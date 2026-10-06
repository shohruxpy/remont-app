import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import '../api.dart';
import '../models.dart';

class MachineScreen extends StatefulWidget {
  final String machineCode;
  const MachineScreen({super.key, required this.machineCode});

  @override
  State<MachineScreen> createState() => _MachineScreenState();
}

class _MachineScreenState extends State<MachineScreen> {
  Machine? _machine;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final m = await context.read<AuthProvider>().getMachine(widget.machineCode);
      if (mounted) {
        setState(() {
          _machine = m;
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
    
    if (_loading) {
      return Scaffold(appBar: AppBar(title: Text(widget.machineCode)), body: const Center(child: CircularProgressIndicator()));
    }
    
    if (_machine == null) {
      return Scaffold(appBar: AppBar(title: Text(widget.machineCode)), body: const Center(child: Text('Error loading machine')));
    }

    if (_machine!.status == 'ARCHIVED') {
      return Scaffold(
        appBar: AppBar(title: Text('${loc.machines}: ${_machine!.code}')),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(loc.archivedMachine, style: const TextStyle(fontSize: 20, color: Colors.red)),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => context.push('/history?machineCode=${_machine!.code}'),
                child: Text(loc.history),
              )
            ],
          )
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(title: Text('${_machine!.code} - ${_machine!.name}')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Код: ${_machine!.code}', style: const TextStyle(fontWeight: FontWeight.bold)),
                  Text('Название: ${_machine!.name}'),
                  if (_machine!.location != null) Text('Локация: ${_machine!.location}'),
                  Text('Статус: ${_machine!.status}', style: TextStyle(
                    color: _machine!.status == 'IN_ZAPRAFKA' ? Colors.orange : Colors.green,
                    fontWeight: FontWeight.bold,
                  )),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),
          SizedBox(
            height: 56,
            child: ElevatedButton.icon(
              icon: const Icon(Icons.history),
              onPressed: () => context.push('/history?machineCode=${_machine!.code}'), 
              label: Text(loc.history)
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 56,
            child: ElevatedButton.icon(
              icon: const Icon(Icons.calendar_month),
              onPressed: () => context.push('/plans?machineCode=${_machine!.code}'), 
              label: Text(loc.plans)
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 56,
            child: ElevatedButton.icon(
              icon: const Icon(Icons.build),
              onPressed: () => context.push('/repairs?machineCode=${_machine!.code}'), 
              label: Text(loc.repairsAndExpenses)
            ),
          ),
        ],
      ),
    );
  }
}
