import React from 'react';

interface LogoLoaderProps {
  animation?: 'pulse' | 'bounce' | 'spin' | 'fade';
  text?: string;
  fullScreen?: boolean;
}

// حجم موحد للوجو في جميع الشاشات - أكبر للحصول على تجربة أفضل
const LOGO_SIZE = 'w-40 h-40'; // 160x160px

const animationMap = {
  pulse: 'animate-logo-pulse',
  bounce: 'animate-logo-bounce',
  spin: 'animate-spin',
  fade: 'animate-logo-fade',
};

export const LogoLoader: React.FC<LogoLoaderProps> = ({
  animation = 'pulse',
  text,
  fullScreen = false,
}) => {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <img
        src="/logo.png"
        alt="Loading..."
        className={`${LOGO_SIZE} ${animationMap[animation]} object-contain`}
      />
      {text && (
        <p className="text-brand-dark font-normal text-base animate-pulse">
          {text}
        </p>
      )}
    </div>
  );

  // دائماً نستخدم fixed position لضمان نفس الموضع في جميع الشاشات
  // الفرق بين fullScreen والعادي هو الخلفية فقط
  // z-20 لتكون تحت الـ Sidebar (z-30) وفوق المحتوى العادي
  return (
    <div className={`fixed inset-0 flex items-center justify-center z-20 ${fullScreen ? 'bg-brand-white' : 'bg-transparent pointer-events-none'}`}>
      {content}
    </div>
  );
};
