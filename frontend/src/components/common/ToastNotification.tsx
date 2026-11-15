import React from 'react';
import { useStore } from '../../context/StoreContext';
import { CheckCircle2, Info, AlertCircle } from 'lucide-react';

export const ToastNotification: React.FC = () => {
  const { toast } = useStore();

  if (!toast) return null;

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-[#14533C] shrink-0" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-[#9E0B16] shrink-0" />;
      case 'info':
      default:
        return <Info className="w-4 h-4 text-[#8A5A10] shrink-0" />;
    }
  };

  const getBorder = () => {
    switch (toast.type) {
      case 'success':
        return 'border-[#B8D8C8]';
      case 'error':
        return 'border-[#E6B8BC]';
      case 'info':
      default:
        return 'border-[#DFCBB2]';
    }
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-20 right-4 sm:right-6 z-50 max-w-sm animate-in fade-in slide-in-from-top-3 duration-200"
    >
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${getBorder()} glass-control-light shadow-[0_14px_34px_-10px_rgba(36,22,20,0.22)] text-xs sm:text-[13px] font-semibold text-[#241614]`}
      >
        {getIcon()}
        <span className="flex-1 leading-snug">{toast.text}</span>
      </div>
    </div>
  );
};
