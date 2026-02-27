import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:jwt_decoder/jwt_decoder.dart';
import 'package:firebase_core/firebase_core.dart';
import 'services/push_notification_service.dart';
import 'services/api_service.dart';
import 'screens/login_screen.dart';
import 'screens/dashboard_screen.dart';
import 'components/app_loader.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    await Firebase.initializeApp();
    // Start notification service but don't block app launch
    PushNotificationService().init();
  } catch (e) {
    debugPrint("Firebase initialization failed: $e");
  }
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ACADS Student',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
        useMaterial3: true,
      ),
      home: const AuthCheck(),
    );
  }
}

class AuthCheck extends StatefulWidget {
  const AuthCheck({super.key});

  @override
  State<AuthCheck> createState() => _AuthCheckState();
}

class _AuthCheckState extends State<AuthCheck> {
  final _storage = const FlutterSecureStorage();
  bool _isLoading = true;
  Widget? _startScreen;

  @override
  void initState() {
    super.initState();
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    try {
      final token = await _storage.read(key: 'jwt_token');
      final lastActiveStr = await _storage.read(key: 'last_active');

      // Check for 5 days inactivity
      if (lastActiveStr != null) {
        final lastActive = DateTime.tryParse(lastActiveStr);
        if (lastActive != null &&
            DateTime.now().difference(lastActive).inDays >= 5) {
          await _storage.delete(key: 'jwt_token');
          await _storage.delete(key: 'last_active');
          setState(() {
            _startScreen = const LoginScreen();
          });
          return;
        }
      }

      if (token != null && !JwtDecoder.isExpired(token)) {
        try {
          final decodedToken = JwtDecoder.decode(token);
          // Handle userId as int or String
          int? userIdInt;
          if (decodedToken['userId'] is int) {
            userIdInt = decodedToken['userId'];
          } else if (decodedToken['userId'] is String) {
            userIdInt = int.tryParse(decodedToken['userId']);
          }

          if (userIdInt != null) {
            // Verify token with backend to ensure user still exists/valid
            // This also handles the case where the user wants to test login flow
            // If backend fails (e.g. 401), we catch and logout.
            // Note: If offline, this might fail. For now, we prioritize security/correctness.
            await ApiService().getStudentProfile(userIdInt);

            // Update activity timestamp
            await _storage.write(
                key: 'last_active', value: DateTime.now().toIso8601String());

            // Register FCM Token (refresh it)
            PushNotificationService().registerToken();

            setState(() {
              _startScreen = DashboardScreen(userId: userIdInt!);
            });
            return;
          }
        } catch (e) {
          debugPrint("Token validation failed or Network Error: $e");
          await _storage.delete(key: 'jwt_token');
        }
      }

      // Fallback to Login
      setState(() {
        _startScreen = const LoginScreen();
      });
    } catch (e) {
      // Storage read error or other issue
      setState(() {
        _startScreen = const LoginScreen();
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: AppLoader(message: 'Starting...'),
      );
    }
    return _startScreen ?? const LoginScreen();
  }
}
