import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { customersApi } from '@/features/customers/customersApi';
import { formatINR, formatDate } from '@/utils/formatters';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { Search, Users, Phone, MapPin, Wallet, Calendar } from 'lucide-react';

export const CustomersPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const { data: customers, isLoading, refetch } = useQuery({
    queryKey: ['admin-customers', search],
    queryFn: () => customersApi.getCustomers(search),
  });

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-serif">Customer Accounts</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            View customer subscriber status, wallet balances, and delivery drop addresses.
          </p>
        </div>

        <div className="w-full sm:w-72">
          <Input
            placeholder="Search customer name, phone, area..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
      </div>

      <Card className="overflow-hidden border border-slate-200">
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <Spinner label="Loading customer directory..." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold text-[10px]">
                <tr>
                  <th className="p-3.5">Customer / Contact</th>
                  <th className="p-3.5">Delivery Address</th>
                  <th className="p-3.5">Wallet Balance</th>
                  <th className="p-3.5">Subscription</th>
                  <th className="p-3.5">Total Orders</th>
                  <th className="p-3.5">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers?.map((cust) => (
                  <tr key={cust.id} className="hover:bg-slate-50/50">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{cust.name}</div>
                      <div className="text-slate-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>+91 {cust.phone}</span>
                      </div>
                    </td>
                    <td className="p-3.5 max-w-xs text-slate-600">
                      <div className="truncate font-medium">{cust.addressSummary}</div>
                      <span className="text-[10px] text-slate-400">Pincode: {cust.pincode}</span>
                    </td>
                    <td className="p-3.5 font-bold text-brand-800">
                      {formatINR(cust.walletBalance)}
                    </td>
                    <td className="p-3.5">
                      {cust.isSubscribed ? (
                        <Badge variant="emerald" dot>
                          {cust.activeSubscriptionCount} Plan Active
                        </Badge>
                      ) : (
                        <Badge variant="neutral">One-Time Only</Badge>
                      )}
                    </td>
                    <td className="p-3.5 font-semibold text-slate-700">
                      {cust.totalOrdersPlaced} drops
                    </td>
                    <td className="p-3.5 text-slate-400">{formatDate(cust.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
