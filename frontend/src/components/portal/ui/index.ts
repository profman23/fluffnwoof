/**
 * Portal UI Components - Barrel Export
 */

// Core Components
export { Button } from './Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button';

export { Card, CardHeader, CardContent, CardFooter, CardSection } from './Card';
export type { CardProps, CardVariant, CardPadding } from './Card';

export { Input, Textarea } from './Input';
export type { InputProps, InputSize, TextareaProps } from './Input';

export { Badge, StatusBadge, NotificationBadge } from './Badge';
export type { BadgeProps, BadgeVariant, BadgeSize } from './Badge';

export { Avatar, AvatarGroup, PetAvatar } from './Avatar';
export type { AvatarProps, AvatarSize, AvatarShape, AvatarGroupProps, PetAvatarProps } from './Avatar';

export {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonAppointmentCard,
  SkeletonPetCard,
  SkeletonList,
} from './Skeleton';
export type { SkeletonProps } from './Skeleton';

export {
  EmptyState,
  NoPetsEmptyState,
  NoAppointmentsEmptyState,
  NoNotificationsEmptyState,
  SearchEmptyState,
  ErrorEmptyState,
} from './EmptyState';
export type { EmptyStateProps } from './EmptyState';

export { ToastProvider, useToast } from './Toast';
export type { Toast, ToastType } from './Toast';

// Modal Components
export { Modal, BottomSheet, ConfirmModal } from './Modal';
export type { ModalProps, BottomSheetProps, ConfirmModalProps } from './Modal';

// Form Components
export { Select, OptionCards } from './Select';
export type { SelectProps, SelectOption, OptionCardProps } from './Select';

export { DatePicker } from './DatePicker';
export type { DatePickerProps } from './DatePicker';

export { TimeSlotPicker, TimeSlotDisplay } from './TimeSlotPicker';
export type { TimeSlotPickerProps, TimeSlotDisplayProps } from './TimeSlotPicker';

// Loader Components
export { PortalLogoLoader } from './PortalLogoLoader';
export type { default as PortalLogoLoaderProps } from './PortalLogoLoader';
