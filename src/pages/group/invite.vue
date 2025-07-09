<script setup>
import { navigateTo } from '#app'
import { useGlobalStore } from '@/stores/useGlobalStore'

const globalStore = useGlobalStore()
const urlParams = new URLSearchParams(window.location.search)
const groupId = urlParams.get('groupId')
const collaboratorKey = urlParams.get('collaboratorKey')
globalStore.groupToJoinOnLoad = { groupId, collaboratorKey }
globalStore.shouldNotifyIsJoiningGroup = true

navigateTo('/')
</script>
