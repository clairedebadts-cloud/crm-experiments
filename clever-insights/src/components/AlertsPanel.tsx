import React, { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { runAlertChecks, generateWeeklyRecap } from '@/lib/alertEngine';
import AlertEmailPreview from '@/components/AlertEmailPreview';
import WeeklyRecapPreview from '@/components/WeeklyRecapPreview';
import { Button } from '@/components/ui/button';
import { Bell, Send, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

const AlertsPanel: React.FC = () => {
  const { campaigns, benchmarks, alertSettings } = useApp();
  const [showRecap, setShowRecap] = useState(false);
  const [expandedAlerts, setExpandedAlerts] = useState(true);

  const alerts = useMemo(
    () => runAlertChecks(campaigns, benchmarks, alertSettings),
    [campaigns, benchmarks, alertSettings]
  );

  const recap = useMemo(
    () => generateWeeklyRecap(campaigns, benchmarks),
    [campaigns, benchmarks]
  );

  const immediateAlerts = alerts.filter(a => a.priority === 'immediate');
  const delayedAlerts = alerts.filter(a => a.priority === 'delayed');

  const handleSendAlert = (alert: { title: string }) => {
    if (!alertSettings.adminEmail) {
      toast.error('No admin email configured', {
        description: 'Set an admin email in Settings → Alert Configuration',
      });
      return;
    }
    toast.success(`Alert sent to ${alertSettings.adminEmail}`, {
      description: `"${alert.title}" — In production, this sends a real email.`,
    });
  };

  const handleSendRecap = () => {
    if (alertSettings.marketingEmails.length === 0) {
      toast.error('No marketing team emails configured', {
        description: 'Add marketing emails in Settings → Alert Configuration',
      });
      return;
    }
    toast.success(`Weekly recap sent to ${alertSettings.marketingEmails.length} recipient(s)`, {
      description: 'In production, this sends the recap email on the scheduled day.',
    });
  };

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Alert Monitor</h3>
          {alerts.length > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-critical/15 text-critical font-medium">
              {alerts.length} alert{alerts.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs gap-1.5"
            onClick={() => setShowRecap(!showRecap)}
          >
            <Eye className="w-3 h-3" />
            {showRecap ? 'Hide' : 'Preview'} Weekly Recap
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setExpandedAlerts(!expandedAlerts)}
          >
            {expandedAlerts ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {expandedAlerts && (
        <div className="space-y-4">
          {/* Immediate alerts */}
          {immediateAlerts.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] text-critical uppercase tracking-wider font-medium px-1">
                🚨 Immediate — Sent right away
              </p>
              {immediateAlerts.map(a => (
                <div key={a.id} className="relative">
                  <AlertEmailPreview alert={a} />
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-3 right-3 text-[10px] gap-1 h-6 px-2"
                    onClick={() => handleSendAlert(a)}
                  >
                    <Send className="w-3 h-3" /> Send
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Delayed alerts */}
          {delayedAlerts.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] text-warning uppercase tracking-wider font-medium px-1">
                ⏳ Delayed — After {alertSettings.performanceDelayDays} days
              </p>
              {delayedAlerts.map(a => (
                <div key={a.id} className="relative">
                  <AlertEmailPreview alert={a} />
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-3 right-3 text-[10px] gap-1 h-6 px-2"
                    onClick={() => handleSendAlert(a)}
                  >
                    <Send className="w-3 h-3" /> Send
                  </Button>
                </div>
              ))}
            </div>
          )}

          {alerts.length === 0 && (
            <div className="text-center py-8 space-y-2">
              <p className="text-2xl">☀️</p>
              <p className="text-sm font-medium">All clear</p>
              <p className="text-xs text-muted-foreground">No alerts detected — campaigns are performing within thresholds</p>
            </div>
          )}
        </div>
      )}

      {/* Weekly recap preview */}
      {showRecap && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-primary uppercase tracking-wider font-medium px-1">
              📅 Weekly Recap Preview
            </p>
            <Button
              size="sm"
              variant="default"
              className="text-xs gap-1.5"
              onClick={handleSendRecap}
            >
              <Send className="w-3 h-3" /> Send Recap Now
            </Button>
          </div>
          <WeeklyRecapPreview recap={recap} />
        </div>
      )}
    </div>
  );
};

export default AlertsPanel;
