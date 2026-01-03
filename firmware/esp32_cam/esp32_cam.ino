#include "esp_camera.h"
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "mbedtls/base64.h" // Required for Base64 encoding

/* ===== CONFIGURATION ===== */
const char* ssid = "1";
const char* password = "Natnael1";

// Backend Settings
const String BASE_URL = "https://mining-hazard-detection-and-safety.onrender.com/api/v1";
const String DEVICE_ID = "995b6b89-060d-4fcc-8b19-2ecc3af7d87f"; 
const String API_USER = "demo_admin";
const String API_PASS = "password123";

/* ===== PIN MAP (AI Thinker) ===== */
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27
#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22
#define LED_GPIO_NUM      4

String jwtToken = "";
unsigned long lastCaptureTime = 0;
// Reduced interval for higher FPS (try 0-100 depending on network)
const int captureInterval = 50; 

/* ===== FUNCTION PROTOTYPES ===== */
void login();
void sendFrame();

void setup() {
  Serial.begin(115200);
  Serial.println();

  // 1. Init Camera
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sscb_sda = SIOD_GPIO_NUM;
  config.pin_sscb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;
  
  // QVGA is good for Base64 (small size)
  config.frame_size = FRAMESIZE_QVGA; 
  config.jpeg_quality = 20; // Higher number = lower quality = faster FPS (10-63)          
  config.fb_count = 2; // Try 2 buffers for better throughput

  if (psramFound()) {
    config.jpeg_quality = 15; // Better quality if we have RAM
    config.fb_count = 2;
  }

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed with error 0x%x", err);
    return;
  }

  sensor_t * s = esp_camera_sensor_get();
  s->set_vflip(s, 1);
  s->set_hmirror(s, 1);

  // 2. Connect WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected!");

  // 3. Login
  login();
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    if (jwtToken == "") {
      login();
    }
    
    if (jwtToken != "" && (millis() - lastCaptureTime > captureInterval)) {
      sendFrame();
      lastCaptureTime = millis();
    }
  } else {
    // Reconnect if lost
    WiFi.begin(ssid, password);
    delay(1000);
  }
  
  // Minimal delay to prevent watchdog trigger, but keep it fast
  delay(1);
}

void login() {
  HTTPClient http;
  String loginUrl = BASE_URL + "/login";
  
  Serial.println("Logging in...");
  http.begin(loginUrl);
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<200> doc;
  doc["username"] = API_USER;
  doc["password"] = API_PASS;
  String requestBody;
  serializeJson(doc, requestBody);

  int httpResponseCode = http.POST(requestBody);

  if (httpResponseCode == 200) {
    String response = http.getString();
    DynamicJsonDocument respDoc(1024);
    deserializeJson(respDoc, response);
    if (respDoc.containsKey("token")) {
      jwtToken = respDoc["token"].as<String>();
      Serial.println("Login Success! Token received.");
    }
  } else {
    Serial.printf("Login Failed: %d\n", httpResponseCode);
  }
  http.end();
}

void sendFrame() {
  camera_fb_t * fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("Camera capture failed");
    return;
  }

  // 1. Encode Image to Base64
  // Formula for Base64 length: 4 * ((n + 2) / 3)
  size_t b64Len = 4 * ((fb->len + 2) / 3);
  
  // Allocate memory for Base64 string + null terminator
  unsigned char* b64Buffer = (unsigned char*)ps_malloc(b64Len + 1);
  if (!b64Buffer) {
    // Fallback to heap if PSRAM not available
    b64Buffer = (unsigned char*)malloc(b64Len + 1);
  }

  if (b64Buffer) {
    size_t olen = 0;
    mbedtls_base64_encode(b64Buffer, b64Len + 1, &olen, fb->buf, fb->len);
    b64Buffer[olen] = 0; // Null terminate

    // 2. Construct JSON Payload
    // We need a large buffer for the JSON: 
    // {"device_id":"...","image_url":"data:image/jpeg;base64,..."}
    // Overhead is small (~100 chars) + b64Len
    
    HTTPClient http;
    String url = BASE_URL + "/images/stream";
    http.begin(url);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("Authorization", "Bearer " + jwtToken);

    // We will stream the JSON to avoid allocating another huge buffer
    // But HTTPClient.POST(String) requires the whole string.
    // Let's try to allocate one big buffer for the JSON.
    
    size_t jsonLen = b64Len + 200;
    char* jsonBuffer = (char*)ps_malloc(jsonLen);
    if (!jsonBuffer) jsonBuffer = (char*)malloc(jsonLen);

    if (jsonBuffer) {
      // Build JSON manually to be efficient
      strcpy(jsonBuffer, "{\"device_id\":\"");
      strcat(jsonBuffer, DEVICE_ID.c_str());
      strcat(jsonBuffer, "\",\"image_url\":\"data:image/jpeg;base64,");
      strcat(jsonBuffer, (char*)b64Buffer);
      strcat(jsonBuffer, "\"}");

      int httpCode = http.POST(jsonBuffer);
      
      if (httpCode == 200) {
        Serial.printf("Frame sent! Size: %d bytes\n", fb->len);
      } else if (httpCode == 401) {
        Serial.println("Token expired");
        jwtToken = "";
      } else {
        Serial.printf("Upload failed, HTTP code: %d\n", httpCode);
      }
      
      free(jsonBuffer);
    } else {
      Serial.println("JSON Buffer Malloc failed");
    }
    
    free(b64Buffer);
    http.end();
  } else {
    Serial.println("Base64 Buffer Malloc failed");
  }

  esp_camera_fb_return(fb);
}
