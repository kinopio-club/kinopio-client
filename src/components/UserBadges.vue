<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import userBadges from '@/data/userBadges.json'
const store = useStore()

const props = defineProps({
  user: Object
})
const state = reactive({
  name: '',
  description: ''
})

const isBadges = computed(() => {
  const badges = ['isSpectator', 'isUpgraded', 'isModerator', 'isDonor', 'isAmbassador']
  return badges.find(badge => props.user[badge])
})

const toggleDescription = (name) => {
  if (state.name === name) {
    state.name = ''
    state.description = ''
    return
  }
  const badge = userBadges.find(userBadge => userBadge.name === name)
  state.name = badge.name
  state.description = badge.description
}
</script>

<template lang="pug">
.row.user-badges(v-if="isBadges")
  //- Spectator
  .badge.button-badge.status(v-if="user.isSpectator" @click.stop="toggleDescription('Spectators')" :class="{active: state.name === 'Spectators'}")
    span Spectator
  //- Upgraded
  .badge.button-badge.success.badge-upgraded(v-if="user.isUpgraded" @click.stop="toggleDescription('Upgraded')" :class="{active: state.name === 'Upgraded'}")
    span Upgraded
  //- Donor
  .badge.button-badge.success.badge-donor(v-if="user.isDonor" @click.stop="toggleDescription('Donor')" :class="{active: state.name === 'Donor'}")
    span Donor
  //- Moderator
  .badge.button-badge.info.badge-moderator(v-if="user.isModerator" @click.stop="toggleDescription('Moderator')" :class="{active: state.name === 'Moderator'}")
    span Moderator
  //- Ambassador
  .badge.button-badge.success.badge-ambassador(v-if="user.isAmbassador" @click.stop="toggleDescription('Ambassador')" :class="{active: state.name === 'Ambassador'}")
    //- img.icon.heart(src="@/assets/heart.svg")
    span Ambassador

//- badge description
.row(v-if="state.description")
  section.subsection
    span(v-html="state.description")

//- card count
.row
  .badge.secondary
    img.icon.card(src="@/assets/card.svg")
    span {{user.cardsCreatedCount}} Cards Created

</template>

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
.badge-donor
  background var(--badge-donor) !important
.badge-upgraded
  background var(--badge-upgraded) !important
.badge-moderator
  background var(--badge-moderator) !important
.badge-ambassador
  background var(--badge-ambassador) !important
</style>
