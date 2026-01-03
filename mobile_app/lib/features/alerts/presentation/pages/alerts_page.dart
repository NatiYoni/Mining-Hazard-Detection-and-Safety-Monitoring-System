import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mobile_app/features/dashboard/domain/entities/device.dart';
import 'package:mobile_app/features/dashboard/presentation/bloc/dashboard_bloc.dart';
import 'package:mobile_app/features/dashboard/presentation/bloc/dashboard_state.dart';
import '../bloc/alerts_bloc.dart';
import '../bloc/alerts_event.dart';
import '../bloc/alerts_state.dart';
import 'package:mobile_app/features/dashboard/domain/entities/alert.dart';

class AlertsPage extends StatefulWidget {
  const AlertsPage({super.key});

  @override
  State<AlertsPage> createState() => _AlertsPageState();
}

class _AlertsPageState extends State<AlertsPage> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    context.read<AlertsBloc>().add(FetchAlerts());
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        TabBar(
          controller: _tabController,
          labelColor: Colors.blue,
          unselectedLabelColor: Colors.grey,
          tabs: const [
            Tab(text: 'High Risk Devices'),
            Tab(text: 'Alert History'),
          ],
        ),
        Expanded(
          child: TabBarView(
            controller: _tabController,
            children: const [
              HighRiskDevicesTab(),
              AlertHistoryTab(),
            ],
          ),
        ),
      ],
    );
  }
}

class HighRiskDevicesTab extends StatelessWidget {
  const HighRiskDevicesTab({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<DashboardBloc, DashboardState>(
      builder: (context, state) {
        if (state is DashboardLoaded) {
          final highRiskDevices = state.devices
              .where((d) => d.isOnline && (d.status == 'Critical' || d.status == 'Warning'))
              .toList();

          if (highRiskDevices.isEmpty) {
            return const Center(child: Text('No high risk devices currently.'));
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: highRiskDevices.length,
            itemBuilder: (context, index) {
              return _HighRiskCard(device: highRiskDevices[index]);
            },
          );
        }
        return const Center(child: CircularProgressIndicator());
      },
    );
  }
}

class _HighRiskCard extends StatelessWidget {
  final Device device;
  const _HighRiskCard({required this.device});

  @override
  Widget build(BuildContext context) {
    return Card(
      color: Colors.red.shade50,
      child: ListTile(
        leading: const Icon(Icons.warning, color: Colors.red),
        title: Text('Device: ${device.id}'),
        subtitle: Text('Status: ${device.status}'),
        trailing: const Icon(Icons.arrow_forward_ios, size: 16),
      ),
    );
  }
}

class AlertHistoryTab extends StatefulWidget {
  const AlertHistoryTab({super.key});

  @override
  State<AlertHistoryTab> createState() => _AlertHistoryTabState();
}

class _AlertHistoryTabState extends State<AlertHistoryTab> {
  String _sortOrder = 'newest';

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              const Text('Sort by: ', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(width: 8),
              DropdownButton<String>(
                value: _sortOrder,
                underline: Container(height: 1, color: Colors.grey),
                items: const [
                  DropdownMenuItem(value: 'newest', child: Text('Newest First')),
                  DropdownMenuItem(value: 'oldest', child: Text('Oldest First')),
                  DropdownMenuItem(value: 'critical_high', child: Text('Criticality (High-Low)')),
                  DropdownMenuItem(value: 'critical_low', child: Text('Criticality (Low-High)')),
                ],
                onChanged: (v) => setState(() => _sortOrder = v!),
              ),
            ],
          ),
        ),
        Expanded(
          child: BlocBuilder<AlertsBloc, AlertsState>(
            builder: (context, state) {
              if (state is AlertsLoading) {
                return const Center(child: CircularProgressIndicator());
              } else if (state is AlertsLoaded) {
                if (state.alerts.isEmpty) {
                  return const Center(child: Text('No alert history found.'));
                }
                
                final sortedAlerts = _sortAlerts(state.alerts);

                return ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: sortedAlerts.length,
                  itemBuilder: (context, index) {
                    final alert = sortedAlerts[index];
                    return Card(
                      elevation: 2,
                      margin: const EdgeInsets.only(bottom: 8),
                      child: ListTile(
                        leading: CircleAvatar(
                          backgroundColor: alert.severity == 'Critical' ? Colors.red.shade100 : Colors.orange.shade100,
                          child: Icon(
                            alert.severity == 'Critical' ? Icons.error : Icons.warning,
                            color: alert.severity == 'Critical' ? Colors.red : Colors.orange,
                          ),
                        ),
                        title: Text(alert.message, style: const TextStyle(fontWeight: FontWeight.w500)),
                        subtitle: Text(alert.timestamp.toString().split('.')[0]),
                        trailing: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: alert.severity == 'Critical' ? Colors.red : Colors.orange,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            alert.severity,
                            style: const TextStyle(color: Colors.white, fontSize: 12),
                          ),
                        ),
                      ),
                    );
                  },
                );
              } else if (state is AlertsError) {
                return Center(child: Text(state.message));
              }
              return const SizedBox.shrink();
            },
          ),
        ),
      ],
    );
  }

  List<Alert> _sortAlerts(List<Alert> alerts) {
    final data = List<Alert>.from(alerts);
    int getSeverityWeight(String s) {
      switch(s.toLowerCase()) {
        case 'critical': return 3;
        case 'warning': return 2;
        case 'info': return 1;
        default: return 0;
      }
    }

    data.sort((a, b) {
      switch (_sortOrder) {
        case 'oldest':
          return a.timestamp.compareTo(b.timestamp);
        case 'critical_high':
          final diff = getSeverityWeight(b.severity) - getSeverityWeight(a.severity);
          return diff != 0 ? diff : b.timestamp.compareTo(a.timestamp);
        case 'critical_low':
          final diff = getSeverityWeight(a.severity) - getSeverityWeight(b.severity);
          return diff != 0 ? diff : b.timestamp.compareTo(a.timestamp);
        case 'newest':
        default:
          return b.timestamp.compareTo(a.timestamp);
      }
    });
    return data;
  }
}
