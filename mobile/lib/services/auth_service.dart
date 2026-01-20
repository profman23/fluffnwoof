import '../models/user.dart';
import 'api_service.dart';

class AuthService {
  final ApiService _api = ApiService();

  Future<User> login(String email, String password) async {
    final response = await _api.post('/auth/login', {
      'email': email,
      'password': password,
    });

    await _api.setToken(response['token']);
    return User.fromJson(response['user']);
  }

  Future<User> register({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    String? phone,
  }) async {
    final response = await _api.post('/auth/register', {
      'email': email,
      'password': password,
      'firstName': firstName,
      'lastName': lastName,
      'phone': phone,
      'role': 'customer',
    });

    await _api.setToken(response['token']);
    return User.fromJson(response['user']);
  }

  Future<User?> getCurrentUser() async {
    if (!_api.isAuthenticated) return null;

    try {
      final response = await _api.get('/auth/me');
      return User.fromJson(response['user']);
    } catch (e) {
      return null;
    }
  }

  Future<void> logout() async {
    await _api.clearToken();
  }
}
