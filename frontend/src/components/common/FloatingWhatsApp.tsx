import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { INITIAL_FLOATING_WIDGET_CONFIG } from '../../data/seedData';
import { FloatingContactItem, FloatingContactIconType } from '../../types';
import { X, Globe } from 'lucide-react';

function normalizeContactUrl(url: string, iconType: FloatingContactIconType): string {
  const trimmed = (url || '').trim();
  if (!trimmed) return '#';

  if (iconType === 'phone') {
    return trimmed.startsWith('tel:') ? trimmed : `tel:${trimmed.replace(/\s+/g, '')}`;
  }
  if (iconType === 'email') {
    return trimmed.startsWith('mailto:') ? trimmed : `mailto:${trimmed}`;
  }
  if (iconType === 'whatsapp') {
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    const cleanNum = trimmed.replace(/[^0-9]/g, '');
    return `https://wa.me/${cleanNum}`;
  }
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('tel:') || trimmed.startsWith('mailto:')) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

function renderContactBadgeIcon(item: FloatingContactItem) {
  switch (item.iconType) {
    case 'facebook':
      return (
        <span className="w-9 h-9 rounded-full bg-[#1877F2] flex items-center justify-center shadow-[0_2px_8px_rgba(24,119,242,0.32)] group-hover:scale-105 transition-transform shrink-0">
          <svg className="w-5 h-5 text-white fill-current" viewBox="0 0 24 24">
            <path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4v-8.5z" />
          </svg>
        </span>
      );

    case 'messenger':
      return (
        <span
          style={{
            background:
              'linear-gradient(45deg, #006AFF 0%, #0099FF 45%, #A033FF 85%, #FF5280 100%)'
          }}
          className="w-9 h-9 rounded-full flex items-center justify-center shadow-[0_2px_8px_rgba(0,132,255,0.32)] group-hover:scale-105 transition-transform shrink-0"
        >
          <svg className="w-5 h-5 text-white fill-current" viewBox="0 0 24 24">
            <path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.912 1.454 5.511 3.727 7.21V22l3.405-1.869c.909.252 1.871.388 2.868.388 5.523 0 10-4.145 10-9.259C22 6.145 17.523 2 12 2zm1.008 12.463l-2.548-2.718-4.97 2.718 5.468-5.805 2.61 2.718 4.908-2.718-5.468 5.805z" />
          </svg>
        </span>
      );

    case 'whatsapp':
      return (
        <span className="w-9 h-9 rounded-full bg-[#25D366] flex items-center justify-center shadow-[0_2px_8px_rgba(37,211,102,0.32)] group-hover:scale-105 transition-transform shrink-0">
          <svg className="w-5 h-5 text-white fill-current" viewBox="0 0 24 24">
            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19.01L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.53 7.35C9.34 7.35 9.14 7.37 8.97 7.69C8.79 8 8.27 8.49 8.27 9.5C8.27 10.5 9 11.47 9.1 11.61C9.2 11.75 10.53 13.8 12.58 14.68C14.28 15.42 14.63 15.27 15 15.23C15.37 15.2 16.18 14.75 16.35 14.28C16.52 13.81 16.52 13.41 16.47 13.33C16.42 13.24 16.27 13.19 16.05 13.08C15.82 12.97 14.72 12.43 14.52 12.35C14.31 12.28 14.16 12.24 14.02 12.46C13.87 12.69 13.45 13.19 13.32 13.33C13.2 13.48 13.07 13.5 12.85 13.39C12.62 13.28 11.89 13.04 11.02 12.27C10.34 11.67 9.89 10.92 9.76 10.7C9.64 10.48 9.75 10.36 9.86 10.25C9.96 10.15 10.09 9.98 10.2 9.85C10.31 9.72 10.35 9.62 10.43 9.47C10.5 9.32 10.46 9.19 10.41 9.08C10.35 8.97 9.93 7.94 9.75 7.52C9.58 7.11 9.4 7.17 9.27 7.16C9.15 7.16 9.01 7.15 8.87 7.15L9.53 7.35Z" />
          </svg>
        </span>
      );

    case 'phone':
      return (
        <span className="w-9 h-9 rounded-full bg-[#10B981] flex items-center justify-center shadow-[0_2px_8px_rgba(16,185,129,0.32)] group-hover:scale-105 transition-transform shrink-0">
          <svg className="w-5 h-5 text-white fill-current" viewBox="0 0 24 24">
            <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
          </svg>
        </span>
      );

    case 'instagram':
      return (
        <span
          style={{
            background:
              'linear-gradient(45deg, #F58529 0%, #FEDA77 25%, #DD2A7B 50%, #8134AF 75%, #515BD4 100%)'
          }}
          className="w-9 h-9 rounded-full flex items-center justify-center shadow-[0_2px_8px_rgba(221,42,123,0.32)] group-hover:scale-105 transition-transform shrink-0"
        >
          <svg className="w-5 h-5 text-white fill-current" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
          </svg>
        </span>
      );

    case 'telegram':
      return (
        <span className="w-9 h-9 rounded-full bg-[#229ED9] flex items-center justify-center shadow-[0_2px_8px_rgba(34,158,217,0.32)] group-hover:scale-105 transition-transform shrink-0">
          <svg className="w-5 h-5 text-white fill-current" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
          </svg>
        </span>
      );

    case 'youtube':
      return (
        <span className="w-9 h-9 rounded-full bg-[#FF0000] flex items-center justify-center shadow-[0_2px_8px_rgba(255,0,0,0.32)] group-hover:scale-105 transition-transform shrink-0">
          <svg className="w-5 h-5 text-white fill-current" viewBox="0 0 24 24">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
        </span>
      );

    case 'email':
      return (
        <span className="w-9 h-9 rounded-full bg-[#EA4335] flex items-center justify-center shadow-[0_2px_8px_rgba(234,67,53,0.32)] group-hover:scale-105 transition-transform shrink-0">
          <svg className="w-5 h-5 text-white fill-current" viewBox="0 0 24 24">
            <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
          </svg>
        </span>
      );

    case 'custom':
    default:
      if (item.customIconUrl) {
        return (
          <span className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.18)] group-hover:scale-105 transition-transform shrink-0 bg-white border border-gray-100">
            <img src={item.customIconUrl} alt={item.label} className="w-full h-full object-cover" />
          </span>
        );
      }
      return (
        <span
          style={{ backgroundColor: item.iconBgColor || '#850B1B' }}
          className="w-9 h-9 rounded-full flex items-center justify-center text-white shadow-[0_2px_8px_rgba(133,11,27,0.32)] group-hover:scale-105 transition-transform shrink-0"
        >
          <Globe className="w-5 h-5 text-white" />
        </span>
      );
  }
}

export const FloatingWhatsApp: React.FC = () => {
  const { currentPage, settings } = useStore();
  const [isOpen, setIsOpen] = useState(false);

  // Position state for free dragging across the entire screen
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const buttonSize = 52;
  const dragInfoRef = useRef<{
    pointerId: number | null;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    hasMoved: boolean;
  }>({
    pointerId: null,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
    hasMoved: false
  });

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Initialize default bottom-right position and keep inside viewport on resize
  useEffect(() => {
    const getBottomOffset = () => (window.innerWidth < 768 ? 74 : 24);

    const clampPosition = (x: number, y: number) => {
      const maxX = Math.max(10, window.innerWidth - buttonSize - 10);
      const maxY = Math.max(10, window.innerHeight - buttonSize - getBottomOffset());
      return {
        x: Math.min(Math.max(10, x), maxX),
        y: Math.min(Math.max(10, y), maxY)
      };
    };

    setPosition((prev) => {
      if (!prev) {
        return clampPosition(
          window.innerWidth - buttonSize - 14,
          window.innerHeight - buttonSize - getBottomOffset()
        );
      }
      return clampPosition(prev.x, prev.y);
    });

    const handleResize = () => {
      setPosition((prev) => {
        if (!prev) {
          return clampPosition(
            window.innerWidth - buttonSize - 14,
            window.innerHeight - buttonSize - getBottomOffset()
          );
        }
        return clampPosition(prev.x, prev.y);
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close popup when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    // Only primary mouse button or touch
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    const currentX = position ? position.x : window.innerWidth - buttonSize - 14;
    const currentY = position ? position.y : window.innerHeight - buttonSize - 74;

    dragInfoRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: currentX,
      originY: currentY,
      hasMoved: false
    };

    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (dragInfoRef.current.pointerId !== e.pointerId) return;

    const dx = e.clientX - dragInfoRef.current.startX;
    const dy = e.clientY - dragInfoRef.current.startY;

    if (!dragInfoRef.current.hasMoved && Math.hypot(dx, dy) > 6) {
      dragInfoRef.current.hasMoved = true;
      setIsDragging(true);
    }

    if (dragInfoRef.current.hasMoved) {
      const maxX = Math.max(10, window.innerWidth - buttonSize - 10);
      const maxY = Math.max(10, window.innerHeight - buttonSize - 10);
      const nextX = Math.min(Math.max(10, dragInfoRef.current.originX + dx), maxX);
      const nextY = Math.min(Math.max(10, dragInfoRef.current.originY + dy), maxY);
      setPosition({ x: nextX, y: nextY });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (dragInfoRef.current.pointerId !== e.pointerId) return;

    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    const wasDragged = dragInfoRef.current.hasMoved;
    dragInfoRef.current.pointerId = null;
    dragInfoRef.current.hasMoved = false;
    setIsDragging(false);

    if (!wasDragged) {
      setIsOpen((prev) => !prev);
    }
  };

  // Don't show inside admin dashboard
  if (currentPage === 'admin') return null;

  const floatingConfig = settings.floatingWidgetConfig || INITIAL_FLOATING_WIDGET_CONFIG;
  if (floatingConfig.isEnabled === false) return null;

  const rawItems = Array.isArray(floatingConfig.items) && floatingConfig.items.length > 0
    ? floatingConfig.items
    : INITIAL_FLOATING_WIDGET_CONFIG.items;

  const activeItems = rawItems
    .filter((it) => it.isActive)
    .sort((a, b) => a.order - b.order);

  if (activeItems.length === 0) return null;

  const posX = position ? position.x : undefined;
  const posY = position ? position.y : undefined;

  // Smart menu placement so popup never clips outside viewport when dragged
  const openBelow = posY !== undefined && posY < 165;
  const alignLeft = posX !== undefined && posX < 180;

  return (
    <div
      ref={containerRef}
      style={
        posX !== undefined && posY !== undefined
          ? { left: `${posX}px`, top: `${posY}px` }
          : { right: '14px', bottom: '74px' }
      }
      className="fixed z-50 select-none touch-none"
    >
      {/* Popup Card (Dynamic Items - Exact Reference Design) */}
      {isOpen && (
        <div
          className={`absolute ${
            openBelow ? 'top-full mt-3' : 'bottom-full mb-3'
          } ${
            alignLeft ? 'left-0' : 'right-0'
          } w-[205px] bg-white rounded-[20px] shadow-[0_10px_35px_rgba(0,0,0,0.12)] border border-black/[0.06] px-4 py-1.5 animate-in fade-in zoom-in-95 duration-150`}
        >
          {activeItems.map((item, idx) => {
            const targetUrl = normalizeContactUrl(item.url, item.iconType);
            return (
              <React.Fragment key={item.id}>
                {idx > 0 && <div className="h-[1px] bg-gray-100 mx-1" />}
                <a
                  href={targetUrl}
                  target={item.iconType === 'phone' || item.iconType === 'email' ? '_self' : '_blank'}
                  rel="noopener noreferrer"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between py-2.5 px-1 rounded-xl hover:bg-gray-50/90 transition-colors cursor-pointer group"
                >
                  <span className="text-[15px] font-medium text-[#2B2B2B] group-hover:text-[#850B1B] transition-colors truncate pr-2">
                    {item.label}
                  </span>
                  {renderContactBadgeIcon(item)}
                </a>
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* Compact 3D Smooth Orange Round Button Matching Reference Image */}
      <button
        type="button"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{
          background:
            'radial-gradient(circle at 48% 20%, #FCA05E 0%, #F47119 46%, #EA5500 100%)',
          boxShadow:
            '0 5px 14px rgba(234, 85, 0, 0.34), inset 0 1.5px 2.5px rgba(255, 255, 255, 0.42), inset 0 -2px 3px rgba(175, 52, 0, 0.25)'
        }}
        className={`w-[52px] h-[52px] aspect-square rounded-full flex items-center justify-center text-white transition-transform ${
          isDragging ? 'cursor-grabbing scale-105' : 'cursor-grab hover:scale-105 active:scale-95'
        }`}
        aria-label={floatingConfig.tooltipText || 'যোগাযোগ করুন'}
        title={floatingConfig.tooltipText || 'ড্র্যাগ করে যেকোনো স্থানে সরান বা ক্লিক করে চ্যাট করুন'}
      >
        {isOpen ? (
          <X className="w-6 h-6 stroke-[2.5] text-white" />
        ) : (
          <svg
            className="w-[26px] h-[26px] text-white drop-shadow-[0_1px_1px_rgba(160,45,0,0.25)]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 4.5a7.5 7.5 0 0 0-6.48 11.27l-.92 2.86a.55.55 0 0 0 .68.68l2.86-.92A7.5 7.5 0 1 0 12 4.5Z" />
          </svg>
        )}
      </button>
    </div>
  );
};


