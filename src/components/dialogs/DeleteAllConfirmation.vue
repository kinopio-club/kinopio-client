<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useApiStore } from '@/stores/useApiStore'
import { useUserStore } from '@/stores/useUserStore'
import Loader from '@/components/Loader.vue'
import cache from '@/cache.js'
import utils from '@/utils.js'

const apiStore = useApiStore()
const userStore = useUserStore()

const dialogElement = ref(null)

onMounted(() => {
  window.addEventListener('resize', updateDialogHeight)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', updateDialogHeight)
})

const emit = defineEmits(['toggleUserBillingSettingsIsVisible'])

const props = defineProps({
  visible: Boolean
})
const state = reactive({
  dialogHeight: null,
  deleteUserConfirmation: '',
  loading: {
    deleteUserPermanent: false
  }
})

watch(() => props.visible, (value, prevValue) => {
  if (value) {
    updateDialogHeight()
  }
})

const isSignedIn = computed(() => userStore.getUserIsSignedIn)
const isUpgraded = computed(() => userStore.isUpgraded)

const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  const element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}

const toggleUserBillingSettingsIsVisible = () => {
  emit('toggleUserBillingSettingsIsVisible')
}

// delete user

const deleteUserPermanentIsConfirmed = computed(() => state.deleteUserConfirmation.toLowerCase() === 'permanently delete account')
const deleteUserPermanent = async () => {
  if (!deleteUserPermanentIsConfirmed.value) { return }
  try {
    state.loading.deleteUserPermanent = true
    await apiStore.deleteUserPermanent()
    await cache.removeAll()
    // clear history wipe state from vue-router
    window.history.replaceState({}, 'Kinopio', '/')
    location.reload()
  } catch (error) {
    console.error('🚒 deleteUserPermanent')
  } finally {
    state.loading.deleteUserPermanent = false
  }
}
</script>

<template lang="pug">
dialog.delete-all-confirmation.narrow(v-if="props.visible" :open="props.visible" @click.left.stop ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}")
  section.title-section
    p Permanently Delete Account
  section
    section.subsection(v-if="isUpgraded")
      span Or cancel paid subscription
      .row.billing-cancel
        button(@click.left.stop="toggleUserBillingSettingsIsVisible")
          span Billing
    section.subsection.danger
      p(v-if="isSignedIn") Permanently Delete your account and all your spaces from this computer and Kinopio's servers?
      p(v-else) Permanently Delete your account and all your spaces and user data from this computer?
    section.subsection.danger
      p Type "Permanently Delete Account" in the input below to confirm. There is no going back. Please be certain.
      p
        input(type="text" v-model="state.deleteUserConfirmation" placeholder="Confirmation Input")
    .row
      .segmented-buttons
        button(@click.left="toggleDeleteAllConfirmationVisible")
          img.icon.cancel(src="@/assets/add.svg")
          span Cancel
        button.danger(@click.left="deleteUserPermanent" :disabled="!deleteUserPermanentIsConfirmed" class="{disabled: !deleteUserPermanentIsConfirmed}")
          img.icon(src="@/assets/remove.svg")
          span Delete All
          Loader(:visible="state.loading.deleteUserPermanent")
</template>

<style lang="stylus">
dialog.delete-all-confirmation
  overflow auto
  .billing-cancel
    margin-top 2px
    padding-bottom 2px
  .subsection.danger
    background-color var(--danger-background)
  @media(max-height 700px)
    top -100px
  @media(max-height 500px)
    top -200px

</style>
