<template lang="pug">
template(v-if="isSpaceMember")
  .row.space-details-info(@click.left="closeDialogsAndEmit")
    //- Background
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
    //- Journal Date
    .button-wrap.date-picker-button(v-if="isCurrentSpaceJournal")
      button(@click.left.stop="toggleDatePickerIsVisible" :class="{active: datePickerIsVisible}")
        MoonPhase(v-if="currentSpace.moonPhase" :moonPhase="currentSpace.moonPhase")
      DatePicker(:visible="datePickerIsVisible" :date="journalDate" :title="'Journal Date'" @date="updateJournalNameWithDate")
    //- Name
    input(ref="name" placeholder="name" v-model="spaceName")
  //- Privacy
  .row.privacy-row
    PrivacyButton(:privacyPickerIsVisible="privacyPickerIsVisible" :showIconOnly="true" @togglePrivacyPickerIsVisible="togglePrivacyPickerIsVisible" @closeDialogs="closeDialogs" @updateSpaces="updateSpaces")
    AddToExplore(v-if="!shouldHideExplore" @updateSpaces="updateSpaces")

template(v-if="!isSpaceMember")
  .row.space-details-info.not-space-member(@click.left="closeDialogsAndEmit")
    .button-wrap(@click.left.stop="toggleBackgroundIsVisible")
      BackgroundPreview(:space="currentSpace" :isButton="true" :buttonIsActive="backgroundIsVisible")
      Background(:visible="backgroundIsVisible")
    p {{spaceName}}
  .row(v-if="shouldShowInExplore")
    .badge.status.explore-message
      img.icon.sunglasses(src="@/assets/sunglasses.svg")
      span In Explore
</template>

<script>
import Background from '@/components/dialogs/Background.vue'
import BackgroundPreview from '@/components/BackgroundPreview.vue'
import Loader from '@/components/Loader.vue'
import PrivacyButton from '@/components/PrivacyButton.vue'
import AddToExplore from '@/components/AddToExplore.vue'
import DatePicker from '@/components/dialogs/DatePicker.vue'
import MoonPhase from '@/components/MoonPhase.vue'
import utils from '@/utils.js'

export default {
  name: 'SpaceDetailsInfo',
  emits: ['updateSpaces', 'closeDialogs'],
  components: {
    Background,
    BackgroundPreview,
    Loader,
    PrivacyButton,
    AddToExplore,
    DatePicker,
    MoonPhase
  },
  props: {
    shouldHideExplore: Boolean
  },
  data () {
    return {
      backgroundIsVisible: false,
      privacyPickerIsVisible: false,
      datePickerIsVisible: false
    }
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
      }
    })
  },
  computed: {
    spaceName: {
      get () {
        return this.$store.state.currentSpace.name
      },
      set (newName) {
        this.$store.dispatch('currentSpace/updateSpace', { name: newName })
        this.updateSpaces()
      }
    },
    currentSpace () { return this.$store.state.currentSpace },
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
    shouldShowInExplore () {
      const privacy = this.$store.state.currentSpace.privacy
      if (privacy === 'private') { return false }
      return this.$store.state.currentSpace.showInExplore
    },
    isCurrentSpaceJournal () { return Boolean(this.currentSpace.moonPhase) },
    journalDate () {
      if (!this.isCurrentSpaceJournal) { return }
      let date = utils.JournalSpaceDeteObjectFromName(this.currentSpace.name)
      return date || new Date()
    }
  },
  methods: {
    updateJournalNameWithDate (date) {
      const name = utils.journalSpaceNameFromDate(date)
      console.log('🐸', date, name)
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
    toggleDatePickerIsVisible () {
      const isVisible = this.datePickerIsVisible
      this.closeDialogsAndEmit()
      this.datePickerIsVisible = !isVisible
    },
    closeDialogs () {
      this.backgroundIsVisible = false
      this.privacyPickerIsVisible = false
      this.datePickerIsVisible = false
    },
    closeDialogsAndEmit () {
      this.closeDialogs()
      this.$emit('closeDialogs')
    },
    updateSpaces () {
      this.$emit('updateSpaces')
    }
  }
}
</script>

<style lang="stylus">
.space-details-info
  > .button-wrap + input
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
  .privacy-button
    min-width 24px
  .date-picker-button
    margin-left 0 !important
    > button
      padding 5px
      padding-top 4px
      padding-left 6px
</style>
