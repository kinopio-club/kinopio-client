<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

import utils from '@/utils.js'
import Loader from '@/components/Loader.vue'

const globalStore = useGlobalStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()

const dialogElement = ref(null)

onMounted(() => {
  window.addEventListener('resize', updateDialogHeight)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', updateDialogHeight)
//   unsubscribe()
})

const props = defineProps({
  visible: Boolean
})
const state = reactive({
  dialogHeight: null,
  regenInfoIsVisible: false,
  isLoading: false
})

watch(() => props.visible, (value, prevValue) => {
  if (value) {
    updateDialogHeight()
  }
})

const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  const element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}

const userId = computed(() => userStore.id)
const censor = (value) => {
  const uncensoredCharacters = 5
  const uncensored = value.slice(-uncensoredCharacters)
  const toСensor = value.slice(0, -uncensoredCharacters)
  const censored = toСensor.replace(/[^-]/g, 'x') // replace every character that isn't `-`
  return censored + uncensored
}
const censoredAppApiKey = computed(() => censor(userStore.apiKey)) // TODO use appApiKey

const copy = async (event, type) => {
  globalStore.clearNotificationsWithPosition()
  const position = utils.cursorPositionInPage(event)
  const apiKey = userStore.apiKey // TODO use appApiKey
  let text = userId.value
  if (type === 'apiKey') {
    text = apiKey
  }
  try {
    await navigator.clipboard.writeText(text)
    globalStore.addNotificationWithPosition({ message: 'Copied', position, type: 'success', layer: 'app', icon: 'checkmark' })
    console.info(`🍇 copied ${type}`)
  } catch (error) {
    console.warn('🚑 copyText', error)
    globalStore.addNotificationWithPosition({ message: 'Copy Error', position, type: 'danger', layer: 'app', icon: 'cancel' })
  }
}

// refresh key

const toggleRegenInfoIsVisible = () => {
  state.regenInfoIsVisible = !state.regenInfoIsVisible
}
const refreshAppApiKey = () => {
  try {
    state.isLoading = true
    state.isError = false
    state.regenInfoIsVisible = false
    console.log('🐢🐢🐢🐢 TODO fetch here')
  } catch (error) {
    console.error('🚒 refreshAppApiKey', error)
    state.isError = true
  }
  // state.isLoading = false
}

</script>

<template lang="pug">
dialog.narrow.user-developer-info(v-if="props.visible" :open="props.visible" @click.left.stop ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}")
  section.title-section
    .row.title-row
      span API Access
      .button-wrap
        a(href="https://help.kinopio.club/api")
          button.small-button
            span API Docs{{' '}}
            img.icon.visit(src="@/assets/visit.svg")

  //- user id
  section
    span User Id
    .row
      code.badge.secondary {{ userId }}
    .row
      button(@click.left="copy($event, 'userId')")
        img.icon.copy(src="@/assets/copy.svg")
        span Copy UserId

  //- api key
  section
    .row.title-row
      span
        img.icon.key(src="@/assets/key.svg")
        span App API Key
      button.small-button(@click="toggleRegenInfoIsVisible" :class="{ active: state.regenInfoIsVisible }" title="Regenerate Key")
        img.icon.refresh(src="@/assets/refresh.svg")

    //- regenerate info
    .row(v-if="state.regenInfoIsVisible")
      .badge.danger.api-keys-info
        .row
          button(@click="refreshAppApiKey" :disabled="state.isLoading")
            img.icon.refresh(src="@/assets/refresh.svg")
            span Regenerate Key
        .row
          span This will disconnect your Kinopio account from any third party apps.
    //- key and loader
    .row
      code.badge.secondary
        template(v-if="state.isLoading")
          Loader(:visible="true")
          span Regenerating Key…
        template(v-else)
          span {{ censoredAppApiKey }}
    //- error handling
    .badge.danger(v-if="state.isError")
      span something went wrong
    //- copy key info
    .row
      .badge.danger.api-keys-info
        .row
          button(@click.left="copy($event, 'apiKey')" :disabled="state.isLoading")
            img.icon.copy(src="@/assets/copy.svg")
            span Copy Key
        p Anyone with your key can read, edit, and remove your cards and spaces. So keep it private.
</template>

<style lang="stylus">
dialog.user-developer-info
  overflow auto
  .api-keys-info
    padding-top 4px
    padding-bottom 4px
  .loader
    vertical-align -2px
</style>
