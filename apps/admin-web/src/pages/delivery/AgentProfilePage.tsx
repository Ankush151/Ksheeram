import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  User,
  Phone,
  Bike,
  MapPin,
  LogOut,
  ShieldCheck,
  RefreshCw,
  HelpCircle,
  Truck,
} from 'lucide-react';

export const AgentProfilePage: React.FC = () => {
  const { user, logout, switchRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSwitchToAdmin = () => {
    switchRole('admin');
    navigate('/admin/dashboard');
  };

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      {/* Profile Header */}
      <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 h-20" />
        <CardContent className="px-5 pb-5 -mt-10 space-y-4">
          <div className="flex justify-between items-end">
            <div className="w-20 h-20 rounded-2xl bg-white p-1 shadow-md border border-slate-200">
              <div className="w-full h-full rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-extrabold text-2xl">
                {user?.name?.charAt(0) || 'R'}
              </div>
            </div>
            <Badge variant="success" className="px-3 py-1 font-semibold text-xs">
              Active on Route
            </Badge>
          </div>

          <div>
            <h1 className="text-xl font-bold text-slate-900">{user?.name || 'Ramesh Patel'}</h1>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{user?.phone || '+91 98111 22233'}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-400 block font-medium flex items-center gap-1">
                <Bike className="w-3.5 h-3.5 text-emerald-600" /> Vehicle
              </span>
              <strong className="text-slate-900 text-xs mt-1 block">
                DL-3S-AB-1234
              </strong>
              <span className="text-[11px] text-slate-500">Insulated Box Carrier</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-400 block font-medium flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Route Sector
              </span>
              <strong className="text-slate-900 text-xs mt-1 block">
                Sector 49 & 50
              </strong>
              <span className="text-[11px] text-slate-500">Morning Shift (5:30 AM)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency & Support */}
      <Card className="bg-white border-slate-200">
        <CardContent className="p-4 space-y-3 text-xs">
          <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
            <HelpCircle className="w-4 h-4 text-emerald-600" />
            Dispatch Support Helpline
          </h3>
          <p className="text-slate-600">
            For vehicle breakdown, customer gate access denial, or pouch temperature issues:
          </p>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex justify-between items-center text-emerald-950 font-bold">
            <span>Depot Dispatch Room</span>
            <a href="tel:+919876543210" className="text-emerald-700 underline flex items-center gap-1">
              <Phone className="w-3.5 h-3.5" /> +91 98765 43210
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Evaluation Quick Switcher */}
      <Card className="bg-slate-50 border-dashed border-2 border-slate-200">
        <CardContent className="p-4 space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="font-bold text-slate-700">Prototype Navigation Helper</span>
            <Badge variant="neutral">Tester Tool</Badge>
          </div>
          <p className="text-slate-500">
            Switch your role to Administrator to review the management dashboard, stock ledger, and orders.
          </p>
          <Button
            variant="secondary"
            onClick={handleSwitchToAdmin}
            className="w-full text-xs flex items-center justify-center gap-2 border-slate-300"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
            Switch to Admin Portal
          </Button>
        </CardContent>
      </Card>

      {/* Logout */}
      <Button
        variant="danger"
        onClick={handleLogout}
        className="w-full py-3 flex items-center justify-center gap-2 font-bold text-xs"
      >
        <LogOut className="w-4 h-4" />
        Log Out of Shift
      </Button>
    </div>
  );
};
export default AgentProfilePage;
