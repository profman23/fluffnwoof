class ApiConfig {
  // For development, use your local IP or 10.0.2.2 for Android emulator
  static const String baseUrl = 'https://fluffnwoof-backend.onrender.com/api';

  // For local development with Android emulator:
  // static const String baseUrl = 'http://10.0.2.2:5000/api';

  // For local development with iOS simulator:
  // static const String baseUrl = 'http://localhost:5000/api';

  static const Duration timeout = Duration(seconds: 30);
}
