<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import UserTemplateSpaceList from '@/components/UserTemplateSpaceList.vue'
import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'
import cache from '@/cache.js'

import last from 'lodash-es/last'
import { nanoid } from 'nanoid'

const store = useStore()

const dialogElement = ref(null)

onMounted(() => {
  window.addEventListener('resize', updateDialogHeight)
})

const emit = defineEmits(['closeDialogs', 'addSpace'])

const props = defineProps({
  visible: Boolean,
  shouldAddSpaceDirectly: Boolean
})
watch(() => props.visible, (value, prevValue) => {
  closeAll()
  shouldHideFooter(false)
  if (value) {
    checkIfUserHasInboxSpace()
    store.commit('shouldExplicitlyHideFooter', true)
    updateDialogHeight()
  } else {
    store.commit('shouldExplicitlyHideFooter', false)
  }
})

const state = reactive({
  urlIsCopied: false,
  dialogHeight: null,
  hasInboxSpace: true,
  templatesIsLoading: true
})

const currentUserId = computed(() => store.state.currentUser.id)
const closeAll = () => {
  state.urlIsCopied = false
}

// styles

const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  let element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}
const shouldHideFooter = (value) => {
  store.commit('shouldExplicitlyHideFooter', value)
}

// space

const addSpace = () => {
  store.commit('isLoadingSpace', true)
  const noUserSpaces = !cache.getAllSpaces().length
  window.scrollTo(0, 0)
  if (noUserSpaces) {
    window.location.href = '/'
  } else {
    emit('closeDialogs')
    emit('addSpace')
  }
  if (props.shouldAddSpaceDirectly) {
    store.dispatch('closeAllDialogs')
    store.dispatch('currentSpace/addSpace')
    store.commit('triggerSpaceDetailsInfoIsVisible')
  }
  store.dispatch('analytics/event', 'AddSpaceButtons')
}
const addInboxSpace = () => {
  store.commit('isLoadingSpace', true)
  store.dispatch('closeAllDialogs')
  window.scrollTo(0, 0)
  store.dispatch('currentSpace/addInboxSpace')
}
const duplicateSpace = () => {
  store.dispatch('currentSpace/duplicateSpace')
}

// inbox space

const checkIfUserHasInboxSpace = async () => {
  const inboxSpace = await store.dispatch('currentUser/inboxSpace')
  state.hasInboxSpace = Boolean(inboxSpace)
}

// templates, import

const updateTemplatesIsLoading = (value) => {
  state.templatesIsLoading = value
}
const triggerImportIsVisible = () => {
  closeAll()
  store.dispatch('closeAllDialogs')
  store.commit('triggerImportIsVisible')
}
</script>

<template lang="pug">
dialog.add-space.narrow(
  v-if="visible"
  :open="visible"
  @touchend.stop
  @click.left.stop
  ref="dialogElement"
  :style="{'max-height': state.dialogHeight + 'px'}"
)
  section
    .row
      //- Add Space
      .segmented-buttons
        button.success(@click="addSpace")
          img.icon(src="@/assets/add.svg")
          span New Space

  //- Inbox
  section(v-if="!state.hasInboxSpace")
    button(@click="addInboxSpace")
      img.icon(src="@/assets/add.svg")
      img.icon.inbox-icon(src="@/assets/inbox.svg")
      span Inbox
    p For collecting ideas to figure out later
  //- Templates
  UserTemplateSpaceList(@updateDialogHeight="updateDialogHeight" @isLoading="updateTemplatesIsLoading")
  //- Import
  section
    .row
      //- import
      .button-wrap
        button(@click="triggerImportIsVisible") Import
      //- Duplicate
      .button-wrap
        button(@click.left="duplicateSpace" title="Duplicate this Space")
          img.icon.add(src="@/assets/duplicate.svg")
          span Duplicate
</template>
<style lang="stylus">
dialog.add-space
  overflow auto
  max-height calc(100vh - 230px)
  .inbox-icon
    margin 0
    margin-left 5px
</style>
