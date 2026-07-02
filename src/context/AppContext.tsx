import React, { createContext, useContext, useState, useCallback } from 'react';
import { Credentials, Campaign, CampaignWithMetrics, ChannelBenchmark, Thresholds, DEFAULT_THRESHOLDS, Channel, AlertSettings, DEFAULT_ALERT_SETTINGS } from '@/types/clevertap';
import { mockCampaigns, mockBenchmarks } from '@/data/mockData';
import { computeMetrics, detectIssues } from '@/lib/campaignEngine';
import type { CostGateState } from '@/types/agent';

interface AppState {
  credentials: Credentials | null;
  isConnected: boolean;
  isDemo: boolean;
  isLoading: boolean;
  campaigns: CampaignWithMetrics[];
  benchmarks: Record<string, ChannelBenchmark>;
  thresholds: Thresholds;
  channelFilter: Channel | 'all';
  selectedCampaign: CampaignWithMetrics | null;
  dateRange: { from: string; to: string };
  alertSettings: AlertSettings;
  costGateState: CostGateState;
}

interface AppContextType extends AppState {
  setCredentials: (c: Credentials) => void;
  setIsConnected: (v: boolean) => void;
  setIsDemo: (v: boolean) => void;
  setChannelFilter: (c: Channel | 'all') => void;
  setSelectedCampaign: (c: CampaignWithMetrics | null) => void;
  setThresholds: (t: Thresholds) => void;
  setDateRange: (r: { from: string; to: string }) => void;
  setAlertSettings: (s: AlertSettings) => void;
  setCostGateState: (s: CostGateState) => void;
  loadDemoData: () => void;
  loadApiData: (campaigns: Campaign[], benchmarks: Record<string, ChannelBenchmark>) => void;
  setIsLoading: (v: boolean) => void;
  disconnect: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};

const getDefaultDateRange = () => {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return { from: from.toISOString().split('T')[0], to: to.toISOString().split('T')[0] };
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>({
    credentials: null,
    isConnected: false,
    isDemo: false,
    isLoading: false,
    campaigns: [],
    benchmarks: {},
    thresholds: DEFAULT_THRESHOLDS,
    channelFilter: 'all',
    selectedCampaign: null,
    dateRange: getDefaultDateRange(),
    alertSettings: DEFAULT_ALERT_SETTINGS,
    costGateState: {
      dailyCallCount: 0,
      dailyResetDate: new Date().toISOString().split('T')[0],
      totalTokensUsed: 0,
    },
  });

  const processCampaigns = useCallback((raw: Campaign[], benchmarks: Record<string, ChannelBenchmark>, thresholds: Thresholds): CampaignWithMetrics[] => {
    return raw.map(c => {
      const metrics = computeMetrics(c);
      const issues = detectIssues({ ...c, ...metrics, issues: [], healthScore: 'healthy' }, benchmarks[c.channel], thresholds, raw);
      const healthScore: CampaignWithMetrics['healthScore'] =
        issues.some(i => i.severity === 'critical') ? 'critical' :
        issues.some(i => i.severity === 'warning') ? 'warning' : 'healthy';
      return { ...c, ...metrics, issues, healthScore };
    });
  }, []);

  const loadDemoData = useCallback(() => {
    const campaigns = processCampaigns(mockCampaigns, mockBenchmarks, state.thresholds);
    setState(s => ({ ...s, isDemo: true, isConnected: true, campaigns, benchmarks: mockBenchmarks, isLoading: false }));
  }, [processCampaigns, state.thresholds]);

  const loadApiData = useCallback((raw: Campaign[], benchmarks: Record<string, ChannelBenchmark>) => {
    const campaigns = processCampaigns(raw, benchmarks, state.thresholds);
    setState(s => ({ ...s, campaigns, benchmarks, isLoading: false }));
  }, [processCampaigns, state.thresholds]);

  const disconnect = useCallback(() => {
    setState(s => ({
      ...s, credentials: null, isConnected: false, isDemo: false,
      campaigns: [], benchmarks: {}, selectedCampaign: null,
    }));
  }, []);

  const value: AppContextType = {
    ...state,
    setCredentials: (c) => setState(s => ({ ...s, credentials: c })),
    setIsConnected: (v) => setState(s => ({ ...s, isConnected: v })),
    setIsDemo: (v) => setState(s => ({ ...s, isDemo: v })),
    setChannelFilter: (c) => setState(s => ({ ...s, channelFilter: c })),
    setSelectedCampaign: (c) => setState(s => ({ ...s, selectedCampaign: c })),
    setThresholds: (t) => {
      setState(s => {
        const campaigns = processCampaigns(
          s.campaigns.map(({ issues, healthScore, openRate, ctr, bounceRate, deliveryRate, unsubscribeRate, ...rest }) => rest),
          s.benchmarks, t
        );
        return { ...s, thresholds: t, campaigns };
      });
    },
    setDateRange: (r) => setState(s => ({ ...s, dateRange: r })),
    setAlertSettings: (a) => setState(s => ({ ...s, alertSettings: a })),
    setCostGateState: (c) => setState(s => ({ ...s, costGateState: c })),
    loadDemoData,
    loadApiData,
    setIsLoading: (v) => setState(s => ({ ...s, isLoading: v })),
    disconnect,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
