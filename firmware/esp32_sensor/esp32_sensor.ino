#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h> // Install "ArduinoJson" via Library Manager
#include <DHT.h>
#include <Wire.h>
#include <MPU6050.h> // Install "MPU6050" by Electronic Cats or similar
#include <math.h>

// ================= CONFIGURATION =================
// 1. Wi-Fi Credentials
const char* WIFI_SSID = "1";
const char* WIFI_PASS = "Natnael1";

// 2. Backend Server URL
const String BASE_URL = "https://mining-hazard-detection-and-safety.onrender.com/api/v1"; 

// 3. Device & Auth Info
const String DEVICE_ID = "995b6b89-060d-4fcc-8b19-2ecc3af7d87f"; // Must match a UUID in your DB
const String API_USER = "demo_admin";             // User to login as
const String API_PASS = "password123";            // User password

// ================= HARDWARE PINS =================
#define DHTPIN 4
#define DHTTYPE DHT22
#define BUZZER 25
#define LED_PIN 2      // Onboard LED or external
#define PIEZO_PIN 27   // 🔔 Piezo disc pin

// 🔥 Alarm limits
#define TEMP_CRITICAL_LIMIT 30.0   // Celsius (User defined)
#define HUM_CRITICAL_LIMIT 70.0    // Humidity (User defined)
#define SHAKE_THRESHOLD 1.0        // g, hand-shake sensitivity
#define PIEZO_THRESHOLD 800        // sensitivity (adjust)

// ================= OBJECTS =================
DHT dht(DHTPIN, DHTTYPE);
MPU6050 mpu;
String jwtToken = "";   // Store the login token here
bool mpuConnected = false; // Flag to track MPU connection status
float lastMagnitude = 0;

// ================= FUNCTION PROTOTYPES =================
void connectWiFi();
void login();
void sendSensorData(float temp, float hum, float vibration, bool fall, bool &localAlarmState);
void blinkLED();
void piezoBeep();

void setup() {
  Serial.begin(115200);
  
  // Init Hardware
  pinMode(BUZZER, OUTPUT);
  pinMode(LED_PIN, OUTPUT);
  pinMode(PIEZO_PIN, INPUT); // Piezo as INPUT
  
  digitalWrite(BUZZER, LOW);
  digitalWrite(LED_PIN, LOW);
  
  // DHT22
  dht.begin();
  
  // MPU6050
  Wire.begin(21, 22); // SDA=21, SCL=22 on ESP32
  mpu.initialize();
  mpu.setFullScaleAccelRange(MPU6050_ACCEL_FS_2);
  
  if (!mpu.testConnection()) {
    Serial.println("MPU6050 connection FAILED");
    mpuConnected = false;
  } else {
    Serial.println("MPU6050 connected successfully");
    mpuConnected = true;
  }

  // Connect to Wi-Fi
  connectWiFi();

  // Login to Backend to get Token
  if(WiFi.status() == WL_CONNECTED) {
    login();
  }
  
  Serial.println("ESP32 Mining Safety System Started");
}

void loop() {
  bool localAlarm = false;
  bool isShaking = false;
  
  // 1. Read DHT22
  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature(); // °C

  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("Failed to read from DHT22!");
    // Use dummy values to prevent crash if sensor fails
    temperature = 0.0;
    humidity = 0.0;
  } else {
    if (temperature > TEMP_CRITICAL_LIMIT && humidity > HUM_CRITICAL_LIMIT) {
       Serial.println("⚠️ Temp & Humidity Alert!");
       localAlarm = true;
    }
  }

  // 2. Read Piezo
  int piezoValue = analogRead(PIEZO_PIN);
  // Serial.print("Piezo Value: "); Serial.println(piezoValue); // Debug
  if (piezoValue > PIEZO_THRESHOLD) {
    Serial.println("⚠️ Piezo Press Detected!");
    localAlarm = true;
  }

  // 3. Read MPU6050 (Shake Detection)
  float magnitude = 1.0; 
  float delta = 0.0;

  if (mpuConnected) {
    int16_t ax, ay, az;
    mpu.getAcceleration(&ax, &ay, &az);
    
    // Convert to g (±2g range default)
    float axg = ax / 16384.0;
    float ayg = ay / 16384.0;
    float azg = az / 16384.0;
    magnitude = sqrt(axg * axg + ayg * ayg + azg * azg);
    
    delta = fabs(magnitude - lastMagnitude);
    lastMagnitude = magnitude;
    
    if (delta > SHAKE_THRESHOLD) {
      Serial.println("⚠️ Shaking Detected!");
      isShaking = true;
      localAlarm = true;
    }
  }

  // 4. Local Alarm Logic
  Serial.printf("Temp: %.1f C  Hum: %.1f %%  Piezo: %d  Shake: %.2f\n", temperature, humidity, piezoValue, delta);

  if (localAlarm) {
    digitalWrite(BUZZER, HIGH);
    digitalWrite(LED_PIN, HIGH);
    // piezoBeep(); // Optional: if you want the piezo to beep back
  } else {
    digitalWrite(BUZZER, LOW);
    digitalWrite(LED_PIN, LOW);
  }

  // 5. Send Data to Backend
  if (WiFi.status() == WL_CONNECTED) {
    if (jwtToken == "") {
      login();
    }
    
    if (jwtToken != "") {
      // Pass real shake status as 'fall' parameter for now to trigger alert on dashboard
      // Pass reference to localAlarm so sendSensorData can modify it (for remote buzzer control)
      sendSensorData(temperature, humidity, delta, isShaking, localAlarm);
    }
  } else {
    Serial.println("WiFi Disconnected! Reconnecting...");
    connectWiFi();
  }

  delay(200); 
}

// ================= HELPER FUNCTIONS =================

void blinkLED() {
  digitalWrite(LED_PIN, HIGH);
  delay(150);
  digitalWrite(LED_PIN, LOW);
  delay(150);
}

void piezoBeep() {
  // tone(PIEZO_PIN, 2000); // ESP32 tone() might need ledcWrite
  // delay(200);
  // noTone(PIEZO_PIN);
}

void connectWiFi() {
  Serial.print("Connecting to WiFi...");
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi Connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nWiFi Connection Failed.");
  }
}

void login() {
  HTTPClient http;
  String loginUrl = BASE_URL + "/login";
  
  Serial.println("Attempting Login...");
  
  http.begin(loginUrl);
  http.addHeader("Content-Type", "application/json");


  // Create JSON Payload
  StaticJsonDocument<200> doc;
  doc["username"] = API_USER;
  doc["password"] = API_PASS;
  String requestBody;
  serializeJson(doc, requestBody);

  int httpResponseCode = http.POST(requestBody);

  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.printf("Login HTTP Response Code: %d\n", httpResponseCode);

    if (httpResponseCode == 200) {
      DynamicJsonDocument respDoc(1024);
      deserializeJson(respDoc, response);
      if (respDoc.containsKey("token")) {
        jwtToken = respDoc["token"].as<String>();
        Serial.println("Login successful! Token received.");
      }
    } else {
      Serial.printf("Login failed: %d\n", httpResponseCode);
    }
  } else {
    Serial.printf("Login error: %s\n", http.errorToString(httpResponseCode).c_str());
  }
  
  http.end();
}

void sendSensorData(float temp, float hum, float vibration, bool fall, bool &localAlarmState) {
  HTTPClient http;
  String url = BASE_URL + "/sensor-data";

  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", "Bearer " + jwtToken);

  // Create JSON Payload
  StaticJsonDocument<512> doc;
  doc["device_id"] = DEVICE_ID;
  doc["sensor_type"] = "telemetry"; 
  
  JsonObject payload = doc.createNestedObject("payload");
  payload["temp"] = temp;           // Real Data
  payload["humidity"] = hum;        // Real Data
  payload["vibration"] = vibration; // Real Data (Accel Magnitude)
  payload["fall"] = fall;           // Real Data
  
  // Simulated Data (Gas is still simulated as we don't have a sensor for it yet)
  payload["gas"] = 200.0;           

  String requestBody;
  serializeJson(doc, requestBody);

  int httpResponseCode = http.POST(requestBody);

  if (httpResponseCode == 200 || httpResponseCode == 201) {
    String response = http.getString();
    Serial.println("✅ Data Sent Successfully");
    
    // Parse response for Buzzer Command
    DynamicJsonDocument respDoc(200);
    deserializeJson(respDoc, response);
    
    if (respDoc.containsKey("buzzer")) {
      bool buzzerState = respDoc["buzzer"];
      if (buzzerState) {
        // Remote activation overrides local logic
        Serial.println("🔔 Remote Buzzer Command Received: ON");
        digitalWrite(BUZZER, HIGH);
        localAlarmState = true; // Update local state so loop knows it's active
      } else {
        // If remote is OFF, we rely on local 'alarm' variable.
        // If local alarm is also OFF, this ensures buzzer is OFF.
        if (!localAlarmState) {
             digitalWrite(BUZZER, LOW);
        }
      }
    }

  } else if (httpResponseCode == 401) {
    Serial.println("❌ Unauthorized (401). Token might be expired.");
    jwtToken = ""; 
  } else {
    Serial.print("❌ Send Failed. Error: ");
    Serial.println(httpResponseCode);
  }

  http.end();
}