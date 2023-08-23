<template lang="pug">
.row.user-badges(v-if="isBadges")
  //- Spectator
  .badge.button-badge.status(v-if="user.isSpectator" @click.stop="toggleDescription('Spectators')" :class="{active: name === 'Spectators'}")
    span Spectator
  //- Upgraded
  .badge.button-badge.success(v-if="user.isUpgraded" @click.stop="toggleDescription('Upgraded')" :class="{active: name === 'Upgraded'}")
    span Upgraded
  //- Donor
  .badge.button-badge.success(v-if="user.isDonor" @click.stop="toggleDescription('Donor')" :class="{active: name === 'Donor'}")
    span Donor
  //- Moderator
  .badge.button-badge.info(v-if="user.isModerator" @click.stop="toggleDescription('Moderator')" :class="{active: name === 'Moderator'}")
    span Moderator
  //- Guide Maker
  .badge.button-badge.info(v-if="user.isGuideMaker" @click.stop="toggleDescription('GuideMaker')" :class="{active: name === 'GuideMaker'}")
    span Guide Maker

.row(v-if="description")
  section.subsection
    span(v-html="description")
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
      const badges = ['isSpectator', 'isUpgraded', 'isModerator', 'isGuideMaker', 'isDonor']
      return badges.find(badge => this.user[badge])
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
    span
      color var(--primary)
.status
  span
    color var(--primary)
</style>
