import React, { useState } from 'react';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Text, Circle } from 'react-native-svg';
import * as shape from 'd3-shape';
import { Lock } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import Colors from '@/constants/Colors';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

interface ProjectionChartPoint {
  x: string;
  value: number;
}

interface ProjectionChartProps {
  points: ProjectionChartPoint[];
  height?: number;
  width?: number;
  lockStartValue?: boolean;
  lockEndValue?: boolean;
}

const ProjectionChart: React.FC<ProjectionChartProps> = ({
  points: inputPoints,
  height = 120,
  width: propWidth,
  lockStartValue = false,
  lockEndValue = false,
}) => {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const [measuredWidth, setMeasuredWidth] = useState<number | null>(propWidth || null);
  const width = measuredWidth || propWidth || 300;

  // If only two points, interpolate 7 points for a smooth, wavy curve
  let points: ProjectionChartPoint[] = inputPoints;
  if (inputPoints.length === 2) {
    const [start, end] = inputPoints;
    const n = 7;
    const base = Array.from({ length: n }, (_, i) => ({
      x: i === 0 ? start.x : i === n - 1 ? end.x : '',
      value: start.value + ((end.value - start.value) * i) / (n - 1),
    }));
    // Add wave offsets to the middle points
    const wave = [0, 1, 2, 3, 4, 5, 6].map(i => {
      let offset = 0;
      if (i === 2) offset = 18;
      if (i === 3) offset = -12;
      if (i === 4) offset = 16;
      return { ...base[i], value: base[i].value + offset };
    });
    wave[0].x = start.x;
    wave[n - 1].x = end.x;
    points = wave;
  }

  // Chart layout
  const chartTopPadding = 32;
  const chartBottomPadding = 32;
  const chartHeight = height - chartTopPadding - chartBottomPadding;
  const left = 20;
  const right = width - 20;
  const n = points.length;

  // Normalize data for y positions
  const values = points.map(p => p.value);
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const range = maxValue - minValue || 1;
  const normalizedData = values.map(v => ((v - minValue) / range) * 100);

  // Points for the curve
  const chartPoints = normalizedData.map((value, index) => [
    left + (index * (right - left)) / (n - 1),
    chartTopPadding + chartHeight - (value * chartHeight / 100)
  ] as [number, number]);

  // For area: extend to bottom left and bottom right
  const areaPoints: [number, number][] = [
    [left, chartTopPadding + chartHeight],
    ...chartPoints,
    [right, chartTopPadding + chartHeight],
  ];

  // Area and line generators
  const areaGenerator = shape.line<[number, number]>()
    .x(d => d[0])
    .y(d => d[1])
    .curve(shape.curveNatural);

  const lineGenerator = shape.line<[number, number]>()
    .x(d => d[0])
    .y(d => d[1])
    .curve(shape.curveNatural);

  // Area path: use a polygon (bottom left -> curve -> bottom right -> bottom left)
  let areaPath = '';
  if (areaPoints.length > 2) {
    // Move to bottom left
    areaPath = `M${areaPoints[0][0]},${areaPoints[0][1]} `;
    // Draw the curve through the middle points
    const curve = areaGenerator(areaPoints.slice(1, -1));
    if (typeof curve === 'string') {
      areaPath += curve.replace(/^M/, 'L'); // continue from the bottom left
    }
    // Line to bottom right
    areaPath += ` L${areaPoints[areaPoints.length - 1][0]},${areaPoints[areaPoints.length - 1][1]} Z`;
  }
  const linePath = lineGenerator(chartPoints) || '';

  // Layout handler
  const onLayout = (e: LayoutChangeEvent) => {
    if (!propWidth) {
      setMeasuredWidth(e.nativeEvent.layout.width);
    }
  };

  // Value label positions
  const start = chartPoints[0];
  const end = chartPoints[chartPoints.length - 1];

  const containerStyle = useAnimatedStyle(() => ({
    flex: 1,
  }));

  return (
    <Animated.View style={containerStyle} onLayout={onLayout}>
      <Svg height={height} width={width}>
        <Defs>
          <LinearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.tint} stopOpacity="0.13" />
            <Stop offset="1" stopColor={colors.tint} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        {/* Area */}
        <Path d={areaPath} fill="url(#gradient)" />
        {/* Line */}
        <Path d={linePath} stroke={colors.tint} strokeWidth={3} fill="none" />
        {/* Dots */}
        <Circle cx={start[0]} cy={start[1]} r={6} fill={colors.tint} />
        <Circle cx={end[0]} cy={end[1]} r={6} fill={colors.tint} />
        {/* Value labels or lock icons */}
        {lockStartValue ? (
          <Text
            x={start[0]}
            y={start[1] - 12}
            fontSize={18}
            fill={colors.tint}
            fontFamily="Inter-Bold"
            textAnchor="middle"
          >
            {'🔒'}
          </Text>
        ) : (
          <Text
            x={start[0]}
            y={start[1] - 12}
            fontSize={15}
            fill={colors.tint}
            fontFamily="Inter-Bold"
            textAnchor="middle"
          >
            {points[0].value}
          </Text>
        )}
        {lockEndValue ? (
          <Text
            x={end[0]}
            y={end[1] - 12}
            fontSize={18}
            fill={colors.tint}
            fontFamily="Inter-Bold"
            textAnchor="middle"
          >
            {'🔒'}
          </Text>
        ) : (
          <Text
            x={end[0]}
            y={end[1] - 12}
            fontSize={15}
            fill={colors.tint}
            fontFamily="Inter-Bold"
            textAnchor="middle"
          >
            {points[points.length - 1].value}
          </Text>
        )}
        {/* X-axis labels */}
        <Text
          x={start[0]}
          y={height - 4}
          fontSize={13}
          fill={colors.muted}
          fontFamily="Inter-Medium"
          textAnchor="middle"
        >
          {points[0].x}
        </Text>
        <Text
          x={end[0]}
          y={height - 4}
          fontSize={13}
          fill={colors.muted}
          fontFamily="Inter-Medium"
          textAnchor="middle"
        >
          {points[points.length - 1].x}
        </Text>
      </Svg>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default ProjectionChart; 