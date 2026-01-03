import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../domain/entities/device.dart';
import '../bloc/dashboard_bloc.dart';
import '../bloc/dashboard_event.dart';

class DeviceList extends StatelessWidget {
  final List<Device> devices;

  const DeviceList({super.key, required this.devices});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.symmetric(vertical: 8.0),
          child: Text(
            'Live Device Overview',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
        ),
        ListView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: devices.length,
          itemBuilder: (context, index) {
            final device = devices[index];
            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
                border: Border.all(color: Colors.grey.shade100),
              ),
              child: ListTile(
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                leading: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: device.isOnline ? Colors.green.withOpacity(0.1) : Colors.grey.withOpacity(0.1),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    device.isOnline ? Icons.wifi : Icons.wifi_off,
                    color: device.isOnline ? Colors.green : Colors.grey,
                    size: 20,
                  ),
                ),
                title: Text(
                  'Device ${device.id.length > 8 ? device.id.substring(0, 8) : device.id}...',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                ),
                subtitle: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        _StatusBadge(status: device.status),
                        const SizedBox(width: 8),
                        if (device.currentReadings != null)
                          Text(
                            '${device.currentReadings!.temp?.toStringAsFixed(1)}°C',
                            style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                          ),
                      ],
                    ),
                  ],
                ),
                trailing: IconButton(
                  icon: const Icon(Icons.notifications_active_outlined),
                  color: Colors.orange,
                  onPressed: () => _showBuzzerDialog(context, device.id),
                ),
              ),
            );
          },
        ),
      ],
    );
  }

  void _showBuzzerDialog(BuildContext context, String deviceId) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Remote Buzzer'),
        content: const Text('Control the buzzer for this device.'),
        actions: [
          TextButton(
            onPressed: () {
              context.read<DashboardBloc>().add(ToggleBuzzer(deviceId, false));
              Navigator.pop(context);
            },
            child: const Text('Turn OFF'),
          ),
          ElevatedButton(
            onPressed: () {
              context.read<DashboardBloc>().add(ToggleBuzzer(deviceId, true));
              Navigator.pop(context);
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red, foregroundColor: Colors.white),
            child: const Text('Turn ON'),
          ),
        ],
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  final String status;

  const _StatusBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    Color color;
    switch (status.toLowerCase()) {
      case 'critical':
        color = Colors.red;
        break;
      case 'warning':
        color = Colors.orange;
        break;
      case 'safe':
      default:
        color = Colors.green;
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Text(
        status,
        style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.bold),
      ),
    );
  }
}
