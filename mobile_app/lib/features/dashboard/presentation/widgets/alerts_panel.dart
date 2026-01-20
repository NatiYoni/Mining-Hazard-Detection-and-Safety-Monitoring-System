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
              // Sort by recency (newest first)
              return b.lastSeen.compareTo(a.lastSeen);
            });

          if (activeAlerts.isEmpty) return const SizedBox.shrink();

          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 8.0),
                child: Row(
                  children: [
                    const Icon(Icons.warning_amber_rounded, color: Colors.red, size: 20),
                    const SizedBox(width: 8),
                    Text(
                      'Active Alerts (${activeAlerts.length})',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.red,
                      ),
                    ),
                  ],
                ),
              ),
              SizedBox(
                height: 140,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: activeAlerts.length,
                  separatorBuilder: (context, index) => const SizedBox(width: 12),
                  itemBuilder: (context, index) {
                    return SizedBox(
                      width: 280,
                      child: _AlertCard(device: activeAlerts[index]),
                    );
                  },
                ),
              ),
            ],
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
    if ((p.temp ?? 0) > 25) return 'CRITICAL HEAT';
    if ((p.temp ?? 0) > 24) return 'HIGH HEAT';
    return 'UNKNOWN HAZARD';
  }

  @override
  Widget build(BuildContext context) {
    final isCritical = device.status == 'Critical';
    final color = isCritical ? Colors.red : Colors.orange;
    final borderColor = isCritical ? Colors.red.shade200 : Colors.orange.shade200;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor),
        boxShadow: [
          BoxShadow(
            color: color.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    Icon(Icons.warning, size: 14, color: color),
                    const SizedBox(width: 4),
                    Text(
                      isCritical ? 'CRITICAL' : 'WARNING',
                      style: TextStyle(
                        color: color,
                        fontWeight: FontWeight.bold,
                        fontSize: 10,
                      ),
                    ),
                  ],
                ),
              ),
              Text(
                _formatTime(device.lastSeen),
                style: TextStyle(fontSize: 10, color: Colors.grey.shade500),
              ),
            ],
          ),
          Text(
            _getCause(device),
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Colors.grey.shade800,
            ),
          ),
          Row(
            children: [
              Icon(Icons.memory, size: 14, color: Colors.grey.shade400),
              const SizedBox(width: 4),
              Text(
                'Device: ${device.id.length > 8 ? device.id.substring(0, 8) : device.id}...',
                style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _formatTime(DateTime time) {
    final now = DateTime.now();
    final diff = now.difference(time);
    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    return '${diff.inHours}h ago';
  }
}
