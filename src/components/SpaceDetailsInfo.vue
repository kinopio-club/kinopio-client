<template lang="pug">
.row.space-details-info(@click.left="closeDialogsAndEmit")

  //- Space Meta

  .row.space-info-wrap
    .button-wrap.background-preview-wrap(@click.left.stop="toggleBackgroundIsVisible")
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
      BackgroundPicker(:visible="backgroundIsVisible" @updateLocalSpaces="updateLocalSpaces")
    //- Name
    .textarea-wrap(:class="{'full-width': shouldHidePin}")
      textarea.name(
        :readonly="!isSpaceMember"
        ref="name"
        rows="1"
        placeholder="name"
        v-model="spaceName"
        @keydown.enter.stop.prevent="closeAllDialogs"
      )
      .textarea-loader(v-if="isLoadingSpace")
        Loader(:visible="true")

  //- Pin Dialog
  .title-row(v-if="!shouldHidePin")
    .button-wrap.title-row-small-button-wrap(@click.left="toggleDialogIsPinned" title="Pin dialog")
      button.small-button(:class="{active: dialogIsPinned}")
        img.icon.pin(src="@/assets/pin.svg")

ReadOnlySpaceInfoBadges

//- member options
.row(v-if="isSpaceMember")
  //- Privacy
  PrivacyButton(:privacyPickerIsVisible="privacyPickerIsVisible" :showShortName="true" @togglePrivacyPickerIsVisible="togglePrivacyPickerIsVisible" @closeDialogs="closeDialogs" @updateLocalSpaces="updateLocalSpaces")
  FavoriteSpaceButton(@updateLocalSpaces="updateLocalSpaces")
  //- Settings
  .button-wrap
    button(@click="toggleSettingsIsVisible" :class="{active: settingsIsVisible}")
      img.icon.settings(src="@/assets/settings.svg")
      span Settings

//- read only options
.row(v-if="!isSpaceMember")
  FavoriteSpaceButton(@updateLocalSpaces="updateLocalSpaces")
  .button-wrap
    button(@click="toggleSettingsIsVisible" :class="{active: settingsIsVisible}")
      img.icon.settings(src="@/assets/settings.svg")
      span Settings

//- Space Settings
template(v-if="settingsIsVisible")
  //- read only space settings
  section.subsection.space-settings(v-if="!isSpaceMember")
    .row
      //- Duplicate
      .button-wrap
        button(@click.left="duplicateSpace")
          img.icon.add(src="@/assets/add.svg")
          span Duplicate
      //- Export
      .button-wrap(:class="{'dialog-is-pinned': dialogIsPinned}")
        button(@click.left.stop="toggleExportIsVisible" :class="{ active: exportIsVisible }")
          span Export
        ImportExport(:visible="exportIsVisible" :isExport="true")

  //- member space settings
  section.subsection.space-settings(v-if="isSpaceMember")
    .row
      //- Template
      .button-wrap(@click.left.prevent="toggleCurrentSpaceIsUserTemplate" @keydown.stop.enter="toggleCurrentSpaceIsUserTemplate")
        button(:class="{ active: currentSpaceIsUserTemplate }")
          img.icon.templates(src="@/assets/templates.svg")
          span Mark as Template
      //- Export
      .button-wrap(:class="{'dialog-is-pinned': dialogIsPinned}")
        button(@click.left.stop="toggleExportIsVisible" :class="{ active: exportIsVisible }")
          span Export
          ImportExport(:visible="exportIsVisible" :isExport="true")
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
          button(@click.stop="toggleHideSpace" :class="{ active: currentSpaceIsHidden }")
            img.icon(v-if="!currentSpaceIsHidden" src="@/assets/view.svg")
            img.icon(v-if="currentSpaceIsHidden" src="@/assets/view-hidden.svg")
            span Hide
</template>

<script>
import BackgroundPicker from '@/components/dialogs/BackgroundPicker.vue'
import BackgroundPreview from '@/components/BackgroundPreview.vue'
import Loader from '@/components/Loader.vue'
import PrivacyButton from '@/components/PrivacyButton.vue'
import templates from '@/data/templates.js'
import ImportExport from '@/components/dialogs/ImportExport.vue'
import ReadOnlySpaceInfoBadges from '@/components/ReadOnlySpaceInfoBadges.vue'
import FavoriteSpaceButton from '@/components/FavoriteSpaceButton.vue'
import cache from '@/cache.js'

export default {
  name: 'SpaceDetailsInfo',
  emits: ['updateLocalSpaces', 'closeDialogs', 'updateDialogHeight', 'addSpace', 'removeSpaceId'],
  components: {
    BackgroundPicker,
    BackgroundPreview,
    Loader,
    PrivacyButton,
    ReadOnlySpaceInfoBadges,
    ImportExport,
    FavoriteSpaceButton
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
      if (mutation.type === 'triggerCloseChildDialogs') {
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
      settingsIsVisible: false,
      exportIsVisible: false
    }
  },
  computed: {
    isLoadingSpace () { return this.$store.state.isLoadingSpace },
    currentSpaceIsTemplate () {
      const id = this.currentSpace.id
      const templateSpaceIds = templates.spaces().map(space => space.id)
      return templateSpaceIds.includes(id)
    },
    currentSpaceIsUserTemplate () { return this.currentSpace.isTemplate },
    showInExplore () { return this.$store.state.currentSpace.showInExplore },
    spaceName: {
      get () {
        return this.$store.state.currentSpace.name
      },
      set (newName) {
        this.textareaSize()
        this.$store.dispatch('currentSpace/updateSpace', { name: newName })
        this.updateLocalSpaces()
        this.$store.commit('triggerUpdateWindowTitle')
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
    toggleCurrentSpaceIsUserTemplate () {
      const value = !this.currentSpaceIsUserTemplate
      this.$store.dispatch('currentSpace/updateSpace', { isTemplate: value })
      this.updateLocalSpaces()
    },
    duplicateSpace () {
      this.$store.dispatch('currentSpace/duplicateSpace')
      this.updateLocalSpaces()
    },
    updateDialogHeight () {
      this.$emit('updateDialogHeight')
    },
    toggleHideSpace () {
      const value = !this.currentSpaceIsHidden
      this.$store.dispatch('currentSpace/updateSpace', { isHidden: value })
      this.updateLocalSpaces()
      this.$store.commit('notifySpaceIsHidden', value)
    },
    removeCurrentSpace () {
      const currentSpaceId = this.$store.state.currentSpace.id
      const currentUserIsSpaceCollaborator = this.$store.getters['currentUser/isSpaceCollaborator']()
      if (currentUserIsSpaceCollaborator) {
        this.$store.dispatch('currentSpace/removeCollaboratorFromSpace', this.$store.state.currentUser)
      } else {
        this.$store.dispatch('currentSpace/removeCurrentSpace')
        this.$store.commit('notifyCurrentSpaceIsNowRemoved', true)
      }
      this.$emit('removeSpaceId', currentSpaceId)
      this.changeToPrevSpace()
      this.$nextTick(() => {
        this.updateLocalSpaces()
      })
    },
    changeToPrevSpace () {
      let spaces = cache.getAllSpaces().filter(space => {
        return this.$store.getters['currentUser/canEditSpace'](space)
      })
      spaces = spaces.filter(space => space.id !== this.currentSpace.id)
      const recentSpace = spaces[0]
      if (this.$store.state.prevSpaceIdInSession) {
        this.$store.dispatch('currentSpace/loadPrevSpaceInSession')
      } else if (recentSpace) {
        this.$store.dispatch('currentSpace/changeSpace', recentSpace)
      } else {
        this.$emit('addSpace')
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
    toggleExportIsVisible () {
      const isVisible = this.exportIsVisible
      this.closeDialogsAndEmit()
      this.exportIsVisible = !isVisible
      this.$emit('updateDialogHeight')
    },
    closeDialogs () {
      this.backgroundIsVisible = false
      this.privacyPickerIsVisible = false
      this.exportIsVisible = false
    },
    closeDialogsAndEmit () {
      this.closeDialogs()
      this.$emit('closeDialogs')
    },
    updateLocalSpaces () {
      this.$emit('updateLocalSpaces')
    },
    closeAllDialogs () {
      this.$store.dispatch('closeAllDialogs')
    }
  }
}
</script>

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
