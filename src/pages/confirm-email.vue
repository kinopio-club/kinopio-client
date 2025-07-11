<script setup>
import { navigateTo } from '#app'
import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'

const globalStore = useGlobalStore()
const userStore = useUserStore()

userStore.updateUserEmailIsVerified()
globalStore.addNotification({ message: 'Email Confirmed', type: 'success' })

navigateTo('/')
</script>
