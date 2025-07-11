import React, { useState } from 'react';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Text } from 'react-native-svg';
import * as shape from 'd3-shape';
import Colors from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';

// Accepts string days for X axis
// type MiniChartProps = {
//   data: { day: string; level: number }[];
//   height?: number;
//   width: number;
// };
type MiniChartProps = {
  data: { day: string; level: number }[];
  height?: number;
  width?: number; // Now optional, can be measured
  sidePadding?: number;
};

const MiniChart: React.FC<MiniChartProps> = ({
  data,
  height = 120,
  width: propWidth,
  sidePadding = 12,
}) => {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const [measuredWidth, setMeasuredWidth] = useState<number | null>(propWidth || null);

  const chartData = data.map(item => item.level);
  const labels = data.map(item => item.day);
  const maxValue = Math.max(...chartData);
  const minValue = Math.min(...chartData);
  const range = maxValue - minValue || 1;
  // Normalize for better visual scaling
  const normalizedData = chartData.map(value => ((value - minValue) / range) * 100);

  // All labels are 3 chars, so estimate width once
  const labelFontSize = 13;
  const estLabelWidth = labelFontSize * 3 * 0.6;
  const labelY = height - 4; // Lower the labels
  const chartTopPadding = 10;
  const chartBottomPadding = 28; // leave space for labels
  const chartHeight = height - chartTopPadding - chartBottomPadding;

  // Responsive width
  const width = measuredWidth || 300; // fallback
  // Use the same estLabelWidth for both sides
  const left = sidePadding + estLabelWidth / 2;
  const right = width - sidePadding - estLabelWidth / 2;
  const n = normalizedData.length;

  // Distribute points and labels evenly between left and right
  const points = normalizedData.map((value, index) => [
    left + (index * (right - left)) / (n - 1),
    chartTopPadding + chartHeight - (value * chartHeight / 100)
  ] as [number, number]);

  // Create the area path
  const areaGenerator = shape.area<[number, number]>()
    .x(d => d[0])
    .y0(chartTopPadding + chartHeight)
    .y1(d => d[1])
    .curve(shape.curveNatural);

  // Create the line path
  const lineGenerator = shape.line<[number, number]>()
    .x(d => d[0])
    .y(d => d[1])
    .curve(shape.curveNatural);

  const areaPath = areaGenerator(points) || '';
  const linePath = lineGenerator(points) || '';

  // Layout handler to measure width if not provided
  const onLayout = (e: LayoutChangeEvent) => {
    if (!propWidth) {
      setMeasuredWidth(e.nativeEvent.layout.width);
    }
  };

  return (
    <View
      style={[styles.container, { backgroundColor: colors.cardBackground, width: propWidth }]}
      onLayout={onLayout}
    >
      {measuredWidth && (
        <Svg height={height} width={width}>
          <Defs>
            <LinearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.tint} stopOpacity="0.18" />
              <Stop offset="1" stopColor={colors.tint} stopOpacity="0" />
            </LinearGradient>
          </Defs>
          
          {/* Area */}
          <Path
            d={areaPath}
            fill="url(#gradient)"
          />
          
          {/* Line */}
          <Path
            d={linePath}
            stroke={colors.tint}
            strokeWidth={2}
            fill="none"
          />

          {/* X-axis labels */}
          {labels.map((label, index) => (
            <Text
              key={index}
              x={left + (index * (right - left)) / (n - 1)}
              y={labelY}
              fontSize={labelFontSize}
              fill={colors.muted}
              fontFamily="Inter-Regular"
              textAnchor="middle"
            >
              {label}
            </Text>
          ))}
        </Svg>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    overflow: 'hidden',
  },
});

export default MiniChart;