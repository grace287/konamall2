'use client';

import { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';

export default function FlashSaleBanner() {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(23, 59, 59, 999);
      const distance = midnight.getTime() - now.getTime();

      if (distance > 0) {
        setTimeLeft({
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (num: number) => String(num).padStart(2, '0');

  return (
    <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white">
      <div className="container mx-auto px-4 py-3 md:py-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-2 md:gap-4">
          {/* 텍스트 영역 */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Zap className="w-6 h-6 text-yellow-300 fill-yellow-300 animate-pulse" />
              <span className="text-lg md:text-xl font-bold">24시간 플래시 세일</span>
            </div>
            <span className="hidden md:inline text-white/80">
              오늘만 최대 80% 할인! 지금 바로 확인해보세요.
            </span>
          </div>

          {/* 카운트다운 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-white/80 hidden sm:inline">⏰ 남은 시간:</span>
            <div className="flex items-center gap-1">
              <span className="bg-white/20 backdrop-blur-sm text-white font-mono font-bold px-2.5 py-1.5 rounded-lg text-lg min-w-[40px] text-center">
                {formatTime(timeLeft.hours)}
              </span>
              <span className="text-xl font-bold">:</span>
              <span className="bg-white/20 backdrop-blur-sm text-white font-mono font-bold px-2.5 py-1.5 rounded-lg text-lg min-w-[40px] text-center">
                {formatTime(timeLeft.minutes)}
              </span>
              <span className="text-xl font-bold">:</span>
              <span className="bg-white/20 backdrop-blur-sm text-white font-mono font-bold px-2.5 py-1.5 rounded-lg text-lg min-w-[40px] text-center">
                {formatTime(timeLeft.seconds)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
