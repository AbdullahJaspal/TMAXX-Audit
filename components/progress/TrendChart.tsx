import React, { useState, useRef } from 'react';
import { View, Text as RNText, StyleSheet, Dimensions, PanResponder } from 'react-native';
import Svg, { Path, Rect, Line, Text as SvgText, Circle, G } from 'react-native-svg';
import * as shape from 'd3-shape';
import * as d3Scale from 'd3-scale';
import Colors from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';

type TrendChartProps = {
  data: { day: string | number; level: number }[];
  title?: string;
  height?: number;
  width?: number;
  showLabels?: boolean;
  showYAxis?: boolean;
  showTitle?: boolean;
};

const TrendChart: React.FC<TrendChartProps> = ({
  data,
  title = 'T-Level Trend',
  height = 240,
  width = Dimensions.get('window').width - 40,
  showLabels = true,
  showYAxis = true,
  showTitle = true,
}) => {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const [tooltipIdx, setTooltipIdx] = useState<number | null>(null);

  // Chart dimensions
  const margin = { top: 20, right: 32, bottom: 40, left: showYAxis ? 56 : 16 };
  const chartWidth = width - (showYAxis ? 56 : 16);

  // Use the full data array for chartData
  const chartData = data.map(item => item.level);

  // X-axis label indices: first, last, and 3 evenly spaced in between
  const labelCount = 5;
  const labelIndices = Array.from({ length: labelCount }, (_, i) =>
    Math.round(i * (data.length - 1) / (labelCount - 1))
  );

  // Labels for those indices
  const labels = labelIndices.map(idx => {
    const date = new Date(
      typeof data[idx].day === 'string' || typeof data[idx].day === 'number'
        ? data[idx].day
        : ''
    );
    return date.toLocaleDateString('default', { month: 'short', day: 'numeric' });
  });

  // X ticks for those indices
  const xPadding = 16;
  const xTicks = labelIndices.map(i => {
    return d3Scale
      .scaleLinear()
      .domain([0, chartData.length - 1])
      .range([margin.left + xPadding, width - margin.right - xPadding])(i);
  });

  // Y axis min/max
  const minValue = Math.min(...chartData);
  const maxValue = Math.max(...chartData);
  const yAxisRange = maxValue - minValue;
  const yMin = Math.floor((minValue - (yAxisRange * 0.1)) / 10) * 10;
  const yMax = Math.ceil((maxValue + (yAxisRange * 0.1)) / 10) * 10;

  // Chart dimensions
  const chartHeight = height - margin.bottom;

  // Scales
  const x = d3Scale
    .scaleLinear()
    .domain([0, chartData.length - 1])
    .range([margin.left + xPadding, width - margin.right - xPadding]);
  const y = d3Scale
    .scaleLinear()
    .domain([yMin, yMax])
    .range([margin.top + chartHeight, margin.top]);

  // Line and area paths
  const line = shape
    .line<number>()
    .x((_, i) => x(i))
    .y(d => y(d))
    .curve(shape.curveNatural)(chartData);
  const area = shape
    .area<number>()
    .x((_, i) => x(i))
    .y0(y(yMin))
    .y1(d => y(d))
    .curve(shape.curveNatural)(chartData);

  // Y axis ticks
  const yTicks = y.ticks(5);

  // PanResponder setup
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const pressX = evt.nativeEvent.locationX - margin.left;
        const idx = Math.round((pressX / (chartWidth - 1)) * (chartData.length - 1));
        setTooltipIdx(Math.max(0, Math.min(chartData.length - 1, idx)));
      },
      onPanResponderMove: (evt) => {
        const pressX = evt.nativeEvent.locationX - margin.left;
        const idx = Math.round((pressX / (chartWidth - 1)) * (chartData.length - 1));
        setTooltipIdx(Math.max(0, Math.min(chartData.length - 1, idx)));
      },
      onPanResponderRelease: () => {
        setTooltipIdx(null);
      },
    })
  ).current;

  // Y axis grid line bounds
  const gridStart = x(0);
  const gridEnd = x(chartData.length - 1);

  return (
    <View style={[styles.container, { backgroundColor: colors.cardBackground, overflow: 'visible' }]}>  
      {showTitle && <RNText style={[styles.title, { color: colors.text }]}>{title}</RNText>}
      <View style={styles.chartWrapper}>
        <View {...panResponder.panHandlers}>
          <Svg width={width} height={height}>
            {/* Area fill */}
            <Path d={area || undefined} fill={colors.tint} fillOpacity={0.18} />
            {/* Line */}
            <Path d={line || undefined} fill="none" stroke={colors.tint} strokeWidth={2} />
            {/* Y axis */}
            {showYAxis && yTicks.map((tick, i) => (
              <G key={i}>
                <Line
                  x1={gridStart}
                  x2={gridEnd}
                  y1={y(tick)}
                  y2={y(tick)}
                  stroke={colors.border}
                  strokeDasharray="2,2"
                  strokeWidth={1}
                />
                <SvgText
                  x={margin.left - 8}
                  y={y(tick) + 4}
                  fontSize={12}
                  fill={colors.muted}
                  fontFamily={'Inter-Regular'}
                  textAnchor="end"
                >
                  {Math.round(tick)}
                </SvgText>
              </G>
            ))}
            {/* X axis */}
            <Line
              x1={margin.left}
              x2={width - margin.right}
              y1={margin.top + chartHeight}
              y2={margin.top + chartHeight}
              stroke={colors.border}
              strokeWidth={1}
            />
            {showLabels && xTicks.map((tick, i) => (
              <SvgText
                key={i}
                x={tick}
                y={Math.min(height, margin.top + chartHeight + 16)}
                fontSize={12}
                fill={colors.muted}
                fontFamily={'Inter-Regular'}
                textAnchor="middle"
              >
                {labels[i]}
              </SvgText>
            ))}
            {/* Tooltip */}
            {tooltipIdx !== null && (() => {
              const pointX = x(tooltipIdx);
              const tooltipWidth = 120;
              // Clamp tooltip x position
              const tooltipX = Math.max(
                margin.left,
                Math.min(pointX - tooltipWidth / 2, width - tooltipWidth - margin.right)
              );
              // Clamp tooltip y position
              const rawY = y(chartData[tooltipIdx]) - 55;
              const tooltipY = Math.max(margin.top, rawY);
              return (
                <G>
                  {/* Vertical line */}
                  <Line
                    x1={pointX}
                    x2={pointX}
                    y1={y(yMin)}
                    y2={y(chartData[tooltipIdx])}
                    stroke={colors.tint}
                    strokeWidth={1}
                    strokeDasharray="4,2"
                  />
                  {/* Circle at data point */}
                  <Circle
                    cx={pointX}
                    cy={y(chartData[tooltipIdx])}
                    r={6}
                    fill={colors.tint}
                    stroke={colors.cardBackground}
                    strokeWidth={2}
                  />
                  {/* Tooltip box */}
                  <G x={tooltipX} y={tooltipY}>
                    <Rect
                      width={tooltipWidth}
                      height={40}
                      rx={8}
                      fill={colors.cardBackground}
                      stroke={colors.border}
                      strokeWidth={1}
                    />
                    <SvgText
                      x={tooltipWidth / 2}
                      y={16}
                      fontSize={12}
                      fill={colors.muted}
                      fontFamily={'Inter-Regular'}
                      alignmentBaseline="middle"
                      textAnchor="middle"
                    >
                      {`${new Date(data[tooltipIdx].day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                    </SvgText>
                    <SvgText
                      x={tooltipWidth / 2}
                      y={32}
                      fontSize={14}
                      fill={colors.text}
                      fontFamily={'Inter-Medium'}
                      alignmentBaseline="middle"
                      textAnchor="middle"
                    >
                      {`Avg: ${chartData[tooltipIdx]}`}
                    </SvgText>
                  </G>
                </G>
              );
            })()}
          </Svg>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 5,
    borderRadius: 16,
  },
  chartWrapper: {
    position: 'relative',
    width: '100%',
  },
  title: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    marginBottom: 8,
  },
});

export default TrendChart;