<template lang="pug">
.row.collaboration-info(v-if="visible" @click.left.stop="closeDialogs")
  //- Share Card
  .button-wrap.share-button-wrap(@click.left.stop="toggleShareCardIsVisible" )
    button.small-button(:class="{active: shareCardIsVisible}")
      //- img.icon.share(src="@/assets/share.svg")
      span Share
    ShareCard(:visible="shareCardIsVisible" :card="card")

  .badge.secondary.button-badge(@click.left.prevent.stop="toggleFilterShowAbsoluteDates" @touchend.prevent.stop="toggleFilterShowAbsoluteDates")
    img.icon.time(src="@/assets/time.svg")
    span.name {{dateUpdatedAt}}
  .users(@click.stop="closeChildDialogs")
    //- created by
    template(v-if="createdByUserIsNotEmpty")
      UserLabelInline(:user="createdByUser" :isClickable="true" :title="'Created by'")
    //- updated by
    template(v-if="isUpdatedByDifferentUser")
      UserLabelInline(:user="updatedByUser" :isClickable="true" :title="'Updated by'")
    //- created through api
    .badge.secondary.system-badge(v-if="card.isCreatedThroughPublicApi" title="Created via public API")
      img.icon.system(src="@/assets/system.svg")

</template>

<script>
import UserLabelInline from '@/components/UserLabelInline.vue'
import ShareCard from '@/components/dialogs/ShareCard.vue'
import utils from '@/utils.js'

let dateIsUpdated
let updatedAbsoluteDate

export default {
  name: 'CardCollaborationInfo',
  components: {
    UserLabelInline,
    ShareCard
  },
  props: {
    visible: Boolean,
    createdByUser: Object,
    updatedByUser: Object,
    card: Object,
    parentElement: Object
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'triggerCardDetailsCloseDialogs' && this.visible) {
        this.closeDialogsFromParent()
      }
    })
  },
  mounted () {
    dateIsUpdated = false
    updatedAbsoluteDate = ''
  },
  data () {
    return {
      shareCardIsVisible: false
    }
  },
  computed: {
    createdByUserIsNotEmpty () { return utils.objectHasKeys(this.createdByUser) },
    isUpdatedByDifferentUser () { return this.createdByUser.id !== this.updatedByUser.id },
    dateUpdatedAt () {
      const date = this.card.nameUpdatedAt || this.card.createdAt
      const showAbsoluteDate = this.$store.state.currentUser.filterShowAbsoluteDates
      if (date) {
        if (showAbsoluteDate) {
          return this.absoluteDate(date)
        } else {
          return this.relativeDate(date)
        }
      } else {
        return 'now'
      }
    },
    userDetailsIsVisible () { return this.$store.state.userDetailsIsVisible }
  },
  methods: {
    userDetailsIsUser (user) {
      if (!this.userDetailsIsVisible) { return }
      const userDetailsUser = this.$store.state.userDetailsUser
      return user.id === userDetailsUser.id
    },
    absoluteDate (date) {
      if (dateIsUpdated && updatedAbsoluteDate) {
        return updatedAbsoluteDate
      }
      dateIsUpdated = true
      updatedAbsoluteDate = new Date(date).toLocaleString()
      return updatedAbsoluteDate
    },
    relativeDate (date) {
      if (dateIsUpdated) {
        return 'now'
      }
      dateIsUpdated = true
      return utils.shortRelativeTime(date)
    },
    closeDialogsFromParent () {
      this.shareCardIsVisible = false
      this.$store.commit('userDetailsIsVisible', false)
    },
    closeDialogs () {
      this.$store.commit('userDetailsIsVisible', false)
      this.shareCardIsVisible = false
      this.$emit('closeDialogs')
    },
    closeChildDialogs () {
      this.shareCardIsVisible = false
    },
    toggleFilterShowAbsoluteDates () {
      this.closeDialogs()
      const value = !this.$store.state.currentUser.filterShowAbsoluteDates
      this.$store.dispatch('currentUser/toggleFilterShowAbsoluteDates', value)
    },
    toggleShareCardIsVisible () {
      const isVisible = this.shareCardIsVisible
      this.$emit('closeDialogs')
      this.shareCardIsVisible = !isVisible
    },
    scrollParentIntoView () {
      const element = this.parentElement
      if (!element) { return }
      utils.scrollIntoView(element)
    }
  },
  watch: {
    visible (visible) {
      this.$nextTick(() => {
        if (visible) {
          this.scrollParentIntoView()
        }
      })
    }
  }
}
</script>

<style lang="stylus">
.collaboration-info
  .users
    display flex
    flex-wrap wrap
  .system-badge
    margin-top 1px
  .name
    color var(--primary)
  .share-button-wrap
    padding-right 6px
    padding-top 1px
    padding-bottom 1px
    cursor pointer
</style>
