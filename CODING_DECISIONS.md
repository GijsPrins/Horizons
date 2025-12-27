# Horizons - Coding Decisions & Architecture

This document outlines the key architectural choices and technical decisions made for the **Horizons** project. It serves as context for future development and AI assistance.

## 🛠 Technology Stack
- **Frontend**: Vue 3 (Composition API) with TypeScript.
- **UI Framework**: Vuetify 3 (Material Design).
- **Data Fetching**: @tanstack/vue-query (for caching and stable state management).
- **Backend & Auth**: Supabase.
- **Build Tool**: Vite.
- **Deployment**: GitHub Pages (automated via GitHub Actions).

## 🚀 Deployment & Navigation
- **Hosting**: The app is hosted at `https://gijsprins.github.io/Horizons/`.
- **Router Mode**: Using **Hash Mode** (`createWebHashHistory`). This is critical for GitHub Pages as it prevents 404 errors when refreshing deep URLs (e.g., `/teams/id`) without requiring server-side redirect configuration.
- **Base Path**: The `base` property in `vite.config.ts` is set to `/Horizons/`. All paths in `DefaultLayout.vue` and `index.html` must account for this (utilizing `import.meta.env.BASE_URL`).

## 🏗 Database & Data Logic
- **Team Querying**: When fetching teams, we use a two-step approach:
    1. Retrieve the IDs of all teams the user belongs to (from the `team_members` table).
    2. Fetch full details for those specific team IDs, including *all* other members.
    *Rationale*: This prevents the team overview from incorrectly filtering the membership list to only show the current user.
- **User Profiles**: Profiles are automatically created via a database trigger on `auth.users`. Manual updates are performed on the `profiles` table.
- **RLS (Row Level Security)**: Enabled on all tables. Users can only manage their own goals and view teams they are members of.

## 🎨 Design & Theme
- **Rainbow Aesthetic**: The app features a vibrant color palette for categories.
- **Theme Persistence**: The chosen theme (Light/Dark) is saved in `localStorage` under the key `horizons-theme`.
- **Typography**: Modern, utilizing Outfit/Inter via Google Fonts.
- **Icons**: Material Design Icons (`@mdi/font`).

## 📱 Mobile UX
- **Team Joining**: Invite codes are sanitized (trimmed and converted to uppercase) on submission rather than during input. This avoids cursor-jumping issues on many mobile keyboards.
- **Responsiveness**: The navigation drawer automatically collapses on mobile devices after a route change.

## ⚠️ Known Considerations
- **Typings**: Casting (`as any` or `as TeamWithMembers[]`) is occasionally used for complex Supabase joins to bypass build-blocking TypeScript inference errors.
- **Asset Paths**: Always use relative paths or the `BASE_URL` prefix for images/icons to ensure compatibility with GitHub Pages subpaths.
