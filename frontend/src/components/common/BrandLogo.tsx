import React from 'react';

interface BrandLogoProps {
  className?: string;
}

/**
 * Custom vector recreation of the Fashion Doniya BD "FD" Emblem
 * (Golden 3-point crown, golden coat hanger, classic high-contrast serif F & D,
 * flowing golden ribbon swoosh, and pleated rose-silk fabric drape)
 * harmonized with the website's brand header.
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = 'h-10 sm:h-12 w-auto',
}) => {
  return (
    <svg
      viewBox="62 13 195 206"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} shrink-0 select-none`}
      aria-label="Fashion Doniya BD Logo"
      role="img"
    >
      <defs>
        {/* Metallic Gold Gradient for Crown, Hanger & Trim */}
        <linearGradient id="fdGoldGrad" x1="64" y1="14" x2="230" y2="200" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E6B96E" />
          <stop offset="28%" stopColor="#F5D797" />
          <stop offset="55%" stopColor="#C8913B" />
          <stop offset="80%" stopColor="#DDA955" />
          <stop offset="100%" stopColor="#9E691C" />
        </linearGradient>

        {/* Bright Gold Highlight Gradient for the Flowing F Ribbon */}
        <linearGradient id="fdRibbonGrad" x1="64" y1="195" x2="160" y2="114" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#B88232" />
          <stop offset="35%" stopColor="#E5B869" />
          <stop offset="65%" stopColor="#F8DFAA" />
          <stop offset="88%" stopColor="#D19A44" />
          <stop offset="100%" stopColor="#9A661B" />
        </linearGradient>

        {/* Deep Espresso-Maroon Charcoal Gradient for F & D Letters */}
        <linearGradient id="fdLetterGrad" x1="80" y1="93" x2="250" y2="218" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1B1312" />
          <stop offset="50%" stopColor="#261715" />
          <stop offset="100%" stopColor="#140D0C" />
        </linearGradient>

        {/* Pleated Rose-Blush Silk Drape Gradients */}
        <linearGradient id="fdSilkBase" x1="215" y1="108" x2="128" y2="216" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#D9958F" />
          <stop offset="40%" stopColor="#F2C2BC" />
          <stop offset="75%" stopColor="#D48A84" />
          <stop offset="100%" stopColor="#9E524E" />
        </linearGradient>

        <linearGradient id="fdSilkFold1" x1="212" y1="115" x2="132" y2="212" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#B86B66" />
          <stop offset="45%" stopColor="#F5CAC4" />
          <stop offset="80%" stopColor="#C97B75" />
          <stop offset="100%" stopColor="#8F4340" />
        </linearGradient>

        <linearGradient id="fdSilkFold2" x1="214" y1="122" x2="152" y2="218" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#A55753" />
          <stop offset="50%" stopColor="#EBB5AF" />
          <stop offset="85%" stopColor="#B86964" />
          <stop offset="100%" stopColor="#7D3532" />
        </linearGradient>

        <linearGradient id="fdSilkFold3" x1="216" y1="130" x2="180" y2="216" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#C47873" />
          <stop offset="55%" stopColor="#F7D3CE" />
          <stop offset="100%" stopColor="#A65A56" />
        </linearGradient>
      </defs>

      {/* 1. ROYAL 3-POINT GOLDEN CROWN */}
      <g>
        {/* Crown Body */}
        <path
          d="M 150 30 L 161.5 36.5 L 170.5 20.5 L 179.5 36.5 L 191 29.5 L 185 44.5 Q 170.5 40.5 156 44.5 Z"
          fill="url(#fdGoldGrad)"
        />
        {/* Crown Pearls */}
        <circle cx="149" cy="28.5" r="3.2" fill="url(#fdGoldGrad)" />
        <circle cx="170.5" cy="17.5" r="4" fill="url(#fdGoldGrad)" />
        <circle cx="192" cy="28" r="3.2" fill="url(#fdGoldGrad)" />
      </g>

      {/* 2. GOLDEN COAT HANGER HOOK & SHOULDERS */}
      <path
        d="M 159.5 54.5 C 158.5 43.5, 181.5 42, 181.5 53.5 C 181.5 60, 173 61.5, 172.5 66.5 C 193 73.5, 221 84, 225.5 91 C 227.5 94.5, 225 99, 221.5 99.5 C 222.5 95.5, 220.5 92.5, 215.5 89.5 C 198 81.5, 180 74.5, 170.5 72 C 160.5 74.5, 137 82.5, 116.5 92 L 112.5 92 C 114 87.5, 146 74, 168 66.5 C 168 60, 176 58, 176 53 C 176 47.5, 164 47.5, 164.5 54.5 Z"
        fill="url(#fdGoldGrad)"
      />

      {/* 3. PLEATED ROSE-SILK FABRIC DRAPE (Between F & D) */}
      <g>
        {/* Base Silk Drape Shape */}
        <path
          d="M 212 106 C 209 135, 184 162, 131 186 C 121 190.5, 119.5 201, 125.5 209.5 C 131.5 216, 147 218, 165 218 C 182 217, 197 212, 204 204.5 C 216 177, 222 141, 212 106 Z"
          fill="url(#fdSilkBase)"
        />
        {/* Left Upper Pleat Fold */}
        <path
          d="M 212 106 C 208 137, 184 164, 131 187 C 122 191, 121 201, 126.5 209 C 133 215, 146 216, 156 213 C 179 186, 204 152, 212 106 Z"
          fill="url(#fdSilkFold1)"
        />
        {/* Center Deep Pleat Fold */}
        <path
          d="M 213 110 C 206 148, 184 182, 151 215 C 161 218.5, 174 218, 184 214 C 201 184, 214 148, 213 110 Z"
          fill="url(#fdSilkFold2)"
        />
        {/* Right Soft Pleat Highlight */}
        <path
          d="M 213.5 112 C 213 150, 201 184, 182 214.5 C 192 212.5, 200 208.5, 204.5 203.5 C 216 176, 221 142, 213.5 112 Z"
          fill="url(#fdSilkFold3)"
        />
        {/* Golden Trim Along the Upper-Left Edge of the Silk Drape */}
        <path
          d="M 211.5 105 C 206 136, 181 163, 129.5 186.5 C 120.5 190.5, 119.5 199.5, 122.5 206 C 121 198, 124.5 192, 133.5 188 C 185 164.5, 209.5 137.5, 214 108.5 Z"
          fill="url(#fdGoldGrad)"
        />
      </g>

      {/* 4. CLASSIC HIGH-CONTRAST SERIF LETTER "F" */}
      <path
        d="M 78 93.5 L 175.5 93.5 L 175.5 121 L 174 121 C 171 105, 163 97.5, 146 97.5 L 119 97.5 L 119 144 C 139 143, 154 134, 158.5 115 L 160 115 L 160 165.5 L 158.5 165.5 C 155 151, 142 146, 119 146.5 L 119 200 C 119 211, 124 215.5, 136 216.5 L 136 218 L 76.5 218 L 76.5 216.5 C 88.5 215.5, 94 211, 94 200 L 94 111 C 94 100, 88.5 95.5, 78 95 Z"
        fill="url(#fdLetterGrad)"
      />

      {/* 5. CLASSIC HIGH-CONTRAST SERIF LETTER "D" CRESCENT */}
      <path
        d="M 181 94 C 224 95.5, 255 122, 255 156.5 C 255 192, 222 218, 166 218 L 166 216.5 C 208 212, 229.5 188, 229.5 157 C 229.5 126, 213 101.5, 181 95.5 Z"
        fill="url(#fdLetterGrad)"
      />

      {/* 6. FLOWING GOLDEN RIBBON SWOOSH ACROSS THE "F" */}
      <path
        d="M 159.5 114.5 C 154 128, 139 134.5, 111 139 C 79.5 144, 64 160, 64 179.5 C 64 189, 68 195, 74 197.5 C 69 193.5, 67 187.5, 67.5 180.5 C 68.5 164.5, 84.5 151.5, 114.5 146 C 141.5 141, 155 132.5, 159.5 114.5 Z"
        fill="url(#fdRibbonGrad)"
      />
    </svg>
  );
};
