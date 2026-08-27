# CrownSourceGlobal Mobile

Native iOS/Android client for the CrownSourceGlobal marketplace, built with
Expo + React Native + TypeScript.

## What this is — and isn't

This app is a **client** of the existing CrownSourceGlobal backend
(`../crownsourceglobal`). It talks to that backend exclusively over HTTPS
via `/api/v1/*`. It does not:

- connect to PostgreSQL or use Prisma,
- duplicate any backend business logic (pricing, moderation, inventory…),
- run independently of the backend — you need the backend running to use it.

The product/backend plan lives in
`../crownsourceglobal/docs/mobile/MOBILE_V1_PLAN.md`. This README only
covers running *this* repo.

**Current milestone (M19.0):** native foundation + public, unauthenticated
discovery — Home, Explore, Shop, Product Detail, Vendor storefront, plus
placeholder Source/Account tabs. No auth, cart, checkout, or payments yet.

## Prerequisites

- Node.js (matching `../crownsourceglobal`'s `>=22.12.0 <23.0.0` is fine)
- The CrownSourceGlobal backend running locally (see below)
- Expo Go (quickest) or Xcode/Android Studio for a simulator/emulator
- A phone and Mac on the **same Wi-Fi network** to test on a physical device

## 1. Run the backend

```sh
cd ../crownsourceglobal
npm run dev
```

This starts the Next.js API on `http://localhost:3000`.

## 2. Configure the API base URL

Copy `.env.example` to `.env.local` and set `EXPO_PUBLIC_API_BASE_URL`:

| Target                          | Value                            |
| -------------------------------- | --------------------------------- |
| iOS Simulator                    | `http://localhost:3000`          |
| Android Emulator                 | `http://10.0.2.2:3000`           |
| Physical phone (same Wi-Fi)      | `http://<your-Mac's-LAN-IP>:3000` |

Find your Mac's LAN IP with `ipconfig getifaddr en0` (Wi-Fi) — a physical
phone cannot reach `localhost` on your Mac, only the simulator/emulator can.

There is **no default/fallback URL** — if this isn't set, the app shows a
"Configuration required" screen instead of silently pointing at production.
Restart `npx expo start` after changing `.env.local`.

## 3. Run the app

```sh
npm install
npx expo start
```

Then press `i` (iOS Simulator), `a` (Android Emulator), or scan the QR code
with Expo Go on a physical device on the same Wi-Fi.

```sh
npm run ios       # expo start --ios
npm run android   # expo start --android
npm run web       # expo start --web
```

## Testing on your own iPhone/Android against your local backend

1. Confirm your phone and Mac are on the same Wi-Fi network.
2. Set `EXPO_PUBLIC_API_BASE_URL` in `.env.local` to your Mac's LAN IP (see
   above), not `localhost`.
3. `npm run dev` in `../crownsourceglobal` (leave it running).
4. `npx expo start` in this repo, then scan the QR code with the Expo Go
   app (or a dev client build).
5. Some networks (corporate/guest Wi-Fi, some routers) block device-to-device
   traffic — if the app can't reach the backend, try a personal hotspot or a
   home network instead.

This only ever talks to your local backend — never production — because the
API base URL is explicit local config, never a hardcoded fallback.

## Commands

| Command              | Purpose                              |
| --------------------- | ------------------------------------- |
| `npm run start`      | Start the Metro bundler / dev server |
| `npm run ios`        | Start + open iOS Simulator            |
| `npm run android`    | Start + open Android Emulator         |
| `npm run web`        | Start the web build (Metro web)       |
| `npm run typecheck`  | `tsc --noEmit`                        |
| `npm run lint`       | `expo lint`                           |

## Project structure

```text
src/
  app/                 Expo Router routes (file-based)
    (tabs)/            Home / Explore / Shop / Source / Account
    listing/[id].tsx   Product detail
    vendor/[slug].tsx  Vendor storefront
  components/
    ui/                Design-system primitives (Text, Button, ProductCard…)
    navigation/        Custom bottom tab bar
  constants/theme.ts   Design tokens (color, spacing, radius, type)
  features/            One folder per screen's data-fetching hook(s)
  lib/
    api/               Fetch client, TanStack Query client, error types
    env.ts             EXPO_PUBLIC_API_BASE_URL resolution
    format.ts          Money/availability/seller-type display formatting
  types/api.ts          Client-side DTOs mirroring the real /api/v1 contracts
```

## API base URL behavior

`EXPO_PUBLIC_API_BASE_URL` is a **public, non-secret** build-time value —
`EXPO_PUBLIC_*` variables are baked into the JS bundle and readable by
anyone with the app installed. Never put a secret in one. This app never
needs to: authentication, payments and storage all stay server-side behind
`/api/v1/*`.

## Scope of M19.0

See `../crownsourceglobal/docs/mobile/MOBILE_V1_PLAN.md` for the full
product plan. This milestone specifically delivers the native scaffold and
public discovery vertical slice — no cart, checkout, payments, phone OTP,
Vendor operational mode, or sourcing submission yet.
