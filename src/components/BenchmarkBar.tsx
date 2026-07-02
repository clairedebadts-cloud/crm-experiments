import React from 'react';
import { useApp } from '@/context/AppContext';
import { ChannelBenchmark } from '@/types/clevertap';
import { TrendingUp, MousePointerClick, AlertTriangle, Send } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import SparklineChart from './SparklineChart';

const metrics = [
  { key: 'avgOpenRate', label: 'Avg Open Rate', icon: TrendingUp, format: (v: number) => `${(v * 100).toFixed(1)}%` },
  { key: 'avgCtr', label: 'Avg CTR', icon: MousePointerClick, format: (v: number) => `${(v * 100).toFixed(1)}%` },
  { key: 'avgBounceRate', label: 'Avg Bounce Rate', icon: AlertTriangle, format: (v: number) => `${(v * 100).toFixed(1)}%` },
  { key: 'avgDeliveryRate', label: 'Avg Delivery Rate', icon: Send, format: (v: number) => `${(v * 100).toFixed(1)}%` },
];

const BenchmarkBar: React.FC = () => {
  const { benchmarks, channelFilter, isLoading } = useApp();

  const getAggregated = (): ChannelBenchmark | null => {
    const channels = channelFilter === 'all' ? Object.keys(benchmarks) : [channelFilter];
    const relevant = channels.map(c => benchmarks[c]).filter(Boolean);
    if (relevant.length === 0) return null;
    return {
      avgOpenRate: relevant.reduce((s, b) => s + b.avgOpenRate, 0) / relevant.length,
      avgCtr: relevant.reduce((s, b) => s + b.avgCtr, 0) / relevant.length,
      avgBounceRate: relevant.reduce((s, b) => s + b.avgBounceRate, 0) / relevant.length,
      avgDeliveryRate: relevant.reduce((s, b) => s + b.avgDeliveryRate, 0) / relevant.length,
      avgUnsubscribeRate: relevant.reduce((s, b) => s + b.avgUnsubscribeRate, 0) / relevant.length,
      trend: relevant[0]?.trend || [],
    };
  };

  const data = getAggregated();

  if (isLoading) {
    return (
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map(m => {
        const Icon = m.icon;
        const value = data[m.key as keyof ChannelBenchmark] as number;
        return (
          <div key={m.key} className="bg-card rounded-xl border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">{m.label}</span>
              <Icon className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-mono font-bold">{m.format(value)}</span>
              <SparklineChart data={data.trend} color="hsl(var(--primary))" />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BenchmarkBar;
