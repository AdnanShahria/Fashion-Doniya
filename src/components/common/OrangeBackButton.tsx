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
      className={`group inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[#FF7A00] hover:bg-[#E86E00] active:bg-[#D46400] text-white font-bold text-xs sm:text-sm leading-none whitespace-nowrap shrink-0 shadow-[0_4px_12px_rgba(255,122,0,0.32)] hover:shadow-[0_6px_16px_rgba(255,122,0,0.45)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7A00] focus-visible:ring-offset-2 ${className}`}
    >
      <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-200 group-hover:-translate-x-0.5 shrink-0" />
      <span>{label}</span>
    </button>
  );
};
