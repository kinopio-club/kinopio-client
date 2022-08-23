<template lang="pug">
.row.collaboration-info(v-if="visible" @click.left.stop="closeDialogs")
  .badge.secondary.button-badge(@click.left.prevent.stop="toggleFilterShowAbsoluteDates" @touchend.prevent.stop="toggleFilterShowAbsoluteDates")
    img.icon.time(src="@/assets/time.svg")
    span.name {{dateUpdatedAt}}
  .users
    //- created by
    template(v-if="createdByUserIsNotEmpty")
      .badge.button-badge(:style="{background: createdByUser.color}" title="Created by" @click.left.stop="toggleUserDetails(createdByUser)")
        User(:user="createdByUser" :isClickable="false" :detailsOnRight="true" :isSmall="true" :hideYouLabel="true" :labelBadge="'Creator'")
        span.name {{createdByUser.name}}
        UserDetails(:visible="userDetailsIsVisibleForCreatedByUser" :user="createdByUser")
    //- updated by
    template(v-if="isUpdatedByDifferentUser")
      .badge.button-badge(:style="{background: updatedByUser.color}" title="Last edited by" @click.left.stop="toggleUserDetails(updatedByUser)")
        img.icon(src="@/assets/brush.svg")
        User(:user="updatedByUser" :isClickable="false" :detailsOnRight="true" :isSmall="true" :hideYouLabel="true" :labelBadge="'Updater'")
        span.name {{updatedByUser.name}}
        UserDetails(:visible="userDetailsIsVisibleForUpdatedByUser" :user="updatedByUser")
    //- created through api
    .badge.secondary.system-badge(v-if="card.isCreatedThroughPublicApi" title="Created via public API")
      img.icon.system(src="@/assets/system.svg")
</template>

<script>
import UserDetails from '@/components/dialogs/UserDetails.vue'
import User from '@/components/User.vue'
import utils from '@/utils.js'

let dateIsUpdated
let updatedAbsoluteDate

export default {
  name: 'CardCollaborationInfo',
  components: {
    UserDetails,
    User
  },
  props: {
    visible: Boolean,
    createdByUser: Object,
    updatedByUser: Object,
    card: Object,
    parentElement: Object
  },
  data () {
    return {
      selectedUser: {},
      userDetailsIsVisibleForCreatedByUser: false,
      userDetailsIsVisibleForUpdatedByUser: false
    }
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'triggerCardDetailsCloseDialogs' && this.visible) {
        this.closeComponentDialogs()
      }
    })
  },
  mounted () {
    dateIsUpdated = false
    updatedAbsoluteDate = ''
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
    }
  },
  methods: {
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
    closeDialogs () {
      this.closeComponentDialogs()
      this.$emit('closeDialogs')
    },
    closeComponentDialogs () {
      this.userDetailsIsVisibleForCreatedByUser = false
      this.userDetailsIsVisibleForUpdatedByUser = false
      this.selectedUser = {}
    },
    toggleFilterShowAbsoluteDates () {
      this.closeDialogs()
      const value = !this.$store.state.currentUser.filterShowAbsoluteDates
      this.$store.dispatch('currentUser/toggleFilterShowAbsoluteDates', value)
    },
    toggleUserDetails (user) {
      let shouldHideDialog
      const userIsCreatedByUser = user.id === this.createdByUser.id
      const userIsUpdatedByUser = user.id === this.updatedByUser.id
      const createdByUserDetailsIsVisible = userIsCreatedByUser && this.userDetailsIsVisibleForCreatedByUser
      const updatedByUserDetailsIsVislble = userIsUpdatedByUser && this.userDetailsIsVisibleForUpdatedByUser
      if (createdByUserDetailsIsVisible || updatedByUserDetailsIsVislble) {
        shouldHideDialog = true
      }
      this.closeDialogs()
      if (shouldHideDialog) { return }
      this.selectedUser = user
      if (userIsCreatedByUser) {
        this.userDetailsIsVisibleForCreatedByUser = true
      } else {
        this.userDetailsIsVisibleForUpdatedByUser = true
      }
      this.$nextTick(() => {
        this.scrollIntoView()
      })
    },
    scrollIntoView () {
      const element = document.querySelector('dialog.user-details')
      utils.scrollIntoView(element)
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
</style>
