import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  String? _token;

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('auth_token');
  }

  Future<void> setToken(String token) async {
    _token = token;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_token', token);
  }

  Future<void> clearToken() async {
    _token = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
  }

  bool get isAuthenticated => _token != null;

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (_token != null) 'Authorization': 'Bearer $_token',
      };

  Future<Map<String, dynamic>> get(String endpoint) async {
    final response = await http
        .get(
          Uri.parse('${ApiConfig.baseUrl}$endpoint'),
          headers: _headers,
        )
        .timeout(ApiConfig.timeout);

    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> post(
      String endpoint, Map<String, dynamic> data) async {
    final response = await http
        .post(
          Uri.parse('${ApiConfig.baseUrl}$endpoint'),
          headers: _headers,
          body: jsonEncode(data),
        )
        .timeout(ApiConfig.timeout);

    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> put(
      String endpoint, Map<String, dynamic> data) async {
    final response = await http
        .put(
          Uri.parse('${ApiConfig.baseUrl}$endpoint'),
          headers: _headers,
          body: jsonEncode(data),
        )
        .timeout(ApiConfig.timeout);

    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> delete(String endpoint) async {
    final response = await http
        .delete(
          Uri.parse('${ApiConfig.baseUrl}$endpoint'),
          headers: _headers,
        )
        .timeout(ApiConfig.timeout);

    return _handleResponse(response);
  }

  Map<String, dynamic> _handleResponse(http.Response response) {
    final body = jsonDecode(response.body);

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return body;
    } else if (response.statusCode == 401) {
      clearToken();
      throw ApiException('Unauthorized. Please login again.');
    } else {
      throw ApiException(body['message'] ?? 'An error occurred');
    }
  }
}

class ApiException implements Exception {
  final String message;
  ApiException(this.message);

  @override
  String toString() => message;
}
