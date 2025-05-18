<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
import { useUserStore } from '@/stores/useUserStore'

const userStore = useUserStore()
const store = useStore()

const props = defineProps({
  message: String
})

const currentUserIsSignedIn = computed(() => userStore.getUserIsSignedIn)
const currentUserIsUpgraded = computed(() => userStore.isUpgraded)
const visible = computed(() => {
  return !currentUserIsSignedIn.value || !currentUserIsUpgraded.value
})

const triggerSignUpOrInIsVisible = () => {
  store.dispatch('closeAllDialogs')
  store.commit('triggerSignUpOrInIsVisible')
}
const triggerUpgradeUserIsVisible = () => {
  store.dispatch('closeAllDialogs')
  store.commit('triggerUpgradeUserIsVisible')
}

</script>

<template lang="pug">
section.upgraded-user-required(v-if="visible")
  //- sign up or in
  template(v-if="!currentUserIsSignedIn")
    p
      span.badge.info Sign Up or In
      span {{props.message}}
    button(@click.left="triggerSignUpOrInIsVisible") Sign Up or In
  //- upgrade
  template(v-else-if="!currentUserIsUpgraded")
    p
      span.badge.info Upgrade
      span {{props.message}}
    button(@click.left="triggerUpgradeUserIsVisible") Upgrade for Groups

</template>

<style lang="stylus">
// .upgraded-user-required
</style>
