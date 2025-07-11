<script setup>
import { navigateTo } from '#app'
import { useGlobalStore } from '@/stores/useGlobalStore'

const globalStore = useGlobalStore()
globalStore.shouldShowExploreOnLoad = true

navigateTo('/')
</script>
