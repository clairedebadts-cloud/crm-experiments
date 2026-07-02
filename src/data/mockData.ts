import { Campaign, ChannelBenchmark } from '@/types/clevertap';

const randomDate = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysAgo));
  return d.toISOString().split('T')[0];
};

export const mockCampaigns: Campaign[] = [
  {
    id: 'c1', name: 'Spring Sale Blast', channel: 'email', date: randomDate(5),
    sent: 50000, delivered: 47500, opens: 9500, clicks: 2375, bounces: 2500, unsubscribes: 125, conversions: 475,
    segmentId: 'seg1', segmentSize: 50000,
  },
  {
    id: 'c2', name: 'Welcome Series #1', channel: 'email', date: randomDate(3),
    sent: 12000, delivered: 11760, opens: 4704, clicks: 1176, bounces: 240, unsubscribes: 12, conversions: 235,
    segmentId: 'seg2', segmentSize: 12000,
  },
  {
    id: 'c3', name: 'Flash Deal Push', channel: 'push', date: randomDate(2),
    sent: 80000, delivered: 72000, opens: 28800, clicks: 20160, bounces: 0, unsubscribes: 0, conversions: 0,
    segmentId: 'seg3', segmentSize: 80000,
  },
  {
    id: 'c4', name: 'Cart Abandon Reminder', channel: 'push', date: randomDate(7),
    sent: 25000, delivered: 22500, opens: 9000, clicks: 2250, bounces: 0, unsubscribes: 0, conversions: 450,
    segmentId: 'seg4', segmentSize: 25000,
  },
  {
    id: 'c5', name: 'OTP Verification', channel: 'sms', date: randomDate(1),
    sent: 15000, delivered: 14700, opens: 0, clicks: 0, bounces: 0, unsubscribes: 0, conversions: 14700,
    segmentId: 'seg5', segmentSize: 15000,
  },
  {
    id: 'c6', name: 'Promo Code SMS', channel: 'sms', date: randomDate(4),
    sent: 30000, delivered: 25500, opens: 0, clicks: 4500, bounces: 0, unsubscribes: 0, conversions: 900,
    segmentId: 'seg6', segmentSize: 30000, hasDndConfig: false,
  },
  {
    id: 'c7', name: 'Feature Tour Popup', channel: 'inapp', date: randomDate(6),
    sent: 40000, delivered: 40000, opens: 32000, clicks: 400, bounces: 0, unsubscribes: 0, conversions: 200,
    segmentId: 'seg7', segmentSize: 40000,
  },
  {
    id: 'c8', name: 'Upgrade CTA Banner', channel: 'inapp', date: randomDate(2),
    sent: 60000, delivered: 60000, opens: 48000, clicks: 1800, bounces: 0, unsubscribes: 0, conversions: 0,
    segmentId: 'seg8', segmentSize: 60000,
  },
  {
    id: 'c9', name: 'Re-engagement Email', channel: 'email', date: randomDate(1),
    sent: 35000, delivered: 28000, opens: 2800, clicks: 14000, bounces: 7000, unsubscribes: 350, conversions: 0,
    segmentId: 'seg1', segmentSize: 35000,
  },
  {
    id: 'c10', name: 'Weekly Newsletter', channel: 'email', date: randomDate(3),
    sent: 100000, delivered: 95000, opens: 19000, clicks: 4750, bounces: 5000, unsubscribes: 200, conversions: 950,
    segmentId: 'seg1', segmentSize: 100000,
  },
];

export const mockBenchmarks: Record<string, ChannelBenchmark> = {
  email: {
    avgOpenRate: 0.22, avgCtr: 0.045, avgBounceRate: 0.035, avgDeliveryRate: 0.95, avgUnsubscribeRate: 0.003,
    trend: [0.20, 0.21, 0.19, 0.22, 0.23, 0.22, 0.24, 0.22],
  },
  push: {
    avgOpenRate: 0.38, avgCtr: 0.12, avgBounceRate: 0, avgDeliveryRate: 0.88, avgUnsubscribeRate: 0,
    trend: [0.35, 0.37, 0.36, 0.38, 0.40, 0.39, 0.38, 0.38],
  },
  sms: {
    avgOpenRate: 0, avgCtr: 0.08, avgBounceRate: 0, avgDeliveryRate: 0.95, avgUnsubscribeRate: 0,
    trend: [0.93, 0.94, 0.95, 0.96, 0.95, 0.94, 0.95, 0.95],
  },
  inapp: {
    avgOpenRate: 0.80, avgCtr: 0.025, avgBounceRate: 0, avgDeliveryRate: 1.0, avgUnsubscribeRate: 0,
    trend: [0.022, 0.023, 0.024, 0.025, 0.026, 0.025, 0.024, 0.025],
  },
};
