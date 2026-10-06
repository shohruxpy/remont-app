import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import '../api.dart';
import '../models.dart';

class PlansScreen extends StatefulWidget {
  final String? machineCode;
  const PlansScreen({super.key, this.machineCode});

  @override
  State<PlansScreen> createState() => _PlansScreenState();
}

class _PlansScreenState extends State<PlansScreen> {
  DateTime _dateFrom = DateTime.now();
  DateTime _dateTo = DateTime(DateTime.now().year, DateTime.now().month + 3, 1);
  List<Plan> _plans = [];
  Machine? _machine;
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
      final p = await api.getPlans(machineCode: widget.machineCode, dateFrom: df, dateTo: dt);
      
      Machine? m;
      if (widget.machineCode != null) {
        m = await api.getMachine(widget.machineCode!);
      }
      
      if (mounted) {
        setState(() {
          _plans = p;
          _machine = m;
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
      firstDate: DateTime.now().subtract(const Duration(days: 365)),
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
    
    return Scaffold(
      appBar: AppBar(title: Text(widget.machineCode != null ? '${loc.plans}: ${widget.machineCode}' : loc.plans)),
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
          if (_machine != null) _buildZaprafkaBlock(loc, _machine!),
          Expanded(
            child: _loading 
              ? const Center(child: CircularProgressIndicator())
              : ListView.builder(
                  itemCount: _plans.length,
                  itemBuilder: (context, index) {
                    final p = _plans[index];
                    return Card(
                      margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      child: ListTile(
                        title: Text('${p.type} - ${DateFormat('dd.MM.yyyy').format(p.planDate)}'),
                        subtitle: Text('${p.description ?? ''}\nСтатус: ${p.status}'),
                        trailing: p.status == 'PLANNED' || p.status == 'OVERDUE' ? IconButton(
                          icon: const Icon(Icons.check, color: Colors.green),
                          onPressed: () {
                            // "Done" opens the repair creation screen
                            context.push('/repairs?machineCode=${p.machineId}&planId=${p.id}');
                          },
                        ) : null,
                      ),
                    );
                  },
              ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          // Add new plan
        },
        child: const Icon(Icons.add),
      ),
    );
  }

  Widget _buildZaprafkaBlock(AppLocalizations loc, Machine m) {
    DateTime? nextDate;
    if (m.lastZaprafkaEnd != null) {
      nextDate = m.lastZaprafkaEnd!.add(Duration(days: m.zaprafkaIntervalMonths * 30));
    }
    
    Color color = Colors.grey;
    String status = 'Нет данных';
    
    if (nextDate != null) {
      final diff = nextDate.difference(DateTime.now()).inDays;
      if (diff < 0) {
        color = Colors.red;
        status = loc.zaprafkaOverdue;
      } else if (diff <= 180) {
        color = Colors.orange;
        status = 'Осталось менее 6 мес';
      } else {
        color = Colors.green;
        status = 'Осталось более 6 мес';
      }
    }

    return Card(
      margin: const EdgeInsets.all(8),
      color: color.withOpacity(0.1),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('Блок Заправки', style: TextStyle(fontWeight: FontWeight.bold, color: color, fontSize: 18)),
            const SizedBox(height: 8),
            Text('Последняя: ${m.lastZaprafkaEnd != null ? DateFormat('dd.MM.yyyy').format(m.lastZaprafkaEnd!) : 'Нет данных'}'),
            Text('${loc.nextZaprafka}: ${nextDate != null ? DateFormat('dd.MM.yyyy').format(nextDate) : 'Нет данных'}'),
            Text('Статус: $status', style: TextStyle(fontWeight: FontWeight.bold, color: color)),
          ],
        ),
      ),
    );
  }
}
