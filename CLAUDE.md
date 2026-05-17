# Ủ App — Claude Code Instructions

## Project Overview

**Ủ** là ứng dụng quản lý sức khỏe toàn diện cho thị trường Việt Nam.

- **Mobile**: React Native (Expo SDK 53/54) — iOS + Android
- **Backend**: Node.js + Express 5 + MongoDB Atlas
- **AI**: LogMeal API + GPT-4o-mini fallback (food recognition)
- **Auth**: JWT + Google OAuth + Apple Sign In

## GSD Workflow

Dự án này sử dụng GSD (Get Shit Done) workflow. **Không thực thi code nếu chưa có PLAN.md cho phase đó.**

### Workflow sequence:
```
/gsd:discuss-phase N  →  /gsd:plan-phase N  →  /gsd:execute-phase N  →  /gsd:verify-work N
```

### Current state:
- Planning: `.planning/ROADMAP.md`
- Requirements: `.planning/REQUIREMENTS.md`
- State: `.planning/STATE.md`

### Next step:
```
/clear
/gsd:discuss-phase 1
```

## Architecture Decisions

### Mobile (React Native)
- **Navigation**: Expo Router (file-based) — không dùng standalone React Navigation
- **State**: Zustand (UI state) + TanStack Query v5 (server state) — không dùng Redux
- **Storage**: react-native-mmkv (local) + expo-secure-store (auth tokens)
- **Styling**: NativeWind v4

### Backend (Node.js)
- **Framework**: Express 5.1
- **ODM**: Mongoose 8.x
- **Validation**: Zod v3
- **Auth**: jsonwebtoken + passport (Google + Apple strategies)

### Database (MongoDB Atlas)
- Bucket pattern: 1 document per user per day
- Required compound index: `{ userId: 1, date: -1 }` trên tất cả health collections
- Minimum production tier: M2 (không dùng M0 cho production)

## Critical Rules

1. **Compress images** trước khi gọi AI API (target <500KB) — không bao giờ gửi raw camera photo
2. **AI APIs phải proxy qua backend** — không bao giờ gọi từ mobile client
3. **Apple Sign In bắt buộc** khi có bất kỳ OAuth nào (App Store requirement)
4. **Rate limit AI scans**: 20 scans/user/ngày
5. **JWT refresh token** phải được lưu trong expo-secure-store, không AsyncStorage

## Project Structure (Target)

```
u-exe201-trang/
├── mobile/          # React Native (Expo)
├── backend/         # Node.js + Express
├── admin/           # React web admin dashboard
├── figma-mockup/    # UI reference (source of truth)
└── .planning/       # GSD planning artifacts
```

## Design System (từ Figma)

- **Primary**: Green (~#4CAF50) — navigation, buttons, progress
- **Accent**: Orange — workout screens (timer, completion)
- **Typography**: Clean sans-serif, tiếng Việt
- **Logo**: "Ủ" plant-inspired
- **Language**: 100% Vietnamese
