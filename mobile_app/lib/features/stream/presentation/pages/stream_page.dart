import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mobile_app/features/dashboard/domain/entities/device.dart';
import 'package:mobile_app/features/dashboard/presentation/bloc/dashboard_bloc.dart';
import 'package:mobile_app/features/dashboard/presentation/bloc/dashboard_state.dart';

class StreamPage extends StatefulWidget {
  const StreamPage({super.key});

  @override
  State<StreamPage> createState() => _StreamPageState();
}

class _StreamPageState extends State<StreamPage> {
  String? _selectedDeviceId;

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<DashboardBloc, DashboardState>(
      builder: (context, state) {
        if (state is DashboardLoaded) {
          final onlineDevices = state.devices.where((d) => d.isOnline).toList();

          if (onlineDevices.isEmpty) {
            return const Center(child: Text('No online devices available for streaming.'));
          }

          // Auto-select first device if none selected
          if (_selectedDeviceId == null && onlineDevices.isNotEmpty) {
            _selectedDeviceId = onlineDevices.first.id;
          }

          // Ensure selected device is still valid/online
          if (_selectedDeviceId != null &&
              !onlineDevices.any((d) => d.id == _selectedDeviceId)) {
            _selectedDeviceId = onlineDevices.first.id;
          }

          final selectedDevice = onlineDevices.firstWhere(
            (d) => d.id == _selectedDeviceId,
            orElse: () => onlineDevices.first,
          );

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Live Video Stream',
                  style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16),
                DropdownButtonFormField<String>(
                  value: _selectedDeviceId,
                  decoration: const InputDecoration(
                    labelText: 'Select Online Device',
                    border: OutlineInputBorder(),
                  ),
                  items: onlineDevices.map((d) {
                    return DropdownMenuItem(
                      value: d.id,
                      child: Text('${d.id} (${d.status})'),
                    );
                  }).toList(),
                  onChanged: (value) {
                    setState(() {
                      _selectedDeviceId = value;
                    });
                  },
                ),
                const SizedBox(height: 24),
                Container(
                  height: 250,
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: Colors.black,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.videocam_off, color: Colors.white54, size: 48),
                        SizedBox(height: 16),
                        Text(
                          'Live Stream Placeholder',
                          style: TextStyle(color: Colors.white54),
                        ),
                        Text(
                          '(Video Player Implementation Required)',
                          style: TextStyle(color: Colors.white24, fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Device Status',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 16),
                        _buildInfoRow('Device ID', selectedDevice.id),
                        const SizedBox(height: 8),
                        _buildInfoRow('Status', selectedDevice.status),
                        const SizedBox(height: 8),
                        _buildInfoRow('Last Seen', selectedDevice.lastSeen.toString()),
                        if (selectedDevice.currentReadings != null) ...[
                          const Divider(height: 24),
                          const Text(
                            'Current Readings',
                            style: TextStyle(fontWeight: FontWeight.w500),
                          ),
                          const SizedBox(height: 8),
                          _buildInfoRow('Temp', '${selectedDevice.currentReadings!.temp}°C'),
                          _buildInfoRow('Gas', '${selectedDevice.currentReadings!.gas} ppm'),
                        ],
                      ],
                    ),
                  ),
                ),
              ],
            ),
          );
        }
        return const Center(child: CircularProgressIndicator());
      },
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(color: Colors.grey)),
        Text(value, style: const TextStyle(fontWeight: FontWeight.w500)),
      ],
    );
  }
}
