import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import WindiCSS from 'vite-plugin-windicss'
import vueJsx from '@vitejs/plugin-vue-jsx'
import Icons from 'unplugin-icons/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), WindiCSS(), vueJsx(), Icons({
    autoInstall: true,
  })],
  resolve:{
    alias:{
      '@':'src'
    }
  }
})
