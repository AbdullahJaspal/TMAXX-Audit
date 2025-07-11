declare module 'react-native-svg-charts' {
  import { ViewStyle } from 'react-native';
  import { Component } from 'react';

  interface ChartProps {
    data: number[];
    style?: ViewStyle;
    svg?: any;
    contentInset?: {
      top?: number;
      bottom?: number;
      left?: number;
      right?: number;
    };
    curve?: any; // Accepts d3-shape curve functions
    gridMin?: number;
    gridMax?: number;
    yMin?: number;
    yMax?: number;
    numberOfTicks?: number;
    animate?: boolean;
    animationDuration?: number;
    decorator?: (props: any) => React.ReactElement | null;
  }

  export class LineChart extends Component<ChartProps> {}
  export class AreaChart extends Component<ChartProps> {}

  interface XAxisProps {
    data: number[];
    style?: ViewStyle;
    formatLabel?: (value: any, index: number) => string;
    contentInset?: {
      left?: number;
      right?: number;
    };
    svg?: any;
  }

  export class XAxis extends Component<XAxisProps> {}

  interface YAxisProps {
    data: number[];
    style?: ViewStyle;
    contentInset?: {
      top?: number;
      bottom?: number;
    };
    min?: number;
    max?: number;
    numberOfTicks?: number;
    formatLabel?: (value: number, index: number) => string;
    svg?: any;
  }

  export class YAxis extends Component<YAxisProps> {}
} 