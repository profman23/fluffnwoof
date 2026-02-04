import { useTranslation } from 'react-i18next';

interface ReadOnlyBadgeProps {
  /** Use compact size for space-constrained layouts like FlowBoard */
  compact?: boolean;
  /** Custom translation key (defaults to 'readOnly' from common namespace) */
  translationKey?: string;
  /** Translation namespace (defaults to 'common') */
  namespace?: string;
}

/**
 * Unified Read-Only badge component for consistent styling across all pages.
 * Uses amber color scheme with rounded-full design.
 */
export const ReadOnlyBadge: React.FC<ReadOnlyBadgeProps> = ({
  compact = false,
  translationKey = 'readOnly',
  namespace = 'common',
}) => {
  const { t } = useTranslation(namespace);

  if (compact) {
    return (
      <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
        {t(translationKey)}
      </span>
    );
  }

  return (
    <span className="inline-block px-3 py-1 text-sm bg-amber-100 text-amber-700 rounded-full">
      {t(translationKey)}
    </span>
  );
};
