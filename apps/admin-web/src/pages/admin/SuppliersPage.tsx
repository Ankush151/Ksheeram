import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { suppliersApi } from '@/features/suppliers/suppliersApi';
import { Supplier, CreateSupplierPayload } from '@/types/suppliers';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { Truck, Plus, Phone, Mail, MapPin, Edit2, Star } from 'lucide-react';

export const SuppliersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: suppliers, isLoading } = useQuery({
    queryKey: ['admin-suppliers'],
    queryFn: () => suppliersApi.getSuppliers(),
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const [formData, setFormData] = useState<CreateSupplierPayload>({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    villageDistrict: '',
    state: 'Karnataka',
    milkTypes: ['cow'],
    dailySupplyCapacityUnits: 500,
    paymentTerms: 'weekly',
    status: 'active',
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateSupplierPayload) => suppliersApi.createSupplier(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-suppliers'] });
      setIsModalOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateSupplierPayload> }) =>
      suppliersApi.updateSupplier(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-suppliers'] });
      setIsModalOpen(false);
    },
  });

  const handleOpenAdd = () => {
    setEditingSupplier(null);
    setFormData({
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      villageDistrict: '',
      state: 'Karnataka',
      milkTypes: ['cow'],
      dailySupplyCapacityUnits: 500,
      paymentTerms: 'weekly',
      status: 'active',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sup: Supplier) => {
    setEditingSupplier(sup);
    setFormData({
      name: sup.name,
      contactPerson: sup.contactPerson,
      phone: sup.phone,
      email: sup.email || '',
      villageDistrict: sup.villageDistrict,
      state: sup.state,
      milkTypes: sup.milkTypes,
      dailySupplyCapacityUnits: sup.dailySupplyCapacityUnits,
      paymentTerms: sup.paymentTerms,
      status: sup.status,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSupplier) {
      updateMutation.mutate({ id: editingSupplier.id, payload: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-serif">
            Dairy Suppliers &amp; Cooperatives
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage partner farmers, collection centers, daily supply volume capacity, and payment terms.
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={handleOpenAdd} leftIcon={<Plus className="w-4 h-4" />}>
          Register New Supplier
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          <div className="col-span-3 py-12 flex justify-center">
            <Spinner label="Loading suppliers..." />
          </div>
        ) : (
          suppliers?.map((sup) => (
            <Card key={sup.id} className="p-5 space-y-4 border border-slate-200">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 block">
                    {sup.code}
                  </span>
                  <h3 className="font-bold text-base text-slate-900 leading-tight mt-0.5">
                    {sup.name}
                  </h3>
                  <p className="text-xs text-slate-500">Contact: {sup.contactPerson}</p>
                </div>
                <Badge variant={sup.status === 'active' ? 'emerald' : 'neutral'} size="sm" dot>
                  {sup.status.toUpperCase()}
                </Badge>
              </div>

              <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>+91 {sup.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {sup.villageDistrict}, {sup.state}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-200/60 font-medium">
                  <span>Supply Capacity:</span>
                  <span className="font-bold text-slate-900">
                    {sup.dailySupplyCapacityUnits} units/day
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-500 capitalize">
                  Terms: <strong className="text-slate-800">{sup.paymentTerms.replace('_', ' ')}</strong>
                </span>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => handleOpenEdit(sup)}
                  leftIcon={<Edit2 className="w-3 h-3" />}
                >
                  Edit
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Supplier Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSupplier ? 'Edit Supplier Record' : 'Register New Farm Supplier'}
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-3.5 pt-2">
          <Input
            label="Supplier / Cooperative Name"
            placeholder="e.g. Nandi Valley Dairy"
            value={formData.name}
            onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Contact Person"
              placeholder="e.g. Manjunath Reddy"
              value={formData.contactPerson}
              onChange={(e) => setFormData((p) => ({ ...p, contactPerson: e.target.value }))}
              required
            />
            <Input
              label="Contact Phone"
              placeholder="e.g. 9880123456"
              value={formData.phone}
              onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Village / District"
              placeholder="e.g. Chikkaballapur"
              value={formData.villageDistrict}
              onChange={(e) => setFormData((p) => ({ ...p, villageDistrict: e.target.value }))}
              required
            />
            <Input
              label="Daily Supply Units"
              type="number"
              value={formData.dailySupplyCapacityUnits}
              onChange={(e) =>
                setFormData((p) => ({ ...p, dailySupplyCapacityUnits: Number(e.target.value) }))
              }
              required
            />
          </div>
          <Select
            label="Payment Terms"
            value={formData.paymentTerms}
            onChange={(e) =>
              setFormData((p) => ({ ...p, paymentTerms: e.target.value as any }))
            }
            options={[
              { value: 'weekly', label: 'Weekly Payment Cycle' },
              { value: 'bi_weekly', label: 'Bi-Weekly (15 Days)' },
              { value: 'monthly', label: 'Monthly' },
              { value: 'immediate', label: 'Immediate / Next Day' },
            ]}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              Save Supplier Record
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
