// Vue Query configuration
import { VueQueryPlugin, QueryClient, type VueQueryPluginOptions } from '@tanstack/vue-query'
import type { App } from 'vue'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

export const vueQueryPluginOptions: VueQueryPluginOptions = {
  queryClient,
}

export function setupVueQuery(app: App) {
  app.use(VueQueryPlugin, vueQueryPluginOptions)
}
