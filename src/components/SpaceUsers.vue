<template lang="pug">
//- Add Page
.space-users(v-if="isAddPage")
  .users
    User(:user="currentUser" :isClickable="true" :detailsOnRight="true" :key="currentUser.id" :shouldCloseAllDialogs="true" tabindex="0")
//- Embed
.space-users(v-else-if="isEmbed")
  .users
    User(v-for="user in members" :user="user" :isClickable="true" :detailsOnRight="true" :key="user.id" :shouldCloseAllDialogs="true" tabindex="0")
//- Normal Space
.space-users(v-else)
  .users.spectators
    User(v-for="user in spectators" :user="user" :isClickable="true" :detailsOnRight="true" :key="user.id" :shouldCloseAllDialogs="true" tabindex="0")
    User(v-if="!currentUserIsSpaceMember" :user="currentUser" :isClickable="true" :detailsOnRight="true" :key="currentUser.id" :shouldCloseAllDialogs="true" tabindex="0")
  .users
    User(v-for="user in collaborators" :user="user" :isClickable="true" :detailsOnRight="true" :key="user.id" :shouldCloseAllDialogs="true" tabindex="0")
    User(v-for="user in users" :user="user" :isClickable="true" :detailsOnRight="true" :key="user.id" :shouldCloseAllDialogs="true" tabindex="0")
    User(v-if="currentUserIsSpaceMember" :user="currentUser" :isClickable="true" :detailsOnRight="true" :key="currentUser.id" :shouldCloseAllDialogs="true" tabindex="0")

</template>

<script>
import utils from '@/utils.js'

import { defineAsyncComponent } from 'vue'

import uniqBy from 'lodash-es/uniqBy'
const User = defineAsyncComponent({
  loader: () => import('@/components/User.vue')
})

export default {
  name: 'TagList',
  components: {
    User
  },
  computed: {
    isEmbed () { return this.$store.state.isEmbed },
    isAddPage () { return this.$store.state.isAddPage },
    currentUser () { return this.$store.state.currentUser },
    currentSpace () { return this.$store.state.currentSpace },
    currentUserIsSpaceMember () { return this.$store.getters['currentUser/isSpaceMember']() },
    members () {
      return this.currentSpace.users
    },
    users () {
      let users = utils.clone(this.currentSpace.users)
      return users.filter(user => user.id !== this.currentUser.id)
    },
    collaborators () {
      let collaborators = this.currentSpace.collaborators
      return collaborators.filter(user => user.id !== this.currentUser.id)
    },
    spectators () {
      let spectators = this.currentSpace.spectators
      spectators = spectators.filter(user => user.id !== this.currentUser.id)
      spectators = uniqBy(spectators, 'id')
      return spectators
    }
  }
}
</script>

<style lang="stylus">
.space-users
  display flex
  > .users
    padding-right 6px
    max-width 40vw
    display flex
    flex-wrap wrap
    justify-content flex-end
    align-content flex-start

</style>
