<template lang="pug">
.row.space-details-info(@click.left="closeDialogsAndEmit")

  //- Space Meta

  .row.space-info-wrap
    .button-wrap(@click.left.stop="toggleBackgroundIsVisible")
      BackgroundPreview(:space="currentSpace" :isButton="true" :buttonIsActive="backgroundIsVisible")
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
      Background(:visible="backgroundIsVisible" @updateSpaces="updateSpaces")
    //- Name
    .textarea-wrap(:class="{'full-width': shouldHidePin}")
      textarea.name(
        :disabled="!isSpaceMember"
        ref="name"
        rows="1"
        placeholder="name"
        v-model="spaceName"
        @keydown.enter.stop.prevent="closeAllDialogs"
      )

  //- Pin Dialog
  .title-row(v-if="!shouldHidePin")
    .button-wrap(@click.left="toggleDialogIsPinned" title="Pin dialog")
      button.small-button(:class="{active: dialogIsPinned}")
        img.icon.pin(src="@/assets/pin.svg")

.row.align-items-top(v-if="!isSpaceMember")
  .badge.info(v-if="!spacePrivacyIsOpen") Read Only
  .badge.success(v-if="spacePrivacyIsOpen") Open to All
  .badge.status(v-if="showInExplore")
    img.icon.sunglasses(src="@/assets/sunglasses.svg")
    span Explore

//- Space Privacy and Explore

.row.align-items-top(v-if="isSpaceMember")
  //- Privacy
  PrivacyButton(:privacyPickerIsVisible="privacyPickerIsVisible" :showShortName="true" @togglePrivacyPickerIsVisible="togglePrivacyPickerIsVisible" @closeDialogs="closeDialogs" @updateSpaces="updateSpaces")

  .button-wrap
    button(@click="toggleSettingsIsVisible" :class="{active: settingsIsVisible}")
      img.icon.settings(src="@/assets/settings.svg")
      span Settings

//- .row.align-items-top(v-if="!isSpaceMember && !showInExplore")
//-   //- Explore Ask
//-   AskToAddToExplore

//- Space Settings
section.subsection.space-settings(v-if="settingsIsVisible")
  //- Background
  .row
    button(@click.left.stop="toggleBackgroundIsVisible")
      BackgroundPreview(:space="currentSpace")
      span Background
  //- Explore
  .row
    AddToExplore(@updateSpaces="updateSpaces")
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
        //- Hide Space
        button(@click.stop="toggleHideSpace" :class="{ active: currentSpaceIsHidden }")
          img.icon(v-if="!currentSpaceIsHidden" src="@/assets/view.svg")
          img.icon(v-if="currentSpaceIsHidden" src="@/assets/view-hidden.svg")
          span Hide
    .button-wrap(v-if="!isSpaceMember")
      button(@click.left="duplicateSpace")
        img.icon.add(src="@/assets/add.svg")
        span Duplicate

</template>

<script>
import Background from '@/components/dialogs/Background.vue'
import BackgroundPreview from '@/components/BackgroundPreview.vue'
import Loader from '@/components/Loader.vue'
import PrivacyButton from '@/components/PrivacyButton.vue'
import AddToExplore from '@/components/AddToExplore.vue'
import AskToAddToExplore from '@/components/AskToAddToExplore.vue'
import templates from '@/data/templates.js'
import cache from '@/cache.js'

export default {
  name: 'SpaceDetailsInfo',
  emits: ['updateSpaces', 'closeDialogs', 'updateDialogHeight'],
  components: {
    Background,
    BackgroundPreview,
    Loader,
    PrivacyButton,
    AddToExplore,
    AskToAddToExplore
  },
  props: {
    shouldHidePin: Boolean,
    currentSpaceIsHidden: Boolean
  },
  mounted () {
    this.textareaSize()
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'triggerSpaceDetailsCloseDialogs') {
        this.closeDialogs()
      } else if (mutation.type === 'triggerFocusSpaceDetailsName') {
        this.$nextTick(() => {
          this.$nextTick(() => {
            const element = this.$refs.name
            if (!element) { return }
            element.focus()
            element.setSelectionRange(0, element.value.length)
          })
        })
      } else if (mutation.type === 'currentSpace/restoreSpace') {
        // reset and update textareaSize
        if (!this.dialogIsPinned) { return }
        const element = this.$refs.name
        if (!element) { return }
        element.style.height = 0
        this.$nextTick(() => {
          this.textareaSize()
        })
      }
    })
  },
  data () {
    return {
      backgroundIsVisible: false,
      privacyPickerIsVisible: false,
      settingsIsVisible: false
    }
  },
  computed: {
    currentSpaceIsTemplate () {
      const id = this.currentSpace.id
      const templateSpaceIds = templates.spaces().map(space => space.id)
      return templateSpaceIds.includes(id)
    },
    spacePrivacyIsOpen () { return this.$store.state.currentSpace.privacy === 'open' },
    showInExplore () { return this.$store.state.currentSpace.showInExplore },
    spaceName: {
      get () {
        return this.$store.state.currentSpace.name
      },
      set (newName) {
        this.textareaSize()
        this.$store.dispatch('currentSpace/updateSpace', { name: newName })
        this.updateSpaces()
      }
    },
    currentSpace () { return this.$store.state.currentSpace },
    currentUser () { return this.$store.state.currentUser },
    isSpaceMember () {
      const currentSpace = this.$store.state.currentSpace
      return this.$store.getters['currentUser/isSpaceMember'](currentSpace)
    },
    pendingUpload () {
      const currentSpace = this.$store.state.currentSpace
      const pendingUploads = this.$store.state.upload.pendingUploads
      return pendingUploads.find(upload => {
        const isCurrentSpace = upload.spaceId === currentSpace.id
        const isInProgress = upload.percentComplete < 100
        return isCurrentSpace && isInProgress
      })
    },
    remotePendingUpload () {
      const currentSpace = this.$store.state.currentSpace
      let remotePendingUploads = this.$store.state.remotePendingUploads
      return remotePendingUploads.find(upload => {
        const inProgress = upload.percentComplete < 100
        const isSpace = upload.spaceId === currentSpace.id
        return inProgress && isSpace
      })
    },
    dialogIsPinned () { return this.$store.state.spaceDetailsIsPinned },
    currentUserIsSpaceCollaborator () { return this.$store.getters['currentUser/isSpaceCollaborator']() }

  },
  methods: {
    removeCurrentSpace () {
      const currentSpaceId = this.$store.state.currentSpace.id
      const currentUserIsSpaceCollaborator = this.$store.getters['currentUser/isSpaceCollaborator']()
      if (currentUserIsSpaceCollaborator) {
        this.$store.dispatch('currentSpace/removeCollaboratorFromSpace', this.this.$store.state.currentUser)
      } else {
        this.$store.dispatch('currentSpace/removeCurrentSpace')
        this.$store.commit('notifyCurrentSpaceIsNowRemoved', true)
      }
      this.updateSpaces()
      this.changeToLastSpace()
    },
    changeToLastSpace () {
      let spaces = cache.getAllSpaces().filter(space => {
        return this.$store.getters['currentUser/canEditSpace'](space)
      })

      spaces = spaces.filter(space => space.id !== this.currentSpace.id)
      if (spaces.length) {
        const cachedSpace = this.$store.getters.cachedOrOtherSpaceById(this.currentUser.prevLastSpaceId)
        this.$store.dispatch('currentSpace/changeSpace', { space: cachedSpace || spaces[0] })
      } else {
        this.addSpace()
      }
    },
    textareaSize () {
      const element = this.$refs.name
      const modifier = 1
      element.style.height = element.scrollHeight + modifier + 'px'
    },
    toggleDialogIsPinned () {
      const isPinned = !this.dialogIsPinned
      this.$store.dispatch('spaceDetailsIsPinned', isPinned)
    },
    toggleBackgroundIsVisible () {
      const isVisible = this.backgroundIsVisible
      this.closeDialogsAndEmit()
      this.backgroundIsVisible = !isVisible
    },
    togglePrivacyPickerIsVisible () {
      const isVisible = this.privacyPickerIsVisible
      this.closeDialogsAndEmit()
      this.privacyPickerIsVisible = !isVisible
    },
    toggleSettingsIsVisible () {
      const isVisible = this.settingsIsVisible
      this.closeDialogsAndEmit()
      this.settingsIsVisible = !isVisible
      this.$emit('updateDialogHeight')
    },
    closeDialogs () {
      this.backgroundIsVisible = false
      this.privacyPickerIsVisible = false
    },
    closeDialogsAndEmit () {
      this.closeDialogs()
      this.$emit('closeDialogs')
    },
    updateSpaces () {
      this.$emit('updateSpaces')
    },
    closeAllDialogs () {
      this.$store.dispatch('closeAllDialogs', 'SpaceDetailsInfo')
    }
  }
}
</script>

<style lang="stylus">
.space-details-info
  align-items flex-start !important
  justify-content space-between

  .space-info-wrap
    margin 0
    .textarea-wrap
      width 145px
      &.full-width
        width 170px
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

.row.align-items-top
  align-items flex-start
  .privacy-button
    min-width 28px

.space-settings
  .background-preview
    vertical-align middle
    margin-right 5px
    .preview-wrap
      height 16px
      width 16px
      vertical-align 0px
      border-radius 4px
  .sunglasses
    margin-left 1px

</style>
