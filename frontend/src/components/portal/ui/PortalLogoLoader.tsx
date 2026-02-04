/**
 * Portal Logo Loader Component
 * Centered logo with pulse animation for loading states
 */

import React from 'react';

interface PortalLogoLoaderProps {
  /** Show text below the logo */
  text?: string;
  /** Full screen overlay or inline centered */
  fullScreen?: boolean;
  /** Size of the logo */
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'w-20 h-20',
  md: 'w-28 h-28',
  lg: 'w-40 h-40',
};

export const PortalLogoLoader: React.FC<PortalLogoLoaderProps> = ({
  text,
  fullScreen = true,
  size = 'lg',
}) => {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <img
        src="/logo.png"
        alt="Loading..."
        className={`${sizeMap[size]} animate-logo-pulse object-contain`}
      />
      {text && (
        <p className="text-gray-600 dark:text-gray-400 font-medium text-base animate-pulse">
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 bg-gray-50 dark:bg-gray-950">
        {content}
      </div>
    );
  }

  // Inline centered loader
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      {content}
    </div>
  );
};

export default PortalLogoLoader;
