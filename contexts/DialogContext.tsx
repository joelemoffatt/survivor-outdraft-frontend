import { createContext, useContext, useRef, useState, ReactNode } from 'react';
import { ConfirmDialog } from '../components/shared/ConfirmDialog';

interface DialogOptions {
  confirmText?: string;
  cancelText?: string | null;
  confirmVariant?: 'primary' | 'danger';
}

interface DialogState {
  visible: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string | null;
  confirmVariant: 'primary' | 'danger';
  onConfirm: () => void;
  onCancel?: () => void;
}

type ShowAlertFn = (title: string, message: string) => void;
type ShowConfirmFn = (title: string, message: string, onConfirm: () => void, options?: DialogOptions) => void;

interface DialogContextValue {
  showAlert: ShowAlertFn;
  showConfirm: ShowConfirmFn;
}

const DialogContext = createContext<DialogContextValue | null>(null);

// Module-level singletons so callers outside React can use them
let _showAlert: ShowAlertFn = (title, message) => { console.warn('DialogProvider not mounted', title, message); };
let _showConfirm: ShowConfirmFn = (title, message, onConfirm) => { onConfirm(); };

export function showAlert(title: string, message: string): void {
  _showAlert(title, message);
}

export function showConfirm(
  title: string,
  message: string,
  onConfirm: () => void,
  options?: DialogOptions,
): void {
  _showConfirm(title, message, onConfirm, options);
}

const CLOSED_STATE: DialogState = {
  visible: false,
  title: '',
  message: '',
  confirmText: 'OK',
  cancelText: null,
  confirmVariant: 'primary',
  onConfirm: () => {},
  onCancel: undefined,
};

export function DialogProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<DialogState>(CLOSED_STATE);
  const closeDialog = () => setDialog((prev) => ({ ...prev, visible: false }));

  const showAlertFn: ShowAlertFn = (title, message) => {
    setDialog({
      visible: true,
      title,
      message,
      confirmText: 'OK',
      cancelText: null,
      confirmVariant: 'primary',
      onConfirm: closeDialog,
      onCancel: undefined,
    });
  };

  const showConfirmFn: ShowConfirmFn = (title, message, onConfirm, options = {}) => {
    setDialog({
      visible: true,
      title,
      message,
      confirmText: options.confirmText ?? 'Confirm',
      cancelText: options.cancelText !== undefined ? options.cancelText : 'Cancel',
      confirmVariant: options.confirmVariant ?? 'primary',
      onConfirm: () => {
        closeDialog();
        onConfirm();
      },
      onCancel: closeDialog,
    });
  };

  // Wire up module-level singletons
  const showAlertRef = useRef(showAlertFn);
  showAlertRef.current = showAlertFn;
  const showConfirmRef = useRef(showConfirmFn);
  showConfirmRef.current = showConfirmFn;

  _showAlert = (title, message) => showAlertRef.current(title, message);
  _showConfirm = (title, message, onConfirm, options) => showConfirmRef.current(title, message, onConfirm, options);

  return (
    <DialogContext.Provider value={{ showAlert: showAlertFn, showConfirm: showConfirmFn }}>
      {children}
      <ConfirmDialog
        visible={dialog.visible}
        title={dialog.title}
        message={dialog.message}
        confirmText={dialog.confirmText}
        cancelText={dialog.cancelText}
        confirmVariant={dialog.confirmVariant}
        onConfirm={dialog.onConfirm}
        onCancel={dialog.onCancel}
      />
    </DialogContext.Provider>
  );
}

export function useDialog(): DialogContextValue {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useDialog must be used within DialogProvider');
  return ctx;
}
