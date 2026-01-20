import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../domain/entities/alert.dart';

class AlertsChart extends StatefulWidget {
  final List<Alert> alerts;

  const AlertsChart({super.key, required this.alerts});

  @override
  State<AlertsChart> createState() => _AlertsChartState();
}

class _AlertsChartState extends State<AlertsChart> {
  String _timeRange = 'week'; // today, week, month
  String _chartType = 'bar'; // bar, line, pie

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 15,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildHeader(),
          const SizedBox(height: 32),
          SizedBox(
            height: 300,
            child: _buildChart(),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('Alert Trends', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            Container(
              height: 36,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(
                color: Colors.grey.shade50,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: DropdownButton<String>(
                value: _timeRange,
                underline: const SizedBox(),
                icon: const Icon(Icons.keyboard_arrow_down, size: 18),
                style: TextStyle(fontSize: 13, color: Colors.grey.shade800, fontWeight: FontWeight.w500),
                items: const [
                  DropdownMenuItem(value: 'today', child: Text('Today')),
                  DropdownMenuItem(value: 'week', child: Text('This Week')),
                  DropdownMenuItem(value: 'month', child: Text('This Month')),
                ],
                onChanged: (v) => setState(() => _timeRange = v!),
              ),
            ),
          ],
        ),
        const SizedBox(height: 20),
        Container(
          padding: const EdgeInsets.all(4),
          decoration: BoxDecoration(
            color: Colors.grey.shade100,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              _buildTypeButton('bar', Icons.bar_chart_rounded),
              _buildTypeButton('line', Icons.show_chart_rounded),
              _buildTypeButton('pie', Icons.pie_chart_rounded),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildTypeButton(String type, IconData icon) {
    final isSelected = _chartType == type;
    return GestureDetector(
      onTap: () => setState(() => _chartType = type),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? Colors.white : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
          boxShadow: isSelected ? [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 4,
              offset: const Offset(0, 2),
            )
          ] : [],
        ),
        child: Icon(
          icon,
          size: 20,
          color: isSelected ? Theme.of(context).primaryColor : Colors.grey.shade600,
        ),
      ),
    );
  }

  Widget _buildChart() {
    final data = _processData();
    final totalAlerts = data.fold<int>(0, (sum, p) => sum + p.critical + p.warning + p.info);

    if (totalAlerts == 0) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.check_circle_outline, size: 48, color: Colors.green.shade300),
            const SizedBox(height: 16),
            Text(
              'No alerts in this period', 
              style: TextStyle(color: Colors.grey.shade400, fontWeight: FontWeight.w500)
            ),
          ],
        ),
      );
    }

    switch (_chartType) {
      case 'line':
        return LineChart(_buildLineChartData(data));
      case 'pie':
        return PieChart(_buildPieChartData(data));
      case 'bar':
      default:
        return BarChart(_buildBarChartData(data));
    }
  }

  List<_ChartDataPoint> _processData() {
    final now = DateTime.now();
    List<Alert> filteredAlerts = [];
    Map<String, _ChartDataPoint> groups = {};
    List<String> sortedTimelineKeys = [];

    // 1. Initialize buckets based on time range
    if (_timeRange == 'today') {
      // 00:00 to 23:00
      for (int i = 0; i < 24; i += 4) { // 4-hour intervals to reduce clutter
        final timeKey = '${i.toString().padLeft(2, '0')}:00';
        groups[timeKey] = _ChartDataPoint(timeKey, 0, 0, 0);
        sortedTimelineKeys.add(timeKey);
      }
      
      filteredAlerts = widget.alerts.where((a) {
        final local = a.timestamp.toLocal();
        return local.year == now.year && 
               local.month == now.month && 
               local.day == now.day;
      }).toList();

    } else if (_timeRange == 'week') {
      // Last 7 days
      for (int i = 6; i >= 0; i--) {
        final date = now.subtract(Duration(days: i));
        final key = DateFormat('E').format(date);
        groups[key] = _ChartDataPoint(key, 0, 0, 0);
        sortedTimelineKeys.add(key);
      }

      final weekAgo = now.subtract(const Duration(days: 7));
      filteredAlerts = widget.alerts.where((a) => a.timestamp.toLocal().isAfter(weekAgo)).toList();

    } else {
      // Last 30 days (grouped by ~5 days for readability)
      for (int i = 29; i >= 0; i--) {
        final date = now.subtract(Duration(days: i));
        final key = DateFormat('MM/dd').format(date);
        // Only add key if it doesn't exist (though date math should be unique)
        if (!groups.containsKey(key)) {
             groups[key] = _ChartDataPoint(key, 0, 0, 0);
             sortedTimelineKeys.add(key);
        }
      }

      final monthAgo = now.subtract(const Duration(days: 30));
      filteredAlerts = widget.alerts.where((a) => a.timestamp.toLocal().isAfter(monthAgo)).toList();
    }

    // 2. Populate with data
    for (var alert in filteredAlerts) {
      final local = alert.timestamp.toLocal();
      String key = '';

      if (_timeRange == 'today') {
        // Find nearest 4-hour bucket
        int hour = local.hour;
        int bucketHour = (hour ~/ 4) * 4;
        key = '${bucketHour.toString().padLeft(2, '0')}:00';
      } else if (_timeRange == 'week') {
        key = DateFormat('E').format(local);
      } else {
        key = DateFormat('MM/dd').format(local);
      }

      if (groups.containsKey(key)) {
        final severity = alert.severity.toLowerCase();
        if (severity == 'critical') {
          groups[key]!.critical++;
        } else if (severity == 'warning') {
          groups[key]!.warning++;
        } else {
          groups[key]!.info++;
        }
      }
    }
    
    // Return values in correct timeline order
    return sortedTimelineKeys.map((k) => groups[k]!).toList();
  }

  BarChartData _buildBarChartData(List<_ChartDataPoint> data) {
    return BarChartData(
      alignment: BarChartAlignment.spaceAround,
      maxY: _getMaxY(data) * 1.2,
      titlesData: FlTitlesData(
        show: true,
        bottomTitles: AxisTitles(
          sideTitles: SideTitles(
            showTitles: true,
            getTitlesWidget: (value, meta) {
              final index = value.toInt();
              if (index >= 0 && index < data.length) {
                if (_timeRange == 'month' && index % 5 != 0) {
                  return const SizedBox.shrink();
                } else if (_timeRange == 'today' && index % 2 != 0) {
                  // Show every other label for 4-hour buckets if we want, but they are already spaced.
                  // Actually 4h buckets (0, 4, 8..) are 6 items. Fits fine.
                }

                return Padding(
                  padding: const EdgeInsets.only(top: 12.0),
                  child: Text(
                    data[index].label,
                    style: TextStyle(
                      fontSize: 10, 
                      color: Colors.grey.shade600,
                      fontWeight: FontWeight.w500
                    ),
                  ),
                );
              }
              return const Text('');
            },
          ),
        ),
        leftTitles: AxisTitles(
          sideTitles: SideTitles(
            showTitles: true, 
            reservedSize: 30,
            getTitlesWidget: (value, meta) {
               if (value == 0) return const SizedBox.shrink();
               return Text(
                 value.toInt().toString(),
                 style: TextStyle(color: Colors.grey.shade400, fontSize: 10),
               );
            }
          )
        ),
        topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
        rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
      ),
      borderData: FlBorderData(show: false),
      gridData: FlGridData(
        show: true, 
        drawVerticalLine: false, 
        getDrawingHorizontalLine: (value) => FlLine(
          color: Colors.grey.shade100, 
          strokeWidth: 1,
          dashArray: [5, 5],
        )
      ),
      barGroups: data.asMap().entries.map((e) {
        final index = e.key;
        final point = e.value;
        return BarChartGroupData(
          x: index,
          barRods: [
            BarChartRodData(
              toY: point.critical.toDouble(),
              gradient: const LinearGradient(
                colors: [Color(0xFFFF5252), Color(0xFFFF1744)],
                begin: Alignment.bottomCenter,
                end: Alignment.topCenter,
              ),
              width: 6,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
            ),
            BarChartRodData(
              toY: point.warning.toDouble(),
              gradient: const LinearGradient(
                colors: [Color(0xFFFFB74D), Color(0xFFFF9800)],
                begin: Alignment.bottomCenter,
                end: Alignment.topCenter,
              ),
              width: 6,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
            ),
            BarChartRodData(
              toY: point.info.toDouble(),
              gradient: const LinearGradient(
                colors: [Color(0xFF42A5F5), Color(0xFF1E88E5)],
                begin: Alignment.bottomCenter,
                end: Alignment.topCenter,
              ),
              width: 6,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
            ),
          ],
        );
      }).toList(),
    );
  }

  LineChartData _buildLineChartData(List<_ChartDataPoint> data) {
    return LineChartData(
      gridData: FlGridData(
        show: true, 
        drawVerticalLine: false, 
        getDrawingHorizontalLine: (value) => FlLine(
          color: Colors.grey.shade100, 
          strokeWidth: 1,
          dashArray: [5, 5]
        )
      ),
      titlesData: FlTitlesData(
        bottomTitles: AxisTitles(
          sideTitles: SideTitles(
            showTitles: true,
            getTitlesWidget: (value, meta) {
              final index = value.toInt();
              if (index >= 0 && index < data.length) {
                if (_timeRange == 'month' && index % 5 != 0) {
                  return const SizedBox.shrink();
                }

                return Padding(
                  padding: const EdgeInsets.only(top: 12.0),
                  child: Text(
                    data[index].label,
                    style: TextStyle(
                      fontSize: 10, 
                      color: Colors.grey.shade600,
                      fontWeight: FontWeight.w500
                    ),
                  ),
                );
              }
              return const Text('');
            },
          ),
        ),
        leftTitles: AxisTitles(
          sideTitles: SideTitles(
            showTitles: true, 
            reservedSize: 30,
            getTitlesWidget: (value, meta) {
               if (value == 0) return const SizedBox.shrink();
               return Text(
                 value.toInt().toString(),
                 style: TextStyle(color: Colors.grey.shade400, fontSize: 10),
               );
            }
          )
        ),
        topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
        rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
      ),
      borderData: FlBorderData(show: false),
      lineBarsData: [
        _buildLineBar(data, (p) => p.critical.toDouble(), const Color(0xFFFF1744)),
        _buildLineBar(data, (p) => p.warning.toDouble(), const Color(0xFFFF9800)),
        _buildLineBar(data, (p) => p.info.toDouble(), const Color(0xFF1E88E5)),
      ],
    );
  }

  LineChartBarData _buildLineBar(List<_ChartDataPoint> data, double Function(_ChartDataPoint) selector, Color color) {
    return LineChartBarData(
      spots: data.asMap().entries.map((e) => FlSpot(e.key.toDouble(), selector(e.value))).toList(),
      isCurved: true,
      color: color,
      dotData: FlDotData(
        show: true,
        getDotPainter: (spot, percent, barData, index) => FlDotCirclePainter(
          radius: 4,
          color: Colors.white,
          strokeWidth: 2,
          strokeColor: color,
        ),
      ),
      belowBarData: BarAreaData(
        show: true,
        color: color.withOpacity(0.1),
      ),
      barWidth: 3,
    );
  }

  PieChartData _buildPieChartData(List<_ChartDataPoint> data) {
    int critical = 0;
    int warning = 0;
    int info = 0;

    for (var p in data) {
      critical += p.critical;
      warning += p.warning;
      info += p.info;
    }

    final total = critical + warning + info;
    if (total == 0) return PieChartData(sections: []);

    return PieChartData(
      sections: [
        if (critical > 0)
          PieChartSectionData(
            color: const Color(0xFFFF1744),
            value: critical.toDouble(),
            title: '${(critical / total * 100).toStringAsFixed(0)}%',
            radius: 60,
            titleStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.white),
            badgeWidget: _buildBadge(Icons.warning_rounded, const Color(0xFFFF1744)),
            badgePositionPercentageOffset: .98,
          ),
        if (warning > 0)
          PieChartSectionData(
            color: const Color(0xFFFF9800),
            value: warning.toDouble(),
            title: '${(warning / total * 100).toStringAsFixed(0)}%',
            radius: 60,
            titleStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.white),
            badgeWidget: _buildBadge(Icons.error_outline_rounded, const Color(0xFFFF9800)),
            badgePositionPercentageOffset: .98,
          ),
        if (info > 0)
          PieChartSectionData(
            color: const Color(0xFF1E88E5),
            value: info.toDouble(),
            title: '${(info / total * 100).toStringAsFixed(0)}%',
            radius: 60,
            titleStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.white),
            badgeWidget: _buildBadge(Icons.info_outline_rounded, const Color(0xFF1E88E5)),
            badgePositionPercentageOffset: .98,
          ),
      ],
      sectionsSpace: 4,
      centerSpaceRadius: 40,
    );
  }

  Widget _buildBadge(IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: Colors.white,
        shape: BoxShape.circle,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Icon(icon, size: 16, color: color),
    );
  }

  double _getMaxY(List<_ChartDataPoint> data) {
    double max = 0;
    for (var p in data) {
      if (p.critical > max) max = p.critical.toDouble();
      if (p.warning > max) max = p.warning.toDouble();
      if (p.info > max) max = p.info.toDouble();
    }
    return max + 1;
  }
}

class _ChartDataPoint {
  final String label;
  int critical;
  int warning;
  int info;

  _ChartDataPoint(this.label, this.critical, this.warning, this.info);
}
