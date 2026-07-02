import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import CredentialsScreen from '@/components/CredentialsScreen';
import DashboardHeader from '@/components/DashboardHeader';
import BenchmarkBar from '@/components/BenchmarkBar';
import CampaignTable from '@/components/CampaignTable';
import CampaignDrawer from '@/components/CampaignDrawer';
import SettingsPanel from '@/components/SettingsPanel';
import AlertsPanel from '@/components/AlertsPanel';

const Index: React.FC = () => {
  const { isConnected, isDemo, loadDemoData } = useApp();
  const [settingsOpen, setSettingsOpen] = useState(false);

  if (!isConnected) {
    return <CredentialsScreen />;
  }

  const handleRefresh = () => {
    if (isDemo) loadDemoData();
  };

  return (
    <div className="min-h-screen">
      <DashboardHeader onRefresh={handleRefresh} onSettings={() => setSettingsOpen(true)} />
      <main className="container px-6 py-6 space-y-6">
        <BenchmarkBar />
        <AlertsPanel />
        <CampaignTable />
      </main>
      <CampaignDrawer />
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
};

export default Index;
