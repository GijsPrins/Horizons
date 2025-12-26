// Vuetify plugin configuration
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import { nl } from 'vuetify/locale'

export default createVuetify({
  locale: {
    locale: 'nl',
    fallback: 'nl',
    messages: { nl }
  },
  theme: {
    defaultTheme: 'dark',
    themes: {
      light: {
        colors: {
          primary: '#6366F1',      // Indigo
          secondary: '#EC4899',    // Pink
          accent: '#8B5CF6',       // Purple
          success: '#10B981',      // Emerald
          warning: '#F59E0B',      // Amber
          error: '#EF4444',        // Red
          info: '#3B82F6',         // Blue
          background: '#F8FAFC',   // Slate 50
          surface: '#FFFFFF',
          // Category colors
          'cat-gezondheid': '#4CAF50',
          'cat-persoonlijk': '#2196F3',
          'cat-relatie': '#E91E63',
          'cat-carriere': '#FF9800',
          'cat-financieel': '#FFC107',
          'cat-creatief': '#9C27B0',
          'cat-sport': '#00BCD4',
          'cat-overig': '#607D8B',
        }
      },
      dark: {
        colors: {
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
          'cat-gezondheid': '#4ADE80',
          'cat-persoonlijk': '#38BDF8',
          'cat-relatie': '#FB7185',
          'cat-carriere': '#FB923C',
          'cat-financieel': '#FACC15',
          'cat-creatief': '#C084FC',
          'cat-sport': '#22D3EE',
          'cat-overig': '#94A3B8',
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
