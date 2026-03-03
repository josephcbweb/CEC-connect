import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../components/app_drawer.dart';
import '../components/app_loader.dart';

class BusScreen extends StatefulWidget {
  final int userId;
  const BusScreen({super.key, required this.userId});

  @override
  State<BusScreen> createState() => _BusScreenState();
}

class _BusScreenState extends State<BusScreen> {
  final ApiService _apiService = ApiService();
  late Future<Map<String, dynamic>> _pageData;

  // Selection state for Request
  bool _isRequesting = false;

  @override
  void initState() {
    super.initState();
    _pageData = _fetchPageData();
  }

  Future<Map<String, dynamic>> _fetchPageData() async {
    final results = await Future.wait([
      _apiService.getAllBusRoutes(),
      _apiService.getStudentProfile(widget.userId)
    ]);
    return {
      'routes': results[0] as List<dynamic>,
      'profile': results[1] as Map<String, dynamic>
    };
  }

  Future<void> _refreshData() async {
    setState(() {
      _pageData = _fetchPageData();
    });
  }

  void _showRequestDialog(Map<String, dynamic> bus, Map<String, dynamic> stop) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        padding: const EdgeInsets.fromLTRB(24, 24, 24, 40),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.teal.shade50,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(Icons.directions_bus_rounded,
                      color: Colors.teal.shade700, size: 28),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Confirm Request',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        'Review details before submitting',
                        style: TextStyle(
                          color: Colors.grey[600],
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey.shade200),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                children: [
                  _buildDialogRow(Icons.pin_drop_outlined, 'Bus Route',
                      '${bus['busName']} (${bus['busNumber']})'),
                  const Padding(
                      padding: EdgeInsets.symmetric(vertical: 12),
                      child: Divider(height: 1)),
                  _buildDialogRow(Icons.storefront_outlined, 'Pickup Stop',
                      stop['stopName']),
                  const Padding(
                      padding: EdgeInsets.symmetric(vertical: 12),
                      child: Divider(height: 1)),
                  _buildDialogRow(Icons.payments_outlined, 'Transport Fee',
                      '₹${stop['feeAmount']} / yr'),
                ],
              ),
            ),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              height: 54,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.pop(ctx);
                  _submitRequest(bus['id'], stop['id']);
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.teal,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16)),
                  elevation: 0,
                ),
                child: const Text('Confirm Request',
                    style:
                        TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              height: 54,
              child: TextButton(
                onPressed: () => Navigator.pop(ctx),
                style: TextButton.styleFrom(
                  foregroundColor: Colors.grey[800],
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16)),
                ),
                child: const Text('Cancel Request'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDialogRow(IconData icon, String label, String value) {
    return Row(
      children: [
        Icon(icon, size: 20, color: Colors.grey[400]),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label,
                  style: TextStyle(
                      color: Colors.grey[500],
                      fontSize: 12,
                      fontWeight: FontWeight.w500)),
              const SizedBox(height: 2),
              Text(value,
                  style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 15,
                      color: Colors.black87)),
            ],
          ),
        ),
      ],
    );
  }

  Future<void> _submitRequest(int busId, int stopId) async {
    setState(() => _isRequesting = true);
    try {
      await _apiService.requestBusService(widget.userId, busId, stopId);
      if (mounted) {
        // Refresh page data to show status
        await _refreshData();

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              behavior: SnackBarBehavior.floating,
              backgroundColor: Colors.teal,
              margin: EdgeInsets.all(20),
              content: Row(
                children: [
                  Icon(Icons.check_circle, color: Colors.white),
                  SizedBox(width: 12),
                  Text('Bus service requested!'),
                ],
              ),
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            behavior: SnackBarBehavior.floating,
            margin: const EdgeInsets.all(20),
            content: Text(e.toString().replaceAll("Exception:", "")),
            backgroundColor: Colors.red.shade600,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isRequesting = false);
    }
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null) return 'N/A';
    try {
      final date = DateTime.parse(dateStr);
      final months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec'
      ];
      return '${date.day} ${months[date.month - 1]} ${date.year}';
    } catch (e) {
      return dateStr.split('T').first;
    }
  }

  int _daysRemaining(String? dateStr) {
    if (dateStr == null) return 0;
    try {
      final dueDate = DateTime.parse(dateStr);
      final now = DateTime.now();
      return dueDate.difference(now).inDays;
    } catch (e) {
      return 0;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text('Bus Service'),
        elevation: 0,
        backgroundColor: Colors.teal,
        foregroundColor: Colors.white,
      ),
      drawer: AppDrawer(userId: widget.userId, currentRoute: 'bus'),
      body: _isRequesting
          ? const AppLoader(
              message: 'Processing request...', color: Colors.teal)
          : FutureBuilder<Map<String, dynamic>>(
              future: _pageData,
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const AppLoader(
                      message: 'Retrieving details...', color: Colors.teal);
                }
                if (snapshot.hasError) {
                  return _buildErrorState(snapshot.error);
                }

                final profile = snapshot.data!['profile'];
                final routes = snapshot.data!['routes'] as List<dynamic>;

                final pending = profile['pendingBusRequest'];
                final busDetails = profile['busDetails'];
                final pendingBusFee = profile['pendingBusFee'];
                final lastPaymentDate = profile['lastBusPaymentDate'];

                // State 1: Active Bus Service
                if (busDetails != null) {
                  return _buildActiveServiceView(
                    busDetails,
                    pendingBusFee: pendingBusFee,
                    lastPaymentDate: lastPaymentDate,
                    isSuspended: profile['is_bus_pass_suspended'] == true,
                    suspendedUntil:
                        profile['bus_pass_suspended_until']?.toString(),
                  );
                }

                // State 2: Approved Request (first-time, pending payment)
                if (pending != null && pending['status'] == 'approved') {
                  return _buildApprovedRequestView(pending);
                }

                // State 3: Pending Request (awaiting admin approval)
                if (pending != null && pending['status'] == 'pending') {
                  return _buildPendingRequestView(pending);
                }

                // State 4: No active bus or request — show routes list
                if (routes.isEmpty) {
                  return RefreshIndicator(
                    color: Colors.teal,
                    onRefresh: _refreshData,
                    child: SingleChildScrollView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      child: SizedBox(
                        height: MediaQuery.of(context).size.height * 0.8,
                        child: Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.directions_bus_outlined,
                                  size: 80, color: Colors.grey[300]),
                              const SizedBox(height: 16),
                              const Text('No bus routes active',
                                  style: TextStyle(color: Colors.grey)),
                            ],
                          ),
                        ),
                      ),
                    ),
                  );
                }

                return RefreshIndicator(
                  color: Colors.teal,
                  onRefresh: _refreshData,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: routes.length,
                    itemBuilder: (context, index) {
                      final route = routes[index];
                      return TweenAnimationBuilder<double>(
                        tween: Tween(begin: 0.0, end: 1.0),
                        duration: Duration(milliseconds: 400 + (index * 100)),
                        curve: Curves.easeOutQuad,
                        builder: (context, value, child) {
                          return Transform.translate(
                            offset: Offset(0, 50 * (1 - value)),
                            child: Opacity(opacity: value, child: child),
                          );
                        },
                        child: _buildRouteCard(route),
                      );
                    },
                  ),
                );
              },
            ),
    );
  }

  // ============================================================
  // STATE 1: Active Bus Service
  // ============================================================
  Widget _buildActiveServiceView(
    Map<String, dynamic> busDetails, {
    Map<String, dynamic>? pendingBusFee,
    dynamic lastPaymentDate,
    bool isSuspended = false,
    String? suspendedUntil,
  }) {
    final busName = busDetails['busName'] ?? 'College Bus';
    final busNumber = busDetails['busNumber'] ?? 'N/A';
    final stopName = busDetails['stopName'] ?? 'N/A';
    final fee = busDetails['feeAmount'];

    return RefreshIndicator(
      color: Colors.teal,
      onRefresh: _refreshData,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        child: Container(
          padding: const EdgeInsets.all(24),
          constraints: BoxConstraints(
              minHeight: MediaQuery.of(context).size.height * 0.8),
          child: Column(
            children: [
              // Suspension Banner
              if (isSuspended) ...[
                Container(
                  padding: const EdgeInsets.all(16),
                  margin: const EdgeInsets.only(bottom: 24),
                  decoration: BoxDecoration(
                    color: Colors.red.shade50,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.red.shade200),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(Icons.warning_rounded, color: Colors.red),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          suspendedUntil != null
                              ? 'Your bus service has been suspended until ${suspendedUntil.split("T").first}.\nPlease contact the administration for any queries.'
                              : 'Your bus service has been suspended by the administration.',
                          style: const TextStyle(
                            color: Colors.red,
                            fontWeight: FontWeight.w600,
                            height: 1.4,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],

              // Pending Bus Fee Banner (returning student — semester renewal)
              if (pendingBusFee != null) ...[
                _buildPendingFeeCard(pendingBusFee),
                const SizedBox(height: 20),
              ],

              // Active service card
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.green.withOpacity(0.1),
                      blurRadius: 20,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.green.withOpacity(0.1),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.check_circle_rounded,
                        size: 40,
                        color: Colors.green,
                      ),
                    ),
                    const SizedBox(height: 24),
                    const Text(
                      'Active Service',
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Colors.green,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Your bus pass is active',
                      style: TextStyle(color: Colors.grey[600]),
                    ),
                    const SizedBox(height: 32),
                    const Divider(),
                    const SizedBox(height: 24),
                    _buildStatusRow(Icons.directions_bus, 'Bus Info',
                        '$busName ($busNumber)'),
                    const SizedBox(height: 16),
                    _buildStatusRow(Icons.place, 'Pickup Stop', stopName),
                    if (fee != null) ...[
                      const SizedBox(height: 16),
                      _buildStatusRow(
                          Icons.currency_rupee, 'Fee', '₹$fee / year'),
                    ],
                    if (lastPaymentDate != null) ...[
                      const SizedBox(height: 16),
                      _buildStatusRow(
                        Icons.calendar_today,
                        'Last Fee Paid',
                        _formatDate(lastPaymentDate.toString()),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // Card showing pending renewal fee for returning students
  Widget _buildPendingFeeCard(Map<String, dynamic> pendingBusFee) {
    final isOverdue = pendingBusFee['isOverdue'] == true;
    final baseAmount = pendingBusFee['baseAmount'] ?? 0;
    final fineAmount = pendingBusFee['fineAmount'] ?? 0;
    final totalAmount = pendingBusFee['totalAmount'] ?? baseAmount;
    final dueDate = pendingBusFee['dueDate']?.toString();
    final daysOverdue = pendingBusFee['daysOverdue'] ?? 0;
    final semester = pendingBusFee['semester'];

    final Color cardColor = isOverdue ? Colors.red : Colors.orange;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: cardColor.withOpacity(0.3), width: 1.5),
        boxShadow: [
          BoxShadow(
            color: cardColor.withOpacity(0.08),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: cardColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  isOverdue
                      ? Icons.warning_amber_rounded
                      : Icons.payment_rounded,
                  color: cardColor,
                  size: 24,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      isOverdue ? 'Bus Fee Overdue' : 'Bus Fee Due',
                      style: TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.bold,
                        color: cardColor,
                      ),
                    ),
                    if (semester != null)
                      Text(
                        'Semester $semester',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[600],
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: cardColor.withOpacity(0.04),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              children: [
                if (isOverdue && fineAmount > 0) ...[
                  _buildFeeRow('Base Fee', '₹$baseAmount'),
                  const SizedBox(height: 6),
                  _buildFeeRow('Fine Amount', '₹$fineAmount',
                      valueColor: Colors.red),
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 8),
                    child: Divider(height: 1),
                  ),
                  _buildFeeRow('Total Amount', '₹$totalAmount',
                      isBold: true, valueColor: Colors.red.shade800),
                ] else ...[
                  _buildFeeRow('Amount to Pay', '₹$totalAmount', isBold: true),
                ],
                if (dueDate != null) ...[
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Icon(Icons.event_outlined,
                          size: 16, color: Colors.grey[500]),
                      const SizedBox(width: 8),
                      Flexible(
                        child: Text(
                          isOverdue
                              ? 'Was due on ${_formatDate(dueDate)} ($daysOverdue days overdue)'
                              : 'Due by ${_formatDate(dueDate)}',
                          style: TextStyle(
                            fontSize: 12,
                            color: isOverdue ? Colors.red : Colors.grey[600],
                            fontWeight:
                                isOverdue ? FontWeight.w600 : FontWeight.normal,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 14),
          Text(
            isOverdue
                ? 'Please pay the overdue fees including fine at the earliest to continue using bus service.'
                : 'Please pay the bus fee before the due date to continue availing the bus service.',
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey[600],
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFeeRow(String label, String value,
      {bool isBold = false, Color? valueColor}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 14,
            fontWeight: isBold ? FontWeight.w700 : FontWeight.w500,
            color: Colors.grey[700],
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: isBold ? 16 : 14,
            fontWeight: isBold ? FontWeight.w700 : FontWeight.w600,
            color: valueColor ?? Colors.black87,
          ),
        ),
      ],
    );
  }

  // ============================================================
  // STATE 2: Approved Request (first-time student, needs to pay)
  // ============================================================
  Widget _buildApprovedRequestView(Map<String, dynamic> request) {
    final busName = request['busName'] ?? 'College Bus';
    final stopName = request['stopName'] ?? 'N/A';
    final feeAmount = request['feeAmount'];
    final dueDate = request['dueDate']?.toString();
    final daysLeft = _daysRemaining(dueDate);

    return RefreshIndicator(
      color: Colors.teal,
      onRefresh: _refreshData,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        child: Container(
          padding: const EdgeInsets.all(24),
          constraints: BoxConstraints(
              minHeight: MediaQuery.of(context).size.height * 0.8),
          alignment: Alignment.center,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.blue.withOpacity(0.1),
                      blurRadius: 20,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.blue.withOpacity(0.1),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.task_alt_rounded,
                        size: 40,
                        color: Colors.blue,
                      ),
                    ),
                    const SizedBox(height: 24),
                    const Text(
                      'Request Approved',
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Colors.blue,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Your bus service request has been approved!',
                      style: TextStyle(color: Colors.grey[600]),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 32),
                    const Divider(),
                    const SizedBox(height: 24),
                    _buildStatusRow(Icons.directions_bus, 'Bus Route', busName),
                    const SizedBox(height: 16),
                    _buildStatusRow(Icons.place, 'Pickup Stop', stopName),
                    if (feeAmount != null) ...[
                      const SizedBox(height: 16),
                      _buildStatusRow(
                          Icons.currency_rupee, 'Fee to Pay', '₹$feeAmount'),
                    ],
                    if (dueDate != null) ...[
                      const SizedBox(height: 16),
                      _buildStatusRow(
                          Icons.event, 'Pay Before', _formatDate(dueDate)),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Payment instruction card
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.amber.shade50,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.amber.shade200),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(Icons.info_outline_rounded,
                        color: Colors.amber.shade800, size: 22),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Payment Required',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              color: Colors.amber.shade900,
                              fontSize: 15,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            'For availing bus service, you need to pay ₹$feeAmount. '
                            'Please proceed to the Fees section to complete the payment.',
                            style: TextStyle(
                              color: Colors.amber.shade900,
                              fontSize: 13,
                              height: 1.4,
                            ),
                          ),
                          if (daysLeft >= 0 && dueDate != null) ...[
                            const SizedBox(height: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: daysLeft <= 2
                                    ? Colors.red.shade100
                                    : Colors.amber.shade100,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                daysLeft == 0
                                    ? 'Due today!'
                                    : '$daysLeft day${daysLeft == 1 ? '' : 's'} remaining',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                  color: daysLeft <= 2
                                      ? Colors.red.shade800
                                      : Colors.amber.shade900,
                                ),
                              ),
                            ),
                          ],
                          const SizedBox(height: 8),
                          Text(
                            'Note: If the fee is not paid within 5 days of approval, '
                            'this request will be automatically cancelled and you will '
                            'need to submit a new request.',
                            style: TextStyle(
                              color: Colors.red.shade700,
                              fontSize: 11,
                              fontStyle: FontStyle.italic,
                              height: 1.3,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              TextButton(
                onPressed: _refreshData,
                child: const Text('Refresh Status'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ============================================================
  // STATE 3: Pending Request (awaiting admin approval)
  // ============================================================
  Widget _buildPendingRequestView(Map<String, dynamic> request) {
    final busName = request['busName'] ?? 'College Bus';
    final stopName = request['stopName'] ?? 'N/A';
    final feeAmount = request['feeAmount'];

    return RefreshIndicator(
      color: Colors.teal,
      onRefresh: _refreshData,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        child: Container(
          padding: const EdgeInsets.all(24),
          constraints: BoxConstraints(
              minHeight: MediaQuery.of(context).size.height * 0.8),
          alignment: Alignment.center,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.orange.withOpacity(0.1),
                      blurRadius: 20,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.orange.withOpacity(0.1),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.hourglass_top_rounded,
                        size: 40,
                        color: Colors.orange,
                      ),
                    ),
                    const SizedBox(height: 24),
                    const Text(
                      'Request Pending',
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Colors.orange,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Your request is being reviewed by admin',
                      style: TextStyle(color: Colors.grey[600]),
                    ),
                    const SizedBox(height: 32),
                    const Divider(),
                    const SizedBox(height: 24),
                    _buildStatusRow(Icons.directions_bus, 'Bus Route', busName),
                    const SizedBox(height: 16),
                    _buildStatusRow(Icons.place, 'Pickup Stop', stopName),
                    if (feeAmount != null) ...[
                      const SizedBox(height: 16),
                      _buildStatusRow(
                          Icons.currency_rupee, 'Fee', '₹$feeAmount / year'),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 24),
              TextButton(
                onPressed: _refreshData,
                child: const Text('Check Status Again'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ============================================================
  // Shared Widgets
  // ============================================================

  Widget _buildStatusRow(IconData icon, String label, String value) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: Colors.grey[100],
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: Colors.grey[700], size: 20),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[500],
                    fontWeight: FontWeight.w500),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Colors.black87),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildRouteCard(dynamic route) {
    final stops = route['stops'] as List<dynamic>? ?? [];
    final isFull = route['isFull'] == true;
    final availableSeats = route['availableSeats'] ?? 0;

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      elevation: 2,
      shadowColor: Colors.black.withOpacity(0.05),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(
          color: isFull
              ? Colors.red.withOpacity(0.15)
              : Colors.teal.withOpacity(0.05),
        ),
      ),
      color: isFull ? Colors.grey[50] : Colors.white,
      child: Theme(
        data: Theme.of(context).copyWith(
          dividerColor: Colors.transparent,
          splashColor: Colors.teal.withOpacity(0.1),
        ),
        child: ExpansionTile(
          tilePadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          leading: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: isFull ? Colors.grey.shade100 : Colors.teal.shade50,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              Icons.directions_bus_rounded,
              color: isFull ? Colors.grey : Colors.teal.shade700,
            ),
          ),
          title: Text(
            route['busName'] ?? 'Bus ${route['busNumber']}',
            style: TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 16,
              color: isFull ? Colors.grey[600] : Colors.black87,
            ),
          ),
          subtitle: Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    'Route: ${route['routeName'] ?? "N/A"}',
                    style: TextStyle(color: Colors.grey[600], fontSize: 13),
                  ),
                ),
                if (isFull)
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: Colors.red.shade50,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.red.shade200),
                    ),
                    child: Text(
                      'Full',
                      style: TextStyle(
                        color: Colors.red.shade700,
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  )
                else
                  Text(
                    '$availableSeats seats',
                    style: TextStyle(
                      color: Colors.teal.shade700,
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
              ],
            ),
          ),
          children: [
            Container(
              decoration: BoxDecoration(
                color: Colors.teal.withOpacity(0.02),
                border: Border(
                    top: BorderSide(color: Colors.grey.withOpacity(0.05))),
              ),
              child: stops.isEmpty
                  ? const Padding(
                      padding: EdgeInsets.all(24),
                      child: Center(
                          child: Text('No stops available for this route')),
                    )
                  : ListView.separated(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: stops.length,
                      separatorBuilder: (ctx, i) => Divider(
                          height: 1,
                          indent: 20,
                          endIndent: 20,
                          color: Colors.grey.withOpacity(0.1)),
                      itemBuilder: (ctx, i) {
                        final stop = stops[i];
                        return ListTile(
                          contentPadding: const EdgeInsets.symmetric(
                              horizontal: 20, vertical: 4),
                          leading: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Container(
                                width: 8,
                                height: 8,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: Colors.white,
                                  border: Border.all(
                                    color: isFull ? Colors.grey : Colors.teal,
                                    width: 2,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          title: Text(
                            stop['stopName'],
                            style: TextStyle(
                              fontWeight: FontWeight.w600,
                              fontSize: 14,
                              color: isFull ? Colors.grey[500] : Colors.black87,
                            ),
                          ),
                          subtitle: Text(
                            isFull
                                ? 'No seats available'
                                : '₹${stop['feeAmount']} / year',
                            style: TextStyle(
                              fontSize: 11,
                              color:
                                  isFull ? Colors.red[300] : Colors.grey[400],
                            ),
                          ),
                          trailing: isFull
                              ? Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 12, vertical: 8),
                                  decoration: BoxDecoration(
                                    color: Colors.grey[100],
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Text(
                                        '₹${stop['feeAmount']}',
                                        style: TextStyle(
                                          fontWeight: FontWeight.bold,
                                          color: Colors.grey[400],
                                          fontSize: 13,
                                        ),
                                      ),
                                      const SizedBox(width: 6),
                                      Icon(Icons.block,
                                          size: 18, color: Colors.grey[400]),
                                    ],
                                  ),
                                )
                              : Container(
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    boxShadow: [
                                      BoxShadow(
                                          color: Colors.black.withOpacity(0.05),
                                          blurRadius: 4)
                                    ],
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: Material(
                                    color: Colors.transparent,
                                    child: InkWell(
                                      onTap: () =>
                                          _showRequestDialog(route, stop),
                                      borderRadius: BorderRadius.circular(20),
                                      child: Padding(
                                        padding: const EdgeInsets.symmetric(
                                            horizontal: 12, vertical: 8),
                                        child: Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            Text(
                                              '₹${stop['feeAmount']}',
                                              style: TextStyle(
                                                fontWeight: FontWeight.bold,
                                                color: Colors.teal.shade800,
                                                fontSize: 13,
                                              ),
                                            ),
                                            const SizedBox(width: 6),
                                            Icon(Icons.add_circle,
                                                size: 18,
                                                color: Colors.teal.shade400),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorState(Object? error) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.commute_outlined, size: 80, color: Colors.grey[300]),
            const SizedBox(height: 16),
            const Text(
              'Route Service Unavailable',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              'We encountered an issue loading the bus routes.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey[600]),
            ),
            const SizedBox(height: 24),
            FilledButton.icon(
              onPressed: _refreshData,
              style: FilledButton.styleFrom(
                backgroundColor: Colors.teal,
                foregroundColor: Colors.white,
              ),
              icon: const Icon(Icons.refresh),
              label: const Text('Refresh'),
            ),
          ],
        ),
      ),
    );
  }
}
