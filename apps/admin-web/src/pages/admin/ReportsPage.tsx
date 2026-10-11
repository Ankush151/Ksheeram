import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi, DailyReportRow } from '@/features/reports/reportsApi';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { formatCurrency } from '@/utils/formatters';
import {
  BarChart3,
  Download,
  Calendar,
  TrendingUp,
  Percent,
  CheckCircle,
  Truck,
  DollarSign,
  AlertOctagon,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { data: reports = [], isLoading, error } = useQuery({
    queryKey: ['admin', 'daily-reports'],
    queryFn: reportsApi.getDailyReports,
  });

  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleExportCSV = () => {
    const headers = 'Date,Procured Units,Delivered Units,Damaged Units,Gross Revenue (INR),Active Subscriptions,Cash Collected (INR)\n';
    const rows = reports
      .map(
        (r) =>
          `${r.date},${r.procuredUnits},${r.deliveredUnits},${r.damagedUnits},${r.grossRevenue},${r.activeSubscriptions},${r.cashCollected}`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ksheeraam-daily-operations-report-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const totalProcured = reports.reduce((acc, r) => acc + r.procuredUnits, 0);
  const totalDelivered = reports.reduce((acc, r) => acc + r.deliveredUnits, 0);
  const totalDamaged = reports.reduce((acc, r) => acc + r.damagedUnits, 0);
  const totalRevenue = reports.reduce((acc, r) => acc + r.grossRevenue, 0);

  const shrinkageRate = totalProcured > 0 ? ((totalDamaged / totalProcured) * 100).toFixed(2) : '0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-emerald-600" />
            Operational & Inventory Reporting
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Aggregated audit summaries for procurement intake, drop fulfillment rates, shrinkage loss, and daily revenue.
          </p>
        </div>
        <div>
          <Button
            variant="secondary"
            onClick={handleExportCSV}
            className="flex items-center gap-2 border-slate-300"
          >
            <Download className="w-4 h-4" />
            {downloadSuccess ? 'Downloaded CSV!' : 'Export CSV Ledger'}
          </Button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Units Procured</div>
              <div className="text-xl font-bold text-slate-900">{totalProcured} units</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Delivered to Customers</div>
              <div className="text-xl font-bold text-blue-700">{totalDelivered} units</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <Percent className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Shrinkage / Leakage Rate</div>
              <div className="text-xl font-bold text-rose-700">{shrinkageRate}% ({totalDamaged} units)</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Total Gross Revenue</div>
              <div className="text-xl font-bold text-purple-900">{formatCurrency(totalRevenue)}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports Table */}
      {isLoading ? (
        <div className="flex justify-center p-12">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <Alert variant="danger">Failed to load reports data.</Alert>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="font-semibold text-slate-900 text-sm">Daily Reconciliation Table</h3>
            <span className="text-xs text-slate-500">Calculated daily at 23:59 IST</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Procured Packets</th>
                  <th className="py-3 px-4">Delivered</th>
                  <th className="py-3 px-4">Fulfillment %</th>
                  <th className="py-3 px-4">Damaged / Leaks</th>
                  <th className="py-3 px-4">Subscribers</th>
                  <th className="py-3 px-4">Gross Revenue</th>
                  <th className="py-3 px-4 text-right">Cash Handover</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-xs">
                {reports.map((row) => {
                  const rate = row.procuredUnits > 0 ? Math.round((row.deliveredUnits / row.procuredUnits) * 100) : 0;
                  return (
                    <tr key={row.date} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-sans font-medium text-slate-900">
                        {row.date}
                      </td>
                      <td className="py-3.5 px-4 text-slate-800">
                        {row.procuredUnits} units
                      </td>
                      <td className="py-3.5 px-4 text-emerald-700 font-bold">
                        {row.deliveredUnits} units
                      </td>
                      <td className="py-3.5 px-4 font-sans">
                        <Badge variant={rate >= 95 ? 'success' : 'warning'}>
                          {rate}%
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-rose-600 font-semibold">
                        {row.damagedUnits} units
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-sans">
                        {row.activeSubscriptions} active
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {formatCurrency(row.grossRevenue)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-700 font-medium">
                        {formatCurrency(row.cashCollected)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
export default ReportsPage;
