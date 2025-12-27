import type { CategoryFormData } from '@/types/database'

export const BRAND_COLORS = {
  primary: '#6366F1',
  secondary: '#EC4899',
  accent: '#8B5CF6',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
}

export const CATEGORY_COLORS = {
  gezondheid: '#4CAF50',
  persoonlijk: '#2196F3',
  relatie: '#E91E63',
  carriere: '#FF9800',
  financieel: '#FFC107',
  creatief: '#9C27B0',
  sport: '#00BCD4',
  overig: '#607D8B',
}

export const CATEGORY_COLORS_DARK = {
  gezondheid: '#4ADE80',
  persoonlijk: '#38BDF8',
  relatie: '#FB7185',
  carriere: '#FB923C',
  financieel: '#FACC15',
  creatief: '#C084FC',
  sport: '#22D3EE',
  overig: '#94A3B8',
}

export const DEFAULT_CATEGORIES: Omit<CategoryFormData, 'sort_order'>[] = [
  { name: 'Gezondheid', color: CATEGORY_COLORS.gezondheid, icon: 'mdi-heart-pulse' },
  { name: 'Persoonlijk', color: CATEGORY_COLORS.persoonlijk, icon: 'mdi-account' },
  { name: 'Relatie', color: CATEGORY_COLORS.relatie, icon: 'mdi-heart' },
  { name: 'Carrière', color: CATEGORY_COLORS.carriere, icon: 'mdi-briefcase' },
  { name: 'Financieel', color: CATEGORY_COLORS.financieel, icon: 'mdi-currency-eur' },
  { name: 'Creatief', color: CATEGORY_COLORS.creatief, icon: 'mdi-palette' },
  { name: 'Sport', color: CATEGORY_COLORS.sport, icon: 'mdi-run' },
  { name: 'Overig', color: CATEGORY_COLORS.overig, icon: 'mdi-dots-horizontal' },
]
