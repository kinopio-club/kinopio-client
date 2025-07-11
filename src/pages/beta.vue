<script setup>
import { navigateTo } from '#app'
import { useGlobalStore } from '@/stores/useGlobalStore'

const globalStore = useGlobalStore()
globalStore.isBeta = true
globalStore.addNotification({ message: 'No features currently in Beta' }) // 'No features currently in Beta'

navigateTo('/')
</script>
