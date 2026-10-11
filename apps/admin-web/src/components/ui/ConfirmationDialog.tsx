import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle, Info } from 'lucide-react';

export interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose?: () => void;
  onCancel?: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  confirmVariant?: 'danger' | 'warning' | 'primary' | string;
  isLoading?: boolean;
  isPending?: boolean;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onCancel,
  onConfirm,
  title,
  description,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant,
  confirmVariant,
  isLoading,
  isPending,
}) => {
  const handleClose = onCancel || onClose || (() => {});
  const activeVariant = (confirmVariant || variant || 'danger') as 'danger' | 'warning' | 'primary';
  const loadingState = isPending || isLoading || false;
  const bodyText = message || description || '';

  return (
    <Modal isOpen={isOpen} onClose={handleClose} maxWidth="sm">
      <div className="flex flex-col items-center text-center space-y-3 pt-2">
        <div
          className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
            activeVariant === 'danger'
              ? 'bg-rose-100 text-rose-600'
              : 'bg-amber-100 text-amber-700'
          }`}
        >
          {activeVariant === 'danger' ? <AlertTriangle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
        </div>

        <div>
          <h4 className="text-base font-bold text-slate-900">{title}</h4>
          <p className="mt-1 text-xs text-slate-600 leading-relaxed">{bodyText}</p>
        </div>

        <div className="flex items-center gap-2.5 w-full pt-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            disabled={loadingState}
            onClick={handleClose}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={activeVariant === 'danger' ? 'danger' : 'primary'}
            className="flex-1"
            isLoading={loadingState}
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
