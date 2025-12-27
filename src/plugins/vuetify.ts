// Vuetify plugin configuration
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import { nl } from 'vuetify/locale'
import { BRAND_COLORS, CATEGORY_COLORS, CATEGORY_COLORS_DARK } from '@/constants/branding'

export default createVuetify({
  locale: {
    locale: 'nl',
    fallback: 'nl',
    messages: { nl }
  },
  theme: {
    defaultTheme: localStorage.getItem('horizons-theme') || 'dark',
    themes: {
      light: {
        colors: {
          ...BRAND_COLORS,
          background: '#F8FAFC',   // Slate 50
          surface: '#FFFFFF',
          // Category colors
          'cat-gezondheid': CATEGORY_COLORS.gezondheid,
          'cat-persoonlijk': CATEGORY_COLORS.persoonlijk,
          'cat-relatie': CATEGORY_COLORS.relatie,
          'cat-carriere': CATEGORY_COLORS.carriere,
          'cat-financieel': CATEGORY_COLORS.financieel,
          'cat-creatief': CATEGORY_COLORS.creatief,
          'cat-sport': CATEGORY_COLORS.sport,
          'cat-overig': CATEGORY_COLORS.overig,
        }
      },
      dark: {
        colors: {
          // Darker/Brighter variants for dark mode if needed, otherwise same branding
          primary: '#818CF8',      // Indigo 400
          secondary: '#F472B6',    // Pink 400
          accent: '#A78BFA',       // Purple 400
          success: '#34D399',      // Emerald 400
          warning: '#FBBF24',      // Amber 400
          error: '#F87171',        // Red 400
          info: '#60A5FA',         // Blue 400
          background: '#0F172A',   // Slate 900
          surface: '#1E293B',      // Slate 800
          // Category colors (brighter for dark mode)
          'cat-gezondheid': CATEGORY_COLORS_DARK.gezondheid,
          'cat-persoonlijk': CATEGORY_COLORS_DARK.persoonlijk,
          'cat-relatie': CATEGORY_COLORS_DARK.relatie,
          'cat-carriere': CATEGORY_COLORS_DARK.carriere,
          'cat-financieel': CATEGORY_COLORS_DARK.financieel,
          'cat-creatief': CATEGORY_COLORS_DARK.creatief,
          'cat-sport': CATEGORY_COLORS_DARK.sport,
          'cat-overig': CATEGORY_COLORS_DARK.overig,
        }
      }
    }
  },
  defaults: {
    VBtn: {
      rounded: 'lg',
      elevation: 0,
    },
    VCard: {
      rounded: 'xl',
      elevation: 0,
    },
    VTextField: {
      variant: 'outlined',
      density: 'comfortable',
    },
    VSelect: {
      variant: 'outlined',
      density: 'comfortable',
    },
  }
})
