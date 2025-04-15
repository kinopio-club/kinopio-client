<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import BackgroundPicker from '@/components/dialogs/BackgroundPicker.vue'
import BackgroundPreview from '@/components/BackgroundPreview.vue'
import Loader from '@/components/Loader.vue'
import PrivacyButton from '@/components/PrivacyButton.vue'
import SpaceInfoBadges from '@/components/SpaceInfoBadges.vue'
import FavoriteSpaceButton from '@/components/FavoriteSpaceButton.vue'
import AddToGroup from '@/components/dialogs/AddToGroup.vue'
import GroupLabel from '@/components/GroupLabel.vue'
import SpaceOptions from '@/components/SpaceOptions.vue'
import cache from '@/cache.js'
import utils from '@/utils.js'
import consts from '@/consts.js'

import dayjs from 'dayjs'

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
  optionsIsVisible: false,
  addToGroupIsVisible: false,
  textareaIsFocused: false,
  error: {
    updateSpaceGroup: false,
    removeSpaceGroup: false
  }
})

const addSpace = () => {
  emit('addSpace')
}
const removeSpaceId = (value) => {
  emit('removeSpaceId', value)
}

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
  const remotePendingUploads = store.state.remotePendingUploads
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

// space name date

const spaceNameDate = computed(() => {
  const date = dayjs(new Date())
  return date.format(consts.nameDateFormat)
})
const spaceNameHasDate = computed(() => {
  const date = spaceNameDate.value
  return spaceName.value.includes(date)
})
const toggleSpaceNameDate = async () => {
  const element = nameElement.value
  const nameIsSelected = element.selectionStart === 0 && element.selectionEnd === element.value.length
  let newName = spaceName.value.trim()
  const date = spaceNameDate.value
  if (spaceNameHasDate.value) {
    newName = newName.replace(date, '')
  } else if (nameIsSelected) {
    newName = newName.slice(0, element.selectionStart) + newName.slice(element.selectionEnd)
    newName = `${newName} ${date}`
  } else {
    newName = `${newName} ${date}`
  }
  spaceName.value = newName // spaceName set()
  // refocus textarea
  element.focus()
  element.setSelectionRange(element.value.length, element.value.length)
  setTimeout(() => {
    textareaFocus()
    textareaSize()
  }, 20) // focus after all closeDialog events
}

// template

const toggleCurrentSpaceIsUserTemplate = async () => {
  const value = !currentSpaceIsUserTemplate.value
  await store.dispatch('currentSpace/updateSpace', { isTemplate: value })
  updateLocalSpaces()
}

// dialog

const dialogIsPinned = computed(() => store.state.spaceDetailsIsPinned)
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
const toggleOptionsIsVisible = () => {
  const isVisible = state.optionsIsVisible
  closeDialogsAndEmit()
  state.optionsIsVisible = !isVisible
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
  textareaBlur()
  clearErrors()
}
const closeDialogsAndEmit = () => {
  console.log('☎️')
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
const toggleSpaceGroup = async (group) => {
  clearErrors()
  const shouldRemoveSpaceGroup = currentSpace.value.groupId === group.id
  if (shouldRemoveSpaceGroup) {
    await removeSpaceGroup(group)
  } else {
    await updateSpaceGroup(group)
  }
  updateLocalSpaces()
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
      BackgroundPicker(:visible="state.backgroundIsVisible" :space="currentSpace" @updateLocalSpaces="updateLocalSpaces")
    //- Name
    .textarea-wrap(:class="{'full-width': props.shouldHidePin && !state.textareaIsFocused }")
      textarea.name(
        :readonly="!isSpaceMember"
        ref="nameElement"
        rows="1"
        placeholder="name"
        v-model="spaceName"
        @keydown.enter.stop.prevent="closeAllDialogs"
        @focus="textareaFocus"
        @click.stop
      )
      .textarea-loader(v-if="isLoadingSpace")
        Loader(:visible="true")

  //- Append date
  .title-row(v-if="state.textareaIsFocused")
    .button-wrap.title-row-small-button-wrap(@click.left="toggleSpaceNameDate" title="Add date to name")
      button.small-button.cal-button(:class="{ active: spaceNameHasDate }")
        img.icon.cal(src="@/assets/cal.svg")

  //- Pin Dialog
  .title-row(v-if="!props.shouldHidePin && !state.textareaIsFocused")
    .button-wrap.title-row-small-button-wrap(@click.left="toggleDialogIsPinned" title="Pin dialog")
      button.small-button(:class="{active: dialogIsPinned}")
        img.icon.pin(src="@/assets/pin.svg")

SpaceInfoBadges(:visible="!dialogIsPinned" :spaceGroup="spaceGroup")

//- members
template(v-if="isSpaceMember")
  .row.title-row
    div
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
    //- Options
    .button-wrap
      button(@click="toggleOptionsIsVisible" :class="{active: state.optionsIsVisible}" title="Space Options")
        span ⋯
  .row(v-if="state.error.updateSpaceGroup")
    .badge.danger
      img.icon.cancel(src="@/assets/add.svg")
      span Only space creator can assign to group
  .row(v-if="state.error.removeSpaceGroup")
    .badge.danger
      img.icon.cancel(src="@/assets/add.svg")
      span Only space creator, or group admin, can remove from group

//- read only users
.row(v-if="!isSpaceMember")
  FavoriteSpaceButton(:parentIsDialog="true" @updateLocalSpaces="updateLocalSpaces")
  .button-wrap
    button(@click="toggleOptionsIsVisible" :class="{active: state.optionsIsVisible}")
      span Options

SpaceOptions(
  :visible="state.optionsIsVisible"
  :isSpaceMember="isSpaceMember"
  :currentSpaceIsHidden="props.currentSpaceIsHidden"
  @closeDialogsAndEmit="closeDialogsAndEmit"
  @updateLocalSpaces="updateLocalSpaces"
  @removeSpaceId="removeSpaceId"
)
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

.icon.cal
  vertical-align 1px
</style>
