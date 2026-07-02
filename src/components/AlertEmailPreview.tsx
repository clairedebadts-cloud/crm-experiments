import React from 'react';
import { Alert } from '@/types/clevertap';

const severityStyles: Record<string, string> = {
  immediate: 'border-critical/30 bg-critical/5',
  delayed: 'border-warning/30 bg-warning/5',
  scheduled: 'border-primary/30 bg-primary/5',
};

const severityIcon: Record<string, string> = {
  immediate: '🚨',
  delayed: '⏳',
  scheduled: '📅',
};

const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

interface Props {
  alert: Alert;
}

const AlertEmailPreview: React.FC<Props> = ({ alert }) => {
  return (
    <div className={`rounded-xl border p-4 space-y-3 ${severityStyles[alert.priority]}`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{severityIcon[alert.priority]}</span>
          <div>
            <h4 className="text-sm font-semibold">{alert.title}</h4>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              {alert.priority === 'immediate' ? 'Immediate Alert' : 
               alert.priority === 'delayed' ? 'Performance Alert' : 'Scheduled'}
            </p>
          </div>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
          alert.priority === 'immediate' ? 'bg-critical/20 text-critical' :
          alert.priority === 'delayed' ? 'bg-warning/20 text-warning' : 'bg-primary/20 text-primary'
        }`}>
          {alert.priority}
        </span>
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground leading-relaxed">{alert.description}</p>

      {/* Metrics */}
      {alert.currentValue !== undefined && alert.benchmarkValue !== undefined && (
        <div className="grid grid-cols-3 gap-3 bg-secondary/50 rounded-lg p-3">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase">Current</p>
            <p className="text-sm font-mono font-semibold text-critical">{pct(alert.currentValue)}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase">Average</p>
            <p className="text-sm font-mono font-semibold">{pct(alert.benchmarkValue)}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase">Drop</p>
            <p className="text-sm font-mono font-semibold text-critical">
              ↓{alert.dropPercent !== undefined ? pct(alert.dropPercent) : '—'}
            </p>
          </div>
        </div>
      )}

      {/* Campaign info (no PII) */}
      {alert.campaignName && (
        <div className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Campaign:</span> {alert.campaignName}
          {alert.channel && <> • <span className="uppercase">{alert.channel}</span></>}
        </div>
      )}

      {/* Domains list */}
      {alert.domains && alert.domains.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium">Flagged Domains:</p>
          <div className="flex flex-wrap gap-1.5">
            {alert.domains.map(d => (
              <span key={d} className="text-[10px] font-mono bg-critical/10 text-critical px-2 py-0.5 rounded-full">
                {d}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="pt-2 border-t border-border/30">
        <p className="text-[10px] text-muted-foreground">
          No customer personal data included • {new Date(alert.createdAt).toLocaleString()}
        </p>
      </div>
    </div>
  );
};

export default AlertEmailPreview;
