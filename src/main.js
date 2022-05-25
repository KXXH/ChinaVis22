import { createApp } from 'vue'
import App from './App.vue'
import 'virtual:windi.css'
import 'virtual:windi-devtools'
import animate from "animate.css"
import { createPinia } from 'pinia'


import {
    create,
    NButton
} from 'naive-ui'

const naive = create({
    components: [NButton]
})

const app = createApp(App)
app.use(naive)
app.use(animate)
app.use(createPinia())
app.mount('#app')
