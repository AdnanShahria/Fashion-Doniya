import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

interface OrangeBackButtonProps {
  onClick?: () => void;
  label?: string;
  className?: string;
}

export const OrangeBackButton: React.FC<OrangeBackButtonProps> = ({
  onClick,
  label = 'ফিরে যান',
  className = '',
}) => {
  const { goBack } = useStore();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (onClick) {
      onClick();
    } else {
      goBack();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label}
      className={`group inline-flex items-center justify-center gap-1.5 sm:gap-2 min-h-[44px] px-4 py-2 rounded-full bg-[#FFFDF9] border border-[#E6D8C5] hover:border-[#C59B48] hover:bg-[#FAF8F5] active:scale-[0.97] text-[#6B0812] hover:text-[#53050D] font-bold text-xs sm:text-sm leading-none whitespace-nowrap shrink-0 shadow-[0_1px_4px_rgba(36,22,20,0.04)] hover:shadow-[0_4px_14px_rgba(107,8,18,0.08)] transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C59B48] focus-visible:ring-offset-2 ${className}`}
    >
      <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#6B0812] transition-transform duration-200 group-hover:-translate-x-1 shrink-0" />
      <span>{label}</span>
    </button>
  );
};
