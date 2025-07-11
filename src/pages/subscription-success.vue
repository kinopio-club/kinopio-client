<script setup>
import { navigateTo } from '#app'
import { useGlobalStore } from '@/stores/useGlobalStore'

const globalStore = useGlobalStore()

const urlParams = new URLSearchParams(window.location.search)
const sessionId = urlParams.get('sessionId')
if (sessionId) {
  globalStore.notifyThanksForUpgrading = true
}

navigateTo('/')
</script>
