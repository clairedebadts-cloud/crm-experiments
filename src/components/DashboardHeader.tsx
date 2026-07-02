import React from 'react';
import { useApp } from '@/context/AppContext';
import { BarChart3, RefreshCw, Settings, LogOut, Beaker } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Channel } from '@/types/clevertap';

const CHANNELS: { label: string; value: Channel | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Email', value: 'email' },
  { label: 'Push', value: 'push' },
  { label: 'SMS', value: 'sms' },
  { label: 'In-App', value: 'inapp' },
];

interface Props {
  onRefresh: () => void;
  onSettings: () => void;
}

const DashboardHeader: React.FC<Props> = ({ onRefresh, onSettings }) => {
  const { credentials, isDemo, channelFilter, setChannelFilter, disconnect, isLoading } = useApp();

  return (
    <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-30">
      <div className="container flex items-center justify-between h-16 px-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-5 h-5 text-primary" />
          <span className="font-semibold text-sm">Campaign Intelligence</span>
          {isDemo && (
            <Badge variant="outline" className="text-warning border-warning/30 text-xs gap-1">
              <Beaker className="w-3 h-3" /> Demo
            </Badge>
          )}
          {credentials && (
            <Badge variant="secondary" className="text-xs font-mono">
              {credentials.region}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1 bg-secondary rounded-lg p-0.5">
          {CHANNELS.map(ch => (
            <button
              key={ch.value}
              onClick={() => setChannelFilter(ch.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                channelFilter === ch.value
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {ch.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onRefresh} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="ghost" size="icon" onClick={onSettings}>
            <Settings className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={disconnect}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
