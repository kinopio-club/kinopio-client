<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'

const store = useStore()

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
  dialogHeight: null
  // : false
})

watch(() => props.visible, (value, prevValue) => {
  if (value) {
    updateDialogHeight()
  }
})

const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  let element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}

const userId = computed(() => store.state.currentUser.id)
const copy = async (event, type) => {
  store.commit('clearNotificationsWithPosition')
  const position = utils.cursorPositionInPage(event)
  const apiKey = store.state.currentUser.apiKey
  let text = userId.value
  if (type === 'apiKey') {
    text = apiKey
  }
  try {
    await navigator.clipboard.writeText(text)
    store.commit('addNotificationWithPosition', { message: 'Copied', position, type: 'success', layer: 'app', icon: 'checkmark' })
    console.info(`🍇 copied ${type}`)
  } catch (error) {
    console.warn('🚑 copyText', error)
    store.commit('addNotificationWithPosition', { message: 'Copy Error', position, type: 'danger', layer: 'app', icon: 'cancel' })
  }
}
</script>

<template lang="pug">
dialog.narrow.user-developer-info(v-if="props.visible" :open="props.visible" @click.left.stop ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}")
  section
    .row.title-row
      span Developer
      .button-wrap
        a(href="https://help.kinopio.club/api")
          button.small-button
            span API Docs{{' '}}
            img.icon.visit(src="@/assets/visit.svg")

  //- user id
  section
    p User Id
    .row
      code.badge.secondary {{ userId }}
    .row
      .button-wrap
        button(@click.left="copy($event, 'userId')")
          img.icon.copy(src="@/assets/copy.svg")
          span Copy UserId
  //- api key
  section
    .row
      p
        img.icon.key(src="@/assets/key.svg")
        span Keep your API Key secret
    .row
      p.badge.danger.copy-api-keys
        .button-wrap
          button(@click.left="copy($event, 'apiKey')")
            img.icon.copy(src="@/assets/copy.svg")
            span Copy API Key
        p Anyone with your key can read, edit, and remove your cards and spaces
</template>

<style lang="stylus">
dialog.user-developer-info
  overflow auto
  .copy-api-keys
    padding-top 4px
    padding-bottom 4px
</style>
