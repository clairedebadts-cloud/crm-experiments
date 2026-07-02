import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Thresholds, DEFAULT_THRESHOLDS, AlertSettings, DEFAULT_ALERT_SETTINGS } from '@/types/clevertap';
import { X, RotateCcw, Bell, Sliders } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

interface Props {
  open: boolean;
  onClose: () => void;
}

const ThresholdInput: React.FC<{ label: string; value: number; onChange: (v: number) => void; isPercent?: boolean }> = ({
  label, value, onChange, isPercent = true,
}) => (
  <div className="flex items-center justify-between py-2">
    <span className="text-xs text-muted-foreground">{label}</span>
    <div className="flex items-center gap-1">
      <Input
        type="number"
        step="0.01"
        value={isPercent ? (value * 100).toFixed(0) : value}
        onChange={e => onChange(isPercent ? parseFloat(e.target.value) / 100 : parseFloat(e.target.value))}
        className="w-20 text-right font-mono text-xs bg-secondary border-0 h-8"
      />
      <span className="text-xs text-muted-foreground">{isPercent ? '%' : ''}</span>
    </div>
  </div>
);

const SettingsPanel: React.FC<Props> = ({ open, onClose }) => {
  const { thresholds, setThresholds, alertSettings, setAlertSettings } = useApp();
  const [tab, setTab] = useState<'thresholds' | 'alerts'>('thresholds');
  const [newEmail, setNewEmail] = useState('');

  if (!open) return null;

  const update = (path: string, value: number) => {
    const parts = path.split('.');
    const next = JSON.parse(JSON.stringify(thresholds)) as any;
    if (parts.length === 2) next[parts[0]][parts[1]] = value;
    else next[parts[0]] = value;
    setThresholds(next as Thresholds);
  };

  const updateAlert = (partial: Partial<AlertSettings>) => {
    setAlertSettings({ ...alertSettings, ...partial });
  };

  const addMarketingEmail = () => {
    const email = newEmail.trim();
    if (email && !alertSettings.marketingEmails.includes(email)) {
      updateAlert({ marketingEmails: [...alertSettings.marketingEmails, email] });
      setNewEmail('');
    }
  };

  const removeMarketingEmail = (email: string) => {
    updateAlert({ marketingEmails: alertSettings.marketingEmails.filter(e => e !== email) });
  };

  return (
    <>
      <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-card border-l z-50 animate-slide-in-right overflow-y-auto">
        <div className="sticky top-0 bg-card border-b p-4 flex items-center justify-between z-10">
          <h2 className="font-semibold text-sm">Settings</h2>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => {
              setThresholds(DEFAULT_THRESHOLDS);
              setAlertSettings(DEFAULT_ALERT_SETTINGS);
            }}>
              <RotateCcw className="w-4 h-4" />
            </Button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border/50">
          <button
            className={`flex-1 py-2.5 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
              tab === 'thresholds' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setTab('thresholds')}
          >
            <Sliders className="w-3.5 h-3.5" /> Thresholds
          </button>
          <button
            className={`flex-1 py-2.5 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
              tab === 'alerts' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setTab('alerts')}
          >
            <Bell className="w-3.5 h-3.5" /> Alert Configuration
          </button>
        </div>

        {tab === 'thresholds' && (
          <div className="p-4 space-y-6">
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Email</h3>
              <div className="bg-muted rounded-lg p-3 divide-y divide-border/50">
                <ThresholdInput label="Bounce Rate" value={thresholds.email.bounce} onChange={v => update('email.bounce', v)} />
                <ThresholdInput label="Open Rate" value={thresholds.email.openRate} onChange={v => update('email.openRate', v)} />
                <ThresholdInput label="CTR" value={thresholds.email.ctr} onChange={v => update('email.ctr', v)} />
                <ThresholdInput label="Delivery" value={thresholds.email.delivery} onChange={v => update('email.delivery', v)} />
              </div>
            </div>
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Push</h3>
              <div className="bg-muted rounded-lg p-3 divide-y divide-border/50">
                <ThresholdInput label="Delivery" value={thresholds.push.delivery} onChange={v => update('push.delivery', v)} />
                <ThresholdInput label="CTR" value={thresholds.push.ctr} onChange={v => update('push.ctr', v)} />
              </div>
            </div>
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">SMS</h3>
              <div className="bg-muted rounded-lg p-3 divide-y divide-border/50">
                <ThresholdInput label="Delivery" value={thresholds.sms.delivery} onChange={v => update('sms.delivery', v)} />
              </div>
            </div>
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">In-App</h3>
              <div className="bg-muted rounded-lg p-3 divide-y divide-border/50">
                <ThresholdInput label="CTR" value={thresholds.inapp.ctr} onChange={v => update('inapp.ctr', v)} />
              </div>
            </div>
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Frequency</h3>
              <div className="bg-muted rounded-lg p-3 divide-y divide-border/50">
                <ThresholdInput label="Sunset after campaigns" value={thresholds.sunsetAfterCampaigns} onChange={v => update('sunsetAfterCampaigns', v)} isPercent={false} />
                <ThresholdInput label="Window (days)" value={thresholds.frequencyWindowDays} onChange={v => update('frequencyWindowDays', v)} isPercent={false} />
              </div>
            </div>
          </div>
        )}

        {tab === 'alerts' && (
          <div className="p-4 space-y-6">
            {/* Admin email */}
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Admin Email</h3>
              <p className="text-[10px] text-muted-foreground mb-2">Receives immediate deliverability alerts and hard-bounce domain alerts</p>
              <Input
                type="email"
                placeholder="admin@company.com"
                value={alertSettings.adminEmail}
                onChange={e => updateAlert({ adminEmail: e.target.value })}
                className="text-xs bg-secondary border-0"
              />
            </div>

            {/* Marketing team emails */}
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Marketing Team</h3>
              <p className="text-[10px] text-muted-foreground mb-2">Receives weekly campaign recap emails</p>
              <div className="space-y-2">
                {alertSettings.marketingEmails.map(email => (
                  <div key={email} className="flex items-center justify-between bg-secondary/50 rounded-lg px-3 py-2">
                    <span className="text-xs font-mono">{email}</span>
                    <button onClick={() => removeMarketingEmail(email)} className="text-muted-foreground hover:text-critical text-xs">✕</button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="team@company.com"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addMarketingEmail()}
                    className="text-xs bg-secondary border-0 flex-1"
                  />
                  <Button size="sm" variant="outline" onClick={addMarketingEmail} className="text-xs">Add</Button>
                </div>
              </div>
            </div>

            {/* Alert thresholds */}
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Deliverability Alert</h3>
              <div className="bg-muted rounded-lg p-3 divide-y divide-border/50">
                <ThresholdInput
                  label="Drop threshold (% below avg)"
                  value={alertSettings.deliverabilityDropThreshold}
                  onChange={v => updateAlert({ deliverabilityDropThreshold: v })}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 px-1">Sent immediately when delivery rate drops this much below the channel average</p>
            </div>

            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Performance Alert</h3>
              <div className="bg-muted rounded-lg p-3 divide-y divide-border/50">
                <ThresholdInput
                  label="Drop threshold (% below avg)"
                  value={alertSettings.performanceDropThreshold}
                  onChange={v => updateAlert({ performanceDropThreshold: v })}
                />
                <ThresholdInput
                  label="Delay (days)"
                  value={alertSettings.performanceDelayDays}
                  onChange={v => updateAlert({ performanceDelayDays: v })}
                  isPercent={false}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 px-1">Sent after the delay period for open rate and CTR drops</p>
            </div>

            {/* Toggles */}
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Features</h3>
              <div className="bg-muted rounded-lg p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium">Hard-bounce domain alerts</p>
                    <p className="text-[10px] text-muted-foreground">Alert when new domains show high bounce rates</p>
                  </div>
                  <Switch
                    checked={alertSettings.hardBounceAlertEnabled}
                    onCheckedChange={v => updateAlert({ hardBounceAlertEnabled: v })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium">Weekly recap</p>
                    <p className="text-[10px] text-muted-foreground">Campaign performance summary to marketing team</p>
                  </div>
                  <Switch
                    checked={alertSettings.weeklyRecapEnabled}
                    onCheckedChange={v => updateAlert({ weeklyRecapEnabled: v })}
                  />
                </div>
              </div>
            </div>

            {/* Recap day */}
            {alertSettings.weeklyRecapEnabled && (
              <div>
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Recap Day</h3>
                <div className="flex gap-1.5 flex-wrap">
                  {(['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const).map(day => (
                    <button
                      key={day}
                      className={`text-[10px] px-3 py-1.5 rounded-full capitalize transition-colors ${
                        alertSettings.weeklyRecapDay === day
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-muted-foreground hover:text-foreground'
                      }`}
                      onClick={() => updateAlert({ weeklyRecapDay: day })}
                    >
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default SettingsPanel;
