import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle, Info } from 'lucide-react';

export interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Keep As Is',
  variant = 'danger',
  isLoading = false,
}) => {
  const isDanger = variant === 'danger';

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="sm" showCloseButton={!isLoading}>
      <div className="flex flex-col items-center text-center space-y-4 pt-2">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
            isDanger ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-700'
          }`}
        >
          {isDanger ? <AlertTriangle className="w-6 h-6" /> : <Info className="w-6 h-6" />}
        </div>

        <div>
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{description}</p>
        </div>

        <div className="flex items-center gap-3 w-full pt-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            disabled={isLoading}
            onClick={onClose}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={variant === 'primary' ? 'primary' : isDanger ? 'danger' : 'gold'}
            className="flex-1"
            isLoading={isLoading}
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
