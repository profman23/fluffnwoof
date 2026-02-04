/**
 * Notification Sound Service
 *
 * Singleton service for managing and playing pet-species-specific notification sounds.
 * Features:
 * - Audio caching for performance
 * - Preloading of common sounds
 * - Fallback chain: Species Sound → Default Sound → Web Audio API
 * - Volume and mute controls
 * - Browser autoplay policy handling
 */

import {
  getSoundForSpecies,
  getSoundPath,
  getPreloadSounds,
  getRepeatCount,
  REPEAT_DELAY_MS,
  DEFAULT_SOUND,
} from '../data/soundConfig';

// ============================================
// Types
// ============================================

type SoundLoadState = 'pending' | 'loading' | 'loaded' | 'error';

interface CachedAudio {
  audio: HTMLAudioElement;
  state: SoundLoadState;
  lastUsed: number;
}

// ============================================
// Service Class
// ============================================

class NotificationSoundService {
  private audioCache: Map<string, CachedAudio> = new Map();
  private isInitialized = false;
  private isMuted = false;
  private volume = 0.5;
  private maxCacheSize = 10;

  // ========================================
  // Initialization
  // ========================================

  /**
   * Initialize the sound service.
   * Preloads common sounds for instant playback.
   * Should be called after first user interaction (browser autoplay policy).
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await this.preloadSounds();
      this.isInitialized = true;
    } catch (error) {
      console.warn('[SoundService] Initialization failed:', error);
    }
  }

  /**
   * Preload sounds for common species to avoid playback delays.
   */
  private async preloadSounds(): Promise<void> {
    const soundsToPreload = getPreloadSounds();

    const preloadPromises = soundsToPreload.map((soundFile) =>
      this.loadSound(soundFile).catch((err) => {
        console.warn(`[SoundService] Failed to preload ${soundFile}:`, err);
        return null;
      })
    );

    await Promise.allSettled(preloadPromises);
  }

  // ========================================
  // Sound Loading
  // ========================================

  /**
   * Load a sound file and cache it.
   */
  private loadSound(soundFile: string): Promise<HTMLAudioElement> {
    const cached = this.audioCache.get(soundFile);

    // Return cached audio if already loaded
    if (cached?.state === 'loaded') {
      cached.lastUsed = Date.now();
      return Promise.resolve(cached.audio);
    }

    // Wait for existing load operation if in progress
    if (cached?.state === 'loading') {
      return new Promise((resolve, reject) => {
        cached.audio.addEventListener(
          'canplaythrough',
          () => resolve(cached.audio),
          { once: true }
        );
        cached.audio.addEventListener(
          'error',
          () => reject(new Error('Load failed')),
          { once: true }
        );
      });
    }

    // Start new load operation
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      const fullPath = getSoundPath(soundFile);

      this.audioCache.set(soundFile, {
        audio,
        state: 'loading',
        lastUsed: Date.now(),
      });

      audio.addEventListener(
        'canplaythrough',
        () => {
          const entry = this.audioCache.get(soundFile);
          if (entry) entry.state = 'loaded';
          resolve(audio);
        },
        { once: true }
      );

      audio.addEventListener(
        'error',
        () => {
          const entry = this.audioCache.get(soundFile);
          if (entry) entry.state = 'error';
          reject(new Error(`Failed to load sound: ${soundFile}`));
        },
        { once: true }
      );

      audio.preload = 'auto';
      audio.src = fullPath;
      audio.load();

      // Enforce cache size limit
      this.cleanupCache();
    });
  }

  /**
   * Remove least recently used sounds when cache is full.
   */
  private cleanupCache(): void {
    if (this.audioCache.size <= this.maxCacheSize) return;

    const entries = Array.from(this.audioCache.entries()).sort(
      (a, b) => a[1].lastUsed - b[1].lastUsed
    );

    // Keep preloaded sounds, remove oldest
    const preloadSounds = new Set(getPreloadSounds());

    for (const [key] of entries) {
      if (this.audioCache.size <= this.maxCacheSize) break;
      if (!preloadSounds.has(key)) {
        this.audioCache.delete(key);
      }
    }
  }

  // ========================================
  // Sound Playback
  // ========================================

  /**
   * Play notification sound for a specific species.
   * Supports repeating sounds based on species configuration.
   *
   * @param species - The pet species (e.g., 'DOG', 'CAT', 'BIRD')
   */
  async playForSpecies(species: string | undefined): Promise<void> {
    if (this.isMuted) return;

    const soundFile = getSoundForSpecies(species);
    const repeatCount = getRepeatCount(species);

    // Play sound with repeats
    for (let i = 0; i < repeatCount; i++) {
      await this.play(soundFile);

      // Add delay between repeats (except after the last one)
      if (i < repeatCount - 1) {
        await this.delay(REPEAT_DELAY_MS);
      }
    }
  }

  /**
   * Utility function to create a delay.
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Play a specific sound file with fallback chain.
   *
   * @param soundFile - The sound file name to play
   * @param waitForEnd - Whether to wait for the sound to finish playing
   */
  async play(soundFile: string, waitForEnd = true): Promise<void> {
    if (this.isMuted) return;

    try {
      // Ensure initialization
      if (!this.isInitialized) {
        await this.initialize();
      }

      const audio = await this.loadSound(soundFile);

      // Reset and configure audio
      audio.currentTime = 0;
      audio.volume = this.volume;

      // Play with error handling
      await audio.play();

      // Wait for audio to finish if requested
      if (waitForEnd) {
        await new Promise<void>((resolve) => {
          audio.addEventListener('ended', () => resolve(), { once: true });
        });
      }
    } catch (error) {
      console.warn(`[SoundService] Playback failed for ${soundFile}:`, error);

      // Try fallback to default sound
      if (soundFile !== DEFAULT_SOUND) {
        await this.playFallback();
      } else {
        // Last resort: Web Audio API beep
        this.playWebAudioFallback();
      }
    }
  }

  /**
   * Play the default notification sound.
   */
  async playFallback(): Promise<void> {
    try {
      const audio = await this.loadSound(DEFAULT_SOUND);
      audio.currentTime = 0;
      audio.volume = this.volume;
      await audio.play();
    } catch (error) {
      console.warn('[SoundService] Fallback failed, using Web Audio:', error);
      this.playWebAudioFallback();
    }
  }

  /**
   * Fallback to Web Audio API for a synthesized notification sound.
   * Used when audio files fail to load.
   */
  private playWebAudioFallback(): void {
    try {
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;

      if (!AudioContextClass) {
        return;
      }

      const ctx = new AudioContextClass();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Pleasant notification "ding" sound
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      oscillator.frequency.exponentialRampToValueAtTime(
        587,
        ctx.currentTime + 0.15
      ); // D5 note

      // Volume envelope
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(
        this.volume * 0.6,
        ctx.currentTime + 0.02
      );
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

      // Play sound
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.3);

      // Cleanup
      oscillator.onended = () => {
        oscillator.disconnect();
        gainNode.disconnect();
        ctx.close();
      };
    } catch (error) {
      // Silently fail - visual notification still works
    }
  }

  // ========================================
  // Settings
  // ========================================

  /**
   * Set mute state.
   */
  setMuted(muted: boolean): void {
    this.isMuted = muted;
  }

  /**
   * Get current mute state.
   */
  getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Set volume level (0.0 to 1.0).
   */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Get current volume level.
   */
  getVolume(): number {
    return this.volume;
  }

  // ========================================
  // Cleanup
  // ========================================

  /**
   * Clean up all resources.
   * Call when the service is no longer needed.
   */
  dispose(): void {
    this.audioCache.forEach(({ audio }) => {
      audio.pause();
      audio.src = '';
    });
    this.audioCache.clear();
    this.isInitialized = false;
  }
}

// ============================================
// Singleton Export
// ============================================

/** Singleton instance of the notification sound service */
export const soundService = new NotificationSoundService();

/** Export class for testing purposes */
export { NotificationSoundService };
