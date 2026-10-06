import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import '../api.dart';
import '../models.dart';

class HistoryScreen extends StatefulWidget {
  final String? machineCode;
  const HistoryScreen({super.key, this.machineCode});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  DateTime _dateFrom = DateTime(DateTime.now().year, DateTime.now().month, 1);
  DateTime _dateTo = DateTime.now();
  List<Repair> _repairs = [];
  List<Zaprafka> _zaprafkas = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    final api = context.read<AuthProvider>();
    try {
      final df = DateFormat('yyyy-MM-dd').format(_dateFrom);
      final dt = DateFormat('yyyy-MM-dd').format(_dateTo);
      final r = await api.getRepairs(machineCode: widget.machineCode, dateFrom: df, dateTo: dt);
      final z = await api.getZaprafkas(machineCode: widget.machineCode);
      
      if (mounted) {
        setState(() {
          _repairs = r;
          _zaprafkas = z.where((zap) => zap.startDate.isBefore(_dateTo.add(const Duration(days: 1))) && 
                                       (zap.endDate == null || zap.endDate!.isAfter(_dateFrom))).toList();
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _selectDateRange() async {
    final picked = await showDateRangePicker(
      context: context,
      initialDateRange: DateTimeRange(start: _dateFrom, end: _dateTo),
      firstDate: DateTime(2020),
      lastDate: DateTime(2030),
    );
    if (picked != null) {
      setState(() {
        _dateFrom = picked.start;
        _dateTo = picked.end;
      });
      _loadData();
    }
  }

  @override
  Widget build(BuildContext context) {
    final loc = AppLocalizations.of(context)!;
    final isAdmin = context.watch<AuthProvider>().isAdmin;
    
    // Analytics
    int repairsCount = 0;
    double newQty = 0;
    double refQty = 0;
    double newAmt = 0;
    double refAmt = 0;

    for (final r in _repairs) {
      if (r.type != 'ZAPRAFKA_WORK') repairsCount++;
      for (final item in r.items) {
        if (item.condition == 'NEW') {
          newQty += item.qty;
          newAmt += item.amount ?? 0;
        } else {
          refQty += item.qty;
          refAmt += item.amount ?? 0;
        }
      }
    }

    final totalQty = newQty + refQty;
    final refShare = totalQty > 0 ? (refQty / totalQty * 100).toStringAsFixed(1) : '0';

    return Scaffold(
      appBar: AppBar(title: Text(widget.machineCode != null ? '${loc.history}: ${widget.machineCode}' : loc.history)),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: Row(
              children: [
                Expanded(
                  child: Text('${DateFormat('dd.MM.yyyy').format(_dateFrom)} - ${DateFormat('dd.MM.yyyy').format(_dateTo)}')
                ),
                ElevatedButton(
                  onPressed: _selectDateRange,
                  child: const Icon(Icons.date_range),
                )
              ],
            ),
          ),
          if (!_loading)
            Card(
              margin: const EdgeInsets.all(8),
              color: Colors.blue.shade50,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Аналитика за период:', style: const TextStyle(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    Text('${loc.analyticsRepairsCount}: $repairsCount'),
                    Text('${loc.analyticsTotalNew}: $newQty ${isAdmin ? '(Сумма: ${newAmt.toStringAsFixed(2)})' : ''}'),
                    Text('${loc.analyticsTotalRef}: $refQty ${isAdmin ? '(Сумма: ${refAmt.toStringAsFixed(2)})' : ''}'),
                    Text('Доля восстановленных: $refShare%'),
                  ],
                ),
              ),
            ),
          Expanded(
            child: _loading 
              ? const Center(child: CircularProgressIndicator())
              : ListView(
                  children: [
                    ..._zaprafkas.map((z) => Card(
                      color: Colors.green.shade50,
                      margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      child: ListTile(
                        title: Text('${loc.zaprafka} (Станок: ${z.machineId})', style: const TextStyle(fontWeight: FontWeight.bold)),
                        subtitle: Text('Статус: ${z.status}\nС: ${DateFormat('dd.MM.yyyy').format(z.startDate)} По: ${z.endDate != null ? DateFormat('dd.MM.yyyy').format(z.endDate!) : '...'}'),
                      ),
                    )),
                    ..._repairs.map((r) => Card(
                      margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      child: ExpansionTile(
                        title: Text('${r.type} - ${DateFormat('dd.MM.yyyy').format(r.repairDate)}'),
                        subtitle: Text(r.description ?? ''),
                        children: [
                          if (r.items.where((i) => i.condition == 'NEW').isNotEmpty)
                            const Padding(
                              padding: EdgeInsets.all(8.0),
                              child: Text('Новые детали:', style: TextStyle(fontWeight: FontWeight.bold)),
                            ),
                          ...r.items.where((i) => i.condition == 'NEW').map((i) => ListTile(
                            dense: true,
                            title: Text(i.freeTextMaterial ?? i.materialId ?? 'Деталь'),
                            trailing: Text('${i.qty} ${i.unit ?? 'шт'} ${isAdmin && i.amount != null ? ' | ${i.amount} сум' : ''}'),
                          )),
                          if (r.items.where((i) => i.condition == 'REFURBISHED').isNotEmpty)
                            const Padding(
                              padding: EdgeInsets.all(8.0),
                              child: Text('Восстановленные детали:', style: TextStyle(fontWeight: FontWeight.bold)),
                            ),
                          ...r.items.where((i) => i.condition == 'REFURBISHED').map((i) => ListTile(
                            dense: true,
                            title: Text(i.freeTextMaterial ?? i.materialId ?? 'Деталь'),
                            trailing: Text('${i.qty} ${i.unit ?? 'шт'}'),
                          )),
                        ],
                      ),
                    )),
                  ],
              ),
          ),
        ],
      ),
    );
  }
}
