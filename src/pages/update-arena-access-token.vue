<script setup>
import { navigateTo } from '#app'
import { useUserStore } from '@/stores/useUserStore'

const urlParams = new URLSearchParams(window.location.search)
const arenaReturnedCode = urlParams.get('code')
const userStore = useUserStore()
userStore.updateUserArenaAccessToken(arenaReturnedCode)

navigateTo('/')
</script>
