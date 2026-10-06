import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import '../api.dart';
import '../models.dart';

class ZaprafkaScreen extends StatefulWidget {
  final String machineCode;
  const ZaprafkaScreen({super.key, required this.machineCode});

  @override
  State<ZaprafkaScreen> createState() => _ZaprafkaScreenState();
}

class _ZaprafkaScreenState extends State<ZaprafkaScreen> {
  bool _loading = true;
  Zaprafka? _activeZaprafka;
  Machine? _machine;
  List<Template> _templates = [];
  Template? _selectedTemplate;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    try {
      final api = context.read<AuthProvider>();
      _machine = await api.getMachine(widget.machineCode);
      final zaps = await api.getZaprafkas(machineCode: widget.machineCode);
      // find in progress
      _activeZaprafka = zaps.where((z) => z.status == 'IN_PROGRESS').firstOrNull;
      if (_activeZaprafka == null) {
        _templates = await api.getTemplates();
      }
    } catch (e) {
      // ignore
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _startZaprafka() async {
    if (_machine == null) return;
    setState(() => _loading = true);
    try {
      final api = context.read<AuthProvider>();
      await api.startZaprafka(
        _machine!.id, 
        DateTime.now().toIso8601String(), 
        _selectedTemplate?.id, 
        null
      );
      await _loadData();
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  Future<void> _finishZaprafka() async {
    if (_activeZaprafka == null) return;
    setState(() => _loading = true);
    try {
      final api = context.read<AuthProvider>();
      await api.finishZaprafka(_activeZaprafka!.id!, DateTime.now().toIso8601String());
      await _loadData();
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final loc = AppLocalizations.of(context)!;
    
    if (_loading) return Scaffold(appBar: AppBar(title: Text(loc.zaprafka)), body: const Center(child: CircularProgressIndicator()));

    return Scaffold(
      appBar: AppBar(title: Text('${loc.zaprafka}: ${widget.machineCode}')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: _activeZaprafka != null ? _buildInProgress(loc) : _buildStart(loc),
      ),
    );
  }

  Widget _buildStart(AppLocalizations loc) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const Icon(Icons.info, size: 64, color: Colors.blue),
        const SizedBox(height: 16),
        const Text('На этом станке нет активной заправки.', textAlign: TextAlign.center, style: TextStyle(fontSize: 18)),
        const SizedBox(height: 32),
        DropdownButtonFormField<Template>(
          value: _selectedTemplate,
          hint: Text(loc.selectTemplate),
          items: _templates.map((t) => DropdownMenuItem(value: t, child: Text(t.name))).toList(),
          onChanged: (v) => setState(() => _selectedTemplate = v),
        ),
        const SizedBox(height: 32),
        ElevatedButton(
          onPressed: _startZaprafka,
          style: ElevatedButton.styleFrom(padding: const EdgeInsets.all(16), backgroundColor: Colors.orange, foregroundColor: Colors.white),
          child: Text(loc.startZaprafka, style: const TextStyle(fontSize: 20)),
        ),
      ],
    );
  }

  Widget _buildInProgress(AppLocalizations loc) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const Icon(Icons.build_circle, size: 64, color: Colors.orange),
        const SizedBox(height: 16),
        const Text('ЗАПРАВКА В ПРОЦЕССЕ', textAlign: TextAlign.center, style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.orange)),
        const SizedBox(height: 16),
        Text('Начата: ${DateFormat('dd.MM.yyyy HH:mm').format(_activeZaprafka!.startDate)}', textAlign: TextAlign.center),
        const SizedBox(height: 32),
        ElevatedButton(
          onPressed: _finishZaprafka,
          style: ElevatedButton.styleFrom(padding: const EdgeInsets.all(16), backgroundColor: Colors.green, foregroundColor: Colors.white),
          child: Text(loc.finishZaprafka, style: const TextStyle(fontSize: 20)),
        ),
      ],
    );
  }
}
