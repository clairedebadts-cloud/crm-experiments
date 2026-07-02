import React from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface Props {
  data: number[];
  color: string;
}

const SparklineChart: React.FC<Props> = ({ data, color }) => {
  const chartData = data.map((v, i) => ({ i, v }));
  return (
    <div className="w-16 h-8">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SparklineChart;
