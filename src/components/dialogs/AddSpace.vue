<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, onUnmounted, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import UserTemplateSpaceList from '@/components/UserTemplateSpaceList.vue'
import UserSettingsNewSpaces from '@/components/subsections/UserSettingsNewSpaces.vue'
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
  templatesIsLoading: true,
  settingsIsVisible: false
})

const currentUserId = computed(() => store.state.currentUser.id)
const closeAll = () => {
  state.urlIsCopied = false
  state.settingsIsVisible = false
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

const addSpace = async () => {
  store.commit('isLoadingSpace', true)
  const cachedSpaces = await cache.getAllSpaces()
  const noUserSpaces = !cachedSpaces.length
  window.scrollTo(0, 0)
  if (noUserSpaces) {
    window.location.href = '/'
  } else {
    emit('closeDialogs')
    emit('addSpace')
  }
  if (props.shouldAddSpaceDirectly) {
    store.dispatch('closeAllDialogs')
    await store.dispatch('currentSpace/addSpace')
    store.commit('triggerSpaceDetailsInfoIsVisible')
  }
  store.dispatch('analytics/event', 'addSpaceButtons')
}
const addInboxSpace = async () => {
  store.commit('isLoadingSpace', true)
  store.dispatch('closeAllDialogs')
  window.scrollTo(0, 0)
  await store.dispatch('currentSpace/addInboxSpace')
}

// duplicate space

const duplicateCurrentSpace = async () => {
  await store.dispatch('currentSpace/duplicateSpace')
}
const duplicateSpace = async (space) => {
  emit('closeDialogs')
  store.commit('closeAllDialogs')
  try {
    store.commit('notifyIsDuplicatingSpace', true)
    // get space
    const cachedSpace = await cache.space(space.id)
    const remoteSpace = await store.dispatch('currentSpace/getRemoteSpace', space)
    const spaceToDuplicate = remoteSpace || cachedSpace
    // dupelicate
    await store.dispatch('currentSpace/duplicateSpace', spaceToDuplicate)
    // show space details info
    store.commit('triggerSpaceDetailsInfoIsVisible')
    await nextTick()
    store.commit('triggerFocusSpaceDetailsName')
  } catch (error) {
    console.error('🚒 duplicateSpace', error)
    store.commit('addNotification', { message: '(シ_ _)シ Something went wrong duplicating space, Please try again or contact support', type: 'danger' })
  }
  store.commit('notifyIsDuplicatingSpace', false)
}

// new space settings

const toggleSettingsIsVisible = () => {
  const value = state.settingsIsVisible
  closeAll()
  state.settingsIsVisible = !value
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
      //- New Space
      button.success(@click="addSpace")
        img.icon(src="@/assets/add.svg")
        span New Space
      button(@click.stop="toggleSettingsIsVisible" :class="{ active: state.settingsIsVisible }")
        img.icon.settings(src="@/assets/settings.svg")
    //- new space settings
    section.subsection(v-if="state.settingsIsVisible")
      UserSettingsNewSpaces
  //- Inbox
  section(v-if="!state.hasInboxSpace")
    button(@click="addInboxSpace")
      img.icon(src="@/assets/add.svg")
      img.icon.inbox-icon(src="@/assets/inbox.svg")
      span Inbox
    p For collecting ideas to figure out later
  //- Templates
  UserTemplateSpaceList(
    @updateDialogHeight="updateDialogHeight"
    @isLoading="updateTemplatesIsLoading"
    @selectSpace="duplicateSpace"
  )
  section
    input(placeholder="Type to generate a space")
    button Preview
  //- Import
  section
    .row
      //- import
      .button-wrap
        button(@click="triggerImportIsVisible") Import
      //- Duplicate
      .button-wrap
        button(@click.left="duplicateCurrentSpace" title="Duplicate this Space")
          img.icon.duplicate(src="@/assets/duplicate.svg")
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
