// ══════════════════════════════════════════════════════════════
// FluffNwoof Backend - Feature Flags Service
// Enables gradual rollout and feature toggling
// ══════════════════════════════════════════════════════════════

/**
 * Feature configuration interface
 */
interface FeatureConfig {
  /** Whether the feature is enabled at all */
  enabled: boolean;
  /** Percentage of users who should see this feature (0-100) */
  rolloutPercentage?: number;
  /** Specific user IDs that always get this feature */
  allowedUserIds?: string[];
  /** Roles that can access this feature */
  allowedRoles?: string[];
  /** Description for documentation */
  description?: string;
}

/**
 * Context for evaluating feature flags
 */
interface FeatureContext {
  userId?: string;
  userRole?: string;
  userEmail?: string;
}

/**
 * All available feature flags
 */
interface FeatureFlags {
  customerPortal: FeatureConfig;
  smsNotifications: FeatureConfig;
  whatsappIntegration: FeatureConfig;
  newDashboard: FeatureConfig;
  advancedReports: FeatureConfig;
  darkMode: FeatureConfig;
  emailNotifications: FeatureConfig;
  multiLanguage: FeatureConfig;
  appointmentReminders: FeatureConfig;
  onlineBooking: FeatureConfig;
}

/**
 * Feature Flags Service
 * Manages feature toggles and gradual rollouts
 */
class FeatureFlagService {
  private flags: FeatureFlags;

  constructor() {
    // Initialize flags from environment variables
    this.flags = {
      customerPortal: {
        enabled: this.envBool('FEATURE_CUSTOMER_PORTAL', true),
        rolloutPercentage: 100,
        description: 'Customer-facing portal for pet owners',
      },

      smsNotifications: {
        enabled: this.envBool('FEATURE_SMS', true),
        rolloutPercentage: 100,
        description: 'SMS notifications for appointments',
      },

      whatsappIntegration: {
        enabled: this.envBool('FEATURE_WHATSAPP', false),
        rolloutPercentage: 100,
        description: 'WhatsApp messaging integration',
      },

      newDashboard: {
        enabled: this.envBool('FEATURE_NEW_DASHBOARD', false),
        rolloutPercentage: this.envNumber('FEATURE_NEW_DASHBOARD_ROLLOUT', 0),
        description: 'New dashboard design (gradual rollout)',
      },

      advancedReports: {
        enabled: this.envBool('FEATURE_ADVANCED_REPORTS', true),
        allowedRoles: ['ADMIN', 'MANAGER'],
        description: 'Advanced analytics and reports',
      },

      darkMode: {
        enabled: this.envBool('FEATURE_DARK_MODE', true),
        rolloutPercentage: 100,
        description: 'Dark mode theme support',
      },

      emailNotifications: {
        enabled: this.envBool('FEATURE_EMAIL', true),
        rolloutPercentage: 100,
        description: 'Email notifications',
      },

      multiLanguage: {
        enabled: this.envBool('FEATURE_MULTI_LANGUAGE', true),
        rolloutPercentage: 100,
        description: 'Multi-language support (AR/EN)',
      },

      appointmentReminders: {
        enabled: this.envBool('FEATURE_REMINDERS', true),
        rolloutPercentage: 100,
        description: 'Automatic appointment reminders',
      },

      onlineBooking: {
        enabled: this.envBool('FEATURE_ONLINE_BOOKING', true),
        rolloutPercentage: 100,
        description: 'Online appointment booking',
      },
    };
  }

  /**
   * Check if a feature is enabled for a given context
   */
  isEnabled(
    feature: keyof FeatureFlags,
    context?: FeatureContext
  ): boolean {
    const config = this.flags[feature];

    // Feature not defined
    if (!config) {
      console.warn(`Feature flag "${feature}" not found`);
      return false;
    }

    // Feature is globally disabled
    if (!config.enabled) {
      return false;
    }

    // Check role-based access
    if (config.allowedRoles && context?.userRole) {
      if (!config.allowedRoles.includes(context.userRole)) {
        return false;
      }
    }

    // Check user-specific access (overrides rollout)
    if (config.allowedUserIds && context?.userId) {
      if (config.allowedUserIds.includes(context.userId)) {
        return true;
      }
    }

    // Check rollout percentage
    if (
      config.rolloutPercentage !== undefined &&
      config.rolloutPercentage < 100
    ) {
      if (context?.userId) {
        // Deterministic rollout based on user ID
        const hash = this.hashUserId(context.userId, feature);
        return hash < config.rolloutPercentage;
      }
      // No user context, use global percentage (random)
      return Math.random() * 100 < config.rolloutPercentage;
    }

    return true;
  }

  /**
   * Get all public feature flags (safe to send to frontend)
   */
  getPublicFlags(): Record<string, boolean> {
    return {
      customerPortal: this.flags.customerPortal.enabled,
      darkMode: this.flags.darkMode.enabled,
      multiLanguage: this.flags.multiLanguage.enabled,
      onlineBooking: this.flags.onlineBooking.enabled,
    };
  }

  /**
   * Get feature flags for a specific user
   */
  getUserFlags(context: FeatureContext): Record<string, boolean> {
    const result: Record<string, boolean> = {};

    for (const feature of Object.keys(this.flags) as (keyof FeatureFlags)[]) {
      result[feature] = this.isEnabled(feature, context);
    }

    return result;
  }

  /**
   * Get all flags configuration (admin only)
   */
  getAllFlags(): FeatureFlags {
    return { ...this.flags };
  }

  /**
   * Update a feature flag at runtime
   * Note: This only affects the current instance
   */
  updateFlag(
    feature: keyof FeatureFlags,
    updates: Partial<FeatureConfig>
  ): void {
    if (this.flags[feature]) {
      this.flags[feature] = {
        ...this.flags[feature],
        ...updates,
      };
    }
  }

  /**
   * Hash a user ID to a number between 0-99
   * Deterministic so same user always gets same result
   */
  private hashUserId(userId: string, feature: string): number {
    const combined = `${userId}:${feature}`;
    let hash = 0;

    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }

    return Math.abs(hash) % 100;
  }

  /**
   * Helper to read boolean from env
   */
  private envBool(key: string, defaultValue: boolean): boolean {
    const value = process.env[key];
    if (value === undefined) return defaultValue;
    return value.toLowerCase() === 'true';
  }

  /**
   * Helper to read number from env
   */
  private envNumber(key: string, defaultValue: number): number {
    const value = process.env[key];
    if (value === undefined) return defaultValue;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }
}

// Export singleton instance
export const featureFlagService = new FeatureFlagService();

// Export types
export type { FeatureFlags, FeatureConfig, FeatureContext };
