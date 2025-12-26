import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import vuetify from './plugins/vuetify'
import { setupVueQuery } from './plugins/vueQuery'

const app = createApp(App)

app.use(router)
app.use(vuetify)
setupVueQuery(app)

app.mount('#app')
