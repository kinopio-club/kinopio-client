<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useUserStore } from '@/stores/useUserStore'

import User from '@/components/User.vue'
import invite from '@/data/invite.js'
import GroupLabel from '@/components/GroupLabel.vue'

import randomColor from 'randomcolor'

const userStore = useUserStore()

const props = defineProps({
  inviteType: String, // 'group', 'edit', 'read'
  group: Object
})

const currentUser = computed(() => userStore.getUserAllState)
const inviteState = computed(() => {
  return invite.states().find(item => item.type === props.inviteType)
})
const friendlyName = computed(() => inviteState.value.friendlyName)
const randomUser = computed(() => {
  const luminosity = userStore.theme
  const color = randomColor({ luminosity })
  return { color }
})
</script>

<template lang="pug">
.invite-label
  //- group
  template(v-if="props.inviteType === 'group'")
    .symbols
      User(:user="currentUser" :isClickable="false" :key="currentUser.id" :isMedium="true" :hideYouLabel="true")
      GroupLabel(:group="props.group")

  //- edit
  template(v-if="props.inviteType === 'edit'")
    .symbols
      User(:user="currentUser" :isClickable="false" :key="currentUser.id" :isMedium="true" :hideYouLabel="true")
      User(:user="randomUser" :isClickable="false" :key="currentUser.id" :isMedium="true" :hideYouLabel="true")

  //- read
  template(v-if="props.inviteType === 'read'")
    .symbols
      User(:user="currentUser" :isClickable="false" :key="currentUser.id" :isMedium="true" :hideYouLabel="true")
      .badge.secondary.read-badge
        img.icon(src="@/assets/view.svg")

  span.name {{friendlyName}}
</template>

<style lang="stylus">
.invite-label
  display flex
  align-items center
  .symbols
    margin-right 5px
    // edit
    .user
      margin-top 3px
      margin-right 0
      &:first-child
        margin-right 0
        .user-avatar
          border-top-right-radius 0
          border-bottom-right-radius 0
      &:nth-child(2)
        .user-avatar
          border-top-left-radius 0
          border-bottom-left-radius 0
      .anon-avatar
        top 6px
    // group
    .group-label
      .group-badge
        border-top-left-radius 0
        border-bottom-left-radius 0
        padding 2px 8px
        vertical-align -2px
        margin 0
    // read
    .read-badge
      border-top-left-radius 0
      border-bottom-left-radius 0
      margin 0
      vertical-align -2px

  span.name
    vertical-align -1px
</style>
