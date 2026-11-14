import React from 'react';
import { useStore } from '../../context/StoreContext';

export const AnnouncementBar: React.FC = () => {
  const { settings, navigateTo } = useStore();

  return (
    <div className="bg-[#1C1B19] text-[#F5F2EB] text-xs py-2 px-4 border-b border-[#2E2C28]">
      <div className="max-w-[1360px] mx-auto flex items-center justify-between gap-4">
        <p className="font-normal tracking-wide text-[#F5F2EB]/90 truncate">
          {settings.announcementText || 'সারা বাংলাদেশে কাপড় ডেলিভারি · যেকোনো পোশাকের জন্য নিখুঁত গজ কাটিং'}
        </p>

        <div className="flex items-center gap-4 text-xs text-[#E6DFD3]/80 shrink-0">
          <button
            onClick={() => navigateTo('order-tracking')}
            className="hover:text-white transition-colors cursor-pointer whitespace-nowrap"
          >
            অর্ডার ট্র্যাকিং
          </button>
          <span aria-hidden="true" className="text-[#55524C]">·</span>
          <button
            onClick={() => navigateTo('about')}
            className="hover:text-white transition-colors hidden sm:inline cursor-pointer whitespace-nowrap"
          >
            আমাদের সম্পর্কে
          </button>
          <span aria-hidden="true" className="text-[#55524C] hidden sm:inline">·</span>
          <button
            onClick={() => navigateTo('admin')}
            className="text-[#C5A46D] hover:text-[#DFC08A] transition-colors font-medium cursor-pointer whitespace-nowrap"
          >
            অ্যাডমিন প্যানেল
          </button>
        </div>
      </div>
    </div>
  );
};
