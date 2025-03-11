/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' }
        },
        glow: {
          // 🎯 調整透明度和縮放強度
          '0%': { opacity: 1, transform: 'scale(1)' },          // 最亮 & 正常大小
          '50%': { opacity: 0.75, transform: 'scale(0.98)' },   // 稍微暗一點 & 縮小一點
          '100%': { opacity: 1, transform: 'scale(1)' }        // 回到正常
        },
        progressFlow: {
          // 🎯 調整進度條流動效果
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '100% 50%' }
        }
      },
      animation: {
        shimmer: 'shimmer 3s linear infinite',
        glow: 'glow 2s ease-in-out infinite', // 可以調整時間讓節奏更緩慢
        progressFlow: 'progressFlow 3s linear infinite' // 調整時間讓流動更平滑
      },
      backgroundImage: {
        // 🎯 調整漸層顏色的透明度，讓閃動效果更柔和
        'progress-gradient': 'linear-gradient(90deg, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 75%)',
      }
    },
  },
  plugins: [],
}