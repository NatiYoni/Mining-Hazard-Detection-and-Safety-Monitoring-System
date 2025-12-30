import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../domain/entities/device.dart';
import '../bloc/dashboard_bloc.dart';
import '../bloc/dashboard_state.dart';

class AlertsPanel extends StatelessWidget {
  const AlertsPanel({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<DashboardBloc, DashboardState>(
      builder: (context, state) {
        if (state is DashboardLoaded) {
          final activeAlerts = state.devices
              .where((d) => d.status != 'Safe')
              .toList()
            ..sort((a, b) {
              if (a.status == 'Critical' && b.status != 'Critical') return -1;
              if (b.status == 'Critical' && a.status != 'Critical') return 1;
              return b.lastSeen.compareTo(a.lastSeen);
            });

          if (activeAlerts.isEmpty) return const SizedBox.shrink();

          return Container(
            margin: const EdgeInsets.only(bottom: 16),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.only(bottom: 8.0),
                  child: Text(
                    'ACTIVE ALERTS (${activeAlerts.length})',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: Colors.grey.shade600,
                      letterSpacing: 1.2,
                    ),
                  ),
                ),
                ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: activeAlerts.length > 3 ? 3 : activeAlerts.length,
                  separatorBuilder: (context, index) => const SizedBox(height: 8),
                  itemBuilder: (context, index) {
                    return _AlertCard(device: activeAlerts[index]);
                  },
                ),
              ],
            ),
          );
        }
        return const SizedBox.shrink();
      },
    );
  }
}

class _AlertCard extends StatelessWidget {
  final Device device;

  const _AlertCard({required this.device});

  String _getCause(Device d) {
    final p = d.currentReadings;
    if (p == null) return 'UNKNOWN HAZARD';
    if (p.fall == true) return 'FALL DETECTED';
    if ((p.gas ?? 0) > 700) return 'GAS LEAK DETECTED';
    if ((p.temp ?? 0) > 38) return 'CRITICAL HEAT';
    if ((p.temp ?? 0) > 31) return 'HIGH HEAT';
    return 'UNKNOWN HAZARD';
  }

  @override
  Widget build(BuildContext context) {
    final isCritical = device.status == 'Critical';
    final color = isCritical ? Colors.red : Colors.orange;
    final bgColor = isCritical ? Colors.red.shade50 : Colors.orange.shade50;

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(8),
        border: Border(left: BorderSide(color: color, width: 4)),
      ),
      child: Row(
        children: [
          Icon(
            isCritical ? Icons.warning_rounded : Icons.info_outline,
            color: color,
            size: 20,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Device: ${device.id.substring(0, 8)}...',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
                Text(
                  _getCause(device),
                  style: TextStyle(
                    fontSize: 12,
                    color: color.withOpacity(0.8),
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
          Text(
            'Just now', // Implement proper time formatting
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey.shade600,
            ),
          ),
        ],
      ),
    );
  }
}
