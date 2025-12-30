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

class AlertHistoryTab extends StatelessWidget {
  const AlertHistoryTab({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AlertsBloc, AlertsState>(
      builder: (context, state) {
        if (state is AlertsLoading) {
          return const Center(child: CircularProgressIndicator());
        } else if (state is AlertsLoaded) {
          if (state.alerts.isEmpty) {
            return const Center(child: Text('No alert history found.'));
          }
          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: state.alerts.length,
            itemBuilder: (context, index) {
              final alert = state.alerts[index];
              return Card(
                child: ListTile(
                  leading: Icon(
                    alert.severity == 'Critical' ? Icons.error : Icons.warning,
                    color: alert.severity == 'Critical' ? Colors.red : Colors.orange,
                  ),
                  title: Text(alert.message),
                  subtitle: Text(alert.timestamp.toString()),
                ),
              );
            },
          );
        } else if (state is AlertsError) {
          return Center(child: Text(state.message));
        }
        return const SizedBox.shrink();
      },
    );
  }
}
