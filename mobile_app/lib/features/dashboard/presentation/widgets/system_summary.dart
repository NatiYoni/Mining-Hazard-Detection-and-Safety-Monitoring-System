import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../bloc/dashboard_bloc.dart';
import '../bloc/dashboard_state.dart';
import 'summary_card.dart';

class SystemSummary extends StatelessWidget {
  const SystemSummary({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<DashboardBloc, DashboardState>(
      builder: (context, state) {
        if (state is DashboardLoaded) {
          return GridView.count(
            crossAxisCount: 2,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            childAspectRatio: 1.3,
            children: [
              SummaryCard(
                title: "Total Devices",
                value: "${state.onlineDevices} / ${state.totalDevices}",
                subtext: "Online Now",
                icon: Icons.group,
                color: Colors.blue.shade50,
                iconColor: Colors.blue,
              ),
              SummaryCard(
                title: "Critical Alerts",
                value: state.criticalAlerts.toString(),
                subtext: "Requires Action",
                icon: Icons.warning_amber_rounded,
                color: Colors.red.shade50,
                iconColor: Colors.red,
                textColor: Colors.red,
              ),
              SummaryCard(
                title: "Warnings",
                value: state.warnings.toString(),
                subtext: "Monitor Closely",
                icon: Icons.show_chart,
                color: Colors.orange.shade50,
                iconColor: Colors.orange,
                textColor: Colors.orange,
              ),
              SummaryCard(
                title: "Avg Temp",
                value: "${state.avgTemp}°C",
                subtext: "Mine Average",
                icon: Icons.thermostat,
                color: Colors.green.shade50,
                iconColor: Colors.green,
              ),
            ],
          );
        }
        return const Center(child: CircularProgressIndicator());
      },
    );
  }
}
