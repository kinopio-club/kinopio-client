<template lang="pug">
dialog.narrow.user-details(
  v-if="visible"
  :open="visible"
  @click="closeDialogs"
  :class="{'right-side': detailsOnRight}"
)
  section(v-if="isCurrentUser")
    .row
      .button-wrap
        button.change-color(@click.stop="toggleColorPicker" :class="{active: colorPickerIsVisible}")
          .current-color(:style="backgroundColor")
        ColorPicker(:currentColor="userColor" :visible="colorPickerIsVisible" @selectedColor="updateUserColor")
      input.name(placeholder="What's your name?" v-model="userName" name="Name")

  section(v-if="isCurrentUser && isSignedIn")
    button(@click="signOut") Sign Out

  section(v-if="isCurrentUser")
    .button-wrap
      button(@click.stop="toggleSettingsIsVisible" :class="{active: settingsIsVisible}") Settings
      Settings(:visible="settingsIsVisible")

    //- button(v-if="!removeAllConfirmationVisible" @click="toggleRemoveAllConfirmationVisible")
    //-   img.icon(src="@/assets/remove.svg")
    //-   span Remove All Your Data
    //- span(v-if="removeAllConfirmationVisible")
    //-   p
    //-     span.badge.danger Permanently remove
    //-     span(v-if="isSignedIn") all your spaces and user data from this computer and Kinopio's servers?
    //-     span(v-else) all your spaces and user data from this computer?
    //-   .segmented-buttons
    //-     button(@click="toggleRemoveAllConfirmationVisible")
    //-       span Cancel
    //-     button.danger(@click="removeUserPermanent")
    //-       img.icon(src="@/assets/remove.svg")
    //-       span Remove All
    //-       Loader(:visible="loading.removeUserPermanent")
</template>

<script>
import ColorPicker from '@/components/dialogs/ColorPicker.vue'
import Settings from '@/components/dialogs/Settings.vue'

import cache from '@/cache.js'
import api from '@/api.js'
import Loader from '@/components/Loader.vue'

export default {
  name: 'UserDetails',
  components: {
    ColorPicker,
    Settings,
    Loader
  },
  props: {
    user: Object,
    detailsOnRight: Boolean,
    visible: Boolean
  },
  data () {
    return {
      colorPickerIsVisible: false,
      // removeAllConfirmationVisible: false,
      settingsIsVisible: false,
      loading: {
        removeUserPermanent: false
      }
    }
  },
  computed: {
    userColor () {
      return this.user.color
    },
    backgroundColor () {
      return {
        backgroundColor: this.userColor
      }
    },
    isCurrentUser () {
      return this.$store.getters['currentUser/isCurrentUser'](this.user.id)
    },
    isSignedIn () {
      return this.$store.getters['currentUser/isSignedIn']
    },
    userName: {
      get () {
        return this.user.name
      },
      set (newName) {
        this.$store.dispatch('updateUserName', {
          userId: this.user.id,
          newName
        })
      }
    }
  },
  methods: {
    toggleSettingsIsVisible () {
      const isVisible = this.settingsIsVisible
      this.closeDialogs()
      this.settingsIsVisible = !isVisible
    },
    toggleColorPicker () {
      const isVisible = this.colorPickerIsVisible
      this.closeDialogs()
      this.colorPickerIsVisible = !isVisible
    },
    closeDialogs () {
      this.colorPickerIsVisible = false
      this.settingsIsVisible = false
    },
    updateUserColor (newColor) {
      this.$store.dispatch('updateUserColor', {
        userId: this.user.id,
        newColor
      })
    },
    toggleRemoveAllConfirmationVisible () {
      this.removeAllConfirmationVisible = !this.removeAllConfirmationVisible
    },
    signOut () {
      cache.removeAll()
      location.reload()
    },
    async removeUserPermanent () {
      this.loading.removeUserPermanent = true
      await api.removeUserPermanent()
      this.loading.removeUserPermanent = false
      this.signOut()
    }

  },
  watch: {
    visible (value) {
      if (value) {
        this.colorPickerIsVisible = false
        this.removeAllConfirmationVisible = false
      }
    }
  }
}
</script>

<style lang="stylus">
.user-details
  cursor: initial
  top calc(100% - 8px)
  .row
    margin 0
  &.right-side
    left initial
    right 8px
  .name
    margin-left 6px
</style>
