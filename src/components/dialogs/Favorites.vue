<template lang="pug">
dialog.narrow.favorites(v-if="visible" :open="visible" @click.stop)
  section
    .segmented-buttons
      button(@click.stop="showSpaces" :class="{ active: spacesIsVisible }")
        span Spaces
        Loader(:visible="isLoading")
      button(@click.stop="hideSpaces" :class="{ active: !spacesIsVisible }")
        span People
        Loader(:visible="isLoading")
  section(v-if="shouldShowDescription")
    p Spaces and people you favorite can be found here

  section.results-section(v-else)
    ul.results-list
      template(v-for="(item in items")
        li(:key="item.id" @click="open(item)" tabindex="0" v-on:keyup.enter="open(item)")
          .name(v-if="spacesIsVisible") {{item.name}}
          .badge(v-else :style="{background: item.color}")
            User(:user="item" :isClickable="false")
            span {{item.name}}
          button(@click.stop="remove(item)")
            img.icon(src="@/assets/remove.svg")

</template>

<script>
import Loader from '@/components/Loader.vue'

export default {
  name: 'Favorites',
  components: {
    User: () => import('@/components/User.vue'),
    Loader
  },
  props: {
    visible: Boolean
  },
  data () {
    return {
      spacesIsVisible: true,
      isLoading: false
    }
  },
  computed: {
    shouldShowDescription () {
      const noSpaces = this.spacesIsVisible && !this.favoriteSpaces.length
      const noPeople = !this.spacesIsVisible && !this.favoriteUsers.length
      if (noSpaces || noPeople) { return true }
      return false
    },
    favoriteUsers () {
      return this.$store.state.currentUser.favoriteUsers
    },
    favoriteSpaces () {
      return this.$store.state.currentUser.favoriteSpaces
    },
    items () {
      if (this.spacesIsVisible) {
        return this.favoriteSpaces
      } else {
        return this.favoriteUsers
      }
    }
  },
  methods: {
    showSpaces () {
      this.spacesIsVisible = true
    },
    hideSpaces () {
      this.spacesIsVisible = false
    },
    open (item) {
      // user opens user details
      // space = goto the spaceid url (or do a claen restore w just id?)
      // dont close dialog
    },
    remove (item) {
      let type
      if (this.spacesIsVisible) {
        type = 'space'
      } else {
        type = 'user'
      }
      this.$store.dispatch('currentUser/removeFavorite', { type, item })
    }
  }
  // watch: {
  //   visible (value) {
  //     if (value) {
  //     }
  //   }
  // }
}
</script>

<style lang="stylus">
.favorites
  .results-section
    border-top 1px solid var(--primary)
    border-top-left-radius 0
    border-top-right-radius 0
    padding-top 4px
  .name
    margin-left 0 !important
    white-space nowrap
    overflow hidden
    text-overflow ellipsis
    max-width calc(100% - 32px)
  .badge
    max-width calc(100% - 32px)
  li
    justify-content space-between
    button
      margin-left auto

</style>
