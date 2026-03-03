import 'dart:convert';
import 'dart:io' show Platform;
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import 'package:flutter/foundation.dart';
import '../utils/constants.dart';

// ─── Background Message Handler (must be top-level) ─────────────────────────
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  debugPrint('Handling a background message: ${message.messageId}');
}

// ─── Navigation callback type ───────────────────────────────────────────────
typedef NotificationTapCallback = void Function(Map<String, dynamic> data);

class PushNotificationService {
  // ── Singleton ──────────────────────────────────────────────────────────────
  static final PushNotificationService _instance =
      PushNotificationService._internal();
  factory PushNotificationService() => _instance;
  PushNotificationService._internal();

  final _firebaseMessaging = FirebaseMessaging.instance;
  final _localNotifications = FlutterLocalNotificationsPlugin();
  final _storage = const FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );

  bool _isInitialized = false;

  /// Callback invoked when a notification is tapped (foreground, background,
  /// or terminated). Set this from your top-level widget so the service can
  /// route the user to the correct screen.
  NotificationTapCallback? onNotificationTap;

  /// Holds a pending payload when the app launched from a terminated-state
  /// notification tap *before* the UI was ready to handle it.
  Map<String, dynamic>? pendingNotificationPayload;

  // ── Initialise ─────────────────────────────────────────────────────────────
  Future<void> init() async {
    if (_isInitialized) return;

    try {
      // 1. Request permission (handles Android 13+ POST_NOTIFICATIONS)
      final settings = await _firebaseMessaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
        provisional: false,
      );

      if (settings.authorizationStatus == AuthorizationStatus.authorized) {
        debugPrint('User granted notification permission');
      } else if (settings.authorizationStatus ==
          AuthorizationStatus.provisional) {
        debugPrint('User granted provisional permission');
      } else {
        debugPrint('User declined notification permission');
        return; // Don't continue if denied
      }

      // 2. Register background handler
      FirebaseMessaging.onBackgroundMessage(
          _firebaseMessagingBackgroundHandler);

      // 3. Initialise local notifications plugin
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
        onDidReceiveNotificationResponse: _onLocalNotificationTapped,
      );

      // 4. Create Android notification channel
      await _createNotificationChannel();

      // 5. Foreground messages – show local notification
      FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

      // 6. Background → foreground tap
      FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);

      // 7. Terminated → foreground tap
      final initialMessage = await _firebaseMessaging.getInitialMessage();
      if (initialMessage != null) {
        debugPrint('App launched from terminated via notification');
        _handleNotificationTap(initialMessage);
      }

      // 8. Listen for token refresh and re-register
      _firebaseMessaging.onTokenRefresh.listen((newToken) {
        debugPrint('FCM token refreshed: $newToken');
        registerToken();
      });

      _isInitialized = true;
      debugPrint('PushNotificationService initialised successfully');
    } catch (e) {
      debugPrint('Error initialising PushNotificationService: $e');
    }
  }

  // ── Android notification channel ──────────────────────────────────────────
  Future<void> _createNotificationChannel() async {
    const channel = AndroidNotificationChannel(
      'high_importance_channel',
      'High Importance Notifications',
      description: 'This channel is used for important notifications.',
      importance: Importance.max,
    );

    await _localNotifications
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(channel);
  }

  // ── Foreground message handler ────────────────────────────────────────────
  void _handleForegroundMessage(RemoteMessage message) {
    debugPrint('Foreground message received: ${message.messageId}');
    if (message.notification != null) {
      _showLocalNotification(message);
    }
  }

  // ── Show a local notification (works on both Android & iOS) ───────────────
  Future<void> _showLocalNotification(RemoteMessage message) async {
    final notification = message.notification;
    if (notification == null) return;

    // Use a stable ID derived from data payload to prevent duplicate
    // notifications from being shown.
    final notificationIdStr =
        message.data['notificationId'] ?? message.data['notification_id'];
    final int notifId = notificationIdStr != null
        ? int.tryParse(notificationIdStr.toString()) ?? notification.hashCode
        : notification.hashCode;

    await _localNotifications.show(
      id: notifId,
      title: notification.title,
      body: notification.body,
      notificationDetails: const NotificationDetails(
        android: AndroidNotificationDetails(
          'high_importance_channel',
          'High Importance Notifications',
          channelDescription:
              'This channel is used for important notifications.',
          importance: Importance.max,
          priority: Priority.high,
          icon: '@mipmap/ic_launcher',
        ),
        iOS: DarwinNotificationDetails(),
      ),
      payload: jsonEncode(message.data),
    );
  }

  // ── Notification tap handlers ─────────────────────────────────────────────
  void _handleNotificationTap(RemoteMessage message) {
    final data = message.data;
    debugPrint('Notification tapped with data: $data');

    if (onNotificationTap != null) {
      onNotificationTap!(Map<String, dynamic>.from(data));
    } else {
      // UI not ready yet – stash for later consumption
      pendingNotificationPayload = Map<String, dynamic>.from(data);
    }
  }

  void _onLocalNotificationTapped(NotificationResponse response) {
    if (response.payload == null) return;
    try {
      final data =
          Map<String, dynamic>.from(jsonDecode(response.payload!) as Map);
      debugPrint('Local notification tapped with data: $data');

      if (onNotificationTap != null) {
        onNotificationTap!(data);
      } else {
        pendingNotificationPayload = data;
      }
    } catch (e) {
      debugPrint('Error parsing notification payload: $e');
    }
  }

  // ── FCM token helpers ─────────────────────────────────────────────────────
  Future<String?> getToken() async {
    try {
      final token = await _firebaseMessaging.getToken();
      debugPrint('FCM Token: $token');
      return token;
    } catch (e) {
      debugPrint('Error getting FCM token: $e');
      return null;
    }
  }

  Future<void> registerToken() async {
    try {
      await init(); // Ensure init ran

      final token = await getToken();
      if (token == null) return;

      final jwt = await _storage.read(key: 'jwt_token');
      if (jwt == null) {
        debugPrint('No JWT token found, skipping FCM registration');
        return;
      }

      final url =
          Uri.parse('${AppConstants.baseUrl}/api/notifications/register-token');
      final deviceType = Platform.isIOS ? 'ios' : 'android';

      debugPrint('Registering FCM token with backend...');

      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $jwt',
        },
        body: jsonEncode({'fcmToken': token, 'deviceType': deviceType}),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        debugPrint('FCM token registered successfully');
      } else {
        debugPrint(
            'Failed to register FCM token: ${response.statusCode} ${response.body}');
      }
    } catch (e) {
      debugPrint('Error registering FCM token: $e');
    }
  }

  // ── Static helper for background isolate ──────────────────────────────────
  static Future<void> handleBackgroundMessage(RemoteMessage message) async {
    await _firebaseMessagingBackgroundHandler(message);
  }
}
