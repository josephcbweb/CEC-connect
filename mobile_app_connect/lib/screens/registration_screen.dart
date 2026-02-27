import 'dart:io';
import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';
import 'package:open_file/open_file.dart';
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
  Future<Map<String, dynamic>>? _pageDataFuture;

  // Selection state
  final Set<int> _selectedCourseIds = {};
  bool _isSubmitting = false;
  int _selectedSemester = 5;
  bool _isInitialized = false;

  @override
  void initState() {
    super.initState();
    _pageDataFuture = _fetchPageData();
  }

  void _loadData() {
    setState(() {
      _pageDataFuture = _fetchPageData();
    });
  }

  Future<Map<String, dynamic>> _fetchPageData() async {
    final results = await Future.wait<dynamic>([
      _apiService.fetchRegistrationStatus(widget.userId),
      _apiService.getAvailableCourses(semester: _selectedSemester)
    ]);

    final statusData = results[0] as Map<String, dynamic>;
    final courses = results[1] as List<dynamic>;

    // Pre-fill selection if existing request
    if (!_isInitialized &&
        statusData['status'] == 'active' &&
        statusData['request'] != null) {
      final request = statusData['request'];
      final selections = request['courseSelections'] as List<dynamic>? ?? [];
      _selectedCourseIds.clear();
      for (var s in selections) {
        if (s['course'] != null) {
          _selectedCourseIds.add(s['course']['id']);
        }
      }
      _isInitialized = true;
    }

    return {'status': statusData, 'courses': courses};
  }

  void _toggleCourse(int id) {
    setState(() {
      if (_selectedCourseIds.contains(id)) {
        _selectedCourseIds.remove(id);
      } else {
        _selectedCourseIds.add(id);
      }
    });
  }

  Future<void> _submitRegistration() async {
    // Check selection logic...
    if (_selectedCourseIds.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select at least one course')),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      await _apiService.submitCourseRegistration(
          widget.userId, _selectedCourseIds.toList());
      if (mounted) {
        _loadData();

        showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            title: const Row(
              children: [
                Icon(Icons.check_circle, color: Colors.green, size: 28),
                SizedBox(width: 12),
                Text('Success'),
              ],
            ),
            content: const Text('Registration updated successfully.'),
            actions: [
              TextButton(
                  onPressed: () => Navigator.pop(ctx), child: const Text('OK')),
            ],
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content:
                  Text('Failed: ${e.toString().replaceAll("Exception:", "")}')),
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
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
        duration: Duration(seconds: 4),
      ),
    );

    try {
      final bytes = await _apiService.downloadRequestPdf(request['id']);
      final dir = await getApplicationDocumentsDirectory();
      final file = File('${dir.path}/request_${request['id']}.pdf');
      await file.writeAsBytes(bytes);

      if (mounted) {
        ScaffoldMessenger.of(context).hideCurrentSnackBar();
        showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            title: const Row(
              children: [
                Icon(Icons.check_circle, color: Colors.green),
                SizedBox(width: 8),
                Text("Export Successful"),
              ],
            ),
            content: const Text("Request has been downloaded."),
            actions: [
              TextButton(
                  onPressed: () {
                    Navigator.pop(ctx);
                    OpenFile.open(file.path);
                  },
                  child: const Text("Open")),
              TextButton(
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text("Close"))
            ],
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).hideCurrentSnackBar();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to download PDF: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text('Course Registration'),
        backgroundColor: Colors.indigo.shade800,
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          PopupMenuButton<int>(
            icon: const Icon(Icons.filter_list_rounded),
            tooltip: 'Select Semester',
            onSelected: (val) {
              setState(() {
                _selectedSemester = val;
                _isInitialized = false;
                _loadData();
              });
            },
            itemBuilder: (context) => [
              for (int i = 1; i <= 8; i++)
                PopupMenuItem(
                  value: i,
                  child: Text('Semester $i',
                      style: TextStyle(
                          fontWeight: _selectedSemester == i
                              ? FontWeight.bold
                              : FontWeight.normal)),
                ),
            ],
          )
        ],
      ),
      drawer: AppDrawer(userId: widget.userId, currentRoute: 'registration'),
      body: FutureBuilder<Map<String, dynamic>>(
        future: _pageDataFuture ??= _fetchPageData(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const AppLoader(
                message: 'Loading details...', color: Colors.indigo);
          }
          if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          }

          final data = snapshot.data!;
          final statusData = data['status'];
          final allCourses = data['courses'] as List<dynamic>;

          // Filter Courses
          final labs = allCourses.where((c) {
            final type = (c['type'] as String?)?.toUpperCase() ?? '';
            final name = (c['name'] as String?)?.toUpperCase() ?? '';
            return (type.contains('LAB') || name.contains('LAB'));
          }).toList();

          final electives = allCourses.where((c) {
            final type = (c['type'] as String?)?.toUpperCase() ?? '';
            final name = (c['name'] as String?)?.toUpperCase() ?? '';
            // Exclude Core and Labs
            return !type.contains('CORE') &&
                !name.contains('CORE') &&
                !type.contains('LAB') &&
                !name.contains('LAB');
          }).toList();

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (statusData['status'] == 'active')
                  _buildStatusCard(statusData['request']),
                const SizedBox(height: 24),
                _buildSemesterHeader(),
                const SizedBox(height: 16),
                if (labs.isNotEmpty) ...[
                  _buildSectionTitle('Select Labs', Colors.purple),
                  const SizedBox(height: 12),
                  _buildCourseGrid(labs),
                  const SizedBox(height: 24),
                ],
                if (electives.isNotEmpty) ...[
                  _buildSectionTitle('Electives & Honours', Colors.orange),
                  const SizedBox(height: 12),
                  _buildCourseGrid(electives),
                  const SizedBox(height: 32),
                ],
                if (labs.isEmpty && electives.isEmpty)
                  const Center(
                      child: Padding(
                          padding: EdgeInsets.all(20),
                          child: Text("No elective/lab courses available."))),
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton.icon(
                    onPressed: _isSubmitting ? null : _submitRegistration,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.grey[800],
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                    ),
                    icon: _isSubmitting
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                                color: Colors.white, strokeWidth: 2))
                        : const Icon(Icons.check_circle_outline),
                    label: const Text('Update Registration',
                        style: TextStyle(
                            fontSize: 16, fontWeight: FontWeight.bold)),
                  ),
                ),
                const SizedBox(height: 40),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildStatusCard(Map<String, dynamic> request) {
    if (request == null) return const SizedBox();

    final noDues = (request['noDues'] as List<dynamic>? ?? []);
    final requestDateStr = request['requestDate'];
    final date = requestDateStr != null
        ? DateTime.tryParse(requestDateStr) ?? DateTime.now()
        : DateTime.now();

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                const Icon(Icons.schedule, color: Colors.blue, size: 20),
                const SizedBox(width: 8),
                const Text(
                  'Current Request Status',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                const Spacer(),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.blue.shade50,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    (request['status'] ?? 'pending').toString().toUpperCase(),
                    style: TextStyle(
                        fontSize: 12,
                        color: Colors.blue.shade700,
                        fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    'Req #${request['id']} • ${date.day}/${date.month}/${date.year}',
                    style: TextStyle(color: Colors.grey[500], fontSize: 13),
                    overflow: TextOverflow.ellipsis,
                    maxLines: 1,
                  ),
                ),
                const SizedBox(width: 8),
                OutlinedButton.icon(
                  onPressed: () => _handleExport(request),
                  icon: const Icon(Icons.download, size: 14),
                  label: const Text('Export', style: TextStyle(fontSize: 12)),
                  style: OutlinedButton.styleFrom(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 0),
                    minimumSize: const Size(0, 32),
                    foregroundColor: Colors.grey[700],
                    side: BorderSide(color: Colors.grey.shade300),
                  ),
                )
              ],
            ),
          ),
          const Divider(height: 1),
          Container(
            color: Colors.grey[50],
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                Expanded(
                    flex: 2,
                    child: Text("Department",
                        style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: Colors.grey[700]))),
                Expanded(
                    flex: 1,
                    child: Text("Type",
                        style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: Colors.grey[700]))),
                Expanded(
                    flex: 1,
                    child: Text("Status",
                        style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: Colors.grey[700]),
                        textAlign: TextAlign.right)),
              ],
            ),
          ),
          const Divider(height: 1),
          if (noDues.isEmpty)
            const Padding(
                padding: EdgeInsets.all(20),
                child: Text("No clearance details found.")),
          ...noDues.map((due) {
            final deptName = due['department']?['name'] ??
                due['serviceDepartment']?['name'] ??
                'Unknown';
            final isService = due['serviceDepartment'] != null;
            final status = due['status'] ?? 'pending';
            final color = status == 'cleared' ? Colors.green : Colors.orange;

            return Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Row(
                children: [
                  Expanded(
                      flex: 2,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(deptName,
                              style: const TextStyle(
                                  fontWeight: FontWeight.w600, fontSize: 14)),
                          Text(isService ? 'Service Dept' : 'Academic Dept',
                              style: TextStyle(
                                  fontSize: 11, color: Colors.grey[500])),
                        ],
                      )),
                  Expanded(
                      flex: 1,
                      child: Align(
                        alignment: Alignment.centerLeft,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                              color: Colors.purple.shade50,
                              borderRadius: BorderRadius.circular(4)),
                          child: Text(isService ? 'Service' : 'Course',
                              style: TextStyle(
                                  fontSize: 10, color: Colors.purple.shade300)),
                        ),
                      )),
                  Expanded(
                      flex: 1,
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          Icon(
                              status == 'cleared'
                                  ? Icons.check_circle_outline
                                  : Icons.schedule,
                              size: 14,
                              color: color),
                          const SizedBox(width: 4),
                          Text(status,
                              style: TextStyle(
                                  fontSize: 12,
                                  color: color,
                                  fontWeight: FontWeight.w500)),
                        ],
                      )),
                ],
              ),
            );
          }).toList(),
          const SizedBox(height: 8),
        ],
      ),
    );
  }

  Widget _buildSemesterHeader() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.blue.shade50.withOpacity(0.5),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.blue.shade100),
      ),
      child: Text(
        'Registering for Semester $_selectedSemester',
        style:
            TextStyle(color: Colors.blue.shade800, fontWeight: FontWeight.bold),
      ),
    );
  }

  Widget _buildSectionTitle(String title, Color color) {
    return Row(
      children: [
        Container(
            width: 4,
            height: 24,
            color: color,
            margin: const EdgeInsets.only(right: 12)),
        Text(title,
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
      ],
    );
  }

  Widget _buildCourseGrid(List<dynamic> courses) {
    return Column(
      children: courses.map((course) {
        final isSelected = _selectedCourseIds.contains(course['id']);
        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey.shade200),
          ),
          child: InkWell(
            onTap: () => _toggleCourse(course['id']),
            borderRadius: BorderRadius.circular(12),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  SizedBox(
                    height: 24,
                    width: 24,
                    child: Checkbox(
                      value: isSelected,
                      onChanged: (v) => _toggleCourse(course['id']),
                      activeColor: Colors.indigo,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(4)),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(course['name'],
                            style: const TextStyle(
                                fontWeight: FontWeight.w600, fontSize: 15)),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            Text(
                                '${course['code'] ?? ""} • ${course['department']?['name'] ?? "Dept"}',
                                style: TextStyle(
                                    fontSize: 12, color: Colors.grey[500])),
                            if (course['type'] == 'ELECTIVE') ...[
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                    color: Colors.grey[100],
                                    borderRadius: BorderRadius.circular(4)),
                                child: const Text("ELECTIVE",
                                    style: TextStyle(
                                        fontSize: 10, color: Colors.grey)),
                              )
                            ]
                          ],
                        ),
                      ],
                    ),
                  )
                ],
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}
