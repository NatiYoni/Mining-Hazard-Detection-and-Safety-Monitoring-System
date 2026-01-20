import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../alerts/presentation/bloc/alerts_bloc.dart';
import '../../../alerts/presentation/bloc/alerts_event.dart';
import '../../../alerts/presentation/bloc/alerts_state.dart';
import '../bloc/dashboard_bloc.dart';
import '../bloc/dashboard_event.dart';
import '../bloc/dashboard_state.dart';
import '../widgets/alerts_panel.dart';
import '../widgets/system_summary.dart';
import '../widgets/alerts_chart.dart';
import '../widgets/device_list.dart';

class DashboardOverview extends StatefulWidget {
  const DashboardOverview({super.key});

  @override
  State<DashboardOverview> createState() => _DashboardOverviewState();
}

class _DashboardOverviewState extends State<DashboardOverview> {
  @override
  void initState() {
    super.initState();
    context.read<DashboardBloc>().add(DashboardStarted());
    context.read<AlertsBloc>().add(FetchAlerts());
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const AlertsPanel(),
          const SizedBox(height: 16),
          const Text(
            'System Overview',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          const SystemSummary(),
          const SizedBox(height: 24),
          
          // Alerts Chart
          BlocBuilder<AlertsBloc, AlertsState>(
            builder: (context, state) {
              if (state is AlertsLoaded) {
                return AlertsChart(alerts: state.alerts);
              } else if (state is AlertsLoading) {
                return const Center(child: CircularProgressIndicator());
              }
              return const SizedBox.shrink();
            },
          ),
          
          const SizedBox(height: 24),

          // Device List
          BlocBuilder<DashboardBloc, DashboardState>(
            builder: (context, state) {
              if (state is DashboardLoaded) {
                // Only show online devices
                final onlineDevices = state.devices.where((d) => d.isOnline).toList();
                return DeviceList(devices: onlineDevices);
              }
              return const SizedBox.shrink();
            },
          ),
        ],
      ),
    );
  }
}
