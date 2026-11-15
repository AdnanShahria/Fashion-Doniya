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
    <section className="relative overflow-hidden py-4 sm:py-10 bg-[#FAF6F0]">
      <div className="max-w-[1400px] mx-auto px-2.5 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="mb-4 sm:mb-8 space-y-1.5">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <span className="text-[11px] sm:text-xs font-extrabold tracking-[0.14em] uppercase text-[#8A5A10]">
              {sectionConfig.eyebrow || 'Fabric Collection'}
            </span>
            <span className="w-12 sm:w-20 h-[1.5px] bg-[#C59B48]/80 rounded-full" aria-hidden="true" />
          </div>

          <h2 className="text-[clamp(1.3rem,4.8vw,2.35rem)] font-extrabold text-[#6B0812] tracking-tight leading-snug">
            {sectionConfig.heading || 'বহর অনুযায়ী কাপড় বেছে নিন'}
          </h2>

          <p className="text-[12.5px] sm:text-base text-[#523A35] font-medium leading-relaxed max-w-2xl">
            {sectionConfig.description || 'আপনার প্রয়োজন অনুযায়ী ৩.৫ ও ২.৫ বহরের প্রিমিয়াম সিল্ক কাপড়ের কালেকশন দেখুন।'}
          </p>
        </div>

        {/* Responsive Layout: Stacked vertically on mobile (< md), 2-Column Side-by-Side on Desktop (>= md) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-6 lg:gap-8">
          {cards.map((card) => (
            <div
              key={card.widthKey}
              onClick={() => handleSelectWidth(card.widthKey)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSelectWidth(card.widthKey);
                }
              }}
              tabIndex={0}
              role="button"
              aria-label={card.badgeTitle}
              className="@container group relative rounded-[18px] sm:rounded-[24px] bg-[#FEFAF6] border border-[#DFC9AA] hover:border-[#C59B48] shadow-[0_8px_24px_-8px_rgba(107,8,18,0.12)] hover:shadow-[0_20px_42px_-12px_rgba(107,8,18,0.20)] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer overflow-hidden aspect-[1000/410] sm:aspect-[1000/358] select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A5A10] focus-visible:ring-offset-2"
            >
              {/* Actual Separate Fabric Photo Blending Naturally into the Banner */}
              <img
                src={card.fabricImage}
                alt={card.fabricAlt}
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover object-right pointer-events-none transition-transform duration-500 ease-out group-hover:scale-[1.02]"
              />

              {/* Real HTML Content Layer (Left Side) */}
              <div className="relative z-10 h-full w-[55%] pl-[4.6%] pr-1 sm:pr-2 py-[5.5%] sm:py-[6.2%] flex flex-col justify-between items-start">
                {/* 1. Crimson Pill Heading Badge with Circular Gold-Bordered Fabric Roll Icon */}
                <div className="relative flex items-center">
                  <div className="relative z-20 w-[clamp(1.9rem,8.8cqw,5.5rem)] h-[clamp(1.9rem,8.8cqw,5.5rem)] rounded-full shrink-0 shadow-[0_4px_12px_rgba(36,22,20,0.22)] ring-2 ring-[#E5C687]/70 overflow-hidden bg-[#6B0812]">
                    <img
                      src="/assets/fabric-roll-icon.png"
                      alt=""
                      aria-hidden="true"
                      className="w-full h-full object-cover block"
                    />
                  </div>

                  <div className="-ml-[clamp(0.55rem,2.4cqw,1.45rem)] pl-[clamp(0.85rem,3.8cqw,2.2rem)] pr-[clamp(0.8rem,3.4cqw,2rem)] py-[clamp(0.28rem,1.2cqw,0.78rem)] rounded-r-full bg-gradient-to-r from-[#8C0A16] via-[#750812] to-[#5E050D] border-y border-r border-[#E5C687]/35 shadow-[0_4px_14px_rgba(107,8,18,0.24)] flex items-center">
                    <h3 className="text-white font-extrabold text-[clamp(0.78rem,3.8cqw,2.25rem)] sm:text-[clamp(0.85rem,3.9cqw,2.25rem)] leading-none tracking-tight whitespace-nowrap drop-shadow-[0_1px_1px_rgba(0,0,0,0.18)]">
                      {card.badgeTitle}
                    </h3>
                  </div>
                </div>

                {/* 2. Real HTML Bengali Description */}
                <p className="pl-[0.4%] text-[#241614] font-bold text-[clamp(0.64rem,2.8cqw,1.68rem)] sm:text-[clamp(0.68rem,2.8cqw,1.68rem)] leading-[1.34] tracking-tight whitespace-nowrap">
                  <span className="block">{card.descLine1}</span>
                  <span className="block">{card.descLine2}</span>
                </p>

                {/* 3. Interactive CTA Pill */}
                <span className="inline-flex items-center justify-center gap-[clamp(0.3rem,1.2cqw,0.75rem)] px-[clamp(0.9rem,4.2cqw,2.5rem)] py-[clamp(0.32rem,1.3cqw,0.82rem)] rounded-full bg-gradient-to-b from-[#820A15] to-[#63060F] group-hover:from-[#940C18] group-hover:to-[#53050D] text-white font-bold text-[clamp(0.66rem,2.6cqw,1.5rem)] leading-none whitespace-nowrap shadow-[0_6px_16px_-2px_rgba(107,8,18,0.38),inset_0_1px_0_rgba(255,255,255,0.2)] transition-all duration-200">
                  <span>{card.ctaText}</span>
                  <span
                    aria-hidden="true"
                    className="inline-block transition-transform duration-200 ease-out group-hover:translate-x-1"
                  >
                    →
                  </span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
