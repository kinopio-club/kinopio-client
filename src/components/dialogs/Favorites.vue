<template lang="pug">
dialog.narrow.favorites(v-if="visible" :open="visible" @click.stop)
  section
    .segmented-buttons
      button(@click.stop="hideSpaces" :class="{ active: !spacesIsVisible }")
        span Spaces
        Loader(:visible="loadingSpaces")
      button(@click.stop="showSpaces" :class="{ active: spacesIsVisible }")
        span People
        Loader(:visible="loadingPeople")
  section.results-section(v-if="spacesIsVisible")
    //- refactor newSpaces into list/spacesList
    p i am spaces
  section.results-section(v-if="!spacesIsVisible")
    //- list/usersList
    p i am people

</template>

<script>
import Loader from '@/components/Loader.vue'

export default {
  name: 'Favorites',
  components: {
    Loader
  },
  props: {
    visible: Boolean
  },
  data () {
    return {
      loadingSpaces: false,
      loadingPeople: false,
      spacesIsVisible: false,
      spaces: [],
      people: []
    }
  },
  computed: {
    // isSignedIn () {
    //   return this.$store.getters['currentUser/isSignedIn']
    // }
  },
  methods: {
    showSpaces () {
      this.spacesIsVisible = true
    },
    hideSpaces () {
      this.spacesIsVisible = false
    }

    // toggleRemoveAllConfirmationVisible () {
    //   this.removeAllConfirmationVisible = !this.removeAllConfirmationVisible
    // },
    // async removeUserPermanent () {
    //   this.loading.removeUserPermanent = true
    //   await this.$store.dispatch('api/removeUserPermanent')
    //   this.loading.removeUserPermanent = false
    //   this.$emit('removeUser')
    // }
  }
  // watch: {
  //   visible (value) {
  //     if (value) {
  //       this.removeAllConfirmationVisible = false
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
</style>
