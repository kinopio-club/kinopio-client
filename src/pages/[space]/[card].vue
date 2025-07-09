<script setup>
import { navigateTo } from '#app'
import { useGlobalStore } from '@/stores/useGlobalStore'

const globalStore = useGlobalStore()
const path = window.location.pathname
const urlParams = new URLSearchParams(window.location.search)
if (urlParams.get('present')) {
  globalStore.isPresentationMode = true
}
if (urlParams.get('comment')) {
  globalStore.isCommentMode = true
}
globalStore.updateSpaceAndCardUrlToLoad(path)

navigateTo('/')
</script>
