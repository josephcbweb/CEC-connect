import 'dart:io';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:path_provider/path_provider.dart';
import 'package:open_file/open_file.dart';
import '../services/api_service.dart';
import '../components/app_loader.dart';
import '../components/app_drawer.dart';

// ─── Certificate Type Definitions ────────────────────────────────────────────

class CertificateTypeInfo {
  final String value;
  final String label;
  final IconData icon;
  final String description;
  final Color color;

  const CertificateTypeInfo({
    required this.value,
    required this.label,
    required this.icon,
    required this.description,
    required this.color,
  });
}

const List<CertificateTypeInfo> certificateTypes = [
  CertificateTypeInfo(
    value: 'BONAFIDE',
    label: 'Bonafide',
    icon: Icons.school_rounded,
    description: 'Proof of current enrollment',
    color: Color(0xFF1565C0),
  ),
  CertificateTypeInfo(
    value: 'COURSE_COMPLETION',
    label: 'Course Completion',
    icon: Icons.emoji_events_rounded,
    description: 'Certificate for completing a course',
    color: Color(0xFF6A1B9A),
  ),
  CertificateTypeInfo(
    value: 'TRANSFER',
    label: 'Transfer Certificate',
    icon: Icons.swap_horiz_rounded,
    description: 'Required when leaving institution',
    color: Color(0xFF00838F),
  ),
  CertificateTypeInfo(
    value: 'CHARACTER',
    label: 'Character Certificate',
    icon: Icons.verified_user_rounded,
    description: 'Certificate of good conduct',
    color: Color(0xFF2E7D32),
  ),
  CertificateTypeInfo(
    value: 'OTHER',
    label: 'Other',
    icon: Icons.description_rounded,
    description: 'Other types of certificates',
    color: Color(0xFF455A64),
  ),
];

// ─── Main Certificate Screen ─────────────────────────────────────────────────

class CertificateScreen extends StatefulWidget {
  final int userId;
  const CertificateScreen({super.key, required this.userId});

  @override
  State<CertificateScreen> createState() => _CertificateScreenState();
}

class _CertificateScreenState extends State<CertificateScreen> {
  final ApiService _apiService = ApiService();
  late Future<Map<String, dynamic>> _profileFuture;
  List<dynamic> _certificates = [];
  bool _isLoadingCerts = true;
  String? _certError;

  @override
  void initState() {
    super.initState();
    _profileFuture = _apiService.getStudentProfile(widget.userId);
    _loadCertificates();
  }

  Future<void> _loadCertificates() async {
    setState(() {
      _isLoadingCerts = true;
      _certError = null;
    });

    try {
      final profile = await _profileFuture;
      final studentId = profile['id'];
      final certs = await _apiService.getStudentCertificates(studentId);
      if (mounted) {
        setState(() {
          _certificates = certs;
          _isLoadingCerts = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _certError = e.toString().replaceFirst('Exception: ', '');
          _isLoadingCerts = false;
        });
      }
    }
  }

  Future<void> _refreshAll() async {
    setState(() {
      _profileFuture = _apiService.getStudentProfile(widget.userId);
    });
    await _loadCertificates();
  }

  // ── Stats helpers ──────────────────────────────────────────────────────────

  int _countByStatus(String status) {
    return _certificates.where((c) => c['status'] == status).length;
  }

  // ── Build ──────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text('Certificates'),
        elevation: 0,
        backgroundColor: Colors.teal.shade700,
        foregroundColor: Colors.white,
      ),
      drawer: AppDrawer(userId: widget.userId, currentRoute: 'certificates'),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showNewRequestSheet(context),
        backgroundColor: Colors.teal.shade700,
        icon: const Icon(Icons.add_rounded, color: Colors.white),
        label: const Text('New Request',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
      ),
      body: FutureBuilder<Map<String, dynamic>>(
        future: _profileFuture,
        builder: (context, profileSnap) {
          if (profileSnap.connectionState == ConnectionState.waiting &&
              _isLoadingCerts) {
            return const AppLoader(
                message: 'Loading certificates...', color: Colors.teal);
          }
          if (profileSnap.hasError) {
            return _buildError(profileSnap.error.toString());
          }

          return RefreshIndicator(
            onRefresh: _refreshAll,
            color: Colors.teal,
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              child: Column(
                children: [
                  // ── Top gradient area ────────────────────────────
                  Container(
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: Colors.teal.shade700,
                      borderRadius: const BorderRadius.only(
                        bottomLeft: Radius.circular(28),
                        bottomRight: Radius.circular(28),
                      ),
                    ),
                    padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
                    child: _buildStatsRow(),
                  ),
                  const SizedBox(height: 16),

                  // ── Certificate list ─────────────────────────────
                  if (_isLoadingCerts)
                    const Padding(
                      padding: EdgeInsets.only(top: 80),
                      child: AppLoader(
                          message: 'Loading requests...', color: Colors.teal),
                    )
                  else if (_certError != null)
                    _buildError(_certError!)
                  else if (_certificates.isEmpty)
                    _buildEmptyState()
                  else
                    _buildCertificateList(),

                  const SizedBox(height: 80), // FAB clearance
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  // ── Stats row ──────────────────────────────────────────────────────────────

  Widget _buildStatsRow() {
    return Row(
      children: [
        _statCard('Total', _certificates.length, Icons.list_alt_rounded,
            Colors.white),
        _statCard('Pending', _countByStatus('PENDING'),
            Icons.hourglass_top_rounded, Colors.amber),
        _statCard('Approved', _countByStatus('APPROVED'),
            Icons.check_circle_rounded, Colors.greenAccent),
        _statCard('Rejected', _countByStatus('REJECTED'), Icons.cancel_rounded,
            Colors.redAccent),
      ],
    );
  }

  Widget _statCard(String label, int count, IconData icon, Color iconColor) {
    return Expanded(
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 4),
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 6),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.15),
          borderRadius: BorderRadius.circular(14),
        ),
        child: Column(
          children: [
            Icon(icon, color: iconColor, size: 22),
            const SizedBox(height: 6),
            Text(
              count.toString(),
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 18,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: TextStyle(
                color: Colors.white.withOpacity(0.85),
                fontSize: 11,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  // ── Certificate list ───────────────────────────────────────────────────────

  Widget _buildCertificateList() {
    return ListView.builder(
      itemCount: _certificates.length,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 16),
      itemBuilder: (context, index) {
        final cert = _certificates[index];
        return _buildCertificateCard(cert);
      },
    );
  }

  Widget _buildCertificateCard(Map<String, dynamic> cert) {
    final type = cert['type'] ?? '';
    final reason = cert['reason'] ?? '';
    final status = cert['status'] ?? 'PENDING';
    final workflowStatus = cert['workflowStatus'] ?? 'WITH_ADVISOR';
    final requestedAt = cert['requestedAt'] != null
        ? DateFormat('dd MMM yyyy').format(DateTime.parse(cert['requestedAt']))
        : '—';

    final typeInfo = certificateTypes.firstWhere(
      (t) => t.value == type,
      orElse: () => certificateTypes.last,
    );

    return Card(
      elevation: 1,
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => _showTrackingSheet(context, cert),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ── Header row ──
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: typeInfo.color.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(typeInfo.icon, color: typeInfo.color, size: 22),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          typeInfo.label,
                          style: const TextStyle(
                            fontWeight: FontWeight.w700,
                            fontSize: 15,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          requestedAt,
                          style: TextStyle(
                            color: Colors.grey[500],
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                  _buildStatusBadge(status),
                ],
              ),

              // ── Reason ──
              if (reason.isNotEmpty) ...[
                const SizedBox(height: 10),
                Text(
                  reason,
                  style: TextStyle(color: Colors.grey[600], fontSize: 13),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],

              // ── Workflow progress ──
              if (status != 'REJECTED') ...[
                const SizedBox(height: 14),
                _buildWorkflowProgressBar(workflowStatus),
              ],

              // ── Rejection reason ──
              if (status == 'REJECTED' &&
                  cert['rejectionReason'] != null &&
                  cert['rejectionReason'].toString().isNotEmpty) ...[
                const SizedBox(height: 10),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.red.shade50,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.red.shade100),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.info_outline,
                          size: 16, color: Colors.red.shade400),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          cert['rejectionReason'],
                          style: TextStyle(
                            color: Colors.red.shade700,
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],

              // ── Action buttons ──
              const SizedBox(height: 12),
              Row(
                children: [
                  // Track button
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => _showTrackingSheet(context, cert),
                      icon: const Icon(Icons.timeline_rounded, size: 18),
                      label: const Text('Track'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.teal.shade700,
                        side: BorderSide(color: Colors.teal.shade200),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                        padding: const EdgeInsets.symmetric(vertical: 10),
                      ),
                    ),
                  ),
                  // Download PDF button (only for GENERATED)
                  if (status == 'GENERATED') ...[
                    const SizedBox(width: 10),
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () => _downloadCertificate(cert['id']),
                        icon: const Icon(Icons.download_rounded, size: 18),
                        label: const Text('Download'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.teal.shade700,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                          padding: const EdgeInsets.symmetric(vertical: 10),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ── Status badge ───────────────────────────────────────────────────────────

  Widget _buildStatusBadge(String status) {
    Color bg;
    Color fg;
    IconData icon;
    String label;

    switch (status) {
      case 'APPROVED':
        bg = Colors.green.shade50;
        fg = Colors.green.shade700;
        icon = Icons.check_circle_rounded;
        label = 'Approved';
        break;
      case 'REJECTED':
        bg = Colors.red.shade50;
        fg = Colors.red.shade700;
        icon = Icons.cancel_rounded;
        label = 'Rejected';
        break;
      case 'GENERATED':
        bg = Colors.blue.shade50;
        fg = Colors.blue.shade700;
        icon = Icons.download_rounded;
        label = 'Ready';
        break;
      default:
        bg = Colors.amber.shade50;
        fg = Colors.amber.shade800;
        icon = Icons.hourglass_top_rounded;
        label = 'Pending';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: fg),
          const SizedBox(width: 4),
          Text(label,
              style: TextStyle(
                  color: fg, fontSize: 12, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }

  // ── Workflow progress bar ──────────────────────────────────────────────────

  Widget _buildWorkflowProgressBar(String workflowStatus) {
    final steps = [
      {'key': 'WITH_ADVISOR', 'label': 'Advisor'},
      {'key': 'WITH_HOD', 'label': 'HOD'},
      {'key': 'WITH_OFFICE', 'label': 'Office'},
      {'key': 'WITH_PRINCIPAL', 'label': 'Principal'},
      {'key': 'COMPLETED', 'label': 'Done'},
    ];

    int currentIndex = steps.indexWhere((s) => s['key'] == workflowStatus);
    if (currentIndex == -1) currentIndex = 0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Progress bar
        ClipRRect(
          borderRadius: BorderRadius.circular(6),
          child: LinearProgressIndicator(
            value: (currentIndex + 1) / steps.length,
            minHeight: 6,
            backgroundColor: Colors.grey.shade200,
            valueColor: AlwaysStoppedAnimation<Color>(
              workflowStatus == 'COMPLETED'
                  ? Colors.green.shade500
                  : Colors.teal.shade400,
            ),
          ),
        ),
        const SizedBox(height: 6),
        // Step labels
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: steps.asMap().entries.map((entry) {
            final idx = entry.key;
            final step = entry.value;
            final isActive = idx <= currentIndex;
            final isCurrent = idx == currentIndex;

            return Expanded(
              child: Text(
                step['label']!,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 9,
                  fontWeight: isCurrent ? FontWeight.w700 : FontWeight.w500,
                  color: isActive ? Colors.teal.shade700 : Colors.grey.shade400,
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  // ── New request bottom sheet ───────────────────────────────────────────────

  Future<void> _showNewRequestSheet(BuildContext context) async {
    final profile = await _profileFuture;
    final studentId = profile['id'];
    final studentName = profile['name'] ?? 'Student';
    final admissionNo = profile['admission_number'] ?? '';

    if (!context.mounted) return;

    String selectedType = 'BONAFIDE';
    final reasonController = TextEditingController();
    bool isSubmitting = false;
    String? errorMessage;

    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setSheetState) {
            final bottomInset = MediaQuery.of(ctx).viewInsets.bottom;
            return Padding(
              padding: EdgeInsets.only(bottom: bottomInset),
              child: Container(
                constraints: BoxConstraints(
                  maxHeight:
                      MediaQuery.of(ctx).size.height * 0.85 - bottomInset,
                ),
                decoration: const BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // ── Handle ──
                    const SizedBox(height: 12),
                    Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: Colors.grey[300],
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // ── Title ──
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: Row(
                        children: [
                          Icon(Icons.add_circle_rounded,
                              color: Colors.teal.shade700, size: 24),
                          const SizedBox(width: 10),
                          const Text(
                            'New Certificate Request',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const Divider(height: 24),

                    // ── Scrollable content ──
                    Flexible(
                      child: SingleChildScrollView(
                        padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // ── Student info card ──
                            Container(
                              padding: const EdgeInsets.all(14),
                              decoration: BoxDecoration(
                                color: Colors.teal.shade50,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: Colors.teal.shade100),
                              ),
                              child: Row(
                                children: [
                                  CircleAvatar(
                                    backgroundColor: Colors.teal.shade100,
                                    child: Icon(Icons.person,
                                        color: Colors.teal.shade700),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          studentName,
                                          style: const TextStyle(
                                            fontWeight: FontWeight.w600,
                                            fontSize: 15,
                                          ),
                                        ),
                                        if (admissionNo.toString().isNotEmpty)
                                          Text(
                                            admissionNo.toString(),
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
                            ),
                            const SizedBox(height: 20),

                            // ── Certificate type picker ──
                            const Text(
                              'Certificate Type',
                              style: TextStyle(
                                fontWeight: FontWeight.w600,
                                fontSize: 14,
                              ),
                            ),
                            const SizedBox(height: 10),
                            ...certificateTypes.map((typeInfo) {
                              final isSelected = selectedType == typeInfo.value;
                              return Padding(
                                padding: const EdgeInsets.only(bottom: 8),
                                child: InkWell(
                                  borderRadius: BorderRadius.circular(12),
                                  onTap: () {
                                    setSheetState(() {
                                      selectedType = typeInfo.value;
                                    });
                                  },
                                  child: AnimatedContainer(
                                    duration: const Duration(milliseconds: 200),
                                    padding: const EdgeInsets.all(14),
                                    decoration: BoxDecoration(
                                      color: isSelected
                                          ? typeInfo.color.withOpacity(0.08)
                                          : Colors.grey.shade50,
                                      borderRadius: BorderRadius.circular(12),
                                      border: Border.all(
                                        color: isSelected
                                            ? typeInfo.color
                                            : Colors.grey.shade200,
                                        width: isSelected ? 2 : 1,
                                      ),
                                    ),
                                    child: Row(
                                      children: [
                                        Icon(
                                          typeInfo.icon,
                                          color: isSelected
                                              ? typeInfo.color
                                              : Colors.grey.shade500,
                                          size: 22,
                                        ),
                                        const SizedBox(width: 12),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment:
                                                CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                typeInfo.label,
                                                style: TextStyle(
                                                  fontWeight: FontWeight.w600,
                                                  color: isSelected
                                                      ? typeInfo.color
                                                      : Colors.grey.shade800,
                                                ),
                                              ),
                                              Text(
                                                typeInfo.description,
                                                style: TextStyle(
                                                  fontSize: 12,
                                                  color: Colors.grey[500],
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                        if (isSelected)
                                          Icon(
                                            Icons.check_circle_rounded,
                                            color: typeInfo.color,
                                            size: 22,
                                          ),
                                      ],
                                    ),
                                  ),
                                ),
                              );
                            }),
                            const SizedBox(height: 16),

                            // ── Reason field ──
                            const Text(
                              'Reason',
                              style: TextStyle(
                                fontWeight: FontWeight.w600,
                                fontSize: 14,
                              ),
                            ),
                            if (errorMessage != null) ...[
                              const SizedBox(height: 4),
                              Text(
                                errorMessage!,
                                style: TextStyle(
                                  color: Colors.red.shade700,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                            const SizedBox(height: 8),
                            TextField(
                              controller: reasonController,
                              maxLines: 4,
                              onChanged: (_) {
                                if (errorMessage != null) {
                                  setSheetState(() => errorMessage = null);
                                }
                              },
                              decoration: InputDecoration(
                                hintText:
                                    'Briefly explain why you need this certificate (min 10 characters)',
                                hintStyle: TextStyle(
                                    color: Colors.grey[400], fontSize: 13),
                                filled: true,
                                fillColor: Colors.grey.shade50,
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  borderSide:
                                      BorderSide(color: Colors.grey.shade200),
                                ),
                                enabledBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  borderSide:
                                      BorderSide(color: Colors.grey.shade200),
                                ),
                                focusedBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  borderSide: BorderSide(
                                      color: Colors.teal.shade400, width: 2),
                                ),
                                contentPadding: const EdgeInsets.all(14),
                              ),
                            ),
                            const SizedBox(height: 24),

                            // ── Submit button ──
                            SizedBox(
                              width: double.infinity,
                              height: 50,
                              child: ElevatedButton(
                                onPressed: isSubmitting
                                    ? null
                                    : () async {
                                        final reason =
                                            reasonController.text.trim();

                                        if (reason.isEmpty) {
                                          setSheetState(() => errorMessage =
                                              'Reason must be specified before submitting');
                                          return;
                                        } else if (reason.length < 10) {
                                          setSheetState(() => errorMessage =
                                              'Reason must be at least 10 characters');
                                          return;
                                        }

                                        setSheetState(() {
                                          errorMessage = null;
                                          isSubmitting = true;
                                        });

                                        try {
                                          final result = await _apiService
                                              .submitCertificateRequest(
                                            studentId: studentId,
                                            type: selectedType,
                                            reason: reason,
                                          );

                                          if (!ctx.mounted) return;
                                          Navigator.pop(ctx);

                                          // Show success
                                          if (mounted) {
                                            ScaffoldMessenger.of(context)
                                                .showSnackBar(
                                              SnackBar(
                                                content: Row(
                                                  children: [
                                                    const Icon(
                                                        Icons
                                                            .check_circle_rounded,
                                                        color: Colors.white,
                                                        size: 20),
                                                    const SizedBox(width: 8),
                                                    Expanded(
                                                      child: Text(
                                                        result['warning'] !=
                                                                null
                                                            ? 'Request submitted with warning'
                                                            : 'Certificate request submitted!',
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                                backgroundColor:
                                                    result['warning'] != null
                                                        ? Colors.orange
                                                        : Colors.green,
                                                duration:
                                                    const Duration(seconds: 3),
                                              ),
                                            );

                                            // Refresh list
                                            _loadCertificates();
                                          }
                                        } catch (e) {
                                          setSheetState(
                                              () => isSubmitting = false);
                                          if (ctx.mounted) {
                                            ScaffoldMessenger.of(context)
                                                .showSnackBar(
                                              SnackBar(
                                                content: Text(e
                                                    .toString()
                                                    .replaceFirst(
                                                        'Exception: ', '')),
                                                backgroundColor: Colors.red,
                                              ),
                                            );
                                          }
                                        }
                                      },
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.teal.shade700,
                                  foregroundColor: Colors.white,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(14),
                                  ),
                                  disabledBackgroundColor: Colors.teal.shade200,
                                ),
                                child: isSubmitting
                                    ? const SizedBox(
                                        width: 22,
                                        height: 22,
                                        child: CircularProgressIndicator(
                                          strokeWidth: 2.5,
                                          color: Colors.white,
                                        ),
                                      )
                                    : const Text(
                                        'Submit Request',
                                        style: TextStyle(
                                          fontWeight: FontWeight.w700,
                                          fontSize: 16,
                                        ),
                                      ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  // ── Tracking bottom sheet ──────────────────────────────────────────────────

  Future<void> _showTrackingSheet(
      BuildContext context, Map<String, dynamic> cert) async {
    final certId = cert['id'];
    bool isLoading = true;
    Map<String, dynamic>? workflowData;
    String? loadError;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setSheetState) {
            // Load workflow on first build
            if (isLoading && workflowData == null && loadError == null) {
              _apiService.getCertificateWorkflow(certId).then((data) {
                setSheetState(() {
                  workflowData = data;
                  isLoading = false;
                });
              }).catchError((e) {
                setSheetState(() {
                  loadError = e.toString().replaceFirst('Exception: ', '');
                  isLoading = false;
                });
              });
            }

            return Container(
              constraints: BoxConstraints(
                maxHeight: MediaQuery.of(ctx).size.height * 0.85,
              ),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // ── Handle ──
                  const SizedBox(height: 12),
                  Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.grey[300],
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // ── Title ──
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Row(
                      children: [
                        Icon(Icons.timeline_rounded,
                            color: Colors.teal.shade700, size: 24),
                        const SizedBox(width: 10),
                        const Text(
                          'Request Tracking',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const Spacer(),
                        _buildStatusBadge(cert['status'] ?? 'PENDING'),
                      ],
                    ),
                  ),
                  const Divider(height: 24),

                  // ── Content ──
                  if (isLoading)
                    const Padding(
                      padding: EdgeInsets.all(40),
                      child: CircularProgressIndicator(color: Colors.teal),
                    )
                  else if (loadError != null)
                    Padding(
                      padding: const EdgeInsets.all(20),
                      child: Text(loadError!,
                          style: const TextStyle(color: Colors.red)),
                    )
                  else
                    Flexible(
                      child: SingleChildScrollView(
                        padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
                        child:
                            _buildTrackingContent(workflowData ?? cert, cert),
                      ),
                    ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildTrackingContent(
      Map<String, dynamic> workflow, Map<String, dynamic> cert) {
    final type = cert['type'] ?? '';
    final reason = cert['reason'] ?? '';
    final status = cert['status'] ?? 'PENDING';
    final workflowStatus = cert['workflowStatus'] ?? 'WITH_ADVISOR';
    final requestedAt = cert['requestedAt'] != null
        ? DateFormat('dd MMM yyyy, hh:mm a')
            .format(DateTime.parse(cert['requestedAt']))
        : '—';

    final typeInfo = certificateTypes.firstWhere(
      (t) => t.value == type,
      orElse: () => certificateTypes.last,
    );

    final approvals = workflow['approvals'] as List<dynamic>? ?? [];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // ── Request info card ──
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.grey.shade50,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: Colors.grey.shade200),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(typeInfo.icon, color: typeInfo.color, size: 20),
                  const SizedBox(width: 8),
                  Text(
                    typeInfo.label,
                    style: TextStyle(
                      fontWeight: FontWeight.w700,
                      color: typeInfo.color,
                      fontSize: 15,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              _infoRow('Requested', requestedAt),
              _infoRow('Reason', reason),
            ],
          ),
        ),
        const SizedBox(height: 20),

        // ── Workflow progress ──
        if (status != 'REJECTED') ...[
          const Text(
            'Progress',
            style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
          ),
          const SizedBox(height: 12),
          _buildDetailedWorkflowSteps(workflowStatus),
          const SizedBox(height: 20),
        ],

        // ── Approval timeline ──
        const Text(
          'Approval Timeline',
          style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
        ),
        const SizedBox(height: 12),

        if (approvals.isEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.amber.shade50,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.amber.shade100),
            ),
            child: Row(
              children: [
                Icon(Icons.hourglass_top_rounded,
                    color: Colors.amber.shade700, size: 20),
                const SizedBox(width: 10),
                const Expanded(
                  child: Text(
                    'Awaiting review from approvers',
                    style: TextStyle(fontSize: 13),
                  ),
                ),
              ],
            ),
          )
        else
          ...approvals.map((approval) => _buildTimelineItem(approval)),

        // ── Current status card ──
        if (status != 'REJECTED' && workflowStatus != 'COMPLETED') ...[
          const SizedBox(height: 16),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.blue.shade50,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.blue.shade100),
            ),
            child: Row(
              children: [
                Icon(Icons.info_outline_rounded,
                    color: Colors.blue.shade700, size: 20),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Currently ${_workflowLabel(workflowStatus)}',
                    style: TextStyle(
                      color: Colors.blue.shade800,
                      fontWeight: FontWeight.w500,
                      fontSize: 13,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],

        // ── Completed status ──
        if (workflowStatus == 'COMPLETED') ...[
          const SizedBox(height: 16),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.green.shade50,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.green.shade100),
            ),
            child: Row(
              children: [
                Icon(Icons.check_circle_rounded,
                    color: Colors.green.shade700, size: 20),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    status == 'GENERATED'
                        ? 'Certificate has been generated and is ready for download!'
                        : 'Request has been fully approved.',
                    style: TextStyle(
                      color: Colors.green.shade800,
                      fontWeight: FontWeight.w500,
                      fontSize: 13,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(top: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 80,
            child: Text(
              label,
              style: TextStyle(
                color: Colors.grey[500],
                fontSize: 13,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontSize: 13),
            ),
          ),
        ],
      ),
    );
  }

  // ── Detailed workflow steps (for tracking sheet) ───────────────────────────

  Widget _buildDetailedWorkflowSteps(String currentWorkflowStatus) {
    final steps = [
      {
        'key': 'WITH_ADVISOR',
        'label': 'Advisor Review',
        'icon': Icons.person_rounded,
        'color': Colors.blue,
      },
      {
        'key': 'WITH_HOD',
        'label': 'HOD Review',
        'icon': Icons.account_balance_rounded,
        'color': Colors.purple,
      },
      {
        'key': 'WITH_OFFICE',
        'label': 'Office Review',
        'icon': Icons.business_rounded,
        'color': Colors.orange,
      },
      {
        'key': 'WITH_PRINCIPAL',
        'label': 'Principal Review',
        'icon': Icons.workspace_premium_rounded,
        'color': Colors.amber.shade800,
      },
      {
        'key': 'COMPLETED',
        'label': 'Completed',
        'icon': Icons.check_circle_rounded,
        'color': Colors.green,
      },
    ];

    final keys = steps.map((s) => s['key'] as String).toList();
    int currentIdx = keys.indexOf(currentWorkflowStatus);
    if (currentIdx == -1) currentIdx = 0;

    return Column(
      children: steps.asMap().entries.map((entry) {
        final idx = entry.key;
        final step = entry.value;
        final isCompleted = idx < currentIdx;
        final isCurrent = idx == currentIdx;
        final isPending = idx > currentIdx;
        final isLast = idx == steps.length - 1;

        Color stepColor;
        if (isCompleted) {
          stepColor = Colors.green;
        } else if (isCurrent) {
          stepColor = step['color'] as Color;
        } else {
          stepColor = Colors.grey.shade300;
        }

        return Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Step indicator column ──
            SizedBox(
              width: 36,
              child: Column(
                children: [
                  Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: isPending
                          ? Colors.grey.shade100
                          : stepColor.withOpacity(0.15),
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: stepColor,
                        width: isCurrent ? 2.5 : 1.5,
                      ),
                    ),
                    child: Icon(
                      isCompleted
                          ? Icons.check_rounded
                          : step['icon'] as IconData,
                      color: isPending ? Colors.grey.shade400 : stepColor,
                      size: 16,
                    ),
                  ),
                  if (!isLast)
                    Container(
                      width: 2,
                      height: 28,
                      color: isCompleted
                          ? Colors.green.shade300
                          : Colors.grey.shade200,
                    ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            // ── Step label ──
            Expanded(
              child: Padding(
                padding: const EdgeInsets.only(top: 5, bottom: 16),
                child: Row(
                  children: [
                    Text(
                      step['label'] as String,
                      style: TextStyle(
                        fontWeight:
                            isCurrent ? FontWeight.w700 : FontWeight.w500,
                        color:
                            isPending ? Colors.grey.shade400 : Colors.grey[800],
                        fontSize: 14,
                      ),
                    ),
                    if (isCurrent && currentWorkflowStatus != 'COMPLETED') ...[
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: stepColor.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          'Current',
                          style: TextStyle(
                            color: stepColor,
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                    if (isCompleted) ...[
                      const SizedBox(width: 8),
                      Icon(Icons.check_circle_rounded,
                          color: Colors.green.shade400, size: 16),
                    ],
                  ],
                ),
              ),
            ),
          ],
        );
      }).toList(),
    );
  }

  // ── Timeline item ──────────────────────────────────────────────────────────

  Widget _buildTimelineItem(dynamic approval) {
    final action = approval['action'] ?? '';
    final role = approval['role'] ?? '';
    final remarks = approval['remarks'] ?? '';
    final createdAt = approval['createdAt'] != null
        ? DateFormat('dd MMM yyyy, hh:mm a')
            .format(DateTime.parse(approval['createdAt']))
        : '';

    Color actionColor;
    IconData actionIcon;
    String actionLabel;

    switch (action) {
      case 'FORWARD':
        actionColor = Colors.green;
        actionIcon = Icons.arrow_forward_rounded;
        actionLabel = 'Forwarded';
        break;
      case 'REJECT':
        actionColor = Colors.red;
        actionIcon = Icons.close_rounded;
        actionLabel = 'Rejected';
        break;
      case 'SUBMIT':
        actionColor = Colors.blue;
        actionIcon = Icons.send_rounded;
        actionLabel = 'Submitted';
        break;
      default:
        actionColor = Colors.grey;
        actionIcon = Icons.info_rounded;
        actionLabel = action;
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Icon ──
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: actionColor.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(actionIcon, color: actionColor, size: 16),
          ),
          const SizedBox(width: 12),
          // ── Details ──
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: actionColor.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        actionLabel,
                        style: TextStyle(
                          color: actionColor,
                          fontWeight: FontWeight.w600,
                          fontSize: 11,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'by ${_formatRole(role)}',
                      style: TextStyle(
                        color: Colors.grey[600],
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
                if (remarks.toString().isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(
                    remarks,
                    style: TextStyle(color: Colors.grey[600], fontSize: 12),
                  ),
                ],
                if (createdAt.isNotEmpty) ...[
                  const SizedBox(height: 2),
                  Text(
                    createdAt,
                    style: TextStyle(color: Colors.grey[400], fontSize: 11),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ── Download certificate ───────────────────────────────────────────────────

  Future<void> _downloadCertificate(int certId) async {
    try {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Row(
            children: [
              SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(
                    strokeWidth: 2, color: Colors.white),
              ),
              SizedBox(width: 12),
              Text('Downloading certificate...'),
            ],
          ),
          duration: Duration(seconds: 10),
        ),
      );

      final bytes = await _apiService.downloadCertificatePdf(certId);
      final dir = await getApplicationDocumentsDirectory();
      final filePath = '${dir.path}/certificate_$certId.pdf';
      final file = File(filePath);
      await file.writeAsBytes(bytes);

      if (!mounted) return;
      ScaffoldMessenger.of(context).hideCurrentSnackBar();

      // Open the file
      await OpenFile.open(filePath);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).hideCurrentSnackBar();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Download failed: ${e.toString().replaceFirst("Exception: ", "")}',
          ),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  String _formatRole(String role) {
    switch (role.toUpperCase()) {
      case 'STUDENT':
        return 'Student';
      case 'ADVISOR':
        return 'Class Advisor';
      case 'HOD':
        return 'Head of Department';
      case 'OFFICE':
        return 'Office';
      case 'PRINCIPAL':
        return 'Principal';
      default:
        return role;
    }
  }

  String _workflowLabel(String wf) {
    switch (wf) {
      case 'WITH_ADVISOR':
        return 'with Class Advisor for review';
      case 'WITH_HOD':
        return 'with Head of Department for review';
      case 'WITH_OFFICE':
        return 'with Office for processing';
      case 'WITH_PRINCIPAL':
        return 'with Principal for final approval';
      case 'COMPLETED':
        return 'completed';
      default:
        return 'in review';
    }
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.only(top: 60),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.description_outlined,
                size: 80, color: Colors.teal.shade100),
            const SizedBox(height: 16),
            Text(
              'No certificate requests yet',
              style: TextStyle(
                color: Colors.grey[600],
                fontSize: 16,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Tap "New Request" to get started',
              style: TextStyle(color: Colors.grey[400], fontSize: 13),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildError(String error) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline_rounded,
                size: 60, color: Colors.red.shade200),
            const SizedBox(height: 16),
            Text(
              error.replaceFirst('Exception: ', ''),
              style: const TextStyle(color: Colors.red),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: _refreshAll,
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('Retry'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.teal,
                foregroundColor: Colors.white,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
