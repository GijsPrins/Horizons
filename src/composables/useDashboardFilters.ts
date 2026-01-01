import { ref, computed, watch, type Ref } from "vue";
import type { GoalWithRelations } from "@/types/database";

export type FilterType =
  | "all"
  | "mine"
  | "shared"
  | "completed"
  | "overdue"
  | "not_completed";
export type SortType = "created" | "completed" | "deadline";

const FILTER_STORAGE_KEY = "horizons_dashboard_filter";
const SORT_STORAGE_KEY = "horizons_dashboard_sort";

export function useDashboardFilters(
  goals: Ref<GoalWithRelations[] | undefined>,
  userId: Ref<string | undefined>,
  selectedCategoryId: Ref<string | null>,
) {
  // Load from localStorage
  const savedFilter = localStorage.getItem(FILTER_STORAGE_KEY) as FilterType | null;
  const savedSort = localStorage.getItem(SORT_STORAGE_KEY) as SortType | null;

  const filter = ref<FilterType>(savedFilter && isValidFilter(savedFilter) ? savedFilter : "all");
  const sort = ref<SortType>(savedSort && isValidSort(savedSort) ? savedSort : "created");

  // Watch and persist changes
  watch(filter, (newFilter) => {
    localStorage.setItem(FILTER_STORAGE_KEY, newFilter);
  });

  watch(sort, (newSort) => {
    localStorage.setItem(SORT_STORAGE_KEY, newSort);
  });

  const filteredGoals = computed(() => {
    if (!goals.value) return [];

    let result = [...goals.value];

    // Apply filter
    result = applyFilter(result, filter.value, userId.value);

    // Apply category filter
    if (selectedCategoryId.value) {
      result = result.filter((g) => g.category_id === selectedCategoryId.value);
    }

    // Apply sort
    result = applySort(result, sort.value);

    return result;
  });

  return {
    filter,
    sort,
    filteredGoals,
  };
}

function applyFilter(
  goals: GoalWithRelations[],
  filterType: FilterType,
  userId: string | undefined,
): GoalWithRelations[] {
  switch (filterType) {
    case "mine":
      return goals.filter((g) => g.user_id === userId);
    case "shared":
      return goals.filter((g) => g.is_shared && g.user_id !== userId);
    case "completed":
      return goals.filter((g) => g.is_completed);
    case "not_completed":
      return goals.filter((g) => g.is_not_completed);
    case "overdue":
      return goals.filter((g) => {
        if (!g.deadline_date || g.is_completed || g.is_not_completed)
          return false;
        const today = new Date().toISOString().split("T")[0] as string;
        return g.deadline_date < today;
      });
    case "all":
    default:
      return goals;
  }
}

function applySort(
  goals: GoalWithRelations[],
  sortType: SortType,
): GoalWithRelations[] {
  const sorted = [...goals];

  switch (sortType) {
    case "created":
      sorted.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
      break;
    case "completed":
      sorted.sort((a, b) => {
        // Goals without completed_at go to the end
        if (!a.completed_at && !b.completed_at) return 0;
        if (!a.completed_at) return 1;
        if (!b.completed_at) return -1;
        return (
          new Date(b.completed_at).getTime() -
          new Date(a.completed_at).getTime()
        );
      });
      break;
    case "deadline":
      sorted.sort((a, b) => {
        // Goals without deadline_date go to the end
        if (!a.deadline_date && !b.deadline_date) return 0;
        if (!a.deadline_date) return 1;
        if (!b.deadline_date) return -1;
        return a.deadline_date.localeCompare(b.deadline_date);
      });
      break;
  }

  return sorted;
}

function isValidFilter(value: string): value is FilterType {
  return ["all", "mine", "shared", "completed", "overdue", "not_completed"].includes(value);
}

function isValidSort(value: string): value is SortType {
  return ["created", "completed", "deadline"].includes(value);
}
