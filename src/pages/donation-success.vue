<script setup>
import { navigateTo } from '#app'
import { useGlobalStore } from '@/stores/useGlobalStore'

const globalStore = useGlobalStore()
globalStore.notifyThanksForDonating = true

navigateTo('/')
</script>
