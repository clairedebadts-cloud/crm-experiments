import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Credentials, REGIONS } from '@/types/clevertap';
import { testConnection } from '@/lib/api';
import { Shield, Zap, Globe, CheckCircle, XCircle, Loader2, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CredentialsScreen: React.FC = () => {
  const { setCredentials, setIsConnected, loadDemoData } = useApp();
  const [accountId, setAccountId] = useState('');
  const [passcode, setPasscode] = useState('');
  const [region, setRegion] = useState('US');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const creds: Credentials = { accountId, passcode, region };
    const ok = await testConnection(creds);
    setTestResult(ok ? 'success' : 'error');
    setTesting(false);
    if (ok) {
      setCredentials(creds);
      setIsConnected(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-2">
            <BarChart3 className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Campaign Intelligence</h1>
          <p className="text-muted-foreground text-sm">Connect your CleverTap account to monitor campaign health</p>
        </div>

        <div className="bg-card rounded-xl border p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-3 h-3" /> Account ID
            </label>
            <Input
              placeholder="X-CleverTap-Account-Id"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="bg-secondary border-0 font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3 h-3" /> Passcode
            </label>
            <Input
              type="password"
              placeholder="X-CleverTap-Passcode"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              className="bg-secondary border-0 font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-3 h-3" /> Region
            </label>
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger className="bg-secondary border-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(REGIONS).map(r => (
                  <SelectItem key={r} value={r}>
                    {r} — {REGIONS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {testResult && (
            <div className={`flex items-center gap-2 text-sm p-3 rounded-lg ${
              testResult === 'success' ? 'bg-healthy/10 text-healthy' : 'bg-critical/10 text-critical'
            }`}>
              {testResult === 'success' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              {testResult === 'success' ? 'Connected successfully!' : 'Connection failed. Check credentials.'}
            </div>
          )}

          <Button
            className="w-full"
            onClick={handleTest}
            disabled={!accountId || !passcode || testing}
          >
            {testing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Testing...</> : 'Test Connection'}
          </Button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-3 text-muted-foreground">or</span>
          </div>
        </div>

        <Button variant="outline" className="w-full" onClick={loadDemoData}>
          <BarChart3 className="w-4 h-4 mr-2" /> Launch Demo Mode
        </Button>
      </div>
    </div>
  );
};

export default CredentialsScreen;
