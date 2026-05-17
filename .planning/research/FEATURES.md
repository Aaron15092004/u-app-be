# Features Research — Health & Wellness App (Ủ)

**Domain:** Comprehensive health management mobile app — Vietnamese market
**Researched:** 2026-05-17
**Confidence:** MEDIUM-HIGH (ecosystem well-documented; Vietnamese-specific data thinner)

---

## Table Stakes (Must Have v1)

These are features users expect in ANY health app. Absence causes immediate churn.
Users discover the gap within the first week and uninstall.

### Nutrition / Food Tracking

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Manual food search and log | Core loop of every nutrition app | Low | Needs Vietnamese food database |
| Calorie display per meal and daily total | Users orient all decisions around this number | Low | Display kcal prominently |
| Macro breakdown (protein / carbs / fat) | Power users check this every session | Low | Even casual users glance at protein |
| Barcode scan for packaged food | Saves 2–3 minutes per logged item; users expect it | Medium | Vietnamese product barcodes in scope |
| AI photo scan for food recognition | Now expected as of 2024–25; Cal AI, MyFitnessPal all have it | High | Core differentiator AND table stakes — gap closes fast |
| Meal history / recent foods | Eliminates re-logging identical meals | Low | Top 10 recent foods covers 80% of use |
| Daily food diary (breakfast / lunch / dinner / snack) | Universal structural pattern users navigate by | Low | Standard 4-slot structure |
| Water intake tracking | Present in every competitor; users notice absence | Low | Simple counter, not high-effort |

### Workout / Exercise Tracking

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Exercise log (type, duration, sets/reps or cardio time) | Core promise of any fitness feature | Low–Medium | Need Vietnamese exercise name localisation |
| Pre-built exercise library | Users cannot free-form name 200 exercises correctly | Medium | 100 common exercises covers 90% of users |
| Calorie burn estimate per session | Users compare intake vs. burn; critical to close the loop | Low | Use MET-based formula, display on dashboard |
| Workout history | Seeing progress over time is the primary motivation | Low | Simple list view |
| Rest timer | Every gym tracker includes this; its absence breaks flow | Low | Configurable 30s–5min, auto-start after set |

### BMI / Body Tracking

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Weight log with trend chart | Primary metric most users care about | Low | Smooth graph, not raw table |
| BMI calculation and category display | Users specifically want to know their BMI category | Low | Use WHO Asian cutoffs (see Vietnamese specifics below) |
| Goal weight / target setting | Users need a destination to orientate progress | Low | Drive onboarding, surface daily |
| Body measurements log (waist, hips, chest) | Optional but expected to exist | Low | 6–8 standard measurements |

### Habit Tracking

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Custom habit creation | Users want to define their own habits | Low | Name, frequency, category |
| Daily check-in / completion toggle | One-tap completion is the entire UX | Low | Make this frictionless |
| Streak counter | Universally expected; drives 40–60% higher DAU | Low | Display prominently |
| Streak freeze / grace day | Prevents streak-break abandonment; best-practice from Duolingo | Low | 1–2 freezes per week max |
| Weekly summary view | Gives users a sense of the arc, not just the day | Low | Simple calendar heatmap |

### Core UX / Infrastructure

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Onboarding with goal-setting | Users need personalised first-run to stay | Medium | Ask: goal, current weight, diet style |
| Dashboard home screen with today's summary | Users open the app to see where they stand | Medium | Calories in/out, habit ring, active challenge |
| Push notifications for reminders | Without nudges, users forget to log | Low | Meal log reminders, habit check-ins |
| Offline-first functionality | Vietnamese mobile connections are variable | Medium | Log food and workouts without internet; sync later |
| Vietnamese language UI (full, not partial) | Vietnamese users will not accept pidgin translation | Medium | All strings, food names, exercise names in Vietnamese |
| Dark mode | Standard iOS/Android expectation since 2020 | Low | System-level dark mode support |

---

## Differentiators (Competitive Edge)

Features that make Ủ stand out. Not every competitor has them;
or competitors do them generically while Ủ does them specifically for Vietnamese users.

### Vietnamese Food Intelligence (Primary Differentiator)

**This is the single biggest opportunity.** MyFitnessPal, Lifesum, and Noom have terrible Vietnamese food coverage. HealthifyMe's SEA expansion focused on Singapore and Malaysia. The Vietnamese market is underserved by local food data.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Curated Vietnamese food database | 500+ Vietnamese dishes with verified nutritional data | High | Manual curation + dietitian sign-off; pho, bun cha, com tam, banh mi, etc. |
| Regional food variants (Hanoi vs. Saigon vs. Hue) | North/South Vietnamese cuisine differs meaningfully | Medium | Same dish name, different calorie profile |
| Street food / vendor meal logging | Most Vietnamese meals come from street stalls, not packaged products | High | No barcode; AI photo scan is critical path for this use case |
| Vietnamese AI photo scan training | Global AI models (Cal AI, etc.) perform poorly on Vietnamese food | Very High | Requires proprietary training data on Vietnamese dishes |
| Fish sauce / nuoc cham / herb portion tracking | Condiments are calorie-significant in Vietnamese cooking and ignored by global apps | Medium | Common add-ons database |

### Culturally-Adapted Wellness

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Asian BMI cutoffs (23/27.5) | WHO recommends lower obesity thresholds for Asians; global apps use Western BMI | Low | Display both WHO-universal and WHO-Asian cutoffs with explanation |
| Vietnamese dietary patterns as goals | "Ăn chay" (vegetarian), Buddhist fasting schedules, Tết eating habits | Medium | Pre-built diet templates for Vietnamese lifestyles |
| Traditional medicine food tags (mát / nóng) | Vietnamese users think about foods in terms of "cooling" and "heating" properties | Medium | Controversial but culturally resonant; label as folk wisdom, not medical advice |
| Lunar calendar integration for fasting habits | Many Vietnamese fast on the 1st and 15th of the lunar month | Low | Overlay lunar dates on habit tracker |

### Engagement & Retention

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Weekly insight summary ("your top protein day was Tuesday") | Noom does this for behaviour; nobody does it well for Vietnamese food | Medium | Scheduled push notification, simple ML on logged data |
| Progress photos with side-by-side comparison | Underused feature in competitors; high emotional value for users | Medium | Privacy-first; local storage only, never uploaded by default |
| Milestone badges (Vietnamese-themed) | Generic global badges feel impersonal | Low | Design 20–30 culturally resonant badges (Rồng, Phượng, etc.) |
| Partner / buddy accountability | Vietnamese social fabric is community-oriented; pair users with a friend or partner | Medium | Share daily summary only, not detailed food diary |

---

## Anti-Features (Deliberately Avoid)

Build none of these in v1. Several should never be built.

### Complexity Traps

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Social feed / activity stream | MyFitnessPal has it; users barely use it; high moderation cost | Light partner accountability only (2-person pair) |
| Full recipe builder with ingredient parser | Enormous scope; most users eat out or cook simple dishes | Allow free-text meal with manual calorie entry as escape hatch |
| Integrated e-commerce / meal kit ordering | Scope creep; distraction from core health mission | Log meals, do not sell them |
| In-app AI chat coach (v1) | LLM costs are high; quality is hard to control; sets wrong expectations | Surface data insights passively, not conversationally |
| Calorie burn from wearables as authoritative | Wearable calorie data has 20–40% error; displaying it as fact causes frustration | Show as estimate with visible disclaimer |
| Micronutrient tracking (vitamins, minerals) | Database coverage is poor for Vietnamese food; creates false precision | Track macros only; flag when micronutrient data is available |
| Menstrual / hormone cycle tracking | Scope beyond this app's identity; dedicated apps do it better | Recommend integration or referral |

### Dark Patterns (Never Build)

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| False urgency on subscription screens | Research shows 75% of health apps use this; it drives churn and distrust | Honest pricing; no countdown timers on paywall |
| Hiding the free-cancel button | Standard in many apps; destroys NPS | Surface cancel easily; retain users with value, not friction |
| Guilt-shaming language when users miss goals | "You missed 3 days — your streak is dead!" framing | Neutral language; "pick up where you left off" |
| Daily calorie target below 1200 kcal | Medically unsafe; legal liability in some jurisdictions | Floor any auto-generated target at 1200 kcal; show a health warning |
| Requiring account before showing any value | Kills conversion at onboarding; users leave before they see the product | Guest mode: let users log 3 meals before account creation prompt |

---

## Vietnamese / SEA Market Specifics

### Food Database Requirements

Vietnamese cuisine is dominated by restaurant, street-stall, and home-cooked meals — not packaged products with barcodes. This fundamentally changes the data strategy:

- **Packaged food barcodes:** Lower proportion of daily meals than Western markets. Barcode scan is still needed but not the primary logging method.
- **Street food dominance:** Pho, bun cha, bun bo Hue, com tam, banh mi, hu tieu — these have no barcodes. AI photo scan or manual search are the only viable logging paths.
- **Nutritional data availability:** Sparse and inconsistent. USDA FoodData Central has minimal Vietnamese entries. Manual curation with registered Vietnamese dietitians is required. Plan for 500–800 dishes at launch, growing to 2,000+ over 12 months.
- **Regional variation:** A bowl of pho in Hanoi has a different profile from one in Ho Chi Minh City. Flag dishes as North/South/Central where the difference is calorie-significant (>15%).
- **Condiment complexity:** Nuoc cham dipping sauce, ginger-fish sauce, hoisin — these are often shared portions, making per-person tracking genuinely hard. Provide sensible default portions.

### Anthropometric / Health Reference Points

- Vietnamese users are shorter and lighter on average than Western populations.
- Standard BMI cutoffs (overweight = 25, obese = 30) underestimate metabolic risk for Asians.
- **Use WHO Asian cutoffs:** normal = <23, overweight = 23–27.4, obese = ≥27.5.
- Surface this distinction in the app explicitly — many Vietnamese users know their BMI from school health checks and will compare to the global scale.

### Cultural Habit Patterns

- **Eating schedule:** Three main meals; breakfast is often bought from a street stall (banh mi, pho, xoi); lunch is the main meal of the day.
- **Exercise culture:** Group exercise (group aerobics, badminton, morning walking groups in parks) is more common than solo gym sessions. The app should accommodate non-gym activities as first-class workout types.
- **Zalo over WhatsApp:** For any social or sharing feature, Zalo is the dominant messaging platform in Vietnam. If sharing is ever built, Zalo share integration is more valuable than WhatsApp or Facebook.
- **TikTok fitness content:** A large portion of fitness awareness comes from TikTok in Vietnam. In-app content or challenges that align with TikTok viral formats have high engagement potential.
- **Price sensitivity:** Vietnam is a developing market. Keep free tier genuinely useful. Premium pricing should target 29,000–79,000 VND/month (roughly $1.20–$3.20 USD) to reach middle-income users, not 200,000+ VND which is the international app tier.

### Language / Localisation

- Full Vietnamese UI is non-negotiable.
- All food and exercise names must be in Vietnamese as the primary label, with English secondary.
- Avoid direct translation of nutritional concepts — Vietnamese users think in "chất đạm" not "protein"; use local terms throughout.
- BMI category names: "Thiếu cân / Bình thường / Thừa cân / Béo phì" — not translated from English.

---

## Feature Complexity Notes

Effort estimates relative to a small team (3–5 engineers, 6-month sprint context).

| Feature Category | Build Complexity | Data Complexity | Notes |
|-----------------|-----------------|-----------------|-------|
| Habit tracker (custom habits, streak, check-in) | Low | None | Standard CRUD + date logic; 2–3 weeks |
| BMI / weight tracker + chart | Low | None | 1–2 weeks including a decent chart library |
| Manual food log + calorie math | Low–Medium | HIGH | Code is simple; food database curation is the hard part |
| Vietnamese food database (500 dishes) | Low | Very High | Dietitian-reviewed data; 2–3 months of data work |
| Barcode scanner (packaged food) | Medium | Medium | Third-party product database API (Open Food Facts has partial SEA coverage) |
| AI food photo scan | Very High | Very High | Custom model needed for Vietnamese food accuracy; generic models fail on pho, bun dishes |
| Workout log (exercise library + sets/reps) | Medium | Medium | Library of 100+ exercises with Vietnamese names |
| Calorie burn calculation | Low | Low | MET table lookup; not complex |
| Push notification reminders | Low | None | Standard mobile OS primitives |
| Onboarding / goal wizard | Medium | None | Multi-step flow; UX polish is the time cost |
| Progress photo comparison | Medium | Low | Local-only storage; side-by-side UI component |
| Partner accountability | Medium | Low | Requires basic social graph; 1-to-1 pairing only |

**Build order implication:** Habit tracker, BMI tracker, and manual food log can ship fast. The Vietnamese food database and AI photo scan are the strategic moat but require the most time investment.

---

## Dependencies Between Features

Features that cannot work without other features being built first.

```
[Onboarding / Goal Setting]
    |
    +---> [Dashboard Home Screen]  (needs user goals to personalise)
    |
    +---> [Calorie Budget Display]  (needs target calories from onboarding)

[Food Database (Vietnamese + packaged)]
    |
    +---> [Manual Food Search & Log]  (needs data to search)
    |
    +---> [Barcode Scanner]  (needs packaged food entries)
    |
    +---> [AI Photo Scan]  (improves from database; photo scan alone insufficient)
    |
    +---> [Meal History / Recent Foods]  (derived from logged meals)

[Manual Food Log]
    |
    +---> [Daily Calorie Total & Macro Breakdown]
    |
    +---> [Weekly Insight Summary]  (needs 7+ days of data)
    |
    +---> [Nutrition Progress Charts]

[Workout Log]
    |
    +---> [Calorie Burn Estimate]  (needs logged exercise type + duration)
    |
    +---> [Calorie Balance View]  (needs both food log + burn)

[BMI / Weight Log]
    |
    +---> [Progress Chart]  (needs 2+ data points)
    |
    +---> [Goal Progress]  (needs target weight from onboarding)

[Habit Definition (custom habits)]
    |
    +---> [Daily Habit Check-In]
    |
    +---> [Streak Counter]
    |         |
    |         +---> [Streak Freeze]  (only meaningful once streaks exist)
    |
    +---> [Weekly Summary / Heatmap]

[User Account / Authentication]
    |
    +---> [Partner Accountability]  (requires two accounts)
    |
    +---> [Cloud sync / multi-device]
    |
    +---> [Push Notifications]  (needs device token tied to account)
```

**Guest mode exception:** Habit check-in, food log, and BMI entry should all work without an account in a local-only mode. Account creation should be prompted after the user has experienced value (day 3+ suggested).
