<template lang="pug">
dialog.favorities-actions.narrow(v-if="visible" :open="visible" @click.left.stop ref="dialog")
  section
    button(:class="{active: isFavoriteSpace}" @click.left.prevent="toggleIsFavoriteSpace" @keydown.stop.enter="toggleIsFavoriteSpace")
      img.icon(v-if="isFavoriteSpace" src="@/assets/heart.svg")
      img.icon(v-else src="@/assets/heart-empty.svg")
      span {{spaceName}}
  section(v-if="spaceMembers.length")
    //- template(v-for="user in spaceMembers")
    //- p {{user.name}}
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
