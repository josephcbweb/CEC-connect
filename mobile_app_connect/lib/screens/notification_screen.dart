import 'dart:async';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../services/api_service.dart';
import '../components/app_loader.dart';

class NotificationScreen extends StatefulWidget {
  const NotificationScreen({super.key});

  @override
  State<NotificationScreen> createState() => _NotificationScreenState();
}

class _NotificationScreenState extends State<NotificationScreen> {
  final ApiService _apiService = ApiService();
  List<dynamic> _notifications = [];
  bool _isLoading = true;
  String? _errorMessage;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _fetchNotifications();
    // Poll API every 5 minutes for updates
    _timer = Timer.periodic(const Duration(minutes: 5), (timer) {
      _fetchNotifications(silent: true);
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _fetchNotifications({bool silent = false}) async {
    if (!silent) {
      if (mounted) setState(() => _isLoading = true);
    }

    try {
      final notifications = await _apiService.getNotifications();
      if (mounted) {
        setState(() {
          _notifications = notifications;
          _isLoading = false;
          _errorMessage = null;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          // If silent refresh fails, don't show full error screen, just keep old data
          if (!silent) {
            _errorMessage = "Failed to load notifications.";
            _isLoading = false;
          }
        });
      }
      debugPrint("Error fetching notifications: $e");
    }
  }

  String _formatDate(String dateStr) {
    try {
      final date = DateTime.parse(dateStr).toLocal();
      final now = DateTime.now();
      final difference = now.difference(date);

      if (difference.inDays == 0) {
        return DateFormat('h:mm a').format(date); // 10:30 AM
      } else if (difference.inDays < 7) {
        return DateFormat('E, h:mm a').format(date); // Mon, 10:30 AM
      } else {
        return DateFormat('MMM d, y').format(date); // Feb 10, 2026
      }
    } catch (e) {
      return dateStr;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Notifications"),
        backgroundColor: Colors.blue.shade800,
        foregroundColor: Colors.white,
      ),
      body: _isLoading
          ? const Center(child: AppLoader())
          : _errorMessage != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(_errorMessage!,
                          style: const TextStyle(color: Colors.red)),
                      const SizedBox(height: 10),
                      ElevatedButton(
                        onPressed: () => _fetchNotifications(),
                        child: const Text("Retry"),
                      )
                    ],
                  ),
                )
              : _notifications.isEmpty
                  ? const Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.notifications_none,
                              size: 64, color: Colors.grey),
                          SizedBox(height: 16),
                          Text(
                            "No new notifications",
                            style: TextStyle(fontSize: 16, color: Colors.grey),
                          ),
                        ],
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: () => _fetchNotifications(),
                      child: ListView.separated(
                        itemCount: _notifications.length,
                        separatorBuilder: (context, index) =>
                            const Divider(height: 1),
                        itemBuilder: (context, index) {
                          final notification = _notifications[index];
                          // Handling 'description' from backend which maps to 'message' in requirements
                          final message = notification['description'] ??
                              notification['message'] ??
                              '';
                          final title = notification['title'] ?? 'Notification';
                          final date = notification['createdAt'] ?? '';
                          final rawPriority =
                              notification['priority'] ?? 'NORMAL';
                          final priority = rawPriority.toString().toUpperCase();
                          final isHighPriority =
                              priority == 'URGENT' || priority == 'HIGH';

                          return Container(
                            color: notification['status'] == 'unread'
                                ? Colors.blue.shade50
                                : Colors.white,
                            child: ListTile(
                              contentPadding: const EdgeInsets.symmetric(
                                  horizontal: 16, vertical: 12),
                              leading: Stack(
                                clipBehavior: Clip.none,
                                children: [
                                  CircleAvatar(
                                    backgroundColor: priority == 'URGENT'
                                        ? Colors.red.shade100
                                        : (priority == 'IMPORTANT'
                                            ? Colors.orange.shade100
                                            : Colors.blue.shade100),
                                    child: Icon(
                                      priority == 'URGENT'
                                          ? Icons.warning_rounded
                                          : (priority == 'IMPORTANT'
                                              ? Icons.campaign_rounded
                                              : Icons.notifications_rounded),
                                      color: priority == 'URGENT'
                                          ? Colors.red
                                          : (priority == 'IMPORTANT'
                                              ? Colors.orange
                                              : Colors.blue.shade800),
                                    ),
                                  ),
                                  if (isHighPriority)
                                    const Positioned(
                                      top: -2,
                                      right: -2,
                                      child: BlinkingStatusIndicator(
                                        size: 14,
                                        color: Colors.redAccent,
                                      ),
                                    ),
                                ],
                              ),
                              title: Text(
                                title,
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: Colors.blue.shade900,
                                ),
                              ),
                              subtitle: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const SizedBox(height: 6),
                                  Text(
                                    message,
                                    style: const TextStyle(
                                        fontSize: 14, color: Colors.black87),
                                  ),
                                  const SizedBox(height: 6),
                                  Text(
                                    _formatDate(date),
                                    style: TextStyle(
                                        fontSize: 12,
                                        color: Colors.grey.shade600),
                                  ),
                                ],
                              ),
                              onTap: () {
                                // Show full details in a dialog or expand
                                showModalBottomSheet(
                                  context: context,
                                  shape: const RoundedRectangleBorder(
                                      borderRadius: BorderRadius.vertical(
                                          top: Radius.circular(20))),
                                  builder: (context) => Container(
                                    padding: const EdgeInsets.all(24),
                                    child: Column(
                                      mainAxisSize: MainAxisSize.min,
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          title,
                                          style: const TextStyle(
                                            fontSize: 20,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                        const SizedBox(height: 8),
                                        Text(
                                          _formatDate(date),
                                          style: TextStyle(
                                              color: Colors.grey.shade600),
                                        ),
                                        const Divider(height: 24),
                                        Text(
                                          message,
                                          style: const TextStyle(fontSize: 16),
                                        ),
                                        const SizedBox(height: 24),
                                        SizedBox(
                                            width: double.infinity,
                                            child: ElevatedButton(
                                                onPressed: () =>
                                                    Navigator.pop(context),
                                                child: const Text("Close")))
                                      ],
                                    ),
                                  ),
                                );
                              },
                            ),
                          );
                        },
                      ),
                    ),
    );
  }
}

class BlinkingStatusIndicator extends StatefulWidget {
  final double size;
  final Color color;

  const BlinkingStatusIndicator({
    super.key,
    this.size = 12,
    this.color = Colors.red,
  });

  @override
  State<BlinkingStatusIndicator> createState() =>
      _BlinkingStatusIndicatorState();
}

class _BlinkingStatusIndicatorState extends State<BlinkingStatusIndicator>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    )..repeat(reverse: true);
    _animation = Tween<double>(begin: 0.2, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _animation,
      child: Container(
        width: widget.size,
        height: widget.size,
        decoration: BoxDecoration(
          color: widget.color,
          border: Border.all(color: Colors.white, width: 2),
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(
              color: widget.color.withOpacity(0.4),
              blurRadius: 4,
              spreadRadius: 2,
            ),
          ],
        ),
      ),
    );
  }
}
