import { Credentials, REGIONS, Campaign, Channel } from '@/types/clevertap';

const getBaseUrl = (region: string) => `https://${REGIONS[region] || REGIONS.US}`;

const headers = (creds: Credentials) => ({
  'X-CleverTap-Account-Id': creds.accountId,
  'X-CleverTap-Passcode': creds.passcode,
  'Content-Type': 'application/json',
});

export async function testConnection(creds: Credentials): Promise<boolean> {
  try {
    const res = await fetch(`${getBaseUrl(creds.region)}/1/accounts.json`, {
      headers: headers(creds),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchCampaignsByChannel(creds: Credentials, channel: Channel): Promise<Campaign[]> {
  try {
    const res = await fetch(`${getBaseUrl(creds.region)}/1/campaigns.json?type=${channel}`, {
      headers: headers(creds),
    });
    if (!res.ok) return [];
    const data = await res.json();
    // Map API response to our Campaign type
    return (data.campaigns || []).map((c: any) => ({
      id: c.id || c.campaign_id,
      name: c.name || c.campaign_name || 'Untitled',
      channel,
      date: c.created_date || new Date().toISOString().split('T')[0],
      sent: c.sent || 0,
      delivered: c.delivered || 0,
      opens: c.opens || c.open || 0,
      clicks: c.clicks || c.click || 0,
      bounces: c.bounces || c.bounce || 0,
      unsubscribes: c.unsubscribes || 0,
      conversions: c.conversions || 0,
      segmentId: c.segment_id,
      segmentSize: c.segment_size,
    }));
  } catch {
    return [];
  }
}

export async function fetchAllCampaigns(creds: Credentials): Promise<Campaign[]> {
  const channels: Channel[] = ['email', 'push', 'sms', 'inapp'];
  const results = await Promise.all(channels.map(ch => fetchCampaignsByChannel(creds, ch)));
  return results.flat();
}

export async function fetchMessageReport(creds: Credentials, from: string, to: string): Promise<any> {
  try {
    const res = await fetch(`${getBaseUrl(creds.region)}/1/message/report.json`, {
      method: 'POST',
      headers: headers(creds),
      body: JSON.stringify({ from: from.replace(/-/g, ''), to: to.replace(/-/g, '') }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
