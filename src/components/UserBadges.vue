<template lang="pug">
.row.user-badges(v-if="isBadges")
  .badge.button-badge.status(v-if="user.isSpectator" @click.stop="toggleDescription('Spectators')" :class="{active: name === 'Spectators'}")
    span Spectator
  .badge.button-badge.success(v-if="user.isUpgraded" @click.stop="toggleDescription('Upgraded')" :class="{active: name === 'Upgraded'}")
    span Upgraded
.row(v-if="description")
  .badge.status(v-html="description")
</template>

<script>

import userBadges from '@/data/userBadges.json'

export default {
  name: 'UserBadges',
  props: {
    user: Object
  },
  data () {
    return {
      name: '',
      description: ''
    }
  },
  computed: {
    isBadges () { return this.user.isSpectator || this.user.isUpgraded }
  },
  methods: {
    toggleDescription (name) {
      if (this.name === name) {
        this.name = ''
        this.description = ''
        return
      }
      const badge = userBadges.find(userBadge => userBadge.name === name)
      this.name = badge.name
      this.description = badge.description
    }
  }
}
</script>

<style lang="stylus">
.user-badges
  margin-top 10px
</style>
