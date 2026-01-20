class User {
  final String id;
  final String email;
  final String firstName;
  final String lastName;
  final String? phone;
  final String role;

  User({
    required this.id,
    required this.email,
    required this.firstName,
    required this.lastName,
    this.phone,
    required this.role,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] ?? '',
      email: json['email'] ?? '',
      firstName: json['firstName'] ?? '',
      lastName: json['lastName'] ?? '',
      phone: json['phone'],
      role: json['role'] ?? 'customer',
    );
  }

  String get fullName => '$firstName $lastName';
}
