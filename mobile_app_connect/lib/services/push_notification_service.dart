import 'dart:convert';
import 'dart:io' show Platform;
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import 'package:flutter/foundation.dart';
import '../utils/constants.dart';

// 1. Background Message Handler (Top-level)
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  debugPrint('Handling a background message: ${message.messageId}');
}

class PushNotificationService {
  static final PushNotificationService _instance =
      PushNotificationService._internal();

  factory PushNotificationService() => _instance;

  PushNotificationService._internal();

  final _firebaseMessaging = FirebaseMessaging.instance;
  final _localNotifications = FlutterLocalNotificationsPlugin();
  final _storage = const FlutterSecureStorage();

  bool _isInitialized = false;

  Future<void> init() async {
    if (_isInitialized) return;

    try {
      // 1. Request Permission
      NotificationSettings settings =
          await _firebaseMessaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
        provisional: false,
      );

      if (settings.authorizationStatus == AuthorizationStatus.authorized) {
        debugPrint('User granted permission');
      } else if (settings.authorizationStatus ==
          AuthorizationStatus.provisional) {
        debugPrint('User granted provisional permission');
      } else {
        debugPrint('User declined or has not accepted permission');
        return;
      }

      // 2. Setup Background Handler
      FirebaseMessaging.onBackgroundMessage(
          _firebaseMessagingBackgroundHandler);

      // 3. Initialize Local Notifications
      const androidSettings =
          AndroidInitializationSettings('@mipmap/ic_launcher');

      const iosSettings = DarwinInitializationSettings(
        requestAlertPermission: false,
        requestBadgePermission: false,
        requestSoundPermission: false,
      );

      const initSettings = InitializationSettings(
        android: androidSettings,
        iOS: iosSettings,
      );

      await _localNotifications.initialize(
        settings: initSettings,
        onDidReceiveNotificationResponse: (NotificationResponse response) {
          if (response.payload != null) {
            debugPrint('Notification payload: ${response.payload}');
            // TODO: Handle navigation based on payload
          }
        },
      );

      // 4. Create Notification Channel (Android)
      await _createNotificationChannel();

      // 5. Build Foreground Notification Handler
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        debugPrint('Got a message whilst in the foreground!');
        debugPrint('Message data: ${message.data}');

        if (message.notification != null) {
          debugPrint(
              'Message also contained a notification: ${message.notification}');
          _showLocalNotification(message);
        }
      });

      // 6. Handle Message Opened App (Background -> Foreground)
      FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
        debugPrint('A new onMessageOpenedApp event was published!');
        // TODO: Handle navigation
      });

      // 7. Check for Initial Message (Terminated -> Foreground)
      RemoteMessage? initialMessage =
          await _firebaseMessaging.getInitialMessage();
      if (initialMessage != null) {
        debugPrint('App launched from terminated state via notification');
        // TODO: Handle navigation
      }

      _isInitialized = true;
    } catch (e) {
      debugPrint('Error initializing PushNotificationService: $e');
    }
  }

  Future<void> _createNotificationChannel() async {
    const AndroidNotificationChannel channel = AndroidNotificationChannel(
      'high_importance_channel', // id
      'High Importance Notifications', // title
      description:
          'This channel is used for important notifications.', // description
      importance: Importance.max,
    );

    await _localNotifications
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(channel);
  }

  Future<void> _showLocalNotification(RemoteMessage message) async {
    RemoteNotification? notification = message.notification;
    AndroidNotification? android = message.notification?.android;

    if (notification != null && android != null) {
      await _localNotifications.show(
        id: notification.hashCode,
        title: notification.title,
        body: notification.body,
        notificationDetails: NotificationDetails(
          android: AndroidNotificationDetails(
            'high_importance_channel',
            'High Importance Notifications',
            channelDescription:
                'This channel is used for important notifications.',
            importance: Importance.max,
            priority: Priority.high,
            icon: '@mipmap/ic_launcher',
          ),
          iOS: const DarwinNotificationDetails(),
        ),
        payload: jsonEncode(message.data),
      );
    }
  }

  Future<String?> getToken() async {
    try {
      String? token = await _firebaseMessaging.getToken();
      debugPrint('FCM Token: $token');
      return token;
    } catch (e) {
      debugPrint('Error getting FCM token: $e');
      return null;
    }
  }

  Future<void> registerToken() async {
    try {
      // Ensure initialized before getting token
      await init();

      String? token = await getToken();
      if (token == null) return;

      final jwt = await _storage.read(key: 'jwt_token');
      if (jwt == null) {
        debugPrint('No JWT token found, skipping FCM registration');
        return;
      }

      final url =
          Uri.parse('${AppConstants.baseUrl}/api/notifications/register-token');
      String deviceType = Platform.isIOS ? 'ios' : 'android';

      debugPrint('Registering FCM Token with backend: $token');

      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $jwt',
        },
        body: jsonEncode({'fcmToken': token, 'deviceType': deviceType}),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        debugPrint('FCM Token registered successfully');
      } else {
        debugPrint(
            'Failed to register FCM Token: ${response.statusCode} ${response.body}');
      }
    } catch (e) {
      debugPrint("Error registering FCM token: $e");
    }
  }

  // Helper to handle background message manually if needed
  static Future<void> handleBackgroundMessage(RemoteMessage message) async {
    await _firebaseMessagingBackgroundHandler(message);
  }
}
