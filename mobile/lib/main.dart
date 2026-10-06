import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';

import 'screens.dart';
import 'api.dart';

void main() {
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
      ],
      child: const RemontApp(),
    ),
  );
}

class RemontApp extends StatelessWidget {
  const RemontApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      onGenerateTitle: (context) => AppLocalizations.of(context)!.appTitle,
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: const [Locale('ru')],
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF1D5FD6)),
        useMaterial3: true,
      ),
      routerConfig: _router,
    );
  }
}

final _router = GoRouter(
  initialLocation: '/login',
  routes: [
    GoRoute(
      path: '/login',
      builder: (context, state) => const LoginScreen(),
    ),
    GoRoute(
      path: '/home',
      builder: (context, state) => const HomeScreen(),
    ),
    GoRoute(
      path: '/qr',
      builder: (context, state) => const QrScannerScreen(),
    ),
    GoRoute(
      path: '/machine/:code',
      builder: (context, state) {
        final code = state.pathParameters['code']!;
        return MachineScreen(machineCode: code);
      },
    ),
    GoRoute(
      path: '/history',
      builder: (context, state) {
        final code = state.uri.queryParameters['machineCode'];
        return HistoryScreen(machineCode: code);
      },
    ),
    GoRoute(
      path: '/plans',
      builder: (context, state) {
        final code = state.uri.queryParameters['machineCode'];
        return PlansScreen(machineCode: code);
      },
    ),
    GoRoute(
      path: '/repairs',
      builder: (context, state) {
        final code = state.uri.queryParameters['machineCode'];
        final planId = state.uri.queryParameters['planId'];
        return RepairsScreen(machineCode: code, planId: planId);
      },
    ),
    GoRoute(
      path: '/zaprafka',
      builder: (context, state) {
        final code = state.uri.queryParameters['machineCode'];
        return ZaprafkaScreen(machineCode: code!);
      },
    ),
    GoRoute(
      path: '/admin',
      builder: (context, state) => const AdminScreen(),
    ),
  ],
);
