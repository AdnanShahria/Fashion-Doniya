import React from 'react';
import { useStore } from '../../context/StoreContext';
import { CheckCircle2, Info, AlertCircle, X } from 'lucide-react';

export const ToastNotification: React.FC = () => {
  const { toast } = useStore();

  if (!toast) return null;

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />;
      case 'info':
      default:
        return <Info className="w-4 h-4 text-[#C5A46D] shrink-0" />;
    }
  };

  const getBorder = () => {
    switch (toast.type) {
      case 'success':
        return 'border-emerald-200 bg-white';
      case 'error':
        return 'border-rose-200 bg-white';
      case 'info':
      default:
        return 'border-[#EDE5D9] bg-white';
    }
  };

  return (
    <div className="fixed top-20 right-4 sm:right-6 z-50 max-w-sm animate-in fade-in slide-in-from-top-4 duration-200 shadow-xl rounded-lg">
      <div className={`flex items-center gap-3 p-3.5 rounded-lg border ${getBorder()} text-xs font-medium text-[#242424]`}>
        {getIcon()}
        <span className="flex-1 leading-normal">{toast.text}</span>
      </div>
    </div>
  );
};
