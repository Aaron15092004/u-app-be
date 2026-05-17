# Phase 1: Infrastructure - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-17
**Phase:** 1-Infrastructure
**Areas discussed:** Expo SDK version, Backend hosting target

---

## Expo SDK Version

| Option | Description | Selected |
|--------|-------------|----------|
| SDK 54 | React Native 0.79, released Sep 2025. Push notifications require Dev Build (bắt buộc dù sao vì Google/Apple Sign In cũng là native modules). 8 tháng tuổi, stable. | ✓ |
| SDK 53 | Cũ hơn, community examples rộng hơn một chút, nhưng đang lỗi thời khi SDK 55 đã ra. | |

**User's choice:** SDK 54

---

## EAS Plan Tier

| Option | Description | Selected |
|--------|-------------|----------|
| EAS Free tier | 100 builds/month, shared queue (~15-30 phút), 1GB OTA bandwidth. Đủ cho development và early beta. | ✓ |
| EAS Production ($99/mo) | Priority queue (< 5 phút), unlimited builds. Chỉ cần khi release store hoặc team > 2 dev. | |

**User's choice:** EAS Free tier
**Notes:** Upgrade trước App Store submission.

---

## Bundle Identifier

| Option | Description | Selected |
|--------|-------------|----------|
| com.uapp.health | Dạng reverse-domain chuẩn, phù hợp tên app "Ủ". Dễ đăng ký Google Play + App Store. | ✓ |
| com.exe201.uapp | Bao gồm mã khóa học EXE201. Phù hợp nếu dự án nộp theo tên trường/khóa. | |

**User's choice:** com.uapp.health

---

## Backend Hosting Target

| Option | Description | Selected |
|--------|-------------|----------|
| Railway | Persistent server, $5/mo. Node.js process luôn chạy, tốt cho MongoDB + cron jobs FCM. | |
| Render | Tương tự Railway, free tier spin-down sau 15 phút (cold start ~30s). Paid $7/mo để luôn bật. | ✓ |
| Vercel (serverless) | Free tier, nhưng serverless — không phù hợp cho cron jobs, MongoDB connection pooling phức tạp. | |

**User's choice:** Render

---

## Render Tier Choice

| Option | Description | Selected |
|--------|-------------|----------|
| Free tier (cold start chấp nhận được khi dev) | Spin-down sau 15 phút, cold start ~30s. Nâng cấp trước beta. | ✓ |
| Paid plan ngay từ đầu ($7/mo) | Server luôn bật, không cold start. Nhất quán hơn khi demo. | |

**User's choice:** Free tier để dev, upgrade trước beta testing với user thực.

---

## Admin Web App Hosting

| Option | Description | Selected |
|--------|-------------|----------|
| Vercel | Free tier cho static React app. Auto-deploy từ GitHub. Lý tưởng cho React + Vite build. | ✓ |
| Render Static Sites | Free, nhưng không có lợi thế đặc biệt so với Vercel cho static app. | |

**User's choice:** Vercel

---

## Claude's Discretion

- **Backend language:** TypeScript cho cả mobile và backend (theo khuyến nghị STACK.md). User không muốn discuss, Claude quyết định dựa trên research.
- **CI/CD scope:** GitHub Actions lint + type-check trên push/PR. EAS build: manual (không auto để tiết kiệm free tier quota). User không chọn area này để discuss.
- **Monorepo tooling:** Simple co-located packages (3 separate package.json), không setup npm workspaces/Turborepo cho Phase 1.
- **Node.js version:** 20 LTS trên Render (stable, production-ready).

## Deferred Ideas

- EAS paid tier upgrade — defer đến trước App Store submission
- Monorepo tooling (npm workspaces / Turborepo) — xem xét lại nếu shared types trở thành pain point
- CI/CD auto EAS build — defer đến khi team có workflow ổn định

## Clarification During Discussion

User clarified: "phần quản lý admin không phải dạng mobile mà là dạng web (dùng react cho FE)" — Đây đã là quyết định trong PROJECT.md và ARCHITECTURE.md (admin = React web app riêng, không phải mobile). Confirmed, không có scope change.
