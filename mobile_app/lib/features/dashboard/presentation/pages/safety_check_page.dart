import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../domain/entities/device.dart';
import '../bloc/dashboard_bloc.dart';
import '../bloc/dashboard_state.dart';

class SafetyCheckPage extends StatelessWidget {
  const SafetyCheckPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<DashboardBloc, DashboardState>(
      builder: (context, state) {
        if (state is DashboardLoaded) {
          final onlineDevices = state.devices.where((d) => d.isOnline).toList();

          if (onlineDevices.isEmpty) {
            return const Center(
              child: Text('No active devices found in your area.'),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: onlineDevices.length,
            itemBuilder: (context, index) {
              return WorkerDeviceCard(device: onlineDevices[index]);
            },
          );
        }
        return const Center(child: CircularProgressIndicator());
      },
    );
  }
}

class WorkerDeviceCard extends StatelessWidget {
  final Device device;

  const WorkerDeviceCard({super.key, required this.device});

  @override
  Widget build(BuildContext context) {
    final isSafe = device.status == 'Safe';
    final color = isSafe ? Colors.green : (device.status == 'Critical' ? Colors.red : Colors.orange);

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Device ID: ${device.id.substring(0, 8)}',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: color.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        device.status.toUpperCase(),
                        style: TextStyle(
                          color: color,
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ],
                ),
                Icon(
                  isSafe ? Icons.check_circle : Icons.warning,
                  color: color,
                  size: 32,
                ),
              ],
            ),
            const Divider(height: 24),
            if (device.currentReadings != null) ...[
              _buildReadingRow('Temperature', '${device.currentReadings!.temp?.toStringAsFixed(1)}°C', Icons.thermostat),
              const SizedBox(height: 8),
              _buildReadingRow('Gas Level', '${device.currentReadings!.gas?.toStringAsFixed(0)} ppm', Icons.cloud),
              const SizedBox(height: 8),
              _buildReadingRow('Fall Detected', device.currentReadings!.fall == true ? 'YES' : 'NO', Icons.person_off),
            ] else
              const Text('No readings available'),
          ],
        ),
      ),
    );
  }

  Widget _buildReadingRow(String label, String value, IconData icon) {
    return Row(
      children: [
        Icon(icon, size: 16, color: Colors.grey),
        const SizedBox(width: 8),
        Text(
          '$label:',
          style: const TextStyle(color: Colors.grey),
        ),
        const Spacer(),
        Text(
          value,
          style: const TextStyle(fontWeight: FontWeight.w500),
        ),
      ],
    );
  }
}
