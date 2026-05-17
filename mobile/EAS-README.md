# EAS Build Guide

## Build Commands

Development build (physical device):
- iOS: `eas build --profile development --platform ios`
- Android: `eas build --profile development --platform android`

Preview build (internal testing):
- `eas build --profile preview --platform all`

Production build (App Store / Play Store):
- `eas build --profile production --platform all`

## First-Time Setup

1. `eas init` — links to your EAS project and sets the projectId in app.json
2. `eas credentials` — configure iOS signing and Android keystore

## EAS Free Tier

- 100 builds/month (shared queue, ~15-30 min wait)
- Upgrade to paid before App Store submission
