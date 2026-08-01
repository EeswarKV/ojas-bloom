# Ojas Bloom Studio Manager

React Native (Expo) app + Supabase backend. One codebase → iOS, Android, and web.

## 1. Set up Supabase (free tier)

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** → paste the contents of `supabase/schema.sql` → Run.
3. Go to **Authentication → Users → Add user** and create a login for yourself
   and each staff member (email + password). There's no public sign-up screen
   on purpose — you control who gets access.
4. Go to **Project Settings → API** and copy the **Project URL** and **anon public** key.

## 2. Configure the app

```bash
cp .env.example .env
# then paste your Supabase URL + anon key into .env
```

## 3. Install and run

```bash
npm install
npx expo start
```

- Press `w` for web, `a` for Android emulator, `i` for iOS simulator (Mac only),
  or scan the QR code with the **Expo Go** app on your phone for instant testing
  without building anything.

## 4. Build real apps (when ready)

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android   # → .aab for Play Store ($25 one-time)
eas build --platform ios       # → needs Apple Developer Program ($99/yr)
```

## 5. Deploy the web version

```bash
npx expo export:web
```

Deploy the resulting `web-build/` (or `dist/`, depending on Expo SDK version)
folder to Vercel or Netlify — drag-and-drop works, or connect the repo for
auto-deploys.

## What's here vs. what to extend

This scaffold ports **all the business logic** from the prototype 1:1
(due-date rolling, recurring bills, FY-aware reports, dues calculation) so
the numbers will always match. A few things worth polishing next:

- **Charts**: `react-native-chart-kit`'s `BarChart` only cleanly renders one
  dataset at a time — the Reports screen currently charts income only. For a
  real side-by-side income-vs-expense bar chart, swap in `victory-native` or
  render two charts stacked.
- **Pie chart / expense-by-category breakdown**: not yet ported — was in the
  web version's Reports tab. `react-native-chart-kit` has a `PieChart` that
  would slot in the same way as the BarChart above.
- **Auth**: currently email/password only, accounts created manually by you
  in the Supabase dashboard. Fine for a small team; swap for magic-link or
  add a proper "manage staff" screen later if the team grows.
- **Offline support**: Supabase's realtime subscription means multiple
  phones stay in sync live, but there's no offline queue yet — actions need
  a network connection. Worth adding if the studio's wifi is unreliable.
- **Styling pass**: components are functional but plainer than the polished
  web artifact — worth a design pass once the data layer feels solid.

## Folder structure

```
App.js                    — navigation shell + auth gate
lib/supabase.js           — Supabase client
lib/StudioDataContext.js  — data fetching + all CRUD actions (single source of truth)
lib/helpers.js            — date/money/FY logic, identical to the web prototype
theme.js                  — brand colors (from ojas-bloom.com)
components/UI.js           — shared Card/Button/Field/Badge/KPI components
screens/                  — one file per tab
supabase/schema.sql       — run this once in the Supabase SQL editor
```
