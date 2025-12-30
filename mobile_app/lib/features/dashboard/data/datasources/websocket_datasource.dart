import 'dart:async';
import 'dart:convert';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../../core/constants/api_constants.dart';
import '../models/device_model.dart';

class WebSocketDataSource {
  final SharedPreferences sharedPreferences;
  WebSocketChannel? _channel;
  final _deviceStreamController = StreamController<Map<String, dynamic>>.broadcast();

  WebSocketDataSource(this.sharedPreferences);

  Stream<Map<String, dynamic>> get messageStream => _deviceStreamController.stream;

  void connect() {
    final token = sharedPreferences.getString('token');
    if (token == null) return;

    // Construct WS URL
    // Base URL: https://mining-hazard-detection-and-safety.onrender.com/api/v1
    // WS URL: wss://mining-hazard-detection-and-safety.onrender.com/api/v1/ws
    final wsUrl = ApiConstants.baseUrl.replaceFirst('https', 'wss') + '/ws';
    
    // Note: If the backend requires token in headers or query params for WS, add it here.
    // Usually standard WS doesn't support headers in browser, but in Flutter it does.
    // However, the backend might expect it in a specific way.
    // Assuming standard connection for now.
    
    try {
      _channel = WebSocketChannel.connect(Uri.parse(wsUrl));
      
      _channel!.stream.listen(
        (message) {
          try {
            final data = json.decode(message);
            _deviceStreamController.add(data);
          } catch (e) {
            print('Error parsing WS message: $e');
          }
        },
        onError: (error) {
          print('WS Error: $error');
          // Implement reconnect logic if needed
        },
        onDone: () {
          print('WS Closed');
        },
      );
    } catch (e) {
      print('WS Connection Error: $e');
    }
  }

  void disconnect() {
    _channel?.sink.close();
    _channel = null;
  }
}
