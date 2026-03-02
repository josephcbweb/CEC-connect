import 'dart:io';
import 'package:permission_handler/permission_handler.dart';
import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';
import 'package:open_file/open_file.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import '../services/api_service.dart';
import '../components/app_drawer.dart';
import '../components/app_loader.dart';

class RegistrationScreen extends StatefulWidget {
  final int userId;
  const RegistrationScreen({super.key, required this.userId});

  @override
  State<RegistrationScreen> createState() => _RegistrationScreenState();
}

class _RegistrationScreenState extends State<RegistrationScreen> {
  final ApiService _apiService = ApiService();
  Future<Map<String, dynamic>>? _statusFuture;

  String _filterStatus = 'all'; // 'all', 'cleared', 'pending'
  String _filterCategory = 'all'; // 'all', 'academic', 'service'

  @override
  void initState() {
    super.initState();
    _statusFuture = _apiService.fetchRegistrationStatus(widget.userId);
  }

  void _reload() {
    setState(() {
      _statusFuture = _apiService.fetchRegistrationStatus(widget.userId);
    });
  }

  List<Map<String, dynamic>> _buildDisplayRows(Map<String, dynamic> request) {
    final rows = <Map<String, dynamic>>[];
    final noDues = (request['noDues'] as List<dynamic>? ?? []);

    // 1. Academic dues with courses
    for (final due in noDues.where((d) => d['course'] != null)) {
      final course = due['course'] as Map<String, dynamic>;
      final status = due['status'] as String;
      final matchesStatus = _filterStatus == 'all' || status == _filterStatus;
      final matchesCategory =
          _filterCategory == 'all' || _filterCategory == 'academic';
      if (matchesStatus && matchesCategory) {
        String typeLabel = course['type'] == 'LAB' ? 'Lab' : 'Theory';
        String categoryLabel = '';
        if (course['category'] == 'ELECTIVE')
          categoryLabel = ' • Elective';
        else if (course['category'] == 'HONOURS') categoryLabel = ' • Honours';
        final faculty =
            (course['staff'] as Map<String, dynamic>?)?['name'] ?? 'Unassigned';
        rows.add({
          'id': 'course-${course['id']}',
          'name': course['name'] ?? '',
          'dueType': 'Academic',
          'status': status,
          'details': '$typeLabel$categoryLabel',
          'faculty': faculty,
          'semester': request['targetSemester'],
        });
      }
    }

    // 2. Service dues
    for (final due in noDues.where((d) => d['serviceDepartment'] != null)) {
      final status = due['status'] as String;
      final matchesStatus = _filterStatus == 'all' || status == _filterStatus;
      final matchesCategory =
          _filterCategory == 'all' || _filterCategory == 'service';
      if (matchesStatus && matchesCategory) {
        rows.add({
          'id': 'due-${due['id']}',
          'name':
              (due['serviceDepartment'] as Map<String, dynamic>)['name'] ?? '',
          'dueType': 'Service',
          'status': status,
          'details': 'Service Dept',
          'faculty': null,
          'semester': request['targetSemester'],
        });
      }
    }

    // 3. Academic dues without course (department only)
    for (final due in noDues.where((d) =>
        d['department'] != null &&
        d['serviceDepartment'] == null &&
        d['course'] == null)) {
      final status = due['status'] as String;
      final matchesStatus = _filterStatus == 'all' || status == _filterStatus;
      final matchesCategory =
          _filterCategory == 'all' || _filterCategory == 'academic';
      if (matchesStatus && matchesCategory) {
        rows.add({
          'id': 'due-${due['id']}',
          'name': (due['department'] as Map<String, dynamic>)['name'] ?? '',
          'dueType': 'Academic',
          'status': status,
          'details': 'Department Clearance',
          'faculty': null,
          'semester': request['targetSemester'],
        });
      }
    }

    return rows;
  }

  Future<void> _handleExport(Map<String, dynamic> request) async {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Row(
          children: [
            SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                    color: Colors.white, strokeWidth: 2)),
            SizedBox(width: 16),
            Text('Generating PDF...'),
          ],
        ),
        duration: Duration(seconds: 10),
      ),
    );

    try {
      final student = request['student'] as Map<String, dynamic>? ?? {};
      final studentName = student['name'] ?? 'N/A';
      final admissionNo = student['admission_number'] ?? 'N/A';
      final studentEmail = student['email'] ?? 'N/A';
      final requestId = request['id']?.toString() ?? 'N/A';
      final semester = request['targetSemester']?.toString() ?? 'N/A';
      final noDues = (request['noDues'] as List<dynamic>? ?? []);

      // Format date
      String requestDate = 'N/A';
      try {
        final d = DateTime.parse(request['requestDate'] as String);
        requestDate =
            '${d.day.toString().padLeft(2, '0')}-${d.month.toString().padLeft(2, '0')}-${d.year}';
      } catch (_) {}

      // Build table rows
      final tableRows = <List<String>>[];
      for (final due in noDues) {
        String name;
        String type;
        if (due['course'] != null) {
          final course = due['course'] as Map<String, dynamic>;
          name = course['name'] ?? 'Unknown';
          final typeLabel = course['type'] == 'LAB' ? 'Lab' : 'Theory';
          String cat = '';
          if (course['category'] == 'ELECTIVE') cat = ' • Elective';
          if (course['category'] == 'HONOURS') cat = ' • Honours';
          final faculty = (course['staff'] as Map<String, dynamic>?)?['name'] ??
              'Unassigned';
          type = '$typeLabel$cat\nFaculty: $faculty';
        } else if (due['serviceDepartment'] != null) {
          name = (due['serviceDepartment'] as Map<String, dynamic>)['name'] ??
              'Unknown';
          type = 'Service Dept';
        } else if (due['department'] != null) {
          name =
              (due['department'] as Map<String, dynamic>)['name'] ?? 'Unknown';
          type = 'Department Clearance';
        } else {
          continue;
        }
        final status = (due['status'] as String? ?? 'pending').toUpperCase();
        tableRows.add([name, type, status]);
      }

      // Build PDF
      final doc = pw.Document();
      final headerStyle =
          pw.TextStyle(fontSize: 14, fontWeight: pw.FontWeight.bold);
      final subStyle = pw.TextStyle(fontSize: 11, color: PdfColors.grey600);
      final labelStyle =
          pw.TextStyle(fontSize: 10, fontWeight: pw.FontWeight.bold);

      doc.addPage(
        pw.MultiPage(
          pageFormat: PdfPageFormat.a4,
          margin: const pw.EdgeInsets.all(32),
          build: (pw.Context context) => [
            pw.Center(
              child: pw.Text(
                'College of Engineering, Cherthala',
                style:
                    pw.TextStyle(fontSize: 18, fontWeight: pw.FontWeight.bold),
              ),
            ),
            pw.SizedBox(height: 4),
            pw.Center(
              child: pw.Text('No Due Status Form', style: subStyle),
            ),
            pw.Divider(),
            pw.SizedBox(height: 8),
            pw.Row(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                pw.Expanded(
                  child: pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.RichText(
                          text: pw.TextSpan(children: [
                        pw.TextSpan(text: 'Name: ', style: labelStyle),
                        pw.TextSpan(
                            text: studentName,
                            style: pw.TextStyle(fontSize: 10)),
                      ])),
                      pw.SizedBox(height: 4),
                      pw.RichText(
                          text: pw.TextSpan(children: [
                        pw.TextSpan(text: 'Admission No: ', style: labelStyle),
                        pw.TextSpan(
                            text: admissionNo,
                            style: pw.TextStyle(fontSize: 10)),
                      ])),
                      pw.SizedBox(height: 4),
                      pw.RichText(
                          text: pw.TextSpan(children: [
                        pw.TextSpan(text: 'Email: ', style: labelStyle),
                        pw.TextSpan(
                            text: studentEmail,
                            style: pw.TextStyle(fontSize: 10)),
                      ])),
                    ],
                  ),
                ),
                pw.Expanded(
                  child: pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.RichText(
                          text: pw.TextSpan(children: [
                        pw.TextSpan(text: 'Request ID: ', style: labelStyle),
                        pw.TextSpan(
                            text: '#$requestId',
                            style: pw.TextStyle(fontSize: 10)),
                      ])),
                      pw.SizedBox(height: 4),
                      pw.RichText(
                          text: pw.TextSpan(children: [
                        pw.TextSpan(text: 'Semester: ', style: labelStyle),
                        pw.TextSpan(
                            text: 'S$semester',
                            style: pw.TextStyle(fontSize: 10)),
                      ])),
                      pw.SizedBox(height: 4),
                      pw.RichText(
                          text: pw.TextSpan(children: [
                        pw.TextSpan(text: 'Date: ', style: labelStyle),
                        pw.TextSpan(
                            text: requestDate,
                            style: pw.TextStyle(fontSize: 10)),
                      ])),
                    ],
                  ),
                ),
              ],
            ),
            pw.SizedBox(height: 16),
            pw.Text('Clearance Details', style: headerStyle),
            pw.SizedBox(height: 8),
            pw.TableHelper.fromTextArray(
              headers: ['Clearance Entity', 'Details', 'Status'],
              data: tableRows,
              headerStyle: pw.TextStyle(
                  fontSize: 10,
                  fontWeight: pw.FontWeight.bold,
                  color: PdfColors.white),
              headerDecoration:
                  const pw.BoxDecoration(color: PdfColors.blue700),
              cellStyle: pw.TextStyle(fontSize: 9),
              cellAlignments: {
                0: pw.Alignment.centerLeft,
                1: pw.Alignment.centerLeft,
                2: pw.Alignment.center,
              },
              columnWidths: {
                0: const pw.FractionColumnWidth(0.35),
                1: const pw.FractionColumnWidth(0.45),
                2: const pw.FractionColumnWidth(0.20),
              },
              border: pw.TableBorder.all(color: PdfColors.grey400, width: 0.5),
            ),
            pw.SizedBox(height: 40),
            pw.Row(
              mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
              children: [
                pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    pw.Text('Signature of Student:',
                        style: pw.TextStyle(fontSize: 10)),
                    pw.SizedBox(height: 4),
                    pw.Container(width: 120, height: 1, color: PdfColors.black),
                  ],
                ),
                pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    pw.Text('Date:', style: pw.TextStyle(fontSize: 10)),
                    pw.SizedBox(height: 4),
                    pw.Container(width: 80, height: 1, color: PdfColors.black),
                  ],
                ),
              ],
            ),
            pw.SizedBox(height: 20),
            pw.Center(
              child: pw.Text(
                'Generated by CEC Connect System',
                style: pw.TextStyle(fontSize: 8, color: PdfColors.grey500),
              ),
            ),
          ],
        ),
      );

      final bytes = await doc.save();

      // Request storage permission (needed for public Downloads on Android ≤ 10)
      if (Platform.isAndroid) {
        final status = await Permission.storage.request();
        if (!status.isGranted && !status.isLimited) {
          throw Exception('Storage permission denied');
        }
      }

      // Determine save directory
      Directory saveDir;
      if (Platform.isAndroid) {
        // Public Downloads folder — visible in Files app
        saveDir = Directory('/storage/emulated/0/Download');
        if (!await saveDir.exists()) {
          saveDir = (await getExternalStorageDirectory()) ??
              await getApplicationDocumentsDirectory();
        }
      } else {
        saveDir = await getApplicationDocumentsDirectory();
      }

      final file = File('${saveDir.path}/no_due_status_$requestId.pdf');
      await file.writeAsBytes(bytes);

      if (mounted) {
        ScaffoldMessenger.of(context).hideCurrentSnackBar();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Row(
              children: [
                Icon(Icons.check_circle, color: Colors.white, size: 18),
                SizedBox(width: 10),
                Text('PDF downloaded successfully'),
              ],
            ),
            backgroundColor: Colors.green,
            duration: Duration(seconds: 3),
          ),
        );
        await OpenFile.open(file.path);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).hideCurrentSnackBar();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to generate PDF: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text('No Due Status'),
        backgroundColor: Colors.teal.shade700,
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _reload,
          ),
        ],
      ),
      drawer: AppDrawer(userId: widget.userId, currentRoute: 'registration'),
      body: FutureBuilder<Map<String, dynamic>>(
        future: _statusFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const AppLoader(
                message: 'Checking your no due status...', color: Colors.teal);
          }
          if (snapshot.hasError) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.cloud_off_rounded,
                        size: 64, color: Colors.grey[300]),
                    const SizedBox(height: 16),
                    Text('Failed to load status',
                        style:
                            TextStyle(fontSize: 16, color: Colors.grey[700])),
                    const SizedBox(height: 8),
                    TextButton.icon(
                      onPressed: _reload,
                      icon: const Icon(Icons.refresh),
                      label: const Text('Retry'),
                    ),
                  ],
                ),
              ),
            );
          }

          final data = snapshot.data!;
          final request = data['status'] == 'active'
              ? data['request'] as Map<String, dynamic>?
              : null;

          if (request == null) {
            return _buildEmptyState();
          }

          final displayRows = _buildDisplayRows(request);
          return _buildStatusView(request, displayRows);
        },
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: Colors.grey[100],
                shape: BoxShape.circle,
              ),
              child: Icon(Icons.description_outlined,
                  size: 40, color: Colors.grey[350]),
            ),
            const SizedBox(height: 24),
            const Text(
              'No Registration Data Found',
              style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87),
            ),
            const SizedBox(height: 12),
            Text(
              'No registration information is available for you at this time. '
              'This usually happens when the registration period hasn\'t started '
              'or your record hasn\'t been initialized by the office.',
              textAlign: TextAlign.center,
              style:
                  TextStyle(fontSize: 14, color: Colors.grey[600], height: 1.5),
            ),
            const SizedBox(height: 24),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.blue[50],
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.blue.shade100),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Think this is a mistake?',
                    style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: Colors.blue[800],
                        fontSize: 14),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Please contact the college office to verify your registration status.',
                    style: TextStyle(color: Colors.blue[700], fontSize: 13),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusView(
      Map<String, dynamic> request, List<Map<String, dynamic>> displayRows) {
    final dateStr = request['requestDate'] as String?;
    String formattedDate = '';
    if (dateStr != null) {
      try {
        final d = DateTime.parse(dateStr);
        formattedDate =
            '${d.day.toString().padLeft(2, '0')}-${d.month.toString().padLeft(2, '0')}-${d.year}';
      } catch (_) {
        formattedDate = dateStr;
      }
    }
    final overallStatus = (request['status'] ?? 'pending') as String;
    final isCleared = overallStatus == 'cleared';

    return RefreshIndicator(
      onRefresh: () async => _reload(),
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.grey.shade200),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.04),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.access_time_rounded,
                          color: Colors.blue, size: 20),
                      const SizedBox(width: 8),
                      const Flexible(
                        child: Text(
                          'Current Request Status',
                          style: TextStyle(
                              fontSize: 16, fontWeight: FontWeight.bold),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: isCleared ? Colors.green[50] : Colors.blue[50],
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          overallStatus.toUpperCase(),
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: isCleared
                                ? Colors.green[700]
                                : Colors.blue[700],
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Request ID: #${request['id']}  •  Date: $formattedDate',
                    style: TextStyle(fontSize: 13, color: Colors.grey[500]),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: () => _handleExport(request),
                      icon: const Icon(Icons.download_rounded, size: 18),
                      label: const Text('Export PDF'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.grey[700],
                        side: BorderSide(color: Colors.grey.shade300),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8)),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),

            // Important notice
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFFFFFBEB),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFFDE68A)),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.description_outlined,
                      color: Color(0xFFB45309), size: 20),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Important: Download PDF Report',
                          style: TextStyle(
                              fontWeight: FontWeight.bold,
                              color: Color(0xFFB45309),
                              fontSize: 13),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Please download your No Due format report and keep it '
                          'with you. You may be required to submit this document at the office.',
                          style: TextStyle(
                              color: Colors.amber[800],
                              fontSize: 12,
                              height: 1.4),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Clearance details card
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Filter row
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 14, 16, 8),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Clearance Details',
                          style: TextStyle(
                              fontSize: 14, fontWeight: FontWeight.w600),
                        ),
                        const SizedBox(height: 10),
                        Row(
                          children: [
                            Expanded(
                              child: _buildDropdown(
                                value: _filterCategory,
                                items: const {
                                  'all': 'All Types',
                                  'academic': 'Academic',
                                  'service': 'Service',
                                },
                                onChanged: (v) =>
                                    setState(() => _filterCategory = v!),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: _buildDropdown(
                                value: _filterStatus,
                                items: const {
                                  'all': 'All Status',
                                  'pending': 'Pending',
                                  'cleared': 'Cleared',
                                },
                                onChanged: (v) =>
                                    setState(() => _filterStatus = v!),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const Divider(height: 1),

                  // Table header
                  Container(
                    color: Colors.grey[50],
                    padding: const EdgeInsets.symmetric(
                        horizontal: 14, vertical: 10),
                    child: Row(
                      children: [
                        Expanded(
                          flex: 5,
                          child: Text('CLEARANCE ENTITY',
                              style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.grey[600],
                                  letterSpacing: 0.5)),
                        ),
                        Expanded(
                          flex: 4,
                          child: Text('DETAILS',
                              style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.grey[600],
                                  letterSpacing: 0.5)),
                        ),
                        Expanded(
                          flex: 3,
                          child: Text('STATUS',
                              textAlign: TextAlign.right,
                              style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.grey[600],
                                  letterSpacing: 0.5)),
                        ),
                      ],
                    ),
                  ),
                  const Divider(height: 1),

                  if (displayRows.isEmpty)
                    const Padding(
                      padding: EdgeInsets.all(24),
                      child: Center(
                        child: Text('No dues found.',
                            style: TextStyle(color: Colors.grey)),
                      ),
                    )
                  else
                    ...displayRows.map((row) => _buildDueRow(row)),
                ],
              ),
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildDropdown({
    required String value,
    required Map<String, String> items,
    required ValueChanged<String?> onChanged,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 0),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey.shade300),
        borderRadius: BorderRadius.circular(6),
        color: Colors.white,
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: value,
          isExpanded: true,
          isDense: true,
          style: const TextStyle(fontSize: 11, color: Colors.black87),
          items: items.entries
              .map((e) => DropdownMenuItem(value: e.key, child: Text(e.value)))
              .toList(),
          onChanged: onChanged,
        ),
      ),
    );
  }

  Widget _buildDueRow(Map<String, dynamic> row) {
    final status = row['status'] as String;
    final isCleared = status == 'cleared';
    final isService = row['dueType'] == 'Service';

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Clearance entity
              Expanded(
                flex: 5,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      row['name'] as String,
                      style: const TextStyle(
                          fontWeight: FontWeight.w600, fontSize: 13),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 3),
                    Wrap(
                      spacing: 4,
                      runSpacing: 4,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color:
                                isService ? Colors.purple[50] : Colors.blue[50],
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            isService ? 'Service' : 'Academic',
                            style: TextStyle(
                                fontSize: 10,
                                color: isService
                                    ? Colors.purple[600]
                                    : Colors.blue[600]),
                          ),
                        ),
                        if (row['semester'] != null)
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: Colors.grey[100],
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              'S${row['semester']}',
                              style: const TextStyle(
                                  fontSize: 10, fontWeight: FontWeight.w600),
                            ),
                          ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(width: 8),

              // Details
              Expanded(
                flex: 4,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      row['details'] as String,
                      style:
                          const TextStyle(fontSize: 12, color: Colors.black87),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (row['faculty'] != null)
                      Text(
                        'Faculty: ${row['faculty']}',
                        style: TextStyle(fontSize: 11, color: Colors.grey[500]),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                  ],
                ),
              ),

              const SizedBox(width: 8),

              // Status
              Expanded(
                flex: 3,
                child: Align(
                  alignment: Alignment.centerRight,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        isCleared
                            ? Icons.check_circle_outline
                            : Icons.access_time_rounded,
                        size: 14,
                        color:
                            isCleared ? Colors.green[600] : Colors.amber[700],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        isCleared ? 'Cleared' : 'Pending',
                        style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: isCleared
                                ? Colors.green[600]
                                : Colors.amber[700]),
                        textAlign: TextAlign.right,
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
        const Divider(height: 1, indent: 14, endIndent: 14),
      ],
    );
  }
}
