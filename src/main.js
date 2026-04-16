import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import FloatingVue from 'floating-vue'
import 'floating-vue/dist/style.css'
import './assets/ui-fields.css'
import './assets/ui-buttons.css'
import './assets/ui-pill-tabs.css'
import './assets/ui-line-tabs.css'
import './assets/ui-switcher.css'
import './assets/tooltips.css'
import './assets/data-table.css'

createApp(App).use(router).use(FloatingVue).mount('#app')
