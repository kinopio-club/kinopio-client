<template lang="pug">
.favorites(v-if="visible" :open="visible" @click.stop="userDetailsIsNotVisible")
  section
    .segmented-buttons
      button(@click.stop="showSpaces" :class="{ active: spacesIsVisible }")
        span Spaces
        Loader(:visible="loading")
      button(@click.stop="hideSpaces" :class="{ active: !spacesIsVisible }")
        span People
        Loader(:visible="loading")
  section(v-if="shouldShowDescription")
    p Spaces and people you favorite can be found here
    p(v-if="loading")
      Loader(:visible="loading")

  section.results-section(v-else)

    //- use spacelist for spaces (if spacesIsVisible)
    //- make userlist for users
    .filter-wrap(v-if="isManySpaces")
      img.icon.search(src="@/assets/search.svg" @click="focusFilterInput")
      input(placeholder="Search" v-model="spaceFilter" ref="filterInput")
      button.borderless.clear-input-wrap(@click="clearFilter")
        img.icon(src="@/assets/add.svg")

    SpaceList(:spaces="spacesFiltered" :showUser="true" :selectedSpace="currentSpace" @selectSpace="changeSpace")

    //- ul.results-list
    //-   template(v-for="(item in items")
    //-     li(:key="item.id" @click.stop="open(item)" tabindex="0" v-on:keyup.stop.enter="open(item)" :class="{ active: itemIsOpened(item) }")
    //-       .name(v-if="spacesIsVisible") {{item.name}}
    //-       .badge(v-else :style="{background: item.color}")
    //-         User(:user="item" :isClickable="false")
    //-         span {{item.name}}

    //- UserDetails(:visible="userDetailsIsVisible" :user="openedUser")
</template>

<script>
import fuzzy from 'fuzzy'

import Loader from '@/components/Loader.vue'
import SpaceList from '@/components/SpaceList.vue'

export default {
  name: 'Favorites',
  components: {
    Loader,
    User: () => import('@/components/User.vue'),
    UserDetails: () => import('@/components/dialogs/UserDetails.vue'),
    SpaceList
  },
  props: {
    visible: Boolean
  },
  data () {
    return {
      spacesIsVisible: true,
      userDetailsIsVisible: false,
      openedUser: {},
      filter: '',
      filteredSpaces: []
    }
  },
  computed: {
    favoriteUsers () { return this.$store.state.currentUser.favoriteUsers },
    favoriteSpaces () { return this.$store.state.currentUser.favoriteSpaces },
    loading () { return this.$store.state.isLoadingUserFavorites },
    currentSpace () { return this.$store.state.currentSpace },
    shouldShowDescription () {
      const noSpaces = this.spacesIsVisible && !this.favoriteSpaces.length
      const noPeople = !this.spacesIsVisible && !this.favoriteUsers.length
      if (noSpaces || noPeople) { return true }
      return false
    },
    isManySpaces () {
      return true
    },
    spaceFilter: {
      get () {
        return this.filter
      },
      set (newValue) {
        this.filter = newValue
        const options = {
          pre: '',
          post: '',
          extract: (space) => {
            return space.name
          }
        }
        const filtered = fuzzy.filter(this.filter, this.favoriteSpaces, options)
        const spaces = filtered.map(space => {
          return space.original
        })
        this.filteredSpaces = spaces
      }
    },
    spacesFiltered () {
      if (this.filter) {
        return this.filteredSpaces
      } else {
        return this.favoriteSpaces
      }
    }

  },
  methods: {
    // async getFavorites () {
    //   if (this.loading) { return }
    //   this.loading = true
    //   const favorites = await this.$store.dispatch('api/getUserFavorites')
    //   this.loading = false
    //   this.favoriteUsers = favorites.favoriteUsers
    //   this.favoriteSpaces = favorites.favoriteSpaces
    // },

    focusFilterInput () {
      const element = this.$refs.filterInput
      element.focus()
      element.setSelectionRange(0, 0)
    },
    clearFilter () {
      this.filter = ''
    },

    showSpaces () {
      this.spacesIsVisible = true
      this.userDetailsIsNotVisible()
    },
    hideSpaces () {
      this.spacesIsVisible = false
      this.userDetailsIsNotVisible()
    },
    changeSpace (space) {
      this.$store.dispatch('currentSpace/changeSpace', { space })
    },

    // open (item) {
    //   this.userDetailsIsNotVisible()
    //   if (this.spacesIsVisible) {
    //     this.$store.dispatch('currentSpace/changeSpace', { space: item, isRemote: true })
    //   } else {
    //     this.openedUser = item
    //     this.userDetailsIsVisible = true
    //   }
    // },

    // itemIsOpened (item) {
    //   let opened
    //   if (this.spacesIsVisible) {
    //     opened = this.$store.state.currentSpace
    //   } else {
    //     opened = this.openedUser
    //   }
    //   return item.id === opened.id
    // },

    // remove (item) {
    //   console.log('remove', item)
    //   let type
    //   if (this.spacesIsVisible) {
    //     type = 'space'
    //   } else {
    //     type = 'user'
    //   }
    //   // const favorites = utils.mergeArrayOfObjectsById(context.state.favoriteUsers, newFavorites)
    //   //   context.commit('favoriteUsers', favorites)

    //   this.$store.dispatch('currentUser/removeFavorite', { type, item })
    // },
    userDetailsIsNotVisible () {
      this.userDetailsIsVisible = false
      this.openedUser = {}
    }
  },
  watch: {
    visible (visible) {
      this.userDetailsIsNotVisible()
      // todo if (visible) {
      //   this.$store.dispatch('currentUser/restoreUserFavorites', currentUser)
      // }
    }
  }

}
</script>

<style lang="stylus">
// .favorites
  // > .results-section
  //   border-top 1px solid var(--primary)
  //   border-top-left-radius 0
  //   border-top-right-radius 0
  //   padding-top 4px
  // li
  //   justify-content space-between
  //   button
  //     margin-left auto
  //   .name
  //     white-space wrap

</style>
