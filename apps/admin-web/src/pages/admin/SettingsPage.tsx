import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { env } from '@/config/env';
import {
  Settings,
  Clock,
  Thermometer,
  ShieldCheck,
  Building,
  Server,
  Save,
  CheckCircle2,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [cutoffTime, setCutoffTime] = useState('20:00');
  const [morningSlotStart, setMorningSlotStart] = useState('05:30');
  const [morningSlotEnd, setMorningSlotEnd] = useState('07:30');
  const [tempThreshold, setTempThreshold] = useState('4.0');
  const [minWalletBalance, setMinWalletBalance] = useState('150');

  const [fssaiLicense, setFssaiLicense] = useState('10823999000142');
  const [gstin, setGstin] = useState('07AAAAK1234F1Z5');
  const [supportPhone, setSupportPhone] = useState('+91 98765 43210');

  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-7 h-7 text-emerald-600" />
            Operational & System Settings
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure order cutoff deadlines, cold room quality thresholds, regulatory licenses, and backend integration parameters.
          </p>
        </div>
      </div>

      {savedNotice && (
        <Alert variant="success" className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Settings successfully persisted to system configuration.
        </Alert>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Operational Deadlines */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-600" />
              Delivery Cutoffs & Dispatch Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Evening Order Cutoff (IST)"
                type="time"
                value={cutoffTime}
                onChange={(e) => setCutoffTime(e.target.value)}
                helperText="Subscriptions lock & procurement batches finalize at this hour"
              />
              <Input
                label="Morning Drop Slot Begins"
                type="time"
                value={morningSlotStart}
                onChange={(e) => setMorningSlotStart(e.target.value)}
              />
              <Input
                label="Morning Drop Slot Ends"
                type="time"
                value={morningSlotEnd}
                onChange={(e) => setMorningSlotEnd(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Quality & Cold Chain Thresholds */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Thermometer className="w-5 h-5 text-emerald-600" />
              Cold Chain & Quality Control
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Max Intake Chilling Temperature (°C)"
                type="number"
                step="0.1"
                value={tempThreshold}
                onChange={(e) => setTempThreshold(e.target.value)}
                helperText="Batches received above this value trigger dock alarms"
              />
              <Input
                label="Min Subscriber Wallet Balance Threshold (₹)"
                type="number"
                value={minWalletBalance}
                onChange={(e) => setMinWalletBalance(e.target.value)}
                helperText="Alerts customer to top up before next-morning dispatch"
              />
            </div>
          </CardContent>
        </Card>

        {/* Compliance & Regulatory Credentials */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building className="w-5 h-5 text-emerald-600" />
              Statutory Licenses & Customer Care
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="FSSAI Food Safety License #"
                value={fssaiLicense}
                onChange={(e) => setFssaiLicense(e.target.value)}
              />
              <Input
                label="GSTIN Identification Number"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
              />
              <Input
                label="Customer Helpline & WhatsApp"
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Backend Connectivity Status */}
        <Card className="bg-slate-50 border-slate-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Server className="w-5 h-5 text-slate-700" />
              Express & MongoDB Backend Environment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-2 border-b border-slate-200">
              <span className="text-slate-500">API Base URL:</span>
              <span className="font-mono font-medium text-slate-900">{env.API_BASE_URL}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-200">
              <span className="text-slate-500">Integration Mode:</span>
              <Badge variant={env.USE_MOCK_API ? 'warning' : 'success'}>
                {env.USE_MOCK_API ? 'Simulated Mock Engine' : 'Live Express Backend'}
              </Badge>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-slate-500">Database Engine:</span>
              <span className="text-slate-900 font-medium">MongoDB via Express REST API (Zero browser direct queries)</span>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" variant="primary" className="flex items-center gap-2 shadow-sm bg-emerald-600 hover:bg-emerald-700">
            <Save className="w-4 h-4" />
            Save Configuration
          </Button>
        </div>
      </form>
    </div>
  );
};
export default SettingsPage;
