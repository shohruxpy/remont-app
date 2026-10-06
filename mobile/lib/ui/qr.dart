import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';

class QrScannerScreen extends StatelessWidget {
  const QrScannerScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final loc = AppLocalizations.of(context)!;
    return Scaffold(
      appBar: AppBar(title: Text(loc.scanQr)),
      body: MobileScanner(
        onDetect: (capture) {
          final List<Barcode> barcodes = capture.barcodes;
          for (final barcode in barcodes) {
            final code = barcode.rawValue;
            if (code != null) {
              if (code.startsWith('EQ:')) {
                final machineCode = code.substring(3);
                context.go('/machine/$machineCode');
              } else {
                ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(loc.invalidQr)));
                context.pop();
              }
              break;
            }
          }
        },
      ),
    );
  }
}
