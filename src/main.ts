import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import vuetify from './plugins/vuetify'
import { setupVueQuery } from './plugins/vueQuery'
import { i18n } from './plugins/i18n'

const app = createApp(App)

app.use(router)
app.use(vuetify)
app.use(i18n)
setupVueQuery(app)

app.mount('#app')
