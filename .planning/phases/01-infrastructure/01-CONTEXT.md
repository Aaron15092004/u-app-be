# Phase 1: Infrastructure - Context

**Gathered:** 2026-05-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Scaffold toàn bộ nền tảng — mobile workspace, backend skeleton, admin scaffold, và tất cả third-party services wired up — để Phase 2 (Authentication) có thể build ngay không cần thêm setup.

**Success criteria (từ ROADMAP.md):**
1. Expo development build chạy được trên physical iOS và Android không có lỗi
2. Express API server khởi động và trả về health-check tại `/api/health`
3. MongoDB Atlas kết nối live; có thể write/read test document qua Mongoose
4. Cloudinary upload trả về public URL từ test image
5. Firebase project cấu hình xong; Expo push token đăng ký được từ device

</domain>

<decisions>
## Implementation Decisions

### Expo Mobile

- **D-01:** Expo SDK **54** (React Native 0.79, released September 2025). Không dùng SDK 53 (lỗi thời) hay SDK 55 (mới 3 tháng, ecosystem lag).
- **D-02:** EAS **Free tier** cho development — 100 builds/month, shared queue (~15-30 phút). Upgrade lên paid trước khi submit App Store.
- **D-03:** Bundle identifier: **`com.uapp.health`** (dùng cho cả iOS `bundleIdentifier` và Android `package`).
- **D-04:** Development Build từ đầu (không dùng Expo Go) vì push notifications, Google Sign In, và Apple Sign In đều cần native modules.

### Backend Hosting

- **D-05:** Backend Node.js + Express → **Render** (free tier khi dev). Cold start ~30s sau 15 phút idle là chấp nhận được trong development. Upgrade lên Render Starter ($7/mo) trước khi beta test với user thực để tránh cold start.
- **D-06:** Admin web app (React + Vite) → **Vercel** (free tier static deploy). Auto-deploy từ GitHub.

### Backend Language & Stack

- **D-07:** **TypeScript** cho cả mobile và backend — type safety end-to-end. Backend dùng `tsx` để chạy dev, compile sang JS cho production deploy trên Render. Theo khuyến nghị STACK.md (không theo .js examples trong ARCHITECTURE.md).
- **D-08:** Node.js **20 LTS** trên Render.
- **D-09:** Express **5.1.x** — native async/await error handling, không cần try/catch wrap trong route handlers.

### MongoDB Atlas

- **D-10:** Tier tối thiểu **M2** cho production ($9/mo). M0 free tier bị giới hạn 500 connections — không dùng cho production.
- **D-11:** Compound index `{ userId: 1, date: -1 }` phải được tạo trong Phase 1 trên TẤT CẢ health collections (FoodLogs, WorkoutLogs, HabitLogs, BMIHistory). Không để đến Phase 3/4 mới tạo.

### Third-Party Services (wired up trong Phase 1)

- **D-12:** **Cloudinary** — food image storage + CDN. Upload qua backend (Multer memory storage → Cloudinary SDK). Free tier: 25 credits/month đủ cho MVP.
- **D-13:** **Firebase Cloud Messaging** — push notifications qua server-side. Không dùng local scheduling cho time-sensitive reminders (OEM Android battery restriction).
- **D-14:** **LogMeal API** primary + **GPT-4o-mini Vision** fallback cho AI food recognition. Cả hai đều proxy qua backend — không bao giờ gọi từ mobile client.

### Mobile Library Choices (locked từ research)

- **D-15:** Navigation: **Expo Router v4** (file-based routing). Không dùng standalone React Navigation.
- **D-16:** State: **Zustand ~5.x** (UI/client state) + **TanStack Query v5** (server state + caching). Không dùng Redux.
- **D-17:** Local storage: **react-native-mmkv** (persisted state, fast sync) + **expo-secure-store** (JWT tokens only — Keychain/Keystore).
- **D-18:** Styling: **NativeWind v4** (Tailwind CSS for React Native). Không dùng styled-components.
- **D-19:** Google OAuth: **`@react-native-google-signin/google-signin`** (native SDK). Không dùng `expo-auth-session` — breaks trong production builds.
- **D-20:** Charts: **victory-native-xl** (Skia GPU-accelerated). Không dùng react-native-chart-kit (unmaintained).
- **D-21:** Camera/image: **expo-image-picker ~15.x** đủ cho food scan. Không cần expo-camera standalone.

### Auth & Security Rules (mandatory từ CLAUDE.md)

- **D-22:** JWT access token: 15 min, stored **in memory only** (Zustand store). Refresh token: 7 days, stored trong **expo-secure-store**, hashed trong MongoDB, rotate on use.
- **D-23:** **Apple Sign In MANDATORY** — App Store Guideline 4.8 yêu cầu khi có bất kỳ third-party OAuth nào. Implement song song với Google OAuth trong Phase 2.
- **D-24:** Image compression: **<500KB** trước khi gọi AI API. Dùng `expo-image-manipulator` với iterative compression.
- **D-25:** AI scan rate limit: **20 scans/user/day** — enforce server-side bằng user ID từ JWT (không dùng IP — carrier NAT phổ biến ở Việt Nam).

### CI/CD (Claude's discretion)

- Scope Phase 1: GitHub Actions pipeline chạy **lint + TypeScript type-check** trên mỗi push/PR. EAS build trigger: manual (không auto-build mỗi push vì Free tier 100 builds/month). Backend deploy: Render auto-deploy từ GitHub `main` branch.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Planning
- `.planning/ROADMAP.md` — Phase 1 goal, success criteria, phase dependencies
- `.planning/PROJECT.md` — Stack overview, key decisions, screen inventory, design system
- `.planning/REQUIREMENTS.md` — 62 v1 requirements với phase traceability
- `CLAUDE.md` — Critical implementation rules: image compression, AI proxy, Apple Sign In, JWT storage, rate limits

### Research Files (must read before planning)
- `.planning/research/STACK.md` — Library versions, rationale, what NOT to use
- `.planning/research/ARCHITECTURE.md` — Folder structures, API routes, DB schemas, build order, data flows
- `.planning/research/PITFALLS.md` — Critical pitfalls mapped by phase; Phase 1 pitfalls: Expo managed workflow audit, AsyncStorage vs SecureStore, MongoDB compound index strategy, Atlas M0 rejection

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Không có code hiện tại — dự án bắt đầu từ đầu (fresh scaffold)

### Established Patterns (từ research — phải implement theo)
- Expo Router file-based routing: `app/(onboarding)/`, `app/(auth)/`, `app/(tabs)/` route groups
- Backend layered architecture: `loaders/` → `api/{domain}/` (routes/controller/service) → `models/` → `middleware/` → `services/` (external integrations)
- MongoDB bucket pattern: 1 document/user/day cho health data (FoodLogs, WorkoutLogs, HabitLogs)
- API response shape chuẩn: `{ success: boolean, data: T, error?: string }`

### Integration Points (Phase 1 phải wire up)
- Mobile `app/_layout.tsx` → AuthProvider + QueryProvider + ThemeProvider
- Backend `loaders/mongoose.js` → MongoDB Atlas connection (M2, connection pool config)
- Backend `loaders/firebase.js` → Firebase Admin SDK init
- Backend `services/cloudinary.service.ts` → Cloudinary SDK config
- Backend `services/ai-food.service.ts` → LogMeal + GPT-4o-mini clients (Phase 1 config only, not implement)

</code_context>

<specifics>
## Specific Ideas

- Admin dashboard là **web app riêng biệt** (React + Vite), không phải mobile — deploy lên Vercel, dùng chung backend `/api/admin/*`
- Bundle ID `com.uapp.health` cho cả iOS và Android
- Render deployment: connect GitHub repo → auto-deploy `backend/` folder; build command `npm run build`, start command `node dist/server.js`
- EAS config: `eas.json` với 3 profiles: `development` (Dev Build), `preview` (internal distribution), `production` (store)

</specifics>

<deferred>
## Deferred Ideas

- **EAS paid tier** — defer đến trước App Store submission
- **Monorepo tooling** (npm workspaces / Turborepo) — không cần cho Phase 1; simple co-located packages với 3 separate `package.json` là đủ. Xem xét lại nếu shared types trở thành pain point
- **CI/CD EAS auto-build** — defer đến khi team có workflow ổn định; Phase 1 chỉ cần lint + type-check
- **Backend language choice** (user không muốn discuss) — đã quyết định TypeScript theo discretion của Claude/STACK.md

</deferred>

---

*Phase: 1-Infrastructure*
*Context gathered: 2026-05-17*
