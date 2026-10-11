import React, { useState } from 'react';
import {
  useAddresses,
  useCreateAddress,
  useUpdateAddress,
  useDeleteAddress,
} from '@/features/addresses/useAddresses';
import { Address, CreateAddressPayload, AddressType } from '@/types/addresses';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import {
  MapPin,
  Plus,
  Home,
  Briefcase,
  Building,
  Edit2,
  Trash2,
  CheckCircle,
  Truck,
} from 'lucide-react';
import { cn } from '@/utils/cn';

export const AddressesPage: React.FC = () => {
  const { data: addresses, isLoading, isError, refetch } = useAddresses();
  const createMutation = useCreateAddress();
  const updateMutation = useUpdateAddress();
  const deleteMutation = useDeleteAddress();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  // Form State
  const [formData, setFormData] = useState<CreateAddressPayload>({
    label: 'Home',
    addressType: 'home',
    flatNumber: '',
    buildingName: '',
    streetArea: '',
    landmark: '',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560103',
    deliveryInstructions: '',
    isDefault: false,
    contactPhone: '',
  });

  // Delete State
  const [addressToDelete, setAddressToDelete] = useState<Address | null>(null);

  const openCreateModal = () => {
    setEditingAddress(null);
    setFormData({
      label: 'Home',
      addressType: 'home',
      flatNumber: '',
      buildingName: '',
      streetArea: '',
      landmark: '',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560103',
      deliveryInstructions: '',
      isDefault: (addresses?.length || 0) === 0,
      contactPhone: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (addr: Address) => {
    setEditingAddress(addr);
    setFormData({
      label: addr.label,
      addressType: addr.addressType,
      flatNumber: addr.flatNumber,
      buildingName: addr.buildingName,
      streetArea: addr.streetArea,
      landmark: addr.landmark || '',
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      deliveryInstructions: addr.deliveryInstructions || '',
      isDefault: addr.isDefault,
      contactPhone: addr.contactPhone || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAddress) {
        await updateMutation.mutateAsync({
          id: editingAddress.id,
          payload: formData,
        });
      } else {
        await createMutation.mutateAsync(formData);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err?.message || 'Could not save address.');
    }
  };

  const handleDelete = async () => {
    if (!addressToDelete) return;
    await deleteMutation.mutateAsync(addressToDelete.id);
    setAddressToDelete(null);
  };

  const handleSetDefault = async (addr: Address) => {
    await updateMutation.mutateAsync({
      id: addr.id,
      payload: { isDefault: true },
    });
  };

  const getAddressIcon = (type: AddressType) => {
    switch (type) {
      case 'home':
        return <Home className="w-4 h-4 text-brand-600" />;
      case 'work':
        return <Briefcase className="w-4 h-4 text-blue-600" />;
      default:
        return <Building className="w-4 h-4 text-amber-600" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-left">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <Badge variant="emerald" size="md">
            Doorstep Deliveries
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 font-serif">
            Delivery Addresses
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage early morning drop points for your flat, villa, parents, or vacation home.
          </p>
        </div>

        <Button variant="primary" onClick={openCreateModal} leftIcon={<Plus className="w-4 h-4" />}>
          Add New Address
        </Button>
      </div>

      {isLoading ? (
        <LoadingState message="Fetching saved delivery locations..." />
      ) : isError ? (
        <ErrorState
          title="Could not load addresses"
          message="Please ensure server is running."
          onRetry={() => refetch()}
        />
      ) : addresses && addresses.length === 0 ? (
        <EmptyState
          icon={<MapPin className="w-8 h-8" />}
          title="No delivery addresses saved"
          description="Add your first delivery address to begin scheduling morning milk deliveries."
          actionText="Add Delivery Address"
          onAction={openCreateModal}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {addresses?.map((addr) => (
            <Card
              key={addr.id}
              hoverEffect
              className={cn(
                'p-6 space-y-4 border flex flex-col justify-between',
                addr.isDefault ? 'border-brand-500/80 bg-brand-50/20' : 'border-slate-200'
              )}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-slate-100">
                      {getAddressIcon(addr.addressType)}
                    </span>
                    <h3 className="font-extrabold text-base text-slate-900">{addr.label}</h3>
                  </div>

                  {addr.isDefault ? (
                    <Badge variant="emerald" size="sm">
                      Default Delivery Drop
                    </Badge>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(addr)}
                      className="text-xs font-semibold text-slate-500 hover:text-brand-700 underline"
                    >
                      Make Default
                    </button>
                  )}
                </div>

                <div className="text-xs text-slate-700 leading-relaxed font-medium">
                  <p>
                    {addr.flatNumber}, {addr.buildingName}
                  </p>
                  <p className="text-slate-500 mt-0.5">
                    {addr.streetArea}
                    {addr.landmark ? `, Near ${addr.landmark}` : ''}
                  </p>
                  <p className="text-slate-900 font-semibold mt-1">
                    {addr.city}, {addr.state} — {addr.pincode}
                  </p>
                </div>

                {addr.deliveryInstructions && (
                  <div className="p-3 rounded-xl bg-amber-50 text-amber-900 text-xs border border-amber-200/60">
                    <span className="font-bold">Rider Note:</span> {addr.deliveryInstructions}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => openEditModal(addr)}
                  leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                >
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs text-rose-600 hover:bg-rose-50 hover:border-rose-300"
                  onClick={() => setAddressToDelete(addr)}
                  leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Address Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAddress ? 'Edit Delivery Address' : 'Add New Delivery Address'}
        description="Provide accurate building and floor details for silent morning drops."
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Address Label"
              placeholder="e.g. Home, Villa, Parents"
              value={formData.label}
              onChange={(e) => setFormData((p) => ({ ...p, label: e.target.value }))}
              required
            />
            <Select
              label="Address Type"
              value={formData.addressType}
              onChange={(e) =>
                setFormData((p) => ({ ...p, addressType: e.target.value as AddressType }))
              }
              options={[
                { value: 'home', label: 'Home Apartment / Villa' },
                { value: 'work', label: 'Work / Office' },
                { value: 'other', label: 'Other Location' },
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Flat / Unit / House #"
              placeholder="e.g. Flat 402, Block B"
              value={formData.flatNumber}
              onChange={(e) => setFormData((p) => ({ ...p, flatNumber: e.target.value }))}
              required
            />
            <Input
              label="Building / Society Name"
              placeholder="e.g. Sobha Lavender"
              value={formData.buildingName}
              onChange={(e) => setFormData((p) => ({ ...p, buildingName: e.target.value }))}
              required
            />
          </div>

          <Input
            label="Street / Area / Layout"
            placeholder="e.g. Sarjapur Main Road, Bellandur"
            value={formData.streetArea}
            onChange={(e) => setFormData((p) => ({ ...p, streetArea: e.target.value }))}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Landmark (Optional)"
              placeholder="e.g. Near Kaikondrahalli Lake"
              value={formData.landmark}
              onChange={(e) => setFormData((p) => ({ ...p, landmark: e.target.value }))}
            />
            <Input
              label="Pincode"
              placeholder="e.g. 560103"
              value={formData.pincode}
              onChange={(e) => setFormData((p) => ({ ...p, pincode: e.target.value }))}
              required
            />
          </div>

          <Input
            label="Instructions for Delivery Partner"
            placeholder="e.g. Leave milk inside insulated cloth bag on gate. Do not ring doorbell before 7 AM."
            value={formData.deliveryInstructions}
            onChange={(e) =>
              setFormData((p) => ({ ...p, deliveryInstructions: e.target.value }))
            }
          />

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isDefaultCheckbox"
              checked={formData.isDefault}
              onChange={(e) => setFormData((p) => ({ ...p, isDefault: e.target.checked }))}
              className="w-4 h-4 accent-brand-600 rounded"
            />
            <label htmlFor="isDefaultCheckbox" className="text-xs text-slate-700 font-medium">
              Set as my default morning delivery address
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              {editingAddress ? 'Update Address' : 'Save Address'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={!!addressToDelete}
        onClose={() => setAddressToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Delivery Address?"
        description={`Are you sure you want to delete "${addressToDelete?.label}" (${addressToDelete?.flatNumber}, ${addressToDelete?.buildingName})?`}
        confirmText="Yes, Delete Address"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
