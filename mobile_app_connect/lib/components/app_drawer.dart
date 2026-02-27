import 'package:flutter/material.dart';
import '../screens/dashboard_screen.dart';
import '../screens/fees_screen.dart';
import '../screens/bus_screen.dart';
import '../screens/registration_screen.dart';
import '../screens/login_screen.dart';
import '../services/api_service.dart';

class AppDrawer extends StatelessWidget {
  final int userId;
  final String currentRoute;

  const AppDrawer({
    super.key,
    required this.userId,
    required this.currentRoute,
  });

  void _navigateTo(BuildContext context, String routeName, Widget screen) {
    if (currentRoute == routeName) {
      Navigator.pop(context); // just close drawer
    } else {
      Navigator.pop(context); // close drawer
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => screen),
      );
    }
  }

  Future<void> _logout(BuildContext context) async {
    final api = ApiService();
    await api.logout();
    if (!context.mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (context) => const LoginScreen()),
      (route) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Drawer(
      backgroundColor: Colors.white,
      surfaceTintColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.only(
          topRight: Radius.circular(0),
          bottomRight: Radius.circular(0),
        ),
      ),
      child: Column(
        children: [
          _buildHeader(context),
          const SizedBox(height: 12),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Column(
              children: [
                _buildDrawerItem(
                  context,
                  title: 'Dashboard',
                  icon: Icons.dashboard_outlined,
                  selectedIcon: Icons.dashboard,
                  route: 'dashboard',
                  onTap: () => _navigateTo(
                    context,
                    'dashboard',
                    DashboardScreen(userId: userId),
                  ),
                ),
                const SizedBox(height: 4),
                _buildDrawerItem(
                  context,
                  title: 'Fees & Invoices',
                  icon: Icons.receipt_long_outlined,
                  selectedIcon: Icons.receipt_long,
                  route: 'fees',
                  onTap: () => _navigateTo(
                    context,
                    'fees',
                    FeesScreen(userId: userId),
                  ),
                ),
                const SizedBox(height: 4),
                _buildDrawerItem(
                  context,
                  title: 'Bus Service',
                  icon: Icons.directions_bus_outlined,
                  selectedIcon: Icons.directions_bus,
                  route: 'bus',
                  onTap: () => _navigateTo(
                    context,
                    'bus',
                    BusScreen(userId: userId),
                  ),
                ),
                const SizedBox(height: 4),
                _buildDrawerItem(
                  context,
                  title: 'Registration',
                  icon: Icons.app_registration_rounded,
                  selectedIcon: Icons.app_registration,
                  route: 'registration',
                  onTap: () => _navigateTo(
                    context,
                    'registration',
                    RegistrationScreen(userId: userId),
                  ),
                ),
              ],
            ),
          ),
          const Spacer(),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 24),
            child: Divider(height: 1),
          ),
          Padding(
            padding: const EdgeInsets.all(12),
            child: ListTile(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              tileColor: Colors.red.withOpacity(0.05),
              leading: const Icon(Icons.logout_rounded, color: Colors.red),
              title: const Text(
                'Logout',
                style: TextStyle(
                  color: Colors.red,
                  fontWeight: FontWeight.w600,
                ),
              ),
              onTap: () => _logout(context),
            ),
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(24, 60, 24, 24),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(
          bottom: BorderSide(
            color: Colors.grey.withOpacity(0.1),
          ),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.blue.shade50,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(Icons.school_rounded,
                size: 32, color: Colors.blue.shade700),
          ),
          const SizedBox(height: 16),
          const Text(
            "CEC Connect",
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.bold,
              color: Colors.black87,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            "Student Portal",
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[600],
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDrawerItem(
    BuildContext context, {
    required String title,
    required IconData icon,
    required IconData selectedIcon,
    required String route,
    required VoidCallback onTap,
  }) {
    final isSelected = currentRoute == route;
    return ListTile(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      tileColor: isSelected ? Colors.blue.shade50 : Colors.transparent,
      leading: Icon(
        isSelected ? selectedIcon : icon,
        color: isSelected ? Colors.blue.shade700 : Colors.grey[600],
      ),
      title: Text(
        title,
        style: TextStyle(
          fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
          color: isSelected ? Colors.blue.shade900 : Colors.grey[800],
        ),
      ),
      onTap: onTap,
    );
  }
}
