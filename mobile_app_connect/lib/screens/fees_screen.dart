import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../components/app_loader.dart';
import '../components/app_drawer.dart';
import 'package:intl/intl.dart';

class FeesScreen extends StatefulWidget {
  final int userId;
  const FeesScreen({super.key, required this.userId});

  @override
  State<FeesScreen> createState() => _FeesScreenState();
}

class _FeesScreenState extends State<FeesScreen> {
  final ApiService _apiService = ApiService();
  late Future<Map<String, dynamic>> _feesData;

  @override
  void initState() {
    super.initState();
    _feesData = _apiService.getStudentFees(widget.userId);
  }

  Future<void> _refreshData() async {
    setState(() {
      _feesData = _apiService.getStudentFees(widget.userId);
    });
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'paid':
        return Colors.green.shade600;
      case 'pending':
        return Colors.orange.shade700;
      case 'overdue':
        return Colors.red.shade600;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text('My Fees'),
        elevation: 0,
        backgroundColor: Colors.indigo,
        foregroundColor: Colors.white,
      ),
      drawer: AppDrawer(userId: widget.userId, currentRoute: 'fees'),
      body: FutureBuilder<Map<String, dynamic>>(
        future: _feesData,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const AppLoader(
                message: 'Retrieving fees...', color: Colors.indigo);
          }
          if (snapshot.hasError) {
            return _buildErrorState(snapshot.error);
          }
          if (!snapshot.hasData) {
            return const Center(child: Text('No details available.'));
          }

          final student = snapshot.data!;
          final invoices = student['invoices'] as List<dynamic>? ?? [];

          if (invoices.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.check_circle_outline,
                      size: 80, color: Colors.green.shade100),
                  const SizedBox(height: 16),
                  const Text("No pending fees!",
                      style: TextStyle(color: Colors.grey)),
                ],
              ),
            );
          }

          return RefreshIndicator(
            color: Colors.indigo,
            onRefresh: _refreshData,
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
              itemCount: invoices.length,
              itemBuilder: (context, index) {
                final inv = invoices[index];
                // Added Slide Animation
                return TweenAnimationBuilder<double>(
                  tween: Tween(begin: 0.0, end: 1.0),
                  duration: Duration(milliseconds: 300 + (index * 100)),
                  builder: (context, value, child) {
                    return Transform.translate(
                      offset: Offset(50 * (1 - value), 0),
                      child: Opacity(opacity: value, child: child),
                    );
                  },
                  child: _buildInvoiceCard(inv),
                );
              },
            ),
          );
        },
      ),
    );
  }

  Widget _buildInvoiceCard(dynamic inv) {
    final feeStructure = inv['FeeStructure'];
    final amount = int.tryParse(inv['amount'].toString()) ?? 0;
    final status = inv['status'] ?? 'Unknown';
    final dueDate =
        inv['dueDate'] != null ? DateTime.parse(inv['dueDate']) : null;
    final statusColor = _getStatusColor(status);

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      elevation: 4,
      shadowColor: Colors.black.withOpacity(0.05),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      color: Colors.white,
      child: InkWell(
        onTap: () {
          // Placeholder for payment gateway
          if (status.toLowerCase() != 'paid') {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                  content: Text('Payment gateway integration in progress')),
            );
          }
        },
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.indigo.shade50,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(Icons.receipt_long_rounded,
                        color: Colors.indigo.shade400),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          feeStructure?['name'] ?? 'Fee Invoice',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: Colors.black87,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: Colors.grey[100],
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            'INV #${inv['id']}',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey[600],
                              fontWeight: FontWeight.w600,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: statusColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: statusColor.withOpacity(0.2)),
                    ),
                    child: Text(
                      status.toString().toUpperCase(),
                      style: TextStyle(
                        color: statusColor,
                        fontWeight: FontWeight.bold,
                        fontSize: 11,
                      ),
                    ),
                  ),
                ],
              ),
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 20),
                child: Divider(height: 1),
              ),
              _buildStatRow('Total Amount',
                  NumberFormat.currency(symbol: '₹').format(amount), true),
              if (dueDate != null) ...[
                const SizedBox(height: 12),
                _buildStatRow('Due Date',
                    DateFormat('dd MMM yyyy').format(dueDate), false),
              ],
              if (status.toLowerCase() == 'pending') ...[
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton(
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                            content: Text('Redirecting to Payment Gateway...')),
                      );
                    },
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.indigo,
                      side: const BorderSide(color: Colors.indigo),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10)),
                    ),
                    child: const Text("Pay Now"),
                  ),
                )
              ]
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatRow(String label, String value, bool isPrimary) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            color: Colors.grey[600],
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontWeight: isPrimary ? FontWeight.bold : FontWeight.w500,
            fontSize: isPrimary ? 18 : 14, // Slightly larger amount
            color: isPrimary ? Colors.black87 : Colors.grey[800],
          ),
        ),
      ],
    );
  }

  Widget _buildErrorState(Object? error) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.warning_amber_rounded,
                size: 60, color: Colors.amber.shade700),
            const SizedBox(height: 16),
            Text(
              'Unable to load fees',
              style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.grey[800]),
            ),
            const SizedBox(height: 8),
            Text(
              error.toString().replaceFirst('Exception:', '').trim(),
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.grey),
            ),
            const SizedBox(height: 24),
            FilledButton.tonal(
              onPressed: _refreshData,
              child: const Text('Try Again'),
            ),
          ],
        ),
      ),
    );
  }
}
