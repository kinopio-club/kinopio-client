<script setup>
import { navigateTo } from '#app'
import { useGlobalStore } from '@/stores/useGlobalStore'

const globalStore = useGlobalStore()
const urlParams = new URLSearchParams(window.location.search)
const apiKey = urlParams.get('apiKey')
if (apiKey) {
  globalStore.updatePasswordApiKey = apiKey
  globalStore.passwordResetIsVisible = true
}

navigateTo('/')
</script>
