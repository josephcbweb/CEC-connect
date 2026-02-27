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
                final approved = profile['busDetails'];

                if (approved != null) {
                  return _buildActiveStatusView(
                      approved, 'Active Service', Colors.green);
                } else if (pending != null) {
                  return _buildActiveStatusView(
                      pending, 'Request Pending', Colors.orange);
                }

                // If no active bus or request, show list
                if (routes.isEmpty) {
                  return Center(
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
                      // Staggered animation
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

  Widget _buildActiveStatusView(
      Map<String, dynamic> data, String statusLabel, Color statusColor) {
    final busName = data['busName'] ?? data['bus']?['busName'] ?? 'College Bus';
    final busNumber = data['busNumber'] ?? data['bus']?['busNumber'] ?? 'N/A';
    final stopName = data['stopName'] ?? data['stop']?['stopName'] ?? 'N/A';
    final fee = data['feeAmount'] ??
        data['stop']
            ?['feeAmount']; // Might vary based on pending vs approved structure

    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: statusColor.withOpacity(0.1),
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
                      color: statusColor.withOpacity(0.1),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      statusLabel.contains('Pending')
                          ? Icons.hourglass_top_rounded
                          : Icons.check_circle_rounded,
                      size: 40,
                      color: statusColor,
                    ),
                  ),
                  const SizedBox(height: 24),
                  Text(
                    statusLabel,
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: statusColor,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    statusLabel.contains('Pending')
                        ? 'Your request is being reviewed by admin'
                        : 'Your bus pass is active',
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
                ],
              ),
            ),
            if (statusLabel.contains('Pending')) ...[
              const SizedBox(height: 24),
              TextButton(
                onPressed: _refreshData,
                child: const Text('Check Status Again'),
              )
            ]
          ],
        ),
      ),
    );
  }

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

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      elevation: 2,
      shadowColor: Colors.black.withOpacity(0.05),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: Colors.teal.withOpacity(0.05)),
      ),
      color: Colors.white,
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
              color: Colors.teal.shade50,
              borderRadius: BorderRadius.circular(12),
            ),
            child:
                Icon(Icons.directions_bus_rounded, color: Colors.teal.shade700),
          ),
          title: Text(
            route['busName'] ?? 'Bus ${route['busNumber']}',
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
          ),
          subtitle: Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Text(
              'Route: ${route['routeName'] ?? "N/A"}',
              style: TextStyle(color: Colors.grey[600], fontSize: 13),
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
                                  border:
                                      Border.all(color: Colors.teal, width: 2),
                                ),
                              ),
                            ],
                          ),
                          title: Text(
                            stop['stopName'],
                            style: const TextStyle(
                                fontWeight: FontWeight.w600, fontSize: 14),
                          ),
                          subtitle: Text(
                            "Stop ID: ${stop['id']}",
                            style: TextStyle(
                                fontSize: 11, color: Colors.grey[400]),
                          ),
                          trailing: Container(
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
                                onTap: () => _showRequestDialog(route, stop),
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
