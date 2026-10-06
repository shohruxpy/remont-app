import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../api.dart';
import '../models.dart';

class AdminScreen extends StatelessWidget {
  const AdminScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 4,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Управление'),
          bottom: const TabBar(
            isScrollable: true,
            tabs: [
              Tab(text: 'Пользователи'),
              Tab(text: 'Станки'),
              Tab(text: 'Аудит'),
              Tab(text: 'Шаблоны'),
            ],
          ),
        ),
        body: const TabBarView(
          children: [
            UsersTab(),
            MachinesTab(),
            AuditLogTab(),
            TemplatesTab(),
          ],
        ),
      ),
    );
  }
}

class UsersTab extends StatefulWidget {
  const UsersTab({super.key});
  @override
  State<UsersTab> createState() => _UsersTabState();
}
class _UsersTabState extends State<UsersTab> {
  List<User> _users = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }
  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final res = await context.read<AuthProvider>().getUsers();
      if (mounted) setState(() { _users = res; _loading = false; });
    } catch(e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _showUserDialog([User? user]) {
    final usernameCtrl = TextEditingController(text: user?.username);
    final fullNameCtrl = TextEditingController(text: user?.fullName);
    final roleCtrl = TextEditingController(text: user?.role ?? 'USER');

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(user == null ? 'Новый пользователь' : 'Редактировать'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(controller: usernameCtrl, decoration: const InputDecoration(labelText: 'Логин')),
            TextField(controller: fullNameCtrl, decoration: const InputDecoration(labelText: 'ФИО')),
            TextField(controller: roleCtrl, decoration: const InputDecoration(labelText: 'Роль (USER/ADMIN)')),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Отмена')),
          ElevatedButton(
            onPressed: () async {
              final data = {
                'username': usernameCtrl.text,
                'full_name': fullNameCtrl.text,
                'role': roleCtrl.text,
                if (user == null) 'password': 'password', // dummy password for creation
              };
              if (user == null) {
                await context.read<AuthProvider>().createUser(data);
              } else {
                await context.read<AuthProvider>().updateUser(user.id, data);
              }
              if (mounted) Navigator.pop(context);
              _load();
            },
            child: const Text('Сохранить'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    return Scaffold(
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showUserDialog(),
        child: const Icon(Icons.add),
      ),
      body: ListView.builder(
        itemCount: _users.length,
        itemBuilder: (context, index) {
          final u = _users[index];
          return ListTile(
            title: Text(u.fullName),
            subtitle: Text('${u.username} - ${u.role}'),
            trailing: IconButton(icon: const Icon(Icons.edit), onPressed: () => _showUserDialog(u)),
          );
        },
      ),
    );
  }
}

class MachinesTab extends StatefulWidget {
  const MachinesTab({super.key});
  @override
  State<MachinesTab> createState() => _MachinesTabState();
}
class _MachinesTabState extends State<MachinesTab> {
  List<Machine> _machines = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }
  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final res = await context.read<AuthProvider>().getMachines();
      if (mounted) setState(() { _machines = res; _loading = false; });
    } catch(e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _showMachineDialog([Machine? machine]) {
    final codeCtrl = TextEditingController(text: machine?.code);
    final nameCtrl = TextEditingController(text: machine?.name);
    final statusCtrl = TextEditingController(text: machine?.status ?? 'active');
    final zaprafkaCtrl = TextEditingController(text: machine?.zaprafkaIntervalMonths.toString() ?? '60');

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(machine == null ? 'Новый станок' : 'Редактировать'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(controller: codeCtrl, decoration: const InputDecoration(labelText: 'Код')),
            TextField(controller: nameCtrl, decoration: const InputDecoration(labelText: 'Название')),
            TextField(controller: statusCtrl, decoration: const InputDecoration(labelText: 'Статус')),
            TextField(controller: zaprafkaCtrl, decoration: const InputDecoration(labelText: 'Интервал заправки (мес)'), keyboardType: TextInputType.number),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Отмена')),
          ElevatedButton(
            onPressed: () async {
              final data = {
                'code': codeCtrl.text,
                'name': nameCtrl.text,
                'status': statusCtrl.text,
                'zaprafka_interval_months': int.tryParse(zaprafkaCtrl.text) ?? 60,
              };
              if (machine == null) {
                await context.read<AuthProvider>().createMachine(data);
              } else {
                await context.read<AuthProvider>().updateMachine(machine.id, data);
              }
              if (mounted) Navigator.pop(context);
              _load();
            },
            child: const Text('Сохранить'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    return Scaffold(
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showMachineDialog(),
        child: const Icon(Icons.add),
      ),
      body: ListView.builder(
        itemCount: _machines.length,
        itemBuilder: (context, index) {
          final m = _machines[index];
          return ListTile(
            title: Text('${m.name} (${m.code})'),
            subtitle: Text('Статус: ${m.status}'),
            trailing: IconButton(icon: const Icon(Icons.edit), onPressed: () => _showMachineDialog(m)),
          );
        },
      ),
    );
  }
}

class AuditLogTab extends StatefulWidget {
  const AuditLogTab({super.key});
  @override
  State<AuditLogTab> createState() => _AuditLogTabState();
}
class _AuditLogTabState extends State<AuditLogTab> {
  List<AuditLog> _logs = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }
  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final res = await context.read<AuthProvider>().getAuditLogs();
      if (mounted) setState(() { _logs = res; _loading = false; });
    } catch(e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    return ListView.builder(
      itemCount: _logs.length,
      itemBuilder: (context, index) {
        final log = _logs[index];
        return ListTile(
          title: Text('${log.action} - ${log.resourceType}'),
          subtitle: Text('${log.createdAt}\nUser: ${log.userId}'),
          isThreeLine: true,
        );
      },
    );
  }
}

class TemplatesTab extends StatefulWidget {
  const TemplatesTab({super.key});
  @override
  State<TemplatesTab> createState() => _TemplatesTabState();
}
class _TemplatesTabState extends State<TemplatesTab> {
  List<Template> _templates = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }
  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final res = await context.read<AuthProvider>().getTemplates();
      if (mounted) setState(() { _templates = res; _loading = false; });
    } catch(e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    return ListView.builder(
      itemCount: _templates.length,
      itemBuilder: (context, index) {
        final t = _templates[index];
        return ListTile(
          title: Text(t.name),
          subtitle: Text('Type: ${t.type}'),
        );
      },
    );
  }
}
