<template lang="pug">
.row.user-badges(v-if="isBadges")
  .badge.button-badge.status(v-if="user.isSpectator" @click.stop="spectatorDescription" :class="{active: activeBadge === 'spectator'}")
    span Spectator
  .badge.button-badge.success(v-if="user.isUpgraded" @click.stop="upgradedDescription" :class="{active: activeBadge === 'upgraded'}")
    span Upgraded
.row(v-if="description")
  .badge.status {{description}}
</template>

<script>
export default {
  name: 'UserBadges',
  props: {
    user: Object
  },
  data () {
    return {
      description: '',
      activeBadge: ''
    }
  },
  computed: {
    isBadges () { return this.user.isSpectator || this.user.isUpgraded },
    spacePrivacyIsOpen () { return this.$store.state.currentSpace.privacy === 'open' },
    isCurrentUser () { return this.user.id === this.$store.state.currentUser.id }
  },
  methods: {
    toggleDescription (description, badge) {
      if (this.description === description) {
        this.description = ''
        this.activeBadge = ''
      } else {
        this.description = description
        this.activeBadge = badge
      }
    },
    spectatorDescription () {
      const badge = 'spectator'
      let description
      if (this.spacePrivacyIsOpen) {
        description = 'Spectators can edit open spaces'
      } else {
        description = 'Spectators can view public spaces'
      }
      this.toggleDescription(description, badge)
    },
    upgradedDescription () {
      const badge = 'upgraded'
      let description
      if (this.isCurrentUser) {
        description = 'You can create unlimited cards – thanks for upgrading!'
      } else {
        description = 'Upgraded users can create unlimited cards'
      }
      this.toggleDescription(description, badge)
    }
  }
}
</script>

<style lang="stylus">
.user-badges
  margin-top 10px
</style>
