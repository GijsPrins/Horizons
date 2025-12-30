# Not Completed Goals Feature

## Overview

This feature allows users to mark goals as "not completed" or "not achieved" with an optional reason. Goals marked as not completed are displayed with a special visual indicator (—) and a grey color scheme to differentiate them from completed and in-progress goals.

## Database Changes

### Migration: `006_add_not_completed.sql`

Added three new columns to the `goals` table:

- `is_not_completed` (BOOLEAN): Indicates if the goal was marked as not completed
- `not_completed_reason` (TEXT): Optional reason why the goal wasn't achieved
- `not_completed_at` (TIMESTAMPTZ): Timestamp when marked as not completed

A constraint ensures a goal cannot be both `is_completed` and `is_not_completed`.

### Applying the Migration

To apply this migration to your Supabase database:

```powershell
# Navigate to the project root
cd d:\repos\Private\WishList\horizons

# Apply the migration using Supabase CLI
supabase db push
```

Or manually run the SQL in your Supabase SQL editor:

```sql
-- Copy and execute the contents of supabase/migrations/006_add_not_completed.sql
```

## Features Implemented

### 1. Goal Card Display

- Shows a grey "×" (cancel) icon for not completed goals
- Displays "—" instead of percentage in progress circle
- Grey color scheme for not completed goals
- Tooltip shows the reason if provided

### 2. Goal View Page

- "Mark as not completed" button for in-progress goals
- Dialog to optionally provide a reason
- Displays the not completed reason below the description
- "Reopen" button to unmark not completed status
- Progress circle shows "—" for not completed goals

### 3. Dashboard Filters

- New "Not bereikt" (Not completed) filter option
- Not completed goals excluded from overdue filter
- Proper filtering and sorting

### 4. Progress Calculation

- Returns -1 for not completed goals (special indicator)
- UI components handle -1 by displaying 0% with special styling

### 5. Celebration View

- Not completed goals shown in grey on timeline
- Excluded from in-progress count
- Distinct visual indicator (cancel icon)

## User Flow

### Marking a Goal as Not Completed

1. Navigate to a goal's detail page
2. Click "Markeer als niet bereikt" (Mark as not completed) button
3. Optionally enter a reason in the dialog
4. Confirm

### Reopening a Not Completed Goal

1. Navigate to the not completed goal's detail page
2. Click "Heropend" (Reopen) button
3. Goal returns to in-progress state

## Visual Design

### Colors

- **In Progress**: Category color or primary blue
- **Completed**: Success green (#4CAF50)
- **Not Completed**: Grey (#757575 / grey-darken-1)

### Icons

- **In Progress**: `mdi-progress-clock`
- **Completed**: `mdi-check-circle`
- **Not Completed**: `mdi-cancel`

### Progress Indicators

- **In Progress**: 0-100%
- **Completed**: 100%
- **Not Completed**: "—" (em dash)

## Translations (Dutch)

Added the following translation keys to `nl.json`:

```json
{
  "goals": {
    "isNotCompleted": "Niet bereikt",
    "markNotCompleted": "Markeer als niet bereikt",
    "notCompletedReason": "Reden (optioneel)",
    "notCompletedReasonPlaceholder": "Waarom is dit doel niet bereikt?",
    "notCompletedReasonHint": "Je kunt een reden opgeven waarom het doel niet is gelukt",
    "markedNotCompleted": "Doel gemarkeerd als niet bereikt",
    "confirmNotCompleted": "Doel markeren als niet bereikt",
    "notCompletedMessage": "Dit doel kan worden gemarkeerd als niet bereikt. Je kunt eventueel een reden opgeven.",
    "filters": {
      "not_completed": "Niet bereikt"
    }
  }
}
```

## Technical Implementation

### Files Modified

1. `supabase/migrations/006_add_not_completed.sql` - Database schema
2. `src/types/database.ts` - TypeScript types
3. `src/composables/useProgress.ts` - Progress calculation
4. `src/composables/useGoalViewLogic.ts` - View logic
5. `src/composables/useDashboardFilters.ts` - Filtering
6. `src/components/goals/GoalCard.vue` - Card display
7. `src/views/GoalView.vue` - Detail view
8. `src/views/CelebrationView.vue` - Timeline view
9. `src/locales/nl.json` - Translations

### Key Functions

- `calculateProgress()`: Returns -1 for not completed goals
- `markNotCompleted()`: Opens dialog to mark goal as not completed
- `confirmMarkNotCompleted()`: Saves the not completed status
- `unmarkNotCompleted()`: Removes not completed status

## Testing Checklist

- [ ] Apply database migration successfully
- [ ] Mark a goal as not completed with reason
- [ ] Mark a goal as not completed without reason
- [ ] Verify goal shows grey indicator on cards
- [ ] Verify goal shows "—" in progress circle
- [ ] Filter by "not completed" status
- [ ] Reopen a not completed goal
- [ ] View not completed goals in celebration timeline
- [ ] Verify not completed goals excluded from overdue filter
- [ ] Check mobile responsive display

## Future Enhancements

Potential additions for this feature:

- Statistics showing not completed rate
- Analytics on common not completed reasons
- Ability to edit the not completed reason after marking
- Bulk operations to mark multiple goals as not completed
- Export reports including not completed goals with reasons
