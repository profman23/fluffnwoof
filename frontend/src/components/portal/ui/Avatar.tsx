/**
 * Portal Avatar Component
 * User and pet avatars with fallback initials
 */

import React from 'react';
import { motion } from 'framer-motion';
import { scaleInSimple } from '../../../styles/portal/animations';

// ============================================
// TYPES
// ============================================

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type AvatarShape = 'circle' | 'rounded';

export interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  shape?: AvatarShape;
  icon?: React.ReactNode;
  className?: string;
  animated?: boolean;
}

// ============================================
// STYLES
// ============================================

const sizeStyles: Record<AvatarSize, { container: string; text: string; icon: string }> = {
  xs: { container: 'w-6 h-6', text: 'text-xs', icon: 'w-3 h-3' },
  sm: { container: 'w-8 h-8', text: 'text-sm', icon: 'w-4 h-4' },
  md: { container: 'w-10 h-10', text: 'text-base', icon: 'w-5 h-5' },
  lg: { container: 'w-12 h-12', text: 'text-lg', icon: 'w-6 h-6' },
  xl: { container: 'w-16 h-16', text: 'text-xl', icon: 'w-8 h-8' },
  '2xl': { container: 'w-20 h-20', text: 'text-2xl', icon: 'w-10 h-10' },
};

const shapeStyles: Record<AvatarShape, string> = {
  circle: 'rounded-full',
  rounded: 'rounded-xl',
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get initials from name
 */
const getInitials = (name?: string): string => {
  if (!name) return '?';

  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

/**
 * Generate a consistent color based on name
 */
const getColorFromName = (name?: string): string => {
  if (!name) return 'bg-gray-400';

  const colors = [
    'bg-mint-400',
    'bg-pink-400',
    'bg-amber-400',
    'bg-blue-400',
    'bg-purple-400',
    'bg-emerald-400',
    'bg-rose-400',
    'bg-cyan-400',
    'bg-orange-400',
    'bg-indigo-400',
  ];

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
};

// ============================================
// COMPONENT
// ============================================

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  name,
  size = 'md',
  shape = 'circle',
  icon,
  className = '',
  animated = false,
}) => {
  const [imageError, setImageError] = React.useState(false);
  const hasImage = src && !imageError;
  const initials = getInitials(name);
  const bgColor = getColorFromName(name);

  const Component = animated ? motion.div : 'div';
  const motionProps = animated
    ? {
        initial: scaleInSimple.initial,
        animate: scaleInSimple.animate,
      }
    : {};

  return (
    <Component
      className={`
        ${sizeStyles[size].container}
        ${shapeStyles[shape]}
        flex items-center justify-center
        overflow-hidden
        flex-shrink-0
        ${hasImage ? '' : bgColor}
        ${className}
      `.replace(/\s+/g, ' ').trim()}
      {...motionProps}
    >
      {hasImage ? (
        <img
          src={src}
          alt={alt || name || 'Avatar'}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : icon ? (
        <span className={`${sizeStyles[size].icon} text-white`}>{icon}</span>
      ) : (
        <span className={`${sizeStyles[size].text} font-medium text-white`}>
          {initials}
        </span>
      )}
    </Component>
  );
};

// ============================================
// AVATAR GROUP
// ============================================

export interface AvatarGroupProps {
  children: React.ReactNode;
  max?: number;
  size?: AvatarSize;
  className?: string;
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  children,
  max = 4,
  size = 'md',
  className = '',
}) => {
  const avatars = React.Children.toArray(children);
  const displayAvatars = avatars.slice(0, max);
  const remaining = avatars.length - max;

  const overlapStyles: Record<AvatarSize, string> = {
    xs: '-ms-2',
    sm: '-ms-2.5',
    md: '-ms-3',
    lg: '-ms-4',
    xl: '-ms-5',
    '2xl': '-ms-6',
  };

  return (
    <div className={`flex items-center ${className}`}>
      {displayAvatars.map((avatar, index) => (
        <div
          key={index}
          className={`
            ${index > 0 ? overlapStyles[size] : ''}
            ring-2 ring-white dark:ring-gray-900
            rounded-full
          `}
        >
          {React.isValidElement(avatar) &&
            React.cloneElement(avatar as React.ReactElement<AvatarProps>, { size })}
        </div>
      ))}
      {remaining > 0 && (
        <div
          className={`
            ${overlapStyles[size]}
            ${sizeStyles[size].container}
            rounded-full
            ring-2 ring-white dark:ring-gray-900
            bg-gray-200 dark:bg-gray-700
            flex items-center justify-center
          `}
        >
          <span className={`${sizeStyles[size].text} text-gray-600 dark:text-gray-300 font-medium`}>
            +{remaining}
          </span>
        </div>
      )}
    </div>
  );
};

// ============================================
// PET AVATAR (With species icon)
// ============================================

// Species icons mapping
const speciesIcons: Record<string, string> = {
  DOG: '🐕',
  CAT: '🐱',
  BIRD: '🐦',
  RABBIT: '🐰',
  HAMSTER: '🐹',
  GUINEA_PIG: '🐹',
  TURTLE: '🐢',
  FISH: '🐠',
  HORSE: '🐴',
  GOAT: '🐐',
  SHEEP: '🐑',
  COW: '🐄',
  CAMEL: '🐪',
  DONKEY: '🫏',
  MONKEY: '🐵',
  FERRET: '🦦',
  HEDGEHOG: '🦔',
  SNAKE: '🐍',
  LIZARD: '🦎',
  FROG: '🐸',
  CHICKEN: '🐔',
  DUCK: '🦆',
  PIG: '🐷',
  ALPACA: '🦙',
  OTHER: '🐾',
};

export interface PetAvatarProps {
  src?: string | null;
  photoUrl?: string | null; // Alias for src
  name?: string;
  species?: string;
  size?: AvatarSize;
  className?: string;
}

export const PetAvatar: React.FC<PetAvatarProps> = ({
  src,
  photoUrl,
  name,
  species = 'OTHER',
  size = 'md',
  className = '',
}) => {
  // Use src or fallback to photoUrl
  const imageSrc = src ?? photoUrl;
  const [imageError, setImageError] = React.useState(false);
  const hasImage = imageSrc && !imageError;
  const icon = speciesIcons[species] || speciesIcons.OTHER;

  // Pet-specific background colors based on species
  const speciesColors: Record<string, string> = {
    DOG: 'bg-amber-100 dark:bg-amber-900/30',
    CAT: 'bg-orange-100 dark:bg-orange-900/30',
    BIRD: 'bg-sky-100 dark:bg-sky-900/30',
    RABBIT: 'bg-pink-100 dark:bg-pink-900/30',
    FISH: 'bg-blue-100 dark:bg-blue-900/30',
    HORSE: 'bg-amber-100 dark:bg-amber-900/30',
    OTHER: 'bg-mint-100 dark:bg-mint-900/30',
  };

  const bgColor = speciesColors[species] || speciesColors.OTHER;

  const iconSizes: Record<AvatarSize, string> = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl',
    '2xl': 'text-3xl',
  };

  return (
    <div
      className={`
        ${sizeStyles[size].container}
        rounded-xl
        flex items-center justify-center
        overflow-hidden
        flex-shrink-0
        ${hasImage ? '' : bgColor}
        ${className}
      `.replace(/\s+/g, ' ').trim()}
    >
      {hasImage ? (
        <img
          src={imageSrc!}
          alt={name || 'Pet'}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <span className={iconSizes[size]}>{icon}</span>
      )}
    </div>
  );
};

export default Avatar;
