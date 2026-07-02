export type Channel = 'email' | 'push' | 'sms' | 'inapp';
export type HealthStatus = 'healthy' | 'warning' | 'critical';

export interface Credentials {
  accountId: string;
  passcode: string;
  region: string;
}

export interface Campaign {
  id: string;
  name: string;
  channel: Channel;
  date: string;
  sent: number;
  delivered: number;
  opens: number;
  clicks: number;
  bounces: number;
  unsubscribes: number;
  conversions: number;
  segmentId?: string;
  segmentSize?: number;
  hasDndConfig?: boolean;
}

export interface CampaignWithMetrics extends Campaign {
  openRate: number;
  ctr: number;
  bounceRate: number;
  deliveryRate: number;
  unsubscribeRate: number;
  healthScore: HealthStatus;
  issues: Issue[];
}

export interface ChannelBenchmark {
  avgOpenRate: number;
  avgCtr: number;
  avgBounceRate: number;
  avgDeliveryRate: number;
  avgUnsubscribeRate: number;
  trend: number[];
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  severity: HealthStatus;
  icon: string;
  recommendation?: Recommendation;
}

export interface Recommendation {
  title: string;
  description: string;
  actionLabel?: string;
  actionType?: 'sunset' | 'deactivate' | 'listHygiene' | 'fixDnd';
  estimatedImpact?: string;
}

export interface Thresholds {
  email: { bounce: number; openRate: number; ctr: number; delivery: number };
  push: { delivery: number; ctr: number };
  sms: { delivery: number };
  inapp: { ctr: number };
  sunsetAfterCampaigns: number;
  frequencyWindowDays: number;
}

export const DEFAULT_THRESHOLDS: Thresholds = {
  email: { bounce: 0.05, openRate: 0.15, ctr: 0.35, delivery: 0.85 },
  push: { delivery: 0.80, ctr: 0.25 },
  sms: { delivery: 0.90 },
  inapp: { ctr: 0.02 },
  sunsetAfterCampaigns: 3,
  frequencyWindowDays: 7,
};

export interface AlertSettings {
  adminEmail: string;
  marketingEmails: string[];
  deliverabilityDropThreshold: number; // e.g. 0.10 = 10% below avg
  performanceDropThreshold: number;
  performanceDelayDays: number; // 3-5 days
  weeklyRecapEnabled: boolean;
  weeklyRecapDay: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';
  hardBounceAlertEnabled: boolean;
}

export const DEFAULT_ALERT_SETTINGS: AlertSettings = {
  adminEmail: '',
  marketingEmails: [],
  deliverabilityDropThreshold: 0.10,
  performanceDropThreshold: 0.10,
  performanceDelayDays: 3,
  weeklyRecapEnabled: true,
  weeklyRecapDay: 'monday',
  hardBounceAlertEnabled: true,
};

export type AlertType = 'deliverability_drop' | 'performance_drop' | 'hard_bounce_domain' | 'weekly_recap';
export type AlertPriority = 'immediate' | 'delayed' | 'scheduled';

export interface Alert {
  id: string;
  type: AlertType;
  priority: AlertPriority;
  title: string;
  description: string;
  channel?: Channel;
  campaignName?: string;
  metric?: string;
  currentValue?: number;
  benchmarkValue?: number;
  dropPercent?: number;
  domains?: string[];
  createdAt: string;
  sent: boolean;
}

export const REGIONS: Record<string, string> = {
  US: 'api.clevertap.com',
  EU: 'eu1.api.clevertap.com',
  IN: 'in1.api.clevertap.com',
  SG: 'sg1.api.clevertap.com',
};
