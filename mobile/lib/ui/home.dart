import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import '../api.dart';
import '../models.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<Machine> _machines = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final m = await context.read<AuthProvider>().getMachines();
      if (mounted) {
        setState(() {
          _machines = m;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final loc = AppLocalizations.of(context)!;
    final isAdmin = context.watch<AuthProvider>().isAdmin;

    final overdueMachines = _machines.where((m) {
      if (m.lastZaprafkaEnd == null) return false;
      final nextDate = m.lastZaprafkaEnd!.add(Duration(days: m.zaprafkaIntervalMonths * 30));
      return nextDate.difference(DateTime.now()).inDays < 30;
    }).toList();

    return Scaffold(
      appBar: AppBar(
        title: Text(loc.mainMenuTitle),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () {
              context.read<AuthProvider>().logout();
              context.go('/login');
            },
          )
        ],
      ),
      body: _loading ? const Center(child: CircularProgressIndicator()) : Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: SizedBox(
              width: double.infinity,
              height: 64,
              child: ElevatedButton.icon(
                onPressed: () => context.push('/qr'),
                icon: const Icon(Icons.qr_code_scanner, size: 32),
                label: Text(loc.scanQr, style: const TextStyle(fontSize: 20)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Theme.of(context).primaryColor,
                  foregroundColor: Colors.white,
                ),
              ),
            ),
          ),
          if (overdueMachines.isNotEmpty)
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 16),
              padding: const EdgeInsets.all(8),
              color: Colors.orange.shade100,
              child: Row(
                children: [
                  const Icon(Icons.warning, color: Colors.deepOrange),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text('Внимание: ${overdueMachines.length} станков требуют заправки!'),
                  )
                ],
              ),
            ),
          Expanded(
            child: GridView.count(
              padding: const EdgeInsets.all(16),
              crossAxisCount: 2,
              mainAxisSpacing: 16,
              crossAxisSpacing: 16,
              children: [
                _MenuButton(title: loc.history, icon: Icons.history, onTap: () => context.push('/history')),
                _MenuButton(title: loc.plans, icon: Icons.calendar_month, onTap: () => context.push('/plans')),
                _MenuButton(title: loc.repairsAndExpenses, icon: Icons.build, onTap: () => context.push('/repairs')),
                _MenuButton(title: loc.machines, icon: Icons.precision_manufacturing, onTap: () {
                  // Machine list
                }),
                if (isAdmin)
                  _MenuButton(title: loc.admin, icon: Icons.admin_panel_settings, onTap: () {
                    context.push('/admin');
                  }),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _MenuButton extends StatelessWidget {
  final String title;
  final IconData icon;
  final VoidCallback onTap;
  const _MenuButton({required this.title, required this.icon, required this.onTap});
  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 4,
      child: InkWell(
        onTap: onTap,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 48, color: Theme.of(context).primaryColor),
            const SizedBox(height: 16),
            Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold), textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }
}
