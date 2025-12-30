import '../../domain/entities/user.dart';

class UserModel extends User {
  const UserModel({
    required String id,
    required String username,
    required String email,
    required String role,
    String? assignedDeviceId,
  }) : super(
          id: id,
          username: username,
          email: email,
          role: role,
          assignedDeviceId: assignedDeviceId,
        );

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] ?? '',
      username: json['username'] ?? '',
      email: json['email'] ?? '',
      role: json['role'] ?? '',
      assignedDeviceId: json['assigned_device_id'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'username': username,
      'email': email,
      'role': role,
      'assigned_device_id': assignedDeviceId,
    };
  }
}
