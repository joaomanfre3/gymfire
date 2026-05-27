# GymFire

**A social fitness network built as a native mobile app with Expo and React Native.**

![Expo](https://img.shields.io/badge/Expo-54-000020?style=flat-square&logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)

GymFire combines workout tracking, a social feed, ephemeral camera drops, group communities, and an AI chat assistant into a single dark-themed mobile experience. Backend lives at `gymfire.vercel.app`.

---

## Features

- **Social Feed** — post workouts, photos, and text updates with likes, comments, and @mentions
- **Workout Tracker** — log exercises, sets, and reps with a dedicated recording flow
- **Camera Drops** — capture and edit gym moments with a built-in camera and image cropper
- **Groups** — create or join fitness communities
- **AI Chat** — conversational assistant for training guidance
- **Notifications** — real-time activity feed for social interactions
- **Google OAuth** — one-tap sign-in, zero friction

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Expo 54 (Managed + Dev Client) |
| UI | React Native 0.81 + React 19, New Architecture enabled |
| Language | TypeScript (strict) |
| Navigation | React Navigation 7 (native stack + bottom tabs) |
| State | Zustand 5 |
| Animations | React Native Reanimated 4 |
| Sheets | @gorhom/bottom-sheet |
| Camera | expo-camera + expo-image-picker + expo-media-library |
| HTTP | Axios |
| Auth | expo-auth-session (Google OAuth) |
| Build/CI | EAS Build (APK distribution) |
| Theme | Dark (#0A0A0F) |

## Key Technical Decisions

- **Expo over bare React Native** — EAS Build handles native compilation in the cloud, eliminating local Android SDK/Xcode maintenance and cutting iteration cycles from hours to minutes.
- **Zustand over Redux** — two lean stores (`authStore`, `dropsStore`) plus co-located screen-level stores. No boilerplate, no providers, no middleware ceremony.
- **EAS Build for CI/CD** — development, preview, and production profiles all output APKs for internal distribution. One `eas build` command, done.
- **Reanimated for 60fps animations** — gesture-driven sheets, feed transitions, and camera UI all run on the native thread. No JS bridge bottleneck.
- **Google OAuth for onboarding** — `expo-auth-session` + `expo-web-browser` handles the full OAuth flow without native module ejection.

## Project Structure

```
mobile/
├── src/
│   ├── api/            # Axios client and endpoint wrappers
│   ├── components/     # Shared UI (Post, Drops editor, Cropper, Mentions, workout)
│   ├── hooks/          # Custom hooks
│   ├── lib/            # Utilities
│   ├── navigation/     # Stack and tab navigators
│   ├── screens/        # Feature screens (Feed, Workout, Drops, Groups, AI, Chat, ...)
│   ├── stores/         # Zustand stores (auth, drops)
│   ├── theme/          # Colors, spacing, typography tokens
│   └── types/          # Shared TypeScript types
├── app.json            # Expo config
├── eas.json            # EAS Build profiles
└── package.json
```

---

Built by [@joaomanfre3](https://github.com/joaomanfre3).
