<template lang="pug">
.row.user-badges(v-if="isBadges")
  //- Spectator
  .badge.button-badge.status(v-if="user.isSpectator" @click.stop="toggleDescription('Spectators')" :class="{active: name === 'Spectators'}")
    span Spectator
  //- Upgraded
  .badge.button-badge.success(v-if="user.isUpgraded" @click.stop="toggleDescription('Upgraded')" :class="{active: name === 'Upgraded'}")
    span Upgraded
  //- Moderator
  .badge.button-badge.info(v-if="user.isModerator" @click.stop="toggleDescription('Moderator')" :class="{active: name === 'Moderator'}")
    span Moderator
  //- Guide Maker
  .badge.button-badge.info(v-if="user.isGuideMaker" @click.stop="toggleDescription('GuideMaker')" :class="{active: name === 'GuideMaker'}")
    span Guide Maker
  //- Donor
  .badge.button-badge.info(v-if="user.isDonor" @click.stop="toggleDescription('Donor')" :class="{active: name === 'Donor'}")
    span Donor

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
    isBadges () {
      return this.user.isSpectator || this.user.isUpgraded || this.user.isModerator || this.user.isGuideMaker
    }
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
  flex-wrap wrap
  .badge
    margin-top 10px
</style>
