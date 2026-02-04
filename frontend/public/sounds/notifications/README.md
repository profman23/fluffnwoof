# Notification Sound Files

Pet-specific notification sounds for the FluffNwoof veterinary clinic system.

## Sound Files

| File | Species | Duration | Size | Source |
|------|---------|----------|------|--------|
| `dog-bark.mp3` | DOG | ~15 sec | 245 KB | Orange Free Sounds |
| `cat-meow.mp3` | CAT | ~9 sec | 146 KB | Orange Free Sounds |
| `bird-chirp.mp3` | BIRD | ~2 sec | 32 KB | Orange Free Sounds |
| `default-ding.mp3` | Default | ~4 sec | 59 KB | Orange Free Sounds |

## License

All sounds are from [Orange Free Sounds](https://orangefreesounds.com) under:
- **CC BY-NC 4.0** (Attribution-NonCommercial 4.0 International)

## Usage

These sounds are automatically played when a booking notification arrives:
- Dog booking → dog-bark.mp3
- Cat booking → cat-meow.mp3
- Bird booking → bird-chirp.mp3
- Other species → default-ding.mp3

## Fallback Behavior

If sound files fail to load, the system automatically falls back to:
1. Default notification sound (default-ding.mp3)
2. Web Audio API synthesized beep

## Credits

- Dog Bark: https://orangefreesounds.com/dog-bark-sound-effect/
- Cat Meow: https://orangefreesounds.com/cat-meow-sound-effect/
- Bird Chirp: https://orangefreesounds.com/small-bird-chirp-sound-effect/
- Notification: https://orangefreesounds.com/ding-notification-melody-sound-effect/
