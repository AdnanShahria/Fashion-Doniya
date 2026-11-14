import React from 'react';
import { useStore } from '../../context/StoreContext';
import { INITIAL_FABRIC_WIDTH_CARDS, INITIAL_HOMEPAGE_CONFIG } from '../../data/seedData';
import { FabricWidthCardConfig } from '../../types';

export const FabricWidthCategorySection: React.FC = () => {
  const { settings, navigateTo } = useStore();

  const handleSelectWidth = (width: '3.5' | '2.5') => {
    navigateTo('fabric-width', { width });
  };

  const hpConfig = settings.homepageConfig || INITIAL_HOMEPAGE_CONFIG;
  const sectionConfig = (hpConfig.sections || []).find((s) => s.id === 'fabric_width') || {
    eyebrow: 'Fabric Collection',
    heading: 'বহর অনুযায়ী কাপড় বেছে নিন',
    description: 'আপনার প্রয়োজন অনুযায়ী ৩.৫ ও ২.৫ বহরের প্রিমিয়াম সিল্ক কাপড়ের কালেকশন দেখুন।',
  };

  const cards: FabricWidthCardConfig[] =
    Array.isArray(hpConfig.fabricWidthCards) && hpConfig.fabricWidthCards.length > 0
      ? hpConfig.fabricWidthCards
      : INITIAL_FABRIC_WIDTH_CARDS;

  return (
    <section className="relative overflow-hidden py-3.5 sm:py-12 bg-[#FAF6F0] sm:bg-white">
      <div className="max-w-[1400px] mx-auto px-2.5 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="mb-3 sm:mb-8">
          <div className="flex items-center gap-2.5 sm:gap-4 mb-1 sm:mb-2">
            <span className="text-xs sm:text-[18px] font-bold text-[#B30C15] tracking-tight">
              {sectionConfig.eyebrow || 'Fabric Collection'}
            </span>
            <div className="w-20 sm:w-44 h-[1.5px] bg-gradient-to-r from-[#B30C15]/80 to-transparent" />
          </div>

          <h2 className="text-[clamp(1.35rem,5.2vw,2.75rem)] font-extrabold text-[#9E0B14] tracking-tight leading-tight">
            {sectionConfig.heading || 'বহর অনুযায়ী কাপড় বেছে নিন'}
          </h2>

          <p className="mt-1 sm:mt-2.5 text-[clamp(0.75rem,2.8vw,1.15rem)] text-[#1E1E1E] font-medium leading-snug sm:leading-relaxed">
            {sectionConfig.description || 'আপনার প্রয়োজন অনুযায়ী ৩.৫ ও ২.৫ বহরের প্রিমিয়াম সিল্ক কাপড়ের কালেকশন দেখুন।'}
          </p>

          <div className="mt-2 sm:mt-4 w-14 sm:w-28 h-[3.5px] sm:h-[5px] rounded-full bg-[#B30C15]" />
        </div>

        {/* Responsive Layout: Stacked vertically on mobile (< md), 2-Column Side-by-Side on Desktop (>= md) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-6 lg:gap-8">
          {cards.map((card) => (
            <div
              key={card.widthKey}
              onClick={() => handleSelectWidth(card.widthKey)}
              role="region"
              aria-label={card.badgeTitle}
              className="@container group relative rounded-[16px] sm:rounded-[24px] lg:rounded-[26px] bg-[#FEFAF6] border border-[#E5D0B1]/85 shadow-[0_6px_20px_-6px_rgba(120,20,20,0.12)] sm:shadow-[0_10px_28px_-8px_rgba(120,20,20,0.12)] hover:shadow-[0_16px_36px_-8px_rgba(120,20,20,0.18)] transition-all duration-300 cursor-pointer overflow-hidden aspect-[1000/410] sm:aspect-[1000/358] select-none"
            >
              {/* Actual Separate Fabric Photo Blending Naturally into the Banner */}
              <img
                src={card.fabricImage}
                alt={card.fabricAlt}
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover object-right pointer-events-none transition-transform duration-500 ease-out group-hover:scale-[1.015]"
              />

              {/* Real HTML Content Layer (Left Side) */}
              <div className="relative z-10 h-full w-[54%] pl-[4.6%] pr-1 sm:pr-2 py-[5.5%] sm:py-[6.2%] flex flex-col justify-between items-start">
                {/* 1. Red Pill Heading Badge with Circular Gold-Bordered Fabric Roll Icon */}
                <div className="relative flex items-center">
                  {/* Circular Gold-Bordered Fabric Roll Icon */}
                  <div className="relative z-20 w-[clamp(1.9rem,8.8cqw,5.75rem)] h-[clamp(1.9rem,8.8cqw,5.75rem)] rounded-full shrink-0 shadow-[0_3px_8px_rgba(0,0,0,0.18)] sm:shadow-[0_4px_10px_rgba(0,0,0,0.18)] overflow-hidden bg-[#B8050C]">
                    <img
                      src="/assets/fabric-roll-icon.png"
                      alt=""
                      aria-hidden="true"
                      className="w-full h-full object-cover block"
                    />
                  </div>

                  {/* Red Pill Heading Container */}
                  <div className="-ml-[clamp(0.55rem,2.4cqw,1.5rem)] pl-[clamp(0.85rem,3.8cqw,2.3rem)] pr-[clamp(0.8rem,3.4cqw,2.1rem)] py-[clamp(0.25rem,1.2cqw,0.8rem)] rounded-r-full bg-gradient-to-r from-[#C3060E] via-[#B4040C] to-[#9E0309] shadow-[0_3px_10px_rgba(155,4,10,0.22)] sm:shadow-[0_4px_12px_rgba(155,4,10,0.22)] flex items-center">
                    <h3 className="text-white font-extrabold text-[clamp(0.78rem,3.8cqw,2.35rem)] sm:text-[clamp(0.85rem,3.9cqw,2.35rem)] leading-none tracking-tight whitespace-nowrap drop-shadow-[0_1px_1px_rgba(0,0,0,0.15)]">
                      {card.badgeTitle}
                    </h3>
                  </div>
                </div>

                {/* 2. Real HTML Bengali Description */}
                <p className="pl-[0.4%] text-[#141414] font-bold text-[clamp(0.6rem,2.8cqw,1.72rem)] sm:text-[clamp(0.66rem,2.85cqw,1.72rem)] leading-[1.32] tracking-tight whitespace-nowrap">
                  <span className="block">{card.descLine1}</span>
                  <span className="block">{card.descLine2}</span>
                </p>

                {/* 3. Real Interactive HTML Button ("কাপড় দেখুন →") */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectWidth(card.widthKey);
                  }}
                  className="group/btn relative inline-flex items-center justify-center gap-[clamp(0.3rem,1.2cqw,0.75rem)] px-[clamp(0.85rem,4.2cqw,2.7rem)] py-[clamp(0.28rem,1.3cqw,0.85rem)] rounded-full bg-gradient-to-r from-[#BE0710] via-[#A3050C] to-[#870207] hover:from-[#D40913] hover:via-[#B8060E] hover:to-[#9A0309] text-white font-bold text-[clamp(0.62rem,2.65cqw,1.62rem)] leading-none whitespace-nowrap shadow-[0_4px_10px_-1px_rgba(145,4,10,0.35)] sm:shadow-[0_5px_14px_-2px_rgba(145,4,10,0.38)] hover:shadow-[0_8px_20px_-2px_rgba(165,6,12,0.52)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.96] transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B30C15] focus-visible:ring-offset-2"
                >
                  <span>{card.ctaText}</span>
                  <span
                    aria-hidden="true"
                    className="inline-block transition-transform duration-200 ease-out group-hover/btn:translate-x-1"
                  >
                    →
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
