<template lang="pug">
.row.collaboration-info(v-if="visible")
  .badge.secondary.button-badge(@click.left.prevent.stop="toggleFilterShowAbsoluteDates" @touchend.prevent.stop="toggleFilterShowAbsoluteDates")
    img.icon.time(src="@/assets/time.svg")
    span.name {{dateUpdatedAt}}
  .users
    .badge.button-badge(:style="{background: createdByUser.color}" title="Created by" @click.left.stop="toggleUserDetails(createdByUser)")
      User(:user="createdByUser" :isClickable="false" :detailsOnRight="true" :isSmall="true")
      span.name {{createdByUser.name}}
      UserDetails(:visible="userDetailsIsVisibleForCreatedByUser" :user="createdByUser")
    template(v-if="isUpdatedByDifferentUser")
      .badge.button-badge(:style="{background: updatedByUser.color}" title="Last edited by" @click.left.stop="toggleUserDetails(updatedByUser)")
        img.icon(src="@/assets/brush.svg")
        User(:user="updatedByUser" :isClickable="false" :detailsOnRight="true" :isSmall="true")
        span.name {{updatedByUser.name}}
        UserDetails(:visible="userDetailsIsVisibleForUpdatedByUser" :user="updatedByUser")
</template>

<script>
import UserDetails from '@/components/dialogs/UserDetails.vue'
import User from '@/components/User.vue'
import utils from '@/utils.js'

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
    card: Object
  },
  data () {
    return {
      selectedUser: {},
      userDetailsIsVisibleForCreatedByUser: false,
      userDetailsIsVisibleForUpdatedByUser: false
    }
  },
  computed: {
    isUpdatedByDifferentUser () { return this.createdByUser.id !== this.updatedByUser.id },
    dateUpdatedAt () {
      const date = this.card.nameUpdatedAt || this.card.createdAt
      const showAbsoluteDate = this.$store.state.currentUser.filterShowAbsoluteDates
      if (date) {
        if (showAbsoluteDate) {
          return new Date(date).toLocaleString()
        } else {
          return utils.shortRelativeTime(date)
        }
      } else {
        return 'Just now'
      }
    }
  },
  methods: {
    closeDialogs () {
      this.userDetailsIsVisibleForCreatedByUser = false
      this.userDetailsIsVisibleForUpdatedByUser = false
      this.selectedUser = {}
      this.$emit('closeDialogs')
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
    }

  }
}
</script>

<style lang="stylus">
.collaboration-info
  .users
    display flex
    flex-wrap wrap
</style>
