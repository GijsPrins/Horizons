# Horizons - Claude AI Reference Guide

## Project Overview
Horizons is a goal tracking and wishlist application built with a security-first approach. Users can create personal goals, join teams, track progress, and collaborate with others.

## Tech Stack
- **Frontend**: Vue 3 + TypeScript + Vite
- **UI Framework**: Vuetify 3
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **State Management**: TanStack Query (Vue Query)
- **Routing**: Vue Router with auth guards
- **i18n**: vue-i18n for internationalization

## Security-First Principles

### Critical Security Rules
1. **ALWAYS validate Supabase RLS (Row Level Security) policies before making ANY database changes**
   - Check existing policies in `/supabase/migrations/`
   - Never assume client-side checks are sufficient
   - Test policies with different user roles (authenticated, team member, team admin, app admin)

2. **Use SECURITY DEFINER functions for sensitive operations**
   - Admin privilege checks MUST be server-side (see `004_security_improvements.sql`)
   - Never trust `is_app_admin` or role checks from client-side code
   - Pattern: Create a SECURITY DEFINER function, then grant EXECUTE to authenticated users

3. **Prevent OWASP Top 10 vulnerabilities**
   - SQL Injection: Use parameterized queries, Supabase handles this
   - XSS: Sanitize user input, Vue's templating helps but verify v-html usage
   - Broken Authentication: Use Supabase auth, never roll custom auth
   - Broken Access Control: Enforce with RLS + SECURITY DEFINER functions
   - Security Misconfiguration: Never commit `.env` file
   - Sensitive Data Exposure: No secrets in client code, use environment variables

4. **Environment Variables**
   - ALL sensitive data goes in `.env` (never committed)
   - Use `VITE_` prefix for client-exposed variables
   - Required vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
   - The anon key is safe to expose (protected by RLS)

### Database Security Patterns
```sql
-- ✅ CORRECT: Server-side validation
CREATE OR REPLACE FUNCTION update_sensitive_data(...)
RETURNS ...
SECURITY DEFINER -- Runs with elevated privileges
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_app_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  -- Perform operation
END;
$$;

-- ❌ WRONG: Client-side only check
-- Never rely on this alone for sensitive operations
const isAdmin = profile.value?.is_app_admin
if (isAdmin) {
  // This can be bypassed!
}
```

## TypeScript Guidelines

### Strict Type Safety
- **NO `any` types** except where absolutely necessary (e.g., `supabase.ts` client export)
- Use `Database` types from `src/types/database.ts` for all Supabase operations
- Always define proper types for:
  - Component props (`defineProps<{ ... }>()`)
  - Function parameters and return values
  - Composable return types
  - API responses

```typescript
// ✅ CORRECT
interface Goal {
  id: string;
  title: string;
  user_id: string;
  // ... etc
}

const fetchGoals = async (): Promise<Goal[]> => {
  // ...
}

// ❌ WRONG
const fetchGoals = async () => {  // Missing return type
  const data: any = await supabase  // Using 'any'
  return data
}
```

## File Organization & Patterns

### Directory Structure
```
src/
├── components/        # Reusable Vue components
│   ├── feedback/     # Feature-specific components
│   └── yearReview/
├── composables/      # Vue composables for shared logic
│   ├── useAuth.ts
│   ├── useFeedback.ts
│   └── useConfetti.ts
├── layouts/          # Layout components
├── locales/          # i18n translation files
├── plugins/          # Vue plugins (Vuetify, Supabase)
├── router/           # Vue Router configuration
├── types/            # TypeScript type definitions
└── views/            # Route-level components
```

### Composables Pattern
- **ALWAYS use composables for shared logic** (don't duplicate code across components)
- Composables should return reactive refs and functions
- Name pattern: `use[Feature].ts`

```typescript
// ✅ CORRECT: Composable pattern
export const useGoals = () => {
  const goals = ref<Goal[]>([])
  const loading = ref(false)

  const fetchGoals = async () => {
    loading.value = true
    // ... fetch logic
    loading.value = false
  }

  return {
    goals: readonly(goals),
    loading: readonly(loading),
    fetchGoals
  }
}
```

### Vue Router Auth Guards
- Routes use meta fields: `requiresAuth: true` or `requiresGuest: true`
- Auth guard is implemented in `router/index.ts`
- Protected routes automatically redirect to `/login` if not authenticated

### Component Guidelines
- Use `<script setup>` syntax (Vue 3 Composition API)
- Use Vuetify components for UI consistency
- Keep components focused and single-responsibility
- Extract complex logic to composables

## Database Schema Key Points

### Tables
- `profiles` - User profiles (linked to Supabase auth.users)
- `teams` - Team/group information
- `team_members` - Many-to-many relationship with roles (admin/member)
- `categories` - Goal categories (can be global or team-specific)
- `goals` - User goals with progress tracking
- `progress_entries` - Goal progress updates
- `attachments` - File attachments (stored in Supabase Storage)
- `feedback_reports` - User feedback system

### RLS Policies
- All tables have RLS enabled
- Users can only access their own data or team data they're members of
- Global categories are read-only for non-admins
- Storage buckets have specific policies for uploads/downloads

## Common Patterns to Follow

### Supabase Queries
```typescript
// ✅ CORRECT: Type-safe with error handling
const { data, error } = await supabase
  .from('goals')
  .select('*')
  .eq('user_id', userId)

if (error) {
  console.error('Error fetching goals:', error)
  // Handle error appropriately
  return
}

// Use data safely
const goals: Goal[] = data || []
```

### Error Handling
- Always check for `error` in Supabase responses
- Log errors with context
- Show user-friendly error messages (use i18n)
- Don't expose sensitive error details to users

### Authentication
```typescript
// ✅ CORRECT: Use the auth composable
const { user, isAuthenticated, signOut } = useAuth()

// Check auth state
if (!isAuthenticated.value) {
  router.push('/login')
}
```

## Things to NEVER Do

1. ❌ Never commit `.env` file or expose secrets
2. ❌ Never use `any` type unless absolutely necessary
3. ❌ Never bypass RLS with service role key in client code
4. ❌ Never trust client-side admin/role checks for sensitive operations
5. ❌ Never directly manipulate DOM (use Vue reactivity)
6. ❌ Never create SQL migrations without RLS policies
7. ❌ Never store sensitive data in localStorage without encryption
8. ❌ Never expose internal error details to end users
9. ❌ Never make database changes without testing with different user roles
10. ❌ Never use `eval()` or `innerHTML` with user-provided content

## Migration Workflow

When creating new database migrations:

1. Create new file: `supabase/migrations/00X_description.sql`
2. Define schema changes (tables, columns, indexes)
3. **ALWAYS add RLS policies** - enable RLS and create appropriate policies
4. Add helpful functions if needed (prefer SECURITY DEFINER for admin checks)
5. Add comments explaining complex logic
6. Test with different user roles before deploying
7. Update `src/types/database.ts` to match schema changes

## Development Workflow

1. Run dev server: `npm run dev`
2. Build: `npm run build`
3. Preview production build: `npm run preview`
4. Type check: `vue-tsc -b`

## Git & Deployment Workflow

**CRITICAL: Always use Pull Requests - NEVER push directly to main**

This allows us to:
- Track what features were added in each PR
- Review changes before merging
- Maintain a clean, traceable history
- Easily revert problematic changes if needed

### Standard Workflow

When implementing a feature or fix:

1. **Create a feature branch**
   ```bash
   git checkout -b feature/descriptive-name
   # or
   git checkout -b fix/issue-description
   ```

2. **Make your changes**
   - Write code following the security and TypeScript guidelines above
   - Test thoroughly with different user roles
   - Ensure type safety (`vue-tsc -b`)

3. **Commit changes**
   ```bash
   git add .
   git commit -m "feat: descriptive commit message"
   ```

   Commit message format:
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `security:` - Security improvement
   - `refactor:` - Code refactoring
   - `docs:` - Documentation changes
   - `style:` - Formatting, no code change
   - `test:` - Adding tests

4. **Push to remote**
   ```bash
   git push -u origin feature/descriptive-name
   ```

5. **Create Pull Request**
   - When Claude is instructed to "push code", create a PR instead
   - Use `gh pr create` to create the PR via CLI
   - Include clear description of changes
   - Reference any related issues
   - Highlight security considerations if applicable

6. **PR Review & Merge**
   - Review the changes in the PR
   - Ensure all checks pass
   - Merge to main when approved

### PR Title Guidelines
- Be descriptive and concise
- Include feature/fix type prefix
- Examples:
  - "feat: Add user profile editing functionality"
  - "fix: Resolve RLS policy for team goals"
  - "security: Implement server-side admin validation"

### PR Description Template
```markdown
## Summary
Brief description of what this PR does

## Changes
- List of key changes
- Another change
- Database migrations (if any)

## Security Considerations
- RLS policies added/modified
- New SECURITY DEFINER functions
- Auth changes

## Testing
- Tested with user role: [authenticated/admin/team member]
- Edge cases covered

## Screenshots (if UI changes)
[Add screenshots if applicable]
```

## Questions to Ask Before Implementation

When given a task, consider:
1. Does this need server-side validation? (Use SECURITY DEFINER function)
2. What RLS policies are needed?
3. Can this logic be shared? (Create a composable)
4. What user roles can access this?
5. Are there any security implications?
6. Does this need i18n support?
7. What error cases need handling?

## Current Features

- User authentication (Supabase Auth)
- Personal goal tracking
- Team collaboration
- Progress tracking with entries
- File attachments (Supabase Storage)
- User feedback system
- Year review feature
- Celebration/achievements system
- Internationalization (i18n)

## Additional Notes

- The app uses hash-based routing (`createWebHashHistory`)
- Vuetify theme and components are configured in `src/plugins/vuetify.ts`
- All user-facing text should be internationalized (check `src/locales/`)
- The project uses ESM (`"type": "module"` in package.json)

---

**Remember: Security first, types second, user experience third.**
