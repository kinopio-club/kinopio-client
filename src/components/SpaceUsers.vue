<template lang="pug">
//- .space-users
  //- embed
  //- .users
  //-   User(v-if="currentUserIsSpaceMember" :user="currentUser" :isClickable="true" :detailsOnRight="true" :key="currentUser.id" :shouldCloseAllDialogs="true" tabindex="0")
  //-   User(v-for="user in users" :user="user" :isClickable="true" :detailsOnRight="true" :key="user.id" :shouldCloseAllDialogs="true" tabindex="0")
  //-   User(v-for="user in collaborators" :user="user" :isClickable="true" :detailsOnRight="true" :key="user.id" :shouldCloseAllDialogs="true" tabindex="0")

.space-users(v-if="!isAddPage")
  .users.spectators
    User(v-for="user in spectators" :user="user" :isClickable="true" :detailsOnRight="true" :key="user.id" :shouldCloseAllDialogs="true" tabindex="0")
    User(v-if="!currentUserIsSpaceMember" :user="currentUser" :isClickable="true" :detailsOnRight="true" :key="currentUser.id" :shouldCloseAllDialogs="true" tabindex="0")
  .users
    User(v-for="user in collaborators" :user="user" :isClickable="true" :detailsOnRight="true" :key="user.id" :shouldCloseAllDialogs="true" tabindex="0")
    User(v-for="user in users" :user="user" :isClickable="true" :detailsOnRight="true" :key="user.id" :shouldCloseAllDialogs="true" tabindex="0")
    User(v-if="currentUserIsSpaceMember" :user="currentUser" :isClickable="true" :detailsOnRight="true" :key="currentUser.id" :shouldCloseAllDialogs="true" tabindex="0")

.space-users(v-if="isAddPage")
  .users
    User(:user="currentUser" :isClickable="true" :detailsOnRight="true" :key="currentUser.id" :shouldCloseAllDialogs="true" tabindex="0")

</template>

<script>
import User from '@/components/User.vue'
import utils from '@/utils.js'

// import UpgradeUser from '@/components/dialogs/UpgradeUser.vue'

import uniqBy from 'lodash-es/uniqBy'

export default {
  name: 'TagList',
  components: {
    User
    // UpgradeUser
  },
  props: {
    // tags: Array,
  },
  created () {
    // this.$store.subscribe((mutation, state) => {
    //   if (mutation.type === 'triggerUpgradeUserIsVisible') {
    //     this.upgradeUserIsVisible = true
    //   }
    // })
  },
  // data () {
  //   return {
  //     upgradeUserIsVisible: false,
  //   }
  // },
  computed: {
    isAddPage () { return this.$store.state.isAddPage },
    currentUser () { return this.$store.state.currentUser },
    currentSpace () { return this.$store.state.currentSpace },
    currentUserIsSpaceMember () { return this.$store.getters['currentUser/isSpaceMember']() },
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

  },
  methods: {
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
