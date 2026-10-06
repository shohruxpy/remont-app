import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import '../api.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}
class _LoginScreenState extends State<LoginScreen> {
  final _usernameCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _isLoading = false;
  String? _error;

  @override
  Widget build(BuildContext context) {
    final loc = AppLocalizations.of(context)!;
    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(loc.loginTitle, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
              const SizedBox(height: 32),
              if (_error != null)
                Text(_error!, style: const TextStyle(color: Colors.red)),
              const SizedBox(height: 8),
              TextField(
                controller: _usernameCtrl,
                decoration: InputDecoration(labelText: loc.loginLabel, border: const OutlineInputBorder()),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _passwordCtrl,
                decoration: InputDecoration(labelText: loc.passwordLabel, border: const OutlineInputBorder()),
                obscureText: true,
              ),
              const SizedBox(height: 16),
              Consumer<AuthProvider>(
                builder: (context, auth, _) => TextFormField(
                  initialValue: auth.baseUrl,
                  onChanged: (val) => auth.setBaseUrl(val),
                  decoration: const InputDecoration(labelText: 'Сервер', border: OutlineInputBorder()),
                ),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : () async {
                    setState(() { _isLoading = true; _error = null; });
                    try {
                      await context.read<AuthProvider>().login(_usernameCtrl.text, _passwordCtrl.text);
                      if (context.mounted) context.go('/home');
                    } catch (e) {
                      setState(() {
                        _error = e.toString().contains('auth_failed') ? loc.loginError : loc.serverError;
                      });
                    } finally {
                      if (mounted) setState(() => _isLoading = false);
                    }
                  },
                  child: _isLoading ? const CircularProgressIndicator() : Text(loc.loginButton),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
