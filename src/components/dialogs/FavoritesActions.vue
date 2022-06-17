<template lang="pug">
dialog.favorities-actions.narrow(v-if="visible" :open="visible" @click.left.stop ref="dialog")
  section
    p(v-if="isSpaceMember")
     span
        img.icon(src="@/assets/heart.svg")
        span your own spaces to pin them to the top of your spaces list
    p(v-else)
      span
        img.icon(src="@/assets/heart.svg")
        span spaces to read them later and keep up with updates

    button(:class="{active: isFavoriteSpace}" @click.left.prevent="toggleIsFavoriteSpace" @keydown.stop.enter="toggleIsFavoriteSpace")
      img.icon(v-if="isFavoriteSpace" src="@/assets/heart.svg")
      img.icon(v-else src="@/assets/heart-empty.svg")
      span {{spaceName}}
  section(v-if="spaceMembers.length")
    p
      img.icon(src="@/assets/heart.svg")
      span people to see their other spaces

    template(v-for="user in spaceMembers")
      p {{user.name}}
      //- UserList(:users="spaceMembers" @selectUser="toggleFavoriteUser" :isClickable="true")

</template>

<script>
export default {
  name: 'FavoritesActions',
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
    }
  },
  methods: {
    toggleIsFavoriteSpace () {
      const currentSpace = this.$store.state.currentSpace
      if (this.isFavoriteSpace) {
        this.$store.dispatch('currentUser/removeFavorite', { type: 'space', item: currentSpace })
      } else {
        this.$store.dispatch('currentUser/addFavorite', { type: 'space', item: currentSpace })
      }
    }
    // toggleFavoriteUser (user)' {

    // }'
  }
}
</script>

<style lang="stylus">
// .favorities-actions
</style>
