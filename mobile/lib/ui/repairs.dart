import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:go_router/go_router.dart';
import '../api.dart';
import '../models.dart';

class RepairsScreen extends StatefulWidget {
  final String? machineCode;
  final String? planId;
  const RepairsScreen({super.key, this.machineCode, this.planId});

  @override
  State<RepairsScreen> createState() => _RepairsScreenState();
}

class _RepairsScreenState extends State<RepairsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  
  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  Widget build(BuildContext context) {
    final loc = AppLocalizations.of(context)!;
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.machineCode != null ? '${loc.repairsAndExpenses}: ${widget.machineCode}' : loc.repairsAndExpenses),
        bottom: TabBar(
          controller: _tabController,
          tabs: [
            Tab(text: loc.addRecord),
            Tab(text: loc.zaprafka),
            Tab(text: loc.history),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _NewRepairForm(machineCode: widget.machineCode, planId: widget.planId),
          _ZaprafkaSection(machineCode: widget.machineCode),
          _PastRecords(machineCode: widget.machineCode),
        ],
      ),
    );
  }
}

class _NewRepairForm extends StatefulWidget {
  final String? machineCode;
  final String? planId;
  const _NewRepairForm({this.machineCode, this.planId});

  @override
  State<_NewRepairForm> createState() => _NewRepairFormState();
}

class _NewRepairFormState extends State<_NewRepairForm> {
  DateTime _date = DateTime.now();
  String _type = 'REPAIR';
  final _descCtrl = TextEditingController();
  final _crewCtrl = TextEditingController();
  List<RepairItem> _items = [];
  bool _loading = false;
  
  List<Machine> _allMachines = [];
  Machine? _selectedMachine;

  @override
  void initState() {
    super.initState();
    if (widget.machineCode == null) {
      _loadMachines();
    }
  }

  Future<void> _loadMachines() async {
    final m = await context.read<AuthProvider>().getMachines();
    setState(() {
      _allMachines = m;
    });
  }

  Future<void> _save() async {
    final machineId = widget.machineCode ?? _selectedMachine?.id;
    if (machineId == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Выберите станок')));
      return;
    }
    if (_descCtrl.text.isEmpty && _items.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Заполните описание или добавьте детали')));
      return;
    }
    setState(() => _loading = true);
    try {
      final repair = Repair(
        machineId: machineId,
        repairDate: _date,
        type: _type,
        description: _descCtrl.text,
        crew: _crewCtrl.text,
        planId: widget.planId,
        items: _items,
      );
      await context.read<AuthProvider>().addRepair(repair);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Успешно сохранено')));
        context.pop(); // or clear form
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Ошибка сохранения')));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final loc = AppLocalizations.of(context)!;
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (widget.machineCode == null)
            DropdownButtonFormField<Machine>(
              value: _selectedMachine,
              hint: Text(loc.selectMachine),
              items: _allMachines.map((m) => DropdownMenuItem(value: m, child: Text(m.code))).toList(),
              onChanged: (v) => setState(() => _selectedMachine = v),
            ),
          const SizedBox(height: 16),
          ListTile(
            title: Text('Дата: ${DateFormat('dd.MM.yyyy').format(_date)}'),
            trailing: const Icon(Icons.date_range),
            onTap: () async {
              final picked = await showDatePicker(
                context: context,
                initialDate: _date,
                firstDate: DateTime(2020),
                lastDate: DateTime.now(),
              );
              if (picked != null) setState(() => _date = picked);
            },
          ),
          DropdownButtonFormField<String>(
            value: _type,
            decoration: InputDecoration(labelText: loc.type),
            items: const [
              DropdownMenuItem(value: 'REPAIR', child: Text('Ремонт')),
              DropdownMenuItem(value: 'INSPECTION', child: Text('Осмотр')),
              DropdownMenuItem(value: 'ZAPRAFKA_WORK', child: Text('Расход на заправку')),
            ],
            onChanged: (v) => setState(() => _type = v!),
          ),
          TextField(controller: _descCtrl, decoration: InputDecoration(labelText: loc.description)),
          TextField(controller: _crewCtrl, decoration: InputDecoration(labelText: loc.crew)),
          const SizedBox(height: 16),
          Text(loc.addMaterials, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          ..._items.asMap().entries.map((entry) {
            final idx = entry.key;
            final item = entry.value;
            return Card(
              child: ListTile(
                title: Text(item.freeTextMaterial ?? item.materialId ?? 'Материал'),
                subtitle: Text('${item.qty} ${item.condition}'),
                trailing: IconButton(icon: const Icon(Icons.delete), onPressed: () => setState(() => _items.removeAt(idx))),
              ),
            );
          }),
          ElevatedButton.icon(
            icon: const Icon(Icons.add),
            label: Text(loc.addMaterials),
            onPressed: () {
              // open material picker dialog
              _showAddMaterialDialog();
            },
          ),
          const SizedBox(height: 32),
          ElevatedButton(
            onPressed: _loading ? null : _save,
            child: _loading ? const CircularProgressIndicator() : Text(loc.save),
          ),
        ],
      ),
    );
  }
  
  void _showAddMaterialDialog() {
    // A simple dialog for adding material (for MVP, let's allow free text or dropdown)
    String condition = 'NEW';
    double qty = 1;
    final textCtrl = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Деталь'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(controller: textCtrl, decoration: InputDecoration(labelText: 'Название (если нет в SAP)')),
            StatefulBuilder(builder: (c, setSt) => DropdownButton<String>(
              value: condition,
              items: const [
                DropdownMenuItem(value: 'NEW', child: Text('Новый')),
                DropdownMenuItem(value: 'REFURBISHED', child: Text('Восстановленный')),
              ],
              onChanged: (v) => setSt(() => condition = v!),
            )),
            TextField(
              decoration: const InputDecoration(labelText: 'Кол-во'),
              keyboardType: TextInputType.number,
              onChanged: (v) => qty = double.tryParse(v) ?? 1,
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Отмена')),
          ElevatedButton(
            onPressed: () {
              setState(() {
                _items.add(RepairItem(
                  itemNo: _items.length + 1,
                  freeTextMaterial: textCtrl.text,
                  condition: condition,
                  qty: qty,
                ));
              });
              Navigator.pop(ctx);
            }, 
            child: const Text('ОК')
          ),
        ],
      )
    );
  }
}

class _ZaprafkaSection extends StatefulWidget {
  final String? machineCode;
  const _ZaprafkaSection({this.machineCode});

  @override
  State<_ZaprafkaSection> createState() => _ZaprafkaSectionState();
}

class _ZaprafkaSectionState extends State<_ZaprafkaSection> {
  // implemented later
  @override
  Widget build(BuildContext context) {
    return Center(child: ElevatedButton(onPressed: () => context.push('/zaprafka?machineCode=${widget.machineCode}'), child: Text('Перейти к заправке')));
  }
}

class _PastRecords extends StatelessWidget {
  final String? machineCode;
  const _PastRecords({this.machineCode});

  @override
  Widget build(BuildContext context) {
    // Re-uses History logic or similar
    return const Center(child: Text('См. вкладку История'));
  }
}
