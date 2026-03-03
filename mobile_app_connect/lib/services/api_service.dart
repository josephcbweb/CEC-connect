import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../utils/constants.dart';

class ApiService {
  final storage = const FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );

  Future<Map<String, dynamic>> login(String email, String password) async {
    final url = Uri.parse('${AppConstants.baseUrl}/auth/login-student');
    try {
      final response = await http
          .post(
            url,
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({'email': email, 'password': password}),
          )
          .timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        final error = jsonDecode(response.body);
        throw Exception(error['message'] ?? 'Login failed');
      }
    } catch (e) {
      throw Exception('Connection error: $e');
    }
  }

  Future<Map<String, dynamic>> getStudentProfile(int id) async {
    final token = await storage.read(key: 'jwt_token');
    final url = Uri.parse('${AppConstants.baseUrl}/students/profile/$id');

    try {
      final response = await http.get(
        url,
        headers: {
          'Content-Type': 'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw Exception('Failed to load profile: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Connection error: $e');
    }
  }

  Future<void> logout() async {
    final token = await storage.read(key: 'jwt_token');
    if (token != null) {
      try {
        final url = Uri.parse('${AppConstants.baseUrl}/auth/logout');
        await http.post(
          url,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer $token',
          },
          body: jsonEncode({'type': 'student'}),
        );
      } catch (e) {
        debugPrint('Logout API call failed: $e');
      }
    }
    await storage.delete(key: 'jwt_token');
    await storage.delete(key: 'last_active');
  }

  Future<Map<String, dynamic>> getStudentFees(int id) async {
    final token = await storage.read(key: 'jwt_token');
    final url = Uri.parse('${AppConstants.baseUrl}/students/$id/fees');

    try {
      final response = await http.get(
        url,
        headers: {
          'Content-Type': 'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw Exception('Failed to load fees: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Connection error: $e');
    }
  }

  Future<List<dynamic>> getAllBusRoutes() async {
    final token = await storage.read(key: 'jwt_token');
    final url = Uri.parse('${AppConstants.baseUrl}/students/bus/routes');

    try {
      final response = await http.get(
        url,
        headers: {
          'Content-Type': 'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        return List<dynamic>.from(jsonDecode(response.body));
      } else {
        throw Exception('Failed to load bus routes: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Connection error: $e');
    }
  }

  Future<void> requestBusService(int studentId, int busId, int stopId) async {
    final token = await storage.read(key: 'jwt_token');
    final url = Uri.parse('${AppConstants.baseUrl}/students/request-bus');

    try {
      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'studentId': studentId,
          'busId': busId,
          'busStopId': stopId,
        }),
      );

      if (response.statusCode != 201 && response.statusCode != 200) {
        final error = jsonDecode(response.body);
        throw Exception(error['message'] ?? 'Failed to request bus');
      }
    } catch (e) {
      throw Exception('Connection error: $e');
    }
  }

  Future<List<dynamic>> getAvailableCourses({int? semester}) async {
    final token = await storage.read(key: 'jwt_token');
    // Build query with semester if provided
    final query = semester != null ? '?semester=$semester' : '';
    final url = Uri.parse('${AppConstants.baseUrl}/api/courses/student$query');

    try {
      final response = await http.get(
        url,
        headers: {
          'Content-Type': 'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        return List<dynamic>.from(jsonDecode(response.body));
      } else {
        throw Exception('Failed to load courses: ${response.statusCode}');
      }
    } catch (e) {
      // Return empty list if network error during dev/mocking
      // or throw. For now, throw to handle in UI.
      throw Exception('Connection error: $e');
    }
  }

  Future<Map<String, dynamic>> fetchRegistrationStatus(int studentId) async {
    final token = await storage.read(key: 'jwt_token');
    final url = Uri.parse(
        '${AppConstants.baseUrl}/api/nodue/status?studentId=$studentId');

    try {
      final response = await http.get(
        url,
        headers: {
          'Content-Type': 'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw Exception('Failed to load registration status');
      }
    } catch (e) {
      throw Exception('Connection error: $e');
    }
  }

  Future<List<int>> downloadRequestPdf(int requestId) async {
    final token = await storage.read(key: 'jwt_token');
    final url = Uri.parse('${AppConstants.baseUrl}/api/nodue/$requestId/pdf');

    try {
      final response = await http.get(
        url,
        headers: {
          if (token != null) 'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        return response.bodyBytes;
      } else {
        throw Exception('Failed to download PDF');
      }
    } catch (e) {
      throw Exception('Connection error: $e');
    }
  }

  Future<void> submitCourseRegistration(
      int studentId, List<int> courseIds) async {
    final token = await storage.read(key: 'jwt_token');
    final url = Uri.parse(
        '${AppConstants.baseUrl}/students/course-registration'); // Hypothetical endpoint

    // Simulation of API call since endpoint might not exist yet
    await Future.delayed(const Duration(seconds: 1));
    return;

    /*
    try {
      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'studentId': studentId,
          'courseIds': courseIds,
        }),
      );

      if (response.statusCode != 200 && response.statusCode != 201) {
        throw Exception('Registration failed');
      }
    } catch (e) {
      throw Exception('Connection error: $e');
    }
    */
  }

  Future<void> registerFcmToken(String fcmToken) async {
    final token = await storage.read(key: 'jwt_token');
    final url =
        Uri.parse('${AppConstants.baseUrl}/api/notifications/register-token');

    try {
      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
        body: jsonEncode({'fcmToken': fcmToken, 'deviceType': 'android'}),
      );

      if (response.statusCode != 200 && response.statusCode != 201) {
        debugPrint("Failed to register FCM token: ${response.statusCode}");
      }
    } catch (e) {
      debugPrint("Error registering FCM token: $e");
    }
  }

  Future<List<dynamic>> getNotifications() async {
    final token = await storage.read(key: 'jwt_token');
    final url =
        Uri.parse('${AppConstants.baseUrl}/api/notifications/my-notifications');

    try {
      final response = await http.get(
        url,
        headers: {
          'Content-Type': 'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        return List<dynamic>.from(jsonDecode(response.body));
      } else {
        throw Exception('Failed to load notifications: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Connection error: $e');
    }
  }

  // ============ Certificate Methods ============

  /// Submit a certificate request
  Future<Map<String, dynamic>> submitCertificateRequest({
    required int studentId,
    required String type,
    required String reason,
  }) async {
    final token = await storage.read(key: 'jwt_token');
    final url = Uri.parse('${AppConstants.baseUrl}/api/certificates');

    try {
      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'studentId': studentId,
          'type': type,
          'reason': reason,
        }),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 201 || response.statusCode == 200) {
        return data;
      } else {
        throw Exception(
            data['error'] ?? 'Failed to submit certificate request');
      }
    } catch (e) {
      if (e is Exception) rethrow;
      throw Exception('Connection error: $e');
    }
  }

  /// Get all certificate requests for a student
  Future<List<dynamic>> getStudentCertificates(int studentId) async {
    final token = await storage.read(key: 'jwt_token');
    final url = Uri.parse(
        '${AppConstants.baseUrl}/api/certificates/student/$studentId');

    try {
      final response = await http.get(
        url,
        headers: {
          'Content-Type': 'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        return List<dynamic>.from(jsonDecode(response.body));
      } else {
        throw Exception('Failed to load certificates: ${response.statusCode}');
      }
    } catch (e) {
      if (e is Exception) rethrow;
      throw Exception('Connection error: $e');
    }
  }

  /// Get workflow status for a specific certificate
  Future<Map<String, dynamic>> getCertificateWorkflow(int certificateId) async {
    final token = await storage.read(key: 'jwt_token');
    final url = Uri.parse(
        '${AppConstants.baseUrl}/api/certificates/$certificateId/workflow');

    try {
      final response = await http.get(
        url,
        headers: {
          'Content-Type': 'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw Exception('Failed to load workflow: ${response.statusCode}');
      }
    } catch (e) {
      if (e is Exception) rethrow;
      throw Exception('Connection error: $e');
    }
  }

  /// Download certificate PDF
  Future<List<int>> downloadCertificatePdf(int certificateId) async {
    final token = await storage.read(key: 'jwt_token');
    final url = Uri.parse(
        '${AppConstants.baseUrl}/api/certificates/$certificateId/download');

    try {
      final response = await http.get(
        url,
        headers: {
          if (token != null) 'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        return response.bodyBytes;
      } else {
        throw Exception('Failed to download certificate PDF');
      }
    } catch (e) {
      if (e is Exception) rethrow;
      throw Exception('Connection error: $e');
    }
  }

  // Password Reset Methods

  /// Send OTP to email for password reset
  Future<Map<String, dynamic>> sendPasswordResetOTP(String email) async {
    final url =
        Uri.parse('${AppConstants.baseUrl}/api/password-reset/send-otp');

    try {
      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email}),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return data;
      } else {
        throw Exception(data['message'] ?? 'Failed to send OTP');
      }
    } catch (e) {
      throw Exception('Connection error: $e');
    }
  }

  /// Verify OTP
  Future<Map<String, dynamic>> verifyPasswordResetOTP(
      String email, String otp) async {
    final url =
        Uri.parse('${AppConstants.baseUrl}/api/password-reset/verify-otp');

    try {
      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email, 'otp': otp}),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return data;
      } else {
        throw Exception(data['message'] ?? 'Failed to verify OTP');
      }
    } catch (e) {
      throw Exception('Connection error: $e');
    }
  }

  /// Reset password with OTP
  Future<Map<String, dynamic>> resetPassword(
    String email,
    String otp,
    String newPassword,
    String confirmPassword,
  ) async {
    final url =
        Uri.parse('${AppConstants.baseUrl}/api/password-reset/reset-password');

    try {
      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'otp': otp,
          'newPassword': newPassword,
          'confirmPassword': confirmPassword,
        }),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return data;
      } else {
        throw Exception(data['message'] ?? 'Failed to reset password');
      }
    } catch (e) {
      throw Exception('Connection error: $e');
    }
  }
}
