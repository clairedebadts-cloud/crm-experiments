import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { CampaignWithMetrics } from '@/types/clevertap';
import { X, BarChart2, AlertTriangle, Lightbulb } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import PerformanceTab from './tabs/PerformanceTab';
import IssuesTab from './tabs/IssuesTab';
import RecommendationsTab from './tabs/RecommendationsTab';

const tabs = [
  { id: 'performance', label: 'Performance', icon: BarChart2 },
  { id: 'issues', label: 'Issues', icon: AlertTriangle },
  { id: 'recommendations', label: 'Actions', icon: Lightbulb },
];

const CampaignDrawer: React.FC = () => {
  const { selectedCampaign, setSelectedCampaign } = useApp();
  const [activeTab, setActiveTab] = useState('performance');

  if (!selectedCampaign) return null;

  const c = selectedCampaign;

  return (
    <>
      <div
        className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40"
        onClick={() => setSelectedCampaign(null)}
      />
      <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-card border-l z-50 animate-slide-in-right overflow-y-auto">
        <div className="sticky top-0 bg-card border-b p-4 flex items-center justify-between z-10">
          <div>
            <h2 className="font-semibold text-sm">{c.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-xs capitalize">{c.channel}</Badge>
              <span className="text-xs text-muted-foreground font-mono">{c.date}</span>
            </div>
          </div>
          <button onClick={() => setSelectedCampaign(null)} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex border-b bg-muted/30">
          {tabs.map(t => {
            const Icon = t.icon;
            const issueCount = t.id === 'issues' ? c.issues.length : undefined;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-3 text-xs font-medium transition-colors border-b-2 ${
                  activeTab === t.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
                {issueCount !== undefined && issueCount > 0 && (
                  <Badge variant="destructive" className="text-[10px] h-4 px-1 min-w-[16px]">{issueCount}</Badge>
                )}
              </button>
            );
          })}
        </div>

        <div className="p-4">
          {activeTab === 'performance' && <PerformanceTab campaign={c} />}
          {activeTab === 'issues' && <IssuesTab campaign={c} />}
          {activeTab === 'recommendations' && <RecommendationsTab campaign={c} />}
        </div>
      </div>
    </>
  );
};

export default CampaignDrawer;
