<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import BackgroundPicker from '@/components/dialogs/BackgroundPicker.vue'
import BackgroundPreview from '@/components/BackgroundPreview.vue'
import Loader from '@/components/Loader.vue'
import PrivacyButton from '@/components/PrivacyButton.vue'
import templates from '@/data/templates.js'
import ImportExportButton from '@/components/ImportExportButton.vue'
import ReadOnlySpaceInfoBadges from '@/components/ReadOnlySpaceInfoBadges.vue'
import AddToExplore from '@/components/AddToExplore.vue'
import AskToAddToExplore from '@/components/AskToAddToExplore.vue'
import FavoriteSpaceButton from '@/components/FavoriteSpaceButton.vue'
import AddToGroup from '@/components/dialogs/AddToGroup.vue'
import GroupLabel from '@/components/GroupLabel.vue'
import cache from '@/cache.js'
import utils from '@/utils.js'

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
  addToGroupIsVisible: false,
  textareaIsFocused: false,
  error: {
    updateSpaceGroup: false,
    removeSpaceGroup: false
  }
})

// user

const currentUser = computed(() => store.state.currentUser)
const currentUserIsSpaceCollaborator = computed(() => store.getters['currentUser/isSpaceCollaborator']())
const currentUserIsSpaceCreator = computed(() => store.getters['currentUser/isSpaceCreator']())
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

// space name textarea

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
const textareaFocus = () => {
  state.textareaIsFocused = true
}
const textareaBlur = () => {
  state.textareaIsFocused = false
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
const toggleAddToGroupIsVisible = () => {
  const isVisible = state.addToGroupIsVisible
  clearErrors()
  closeDialogsAndEmit()
  state.addToGroupIsVisible = !isVisible
}
const clearErrors = () => {
  state.error.updateSpaceGroup = false
  state.error.removeSpaceGroup = false
}
const closeDialogs = () => {
  state.backgroundIsVisible = false
  state.privacyPickerIsVisible = false
  state.addToGroupIsVisible = false
  clearErrors()
}
const closeDialogsAndEmit = () => {
  closeDialogs()
  emit('closeDialogs')
}
const closeAllDialogs = () => {
  store.dispatch('closeAllDialogs')
}

// group

const userGroups = computed(() => store.getters['groups/byUser']())
const spaceGroup = computed(() => store.getters['groups/spaceGroup']())
const currentUserIsGroupAdmin = (group) => {
  return store.getters['groups/groupUserIsAdmin']({
    userId: store.state.currentUser.id,
    groupId: group.id
  })
}
const toggleSpaceGroup = (group) => {
  clearErrors()
  const shouldRemoveSpaceGroup = currentSpace.value.groupId === group.id
  if (shouldRemoveSpaceGroup) {
    removeSpaceGroup(group)
  } else {
    updateSpaceGroup(group)
  }
}
const updateSpaceGroup = (group) => {
  const isSpaceCreator = currentUserIsSpaceCreator.value
  if (isSpaceCreator) {
    store.dispatch('groups/addCurrentSpace', group)
    updateLocalSpaces()
  } else {
    state.error.updateSpaceGroup = true
  }
}
const removeSpaceGroup = (group) => {
  const isGroupAdmin = currentUserIsGroupAdmin(group)
  const isSpaceCreator = currentUserIsSpaceCreator.value
  if (isGroupAdmin || isSpaceCreator) {
    store.dispatch('groups/removeCurrentSpace')
    updateLocalSpaces()
  } else {
    state.error.removeSpaceGroup = true
  }
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
    .textarea-wrap(:class="{'full-width': props.shouldHidePin, 'space-is-hidden': props.currentSpaceIsHidden}")
      textarea.name(
        :readonly="!isSpaceMember"
        ref="nameElement"
        rows="1"
        placeholder="name"
        v-model="spaceName"
        @keydown.enter.stop.prevent="closeAllDialogs"
        @focus="textareaFocus"
        @blur="textareaBlur"
      )
      .textarea-loader(v-if="isLoadingSpace")
        Loader(:visible="true")

  //- Pin Dialog
  .title-row(v-if="!props.shouldHidePin")
    .button-wrap.title-row-small-button-wrap(@click.left="toggleDialogIsPinned" title="Pin dialog")
      button.small-button(:class="{active: dialogIsPinned}")
        img.icon.pin(src="@/assets/pin.svg")

ReadOnlySpaceInfoBadges(:spaceGroup="spaceGroup")

//- member options
template(v-if="isSpaceMember")
  .row
    //- Privacy
    PrivacyButton(:privacyPickerIsVisible="state.privacyPickerIsVisible" :showShortName="true" @togglePrivacyPickerIsVisible="togglePrivacyPickerIsVisible" @closeDialogs="closeDialogs" @updateLocalSpaces="updateLocalSpaces")
      //- toggle space group | favorite
    template(v-if="userGroups")
      .button-wrap
        .segmented-buttons
          //- Group
          button.group-button(title="Add to Group" :class="{active: state.addToGroupIsVisible || spaceGroup}" @click.left.prevent.stop="toggleAddToGroupIsVisible" @keydown.stop.enter="toggleAddToGroupIsVisible")
            img.icon.group(src="@/assets/group.svg")
          //- Template
          button(:class="{ active: currentSpaceIsUserTemplate }" @click.left.prevent="toggleCurrentSpaceIsUserTemplate" @keydown.stop.enter="toggleCurrentSpaceIsUserTemplate" title="Mark as Template")
            img.icon.templates(src="@/assets/templates.svg")
          //- Favorite
          FavoriteSpaceButton(:parentIsDialog="true" @updateLocalSpaces="updateLocalSpaces")
        AddToGroup(:visible="state.addToGroupIsVisible" @selectGroup="toggleSpaceGroup" :groups="userGroups" :selectedGroup="spaceGroup" @closeDialogs="closeDialogs")
    template(v-else)
      //- Favorite
      FavoriteSpaceButton(:parentIsDialog="true" @updateLocalSpaces="updateLocalSpaces")
    //- Settings
    .button-wrap
      button(@click="toggleSettingsIsVisible" :class="{active: state.settingsIsVisible}" title="Space Settings")
        img.icon.settings(src="@/assets/settings.svg")
  .row(v-if="state.error.updateSpaceGroup")
    .badge.danger
      img.icon.cancel(src="@/assets/add.svg")
      span Only space creator can assign to group
  .row(v-if="state.error.removeSpaceGroup")
    .badge.danger
      img.icon.cancel(src="@/assets/add.svg")
      span Only space creator, or group admin, can remove from group

//- read only options
.row(v-if="!isSpaceMember")
  FavoriteSpaceButton(:parentIsDialog="true" @updateLocalSpaces="updateLocalSpaces")
  .button-wrap
    button(@click="toggleSettingsIsVisible" :class="{active: state.settingsIsVisible}")
      img.icon.settings(src="@/assets/settings.svg")
      span Settings

//- Space Settings
template(v-if="state.settingsIsVisible")
  section.subsection.space-settings
    .row(v-if="!isSpaceMember && !showInExplore")
      AskToAddToExplore
    .row(v-if="isSpaceMember")
      AddToExplore
    .row
      //- Import / Export
      ImportExportButton(@closeDialogs="closeDialogsAndEmit")
      //- Duplicate
      .button-wrap
        button(@click.left="duplicateSpace" title="Duplicate this Space")
          img.icon.add(src="@/assets/duplicate.svg")
          span Duplicate
    .row(v-if="isSpaceMember")
      .button-wrap
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

.group-button
  padding-right 6px

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

</style>
