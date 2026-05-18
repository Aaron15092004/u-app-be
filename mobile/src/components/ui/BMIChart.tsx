import React from 'react';
import { View, Text } from 'react-native';
import { CartesianChart, Bar } from 'victory-native';
import { TEXT_SECONDARY } from '../../constants/colors';
import type { IBMIHistoryEntry } from '../../lib/api/types';

interface BMIChartProps {
  records: IBMIHistoryEntry[];
}

type ChartDatum = { x: number; bmi: number };

export default function BMIChart({ records }: BMIChartProps): React.JSX.Element {
  if (records.length === 0) {
    return (
      <Text
        style={{
          color: TEXT_SECONDARY,
          textAlign: 'center',
          padding: 24,
          fontSize: 14,
        }}
      >
        Chưa có dữ liệu BMI. Nhập số đo và nhấn Lưu số đo để bắt đầu theo dõi.
      </Text>
    );
  }

  const data: ChartDatum[] = records.map((r, idx) => ({ x: idx, bmi: r.bmi }));

  return (
    <View style={{ height: 220 }}>
      <CartesianChart<ChartDatum, 'x', 'bmi'>
        data={data}
        xKey="x"
        yKeys={['bmi']}
        domainPadding={{ left: 16, right: 16, top: 8, bottom: 8 }}
      >
        {({ points, chartBounds }) => (
          <Bar
            points={points.bmi}
            chartBounds={chartBounds}
            color="#4CAF50"
            roundedCorners={{ topLeft: 4, topRight: 4 }}
          />
        )}
      </CartesianChart>
    </View>
  );
}
