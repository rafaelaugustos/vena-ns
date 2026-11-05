import { createApp, h, registerElement } from 'nativescript-vue'
import App from './App.vue'
import { HeartScene } from './scene/scene-view'
import { SignalView } from './scene/signal-view'
import { IconView } from './scene/icons'
import './app.css'

registerElement('HeartScene', () => HeartScene)
registerElement('SignalView', () => SignalView)
registerElement('IconView', () => IconView)
createApp({ render: () => h('Frame', {}, [h(App)]) }).start()
