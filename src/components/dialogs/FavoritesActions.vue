<template lang="pug">
dialog.favorities-actions.narrow(v-if="visible" :open="visible" @click.left.stop ref="dialog")
  section
    p(v-if="isSpaceMember") Pin to the top of your spaces
    p(v-else) Follow updates to this space
    button(:class="{active: isFavoriteSpace}" @click.left.prevent="toggleIsFavoriteSpace" @keydown.stop.enter="toggleIsFavoriteSpace")
      img.icon(v-if="isFavoriteSpace" src="@/assets/heart.svg")
      img.icon(v-else src="@/assets/heart-empty.svg")
      span {{spaceName}}
  section.favorite-users(v-if="spaceMembers.length")
    .row
      p Follow people to see their other public spaces
    template(v-for="user in spaceMembers")
      .row
        button(:class="{active: isFavoriteUser(user)}" @click.left.prevent="toggleIsFavoriteUser(user)" @keydown.stop.enter="toggleIsFavoriteUser(user)")
          img.icon(v-if="isFavoriteUser(user)" src="@/assets/heart.svg")
          img.icon(v-else src="@/assets/heart-empty.svg")
          UserLabel(:user="user" :isInline="true")

</template>

<script>
import UserLabel from '@/components/UserLabel.vue'

export default {
  name: 'FavoritesActions',
  components: {
    UserLabel
  },
  props: {
    visible: Boolean
  },
  data () {
    return {
    }
  },
  computed: {
    currentSpace () { return this.$store.state.currentSpace },
    spaceName () { return this.currentSpace.name },
    isSpaceMember () { return this.$store.getters['currentUser/isSpaceMember']() },
    isLoadingSpace () { return this.$store.state.isLoadingSpace },
    isFavoriteSpace () { return this.$store.getters['currentSpace/isFavorite'] },
    spaceMembers () {
      const excludeCurrentUser = true
      return this.$store.getters['currentSpace/members'](excludeCurrentUser)
    },
    hasRestoredFavorites () { return this.$store.state.hasRestoredFavorites }
  },
  methods: {
    toggleIsFavoriteSpace () {
      const currentSpace = this.$store.state.currentSpace
      if (this.isFavoriteSpace) {
        this.$store.dispatch('currentUser/removeFavorite', { type: 'space', item: currentSpace })
      } else {
        this.$store.dispatch('currentUser/addFavorite', { type: 'space', item: currentSpace })
      }
    },
    isFavoriteUser (user) {
      const favoriteUsers = this.$store.state.currentUser.favoriteUsers
      const isFavoriteUser = Boolean(favoriteUsers.find(favoriteUser => {
        return favoriteUser.id === user.id
      }))
      return isFavoriteUser
    },
    toggleIsFavoriteUser (user) {
      if (this.isFavoriteUser(user)) {
        this.$store.dispatch('currentUser/removeFavorite', { type: 'user', item: user })
      } else {
        this.$store.dispatch('currentUser/addFavorite', { type: 'user', item: user })
      }
    }
  }
}
</script>

<style lang="stylus">
.favorities-actions
  .favorite-users
    button
      height 24px
      display flex
      align-items center
      .user-label
        margin 0
        margin-left 6px

</style>
