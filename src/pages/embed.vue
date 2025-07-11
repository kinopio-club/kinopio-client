<script setup>
import { navigateTo } from '#app'
import { useGlobalStore } from '@/stores/useGlobalStore'

const globalStore = useGlobalStore()
const urlParams = new URLSearchParams(window.location.search)
const spaceId = urlParams.get('spaceId')
const zoomLimit = {
  min: 40,
  max: 100
}
let zoom = urlParams.get('zoom')
zoom = Math.max(zoomLimit.min, zoom)
zoom = Math.min(zoomLimit.max, zoom)
globalStore.spaceUrlToLoad = spaceId
globalStore.spaceZoomPercent = zoom
globalStore.isEmbedMode = true

navigateTo('/')
</script>
