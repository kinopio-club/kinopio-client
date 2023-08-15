<script setup>
import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import User from '@/components/User.vue'
import Loader from '@/components/Loader.vue'
import UserCredits from '@/components/UserCredits.vue'
import ReferredNewUserCredits from '@/components/ReferredNewUserCredits.vue'
import utils from '@/utils.js'

import dayjs from 'dayjs'
const store = useStore()

const dialog = ref(null)

onMounted(() => {
  console.log(`🍆 the component is now mounted.`, store.state.currentSpace)
  // store.subscribe((mutation, state) => {
  //   if (mutation.type === 'triggerUpdateOtherCard') {
  //     mutation.payload
  //   }
  // })
  store.subscribe((mutation, state) => {
    if (mutation.type === 'updatePageSizes') {
      updateDialogHeight()
    }
  })
})

const props = defineProps({
  visible: Boolean
})

watch(() => props.visible, (value, prevValue) => {
  if (value) {
    console.log('💁‍♀️💁‍♀️', value, store.state.currentUser)
    updateDialogHeight()
  }
})

const state = reactive({
  cancelSubscriptionVisible: false,
  isCancelled: false,
  dialogHeight: null,
  info: {
    price: 0,
    period: 'month',
    cardType: '',
    cardLast4: '',
    cardExpMonth: 0,
    cardExpYear: 0,
    nextBillingDate: ''
  },
  loading: {
    gettingBillingInfo: false,
    isCancelling: false
  }
})

// const themeName = computed(() => store.state.currentUser.theme)
const appleSubscriptionIsActive = computed(() => store.state.currentUser.appleSubscriptionIsActive)
const subscriptionIsFree = computed(() => store.state.currentUser.stripeSubscriptionId === '🌷free')

const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  let element = dialog.value
  state.dialogHeight = utils.elementHeight(element)
}

// const incrementBy = () => {
//   const theme = themeName.value
//   console.log('🧢', theme)
//   state.count = state.count + 1
//   emit('updateCount', state.count)
//   // store.dispatch('themes/isSystem', false)
// }
</script>

<template lang="pug">
dialog.narrow.user-billing(v-if="visible" :open="visible" @click.left.stop ref="dialog" :style="{'max-height': state.dialogHeight + 'px'}")
  //- v-if subscriptionIsFree
  section
    p alsdkfj
  template(v-if="appleSubscriptionIsActive")
    section
      p
        img.icon(src="@/assets/apple.svg")
        span Because you upgraded on iOS, your subscription is managed by Apple{{' '}}
        a(href="https://support.apple.com/billing")
          span (More Info)

</template>

<style lang="stylus">
// .component-name
</style>
