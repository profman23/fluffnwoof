/**
 * Sound Configuration for Pet Species Notifications
 *
 * Maps pet species to their respective notification sounds.
 * Provides utilities for sound file path resolution and preloading.
 */

import { Species } from '../types';

// ============================================
// Constants
// ============================================

/** Base path for notification sound files (relative to public folder) */
export const SOUND_BASE_PATH = '/sounds/notifications/';

/** Default notification sound for unmapped species */
export const DEFAULT_SOUND = 'default-ding.mp3';

// ============================================
// Species to Sound Mapping
// ============================================

/**
 * Maps pet species to their notification sound files.
 * Species not in this map will use the default sound.
 */
export const SPECIES_SOUNDS: Record<string, string> = {
  [Species.DOG]: 'dog-bark.mp3',
  [Species.CAT]: 'cat-meow.mp3',
  [Species.BIRD]: 'bird-chirp.mp3',
};

/**
 * Maps pet species to the number of times their sound should repeat.
 * Species not in this map will play once.
 */
export const SPECIES_REPEAT_COUNT: Record<string, number> = {
  [Species.CAT]: 3,
  [Species.BIRD]: 3,
};

/** Delay between sound repetitions in milliseconds */
export const REPEAT_DELAY_MS = 400;

/**
 * Species that should be preloaded on initialization.
 * These are the most common pet types seen in veterinary clinics.
 */
export const PRELOAD_SPECIES: Species[] = [Species.DOG, Species.CAT, Species.BIRD];

// ============================================
// Utility Functions
// ============================================

/**
 * Get the sound file name for a given species.
 * Returns the default sound if species is not mapped.
 *
 * @param species - The pet species (e.g., 'DOG', 'CAT', 'BIRD')
 * @returns The sound file name (e.g., 'dog-bark.mp3')
 */
export const getSoundForSpecies = (species: string | undefined): string => {
  if (!species) return DEFAULT_SOUND;
  return SPECIES_SOUNDS[species] || DEFAULT_SOUND;
};

/**
 * Get the full path for a sound file.
 *
 * @param soundFile - The sound file name
 * @returns The full path (e.g., '/sounds/notifications/dog-bark.mp3')
 */
export const getSoundPath = (soundFile: string): string => {
  return `${SOUND_BASE_PATH}${soundFile}`;
};

/**
 * Get all sound files that should be preloaded.
 * Includes the default sound and all species-specific sounds.
 *
 * @returns Array of sound file names to preload
 */
export const getPreloadSounds = (): string[] => {
  const speciesSounds = PRELOAD_SPECIES.map(
    (species) => SPECIES_SOUNDS[species]
  ).filter(Boolean);

  return [DEFAULT_SOUND, ...speciesSounds];
};

/**
 * Check if a species has a custom sound.
 *
 * @param species - The pet species to check
 * @returns True if the species has a custom sound
 */
export const hasCustomSound = (species: string): boolean => {
  return species in SPECIES_SOUNDS;
};

/**
 * Get the number of times a species sound should repeat.
 *
 * @param species - The pet species
 * @returns The repeat count (default: 1)
 */
export const getRepeatCount = (species: string | undefined): number => {
  if (!species) return 1;
  return SPECIES_REPEAT_COUNT[species] || 1;
};
