import { createApp } from 'vue'
import { Icon } from '@iconify/vue'
import App from './App.vue'
import router from './router'
import uploader from 'vue-simple-uploader'
import 'vue-simple-uploader/dist/style.css'
import './styles/index.scss'

const app = createApp(App)
app.use(router)
app.use(uploader)
app.component('Icon', Icon)

app.mount('#app')
