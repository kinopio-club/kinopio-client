<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useGroupStore } from '@/stores/useGroupStore'
import { useUploadStore } from '@/stores/useUploadStore'

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
import ItemDetailsDebug from '@/components/ItemDetailsDebug.vue'

const globalStore = useGlobalStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()
const groupStore = useGroupStore()
const uploadStore = useUploadStore()

const nameElement = ref(null)
let unsubscribes

onMounted(() => {
  textareaSize()

  const globalActionUnsubscribe = globalStore.$onAction(
    async ({ name, args }) => {
      if (name === 'triggerCloseChildDialogs') {
        closeDialogs()
      } else if (name === 'triggerFocusSpaceDetailsName') {
        await nextTick()
        await nextTick()
        const element = nameElement.value
        if (!element) { return }
        element.focus()
        element.setSelectionRange(0, element.value.length)
      }
    }
  )
  const spaceActionUnsubscribe = spaceStore.$onAction(
    async ({ name, args }) => {
      if (name === 'restoreSpace') {
        // reset and update textareaSize
        if (!dialogIsPinned.value) { return }
        const element = nameElement.value
        if (!element) { return }
        element.style.height = 0
        await nextTick()
        textareaSize()
      }
    }
  )
  unsubscribes = () => {
    globalActionUnsubscribe()
    spaceActionUnsubscribe()
  }
})
onBeforeUnmount(() => {
  unsubscribes()
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
  addToGroupIsVisible: false
})

const addSpace = () => {
  emit('addSpace')
}
const removeSpaceId = (value) => {
  emit('removeSpaceId', value)
}

// user

const currentUser = computed(() => userStore.getUserAllState)
const currentUserIsSpaceCollaborator = computed(() => userStore.getUserIsSpaceCollaborator)
const isSpaceMember = computed(() => userStore.getUserIsSpaceMember)

// current space

const updateLocalSpaces = () => {
  emit('updateLocalSpaces')
}
const currentSpace = computed(() => spaceStore.getSpaceAllState)
const isLoadingSpace = computed(() => globalStore.isLoadingSpace)
const currentSpaceIsUserTemplate = computed(() => currentSpace.value.isTemplate)
const pendingUpload = computed(() => {
  const currentSpace = spaceStore.getSpaceAllState
  const pendingUploads = uploadStore.pendingUploads
  return pendingUploads.find(upload => {
    const isCurrentSpace = upload.spaceId === currentSpace.id
    const isInProgress = upload.percentComplete < 100
    return isCurrentSpace && isInProgress
  })
})
const remotePendingUpload = computed(() => {
  const currentSpace = spaceStore.getSpaceAllState
  const remotePendingUploads = globalStore.remotePendingUploads
  return remotePendingUploads.find(upload => {
    const inProgress = upload.percentComplete < 100
    const isSpace = upload.spaceId === currentSpace.id
    return inProgress && isSpace
  })
})

// space name textarea

const spaceName = computed({
  get () {
    return spaceStore.name
  },
  set (newName) {
    textareaSize()
    spaceStore.updateSpace({ name: newName })
    updateLocalSpaces()
    globalStore.triggerUpdateWindowTitle()
  }
})
const textareaSize = () => {
  const element = nameElement.value
  const modifier = 1
  element.style.height = element.scrollHeight + modifier + 'px'
}

// template

const toggleCurrentSpaceIsUserTemplate = async () => {
  const value = !currentSpaceIsUserTemplate.value
  await spaceStore.updateSpace({ isTemplate: value })
  updateLocalSpaces()
}

// dialog

const dialogIsPinned = computed(() => globalStore.spaceDetailsIsPinned)
const updateDialogHeight = () => {
  emit('updateDialogHeight')
}
const toggleDialogIsPinned = () => {
  const isPinned = !dialogIsPinned.value
  globalStore.spaceDetailsIsPinned = isPinned
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
  closeDialogsAndEmit()
  state.addToGroupIsVisible = !isVisible
}
const closeDialogs = () => {
  state.backgroundIsVisible = false
  state.privacyPickerIsVisible = false
  state.addToGroupIsVisible = false
}
const closeDialogsAndEmit = () => {
  closeDialogs()
  emit('closeDialogs')
}
const closeAllDialogs = () => {
  globalStore.closeAllDialogs()
}

// group

const userGroups = computed(() => groupStore.getCurrentUserGroups)
const spaceGroup = computed(() => groupStore.getCurrentSpaceGroup)
const currentUserIsGroupAdmin = (group) => {
  return groupStore.getGroupUserIsAdmin({
    userId: userStore.id,
    groupId: group.id
  })
}
const toggleSpaceGroup = async (group) => {
  const shouldRemoveSpaceGroup = currentSpace.value.groupId === group.id
  if (shouldRemoveSpaceGroup) {
    await removeSpaceGroup(group)
  } else {
    await updateSpaceGroup(group)
  }
  updateLocalSpaces()
}
const updateSpaceGroup = (group) => {
  const isSpaceCreator = userStore.getUserIsSpaceCreator
  if (isSpaceCreator) {
    groupStore.addSpaceToGroup(group)
    updateLocalSpaces()
  } else {
    globalStore.addNotification({
      message: 'Only space creator can assign to group',
      type: 'danger'
    })
  }
}
const removeSpaceGroup = (group) => {
  const isGroupAdmin = currentUserIsGroupAdmin(group)
  const isSpaceCreator = userStore.getUserIsSpaceCreator
  if (isGroupAdmin || isSpaceCreator) {
    groupStore.removeSpaceFromGroup()
    updateLocalSpaces()
  } else {
    globalStore.addNotification({
      message: 'Only space creator, or group admin, can remove from group',
      type: 'danger'
    })
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
    .textarea-wrap(:class="{'full-width': props.shouldHidePin }")
      textarea.name(
        :readonly="!isSpaceMember"
        ref="nameElement"
        rows="1"
        placeholder="name"
        v-model="spaceName"
        @keydown.enter.stop.prevent="closeAllDialogs"
        @click.stop
      )
      .textarea-loader(v-if="isLoadingSpace")
        Loader(:visible="true")

  //- Pin Dialog
  .title-row(v-if="!props.shouldHidePin")
    .button-wrap.title-row-small-button-wrap(@click.left="toggleDialogIsPinned" title="Pin dialog")
      button.small-button(:class="{active: dialogIsPinned}")
        img.icon.pin(src="@/assets/pin.svg")
//- members
template(v-if="isSpaceMember")
  .row.title-row
    .info-buttons-wrap
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

SpaceInfoBadges(:visible="!dialogIsPinned" :spaceGroup="spaceGroup")
ItemDetailsDebug(:item="currentSpace")
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

.info-buttons-wrap
  display flex

.group-button
  padding-right 6px

</style>
