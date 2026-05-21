<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

import User from '@/components/User.vue'
import invite from '@/data/invite.js'
import GroupLabel from '@/components/GroupLabel.vue'

import randomColor from 'randomcolor'

const userStore = useUserStore()
const spaceStore = useSpaceStore()

const props = defineProps({
  inviteType: String, // 'group', 'edit', 'read'
  group: Object,
  randomUser: Object
})

const spaceIsPrivate = computed(() => spaceStore.getSpaceIsPrivate)
const spaceIsPublic = computed(() => spaceStore.getSpaceIsPublic)
const currentUser = computed(() => userStore.getUserAllState)
const inviteState = computed(() => {
  let inviteStates = invite.states()
  if (spaceIsPublic.value) {
    inviteStates = invite.statesPublicSpace()
  }
  return inviteStates.find(item => item.type === props.inviteType)
})
const friendlyName = computed(() => inviteState.value.friendlyName)
</script>

<template lang="pug">
.invite-label
  //- invite to group
  template(v-if="props.inviteType === 'group'")
    .symbols
      User(:user="currentUser" :isClickable="false" :key="currentUser.id" :isMedium="true" :hideYouLabel="true")
      GroupLabel(:group="props.group")

  //- invite to edit
  template(v-if="props.inviteType === 'edit'")
    .symbols
      User(:user="currentUser" :isClickable="false" :key="currentUser.id" :isMedium="true" :hideYouLabel="true")
      User(:user="props.randomUser" :isClickable="false" :key="currentUser.id" :isMedium="true" :hideYouLabel="true")

  //- invite to read only or published
  template(v-if="props.inviteType === 'read'")
    .symbols
      User(:user="currentUser" :isClickable="false" :key="currentUser.id" :isMedium="true" :hideYouLabel="true")
      .badge.secondary.read-badge(v-if="spaceIsPrivate")
        img.icon.view(src="@/assets/view.svg")
      .badge.secondary.read-badge(v-else)
        img.icon.open(src="@/assets/open.svg")

  span.name {{friendlyName}}
</template>

<style lang="stylus">
.invite-label
  display flex
  align-items center
  .symbols
    margin-right 5px
    display flex

    // edit
    .user
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
      .user-avatar
        margin-top 0

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
      .icon.open
        vertical-align -1px
      .icon.view
        vertical-align 0px

</style>
