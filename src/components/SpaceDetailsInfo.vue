<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import BackgroundPicker from '@/components/dialogs/BackgroundPicker.vue'
import BackgroundPreview from '@/components/BackgroundPreview.vue'
import Loader from '@/components/Loader.vue'
import PrivacyButton from '@/components/PrivacyButton.vue'
import templates from '@/data/templates.js'
import ImportExport from '@/components/dialogs/ImportExport.vue'
import ReadOnlySpaceInfoBadges from '@/components/ReadOnlySpaceInfoBadges.vue'
import AddToExplore from '@/components/AddToExplore.vue'
import AskToAddToExplore from '@/components/AskToAddToExplore.vue'
import FavoriteSpaceButton from '@/components/FavoriteSpaceButton.vue'
import cache from '@/cache.js'

const store = useStore()

const nameElement = ref(null)

onMounted(() => {
  store.subscribe(async (mutation) => {
    if (mutation.type === 'triggerCloseChildDialogs') {
      closeDialogs()
    } else if (mutation.type === 'triggerFocusSpaceDetailsName') {
      await nextTick()
      await nextTick()
      const element = nameElement.value
      if (!element) { return }
      element.focus()
      element.setSelectionRange(0, element.value.length)
    } else if (mutation.type === 'currentSpace/restoreSpace') {
      // reset and update textareaSize
      if (!dialogIsPinned.value) { return }
      const element = nameElement.value
      if (!element) { return }
      element.style.height = 0
      await nextTick()
      textareaSize()
    }
  })
  textareaSize()
})

const emit = defineEmits(['updateLocalSpaces', 'closeDialogs', 'updateDialogHeight', 'addSpace', 'removeSpaceId'])

const props = defineProps({
  shouldHidePin: Boolean,
  currentSpaceIsHidden: Boolean
})

const state = reactive({
  backgroundIsVisible: false,
  privacyPickerIsVisible: false,
  settingsIsVisible: false,
  exportIsVisible: false
})

// user

const currentUser = computed(() => store.state.currentUser)
const currentUserIsSpaceCollaborator = computed(() => store.getters['currentUser/isSpaceCollaborator']())
const isSpaceMember = computed(() => {
  const currentSpace = store.state.currentSpace
  return store.getters['currentUser/isSpaceMember'](currentSpace)
})

// current space

const updateLocalSpaces = () => {
  emit('updateLocalSpaces')
}
const currentSpace = computed(() => store.state.currentSpace)
const isLoadingSpace = computed(() => store.state.isLoadingSpace)
const currentSpaceIsTemplate = computed(() => {
  const id = currentSpace.value.id
  const templateSpaceIds = templates.spaces().map(space => space.id)
  return templateSpaceIds.includes(id)
})
const currentSpaceIsUserTemplate = computed(() => currentSpace.value.isTemplate)
const pendingUpload = computed(() => {
  const currentSpace = store.state.currentSpace
  const pendingUploads = store.state.upload.pendingUploads
  return pendingUploads.find(upload => {
    const isCurrentSpace = upload.spaceId === currentSpace.id
    const isInProgress = upload.percentComplete < 100
    return isCurrentSpace && isInProgress
  })
})
const remotePendingUpload = computed(() => {
  const currentSpace = store.state.currentSpace
  let remotePendingUploads = store.state.remotePendingUploads
  return remotePendingUploads.find(upload => {
    const inProgress = upload.percentComplete < 100
    const isSpace = upload.spaceId === currentSpace.id
    return inProgress && isSpace
  })
})

// space name

const spaceName = computed({
  get () {
    return store.state.currentSpace.name
  },
  set (newName) {
    textareaSize()
    store.dispatch('currentSpace/updateSpace', { name: newName })
    updateLocalSpaces()
    store.commit('triggerUpdateWindowTitle')
  }
})
const textareaSize = () => {
  const element = nameElement.value
  const modifier = 1
  element.style.height = element.scrollHeight + modifier + 'px'
}

// show in explore

const showInExplore = computed(() => store.state.currentSpace.showInExplore)
const dialogIsPinned = computed(() => store.state.spaceDetailsIsPinned)

// template

const toggleCurrentSpaceIsUserTemplate = () => {
  const value = !currentSpaceIsUserTemplate.value
  store.dispatch('currentSpace/updateSpace', { isTemplate: value })
  updateLocalSpaces()
}

// duplicate

const duplicateSpace = () => {
  store.dispatch('currentSpace/duplicateSpace')
  updateLocalSpaces()
}

// hide

const toggleHideSpace = () => {
  const value = !props.currentSpaceIsHidden
  store.dispatch('currentSpace/updateSpace', { isHidden: value })
  updateLocalSpaces()
  store.commit('notifySpaceIsHidden', value)
}

// remove

const removeCurrentSpace = async () => {
  const currentSpaceId = store.state.currentSpace.id
  const currentUserIsSpaceCollaborator = store.getters['currentUser/isSpaceCollaborator']()
  if (currentUserIsSpaceCollaborator) {
    store.dispatch('currentSpace/removeCollaboratorFromSpace', store.state.currentUser)
  } else {
    store.dispatch('currentSpace/removeCurrentSpace')
    store.commit('notifyCurrentSpaceIsNowRemoved', true)
  }
  emit('removeSpaceId', currentSpaceId)
  changeToPrevSpace()
  await nextTick()
  updateLocalSpaces()
}
const changeToPrevSpace = () => {
  let spaces = cache.getAllSpaces().filter(space => {
    return store.getters['currentUser/canEditSpace'](space)
  })
  spaces = spaces.filter(space => space.id !== currentSpace.value.id)
  const recentSpace = spaces[0]
  if (store.state.prevSpaceIdInSession) {
    store.dispatch('currentSpace/loadPrevSpaceInSession')
  } else if (recentSpace) {
    store.dispatch('currentSpace/changeSpace', recentSpace)
  } else {
    emit('addSpace')
  }
}

// dialog

const updateDialogHeight = () => {
  emit('updateDialogHeight')
}
const toggleDialogIsPinned = () => {
  const isPinned = !dialogIsPinned.value
  store.dispatch('spaceDetailsIsPinned', isPinned)
}
const toggleBackgroundIsVisible = () => {
  const isVisible = state.backgroundIsVisible
  closeDialogsAndEmit()
  state.backgroundIsVisible = !isVisible
}
const togglePrivacyPickerIsVisible = () => {
  const isVisible = state.privacyPickerIsVisible
  closeDialogsAndEmit()
  state.privacyPickerIsVisible = !isVisible
}
const toggleSettingsIsVisible = () => {
  const isVisible = state.settingsIsVisible
  closeDialogsAndEmit()
  state.settingsIsVisible = !isVisible
  emit('updateDialogHeight')
}
const toggleExportIsVisible = () => {
  const isVisible = state.exportIsVisible
  closeDialogsAndEmit()
  state.exportIsVisible = !isVisible
  emit('updateDialogHeight')
}
const closeDialogs = () => {
  state.backgroundIsVisible = false
  state.privacyPickerIsVisible = false
  state.exportIsVisible = false
}
const closeDialogsAndEmit = () => {
  closeDialogs()
  emit('closeDialogs')
}
const closeAllDialogs = () => {
  store.dispatch('closeAllDialogs')
}
</script>

<template lang="pug">
.row.space-details-info(@click.left="closeDialogsAndEmit")
  //- Space Meta
  .row.space-info-wrap
    .button-wrap.background-preview-wrap(@click.left.stop="toggleBackgroundIsVisible")
      BackgroundPreview(:space="currentSpace" :isButton="true" :buttonIsActive="state.backgroundIsVisible")
      //- Background Upload Progress
      .uploading-container-footer(v-if="pendingUpload")
        .badge.info(:class="{absolute : pendingUpload.imageDataUrl}")
          Loader(:visible="true")
          span {{pendingUpload.percentComplete}}%
      //- Background Remote Upload Progress
      .uploading-container-footer(v-if="remotePendingUpload")
        .badge.info
          Loader(:visible="true")
          span {{remotePendingUpload.percentComplete}}%
      BackgroundPicker(:visible="state.backgroundIsVisible" @updateLocalSpaces="updateLocalSpaces")
    //- Name
    .textarea-wrap(:class="{'full-width': props.shouldHidePin}")
      textarea.name(
        :readonly="!isSpaceMember"
        ref="nameElement"
        rows="1"
        placeholder="name"
        v-model="spaceName"
        @keydown.enter.stop.prevent="closeAllDialogs"
      )
      .textarea-loader(v-if="isLoadingSpace")
        Loader(:visible="true")

  //- Pin Dialog
  .title-row(v-if="!props.shouldHidePin")
    .button-wrap.title-row-small-button-wrap(@click.left="toggleDialogIsPinned" title="Pin dialog")
      button.small-button(:class="{active: dialogIsPinned}")
        img.icon.pin(src="@/assets/pin.svg")

ReadOnlySpaceInfoBadges

//- member options
.row(v-if="isSpaceMember")
  //- Privacy
  PrivacyButton(:privacyPickerIsVisible="state.privacyPickerIsVisible" :showShortName="true" @togglePrivacyPickerIsVisible="togglePrivacyPickerIsVisible" @closeDialogs="closeDialogs" @updateLocalSpaces="updateLocalSpaces")
  FavoriteSpaceButton(@updateLocalSpaces="updateLocalSpaces")
  //- Settings
  .button-wrap
    button(@click="toggleSettingsIsVisible" :class="{active: state.settingsIsVisible}")
      img.icon.settings(src="@/assets/settings.svg")
      span Settings

//- read only options
.row(v-if="!isSpaceMember")
  FavoriteSpaceButton(@updateLocalSpaces="updateLocalSpaces")
  .button-wrap
    button(@click="toggleSettingsIsVisible" :class="{active: state.settingsIsVisible}")
      img.icon.settings(src="@/assets/settings.svg")
      span Settings

//- Space Settings
template(v-if="state.settingsIsVisible")
  //- read only space settings
  section.subsection.space-settings(v-if="!isSpaceMember")
    .row(v-if="!showInExplore")
      AskToAddToExplore
    .row
      //- Duplicate
      .button-wrap
        button(@click.left="duplicateSpace")
          img.icon.add(src="@/assets/add.svg")
          span Duplicate
      //- Export
      .button-wrap(:class="{'dialog-is-pinned': dialogIsPinned}")
        button(@click.left.stop="toggleExportIsVisible" :class="{ active: state.exportIsVisible }")
          span Export
        ImportExport(:visible="state.exportIsVisible" :isExport="true")

  //- member space settings
  section.subsection.space-settings(v-if="isSpaceMember")
    .row
      AddToExplore
    .row
      //- Template
      .button-wrap(@click.left.prevent="toggleCurrentSpaceIsUserTemplate" @keydown.stop.enter="toggleCurrentSpaceIsUserTemplate")
        button(:class="{ active: currentSpaceIsUserTemplate }")
          img.icon.templates(src="@/assets/templates.svg")
          span Mark as Template
      //- Export
      .button-wrap(:class="{'dialog-is-pinned': dialogIsPinned}")
        button(@click.left.stop="toggleExportIsVisible" :class="{ active: state.exportIsVisible }")
          span Export
          ImportExport(:visible="state.exportIsVisible" :isExport="true")
    .row(v-if="currentSpaceIsUserTemplate")
      //- Duplicate
      .button-wrap
        button(@click.left="duplicateSpace")
          img.icon.add(src="@/assets/add.svg")
          span Duplicate
    .row
      .button-wrap(v-if="isSpaceMember")
        .segmented-buttons
          //- Remove
          button.danger(@click.left="removeCurrentSpace" :class="{ disabled: currentSpaceIsTemplate }")
            template(v-if="currentUserIsSpaceCollaborator")
              img.icon.cancel(src="@/assets/add.svg")
              span Leave
            template(v-else)
              img.icon.remove(src="@/assets/remove.svg")
              span Remove
          //- Hide
          button(@click.stop="toggleHideSpace" :class="{ active: props.currentSpaceIsHidden }")
            img.icon(v-if="!props.currentSpaceIsHidden" src="@/assets/view.svg")
            img.icon(v-if="props.currentSpaceIsHidden" src="@/assets/view-hidden.svg")
            span Hide
</template>

<style lang="stylus">
.space-details-info
  align-items flex-start !important
  justify-content space-between
  margin-bottom 0 !important

  .space-info-wrap
    align-items flex-start
    margin 0
    .textarea-wrap
      width 200px
      margin-bottom 6px
      &.full-width
        width 225px
      .textarea-loader
        position absolute
        right 0
        top 0
        .loader
          width 14px
          height 14px
    textarea.name
      margin 0
      width 100%
    > .button-wrap + textarea
      margin 0
    > .button-wrap
      padding-right 6px
      > button
        width 24px
        height 24px
        background-size cover
        background-position center
    > .button-wrap + p
      margin-top 0
    &.not-space-member
      margin 0
      margin-bottom 10px
    .uploading-container-footer
      position absolute
      top 15px
      left 8px
      width 100px
      pointer-events none
      z-index 1
      .badge
        display inline-block
        &.absolute
          position absolute
          top 6px
          left 6px
    .title-row
      margin-left 6px

  .background-preview-wrap
    margin-bottom 6px

.space-settings
  .background-preview
    vertical-align middle
    margin-right 5px
    .preview-wrap
      height 16px
      width 16px
      vertical-align 0px
      border-radius 4px
  p
    white-space normal

  dialog.import-export
    left initial
    right 8px

.dialog-is-pinned
  dialog.import-export
    right -50px
</style>
