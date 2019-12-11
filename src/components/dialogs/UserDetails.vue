<template lang="pug">
dialog.narrow.user-details(v-if="visible" :open="visible" @click="closeDialogs" :class="{'right-side': detailsOnRight}")
  section.user-info(v-if="!isCurrentUser")
    .row
      User(:user="user" :isClickable="false" :detailsOnRight="false" :key="user.id" :shouldCloseAllDialogs="false")
      p.name {{user.name}}
  section(v-if="isCurrentUser")
    .row
      .button-wrap
        button.change-color(@click.stop="toggleColorPicker" :class="{active: colorPickerIsVisible}")
          .current-color(:style="backgroundColor")
        ColorPicker(:currentColor="userColor" :visible="colorPickerIsVisible" @selectedColor="updateUserColor")
      input.name(placeholder="What's your name?" v-model="userName" name="Name")
  section(v-if="isCurrentUser")
    .button-wrap
      button(@click.stop="toggleUserSettingsIsVisible" :class="{active: userSettingsIsVisible}") Settings
      UserSettings(:user="user" :visible="userSettingsIsVisible" @removeUser="signOut")

    button(v-if="isSignedIn" @click="signOut") Sign Out

</template>

<script>
import ColorPicker from '@/components/dialogs/ColorPicker.vue'
import UserSettings from '@/components/dialogs/UserSettings.vue'
import cache from '@/cache.js'

export default {
  name: 'UserDetails',
  components: {
    ColorPicker,
    UserSettings,
    User: () => import('@/components/User.vue')
  },
  props: {
    user: Object,
    detailsOnRight: Boolean,
    visible: Boolean
  },
  data () {
    return {
      colorPickerIsVisible: false,
      userSettingsIsVisible: false
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
      return this.$store.getters['currentUser/isCurrentUser'](this.user)
    },
    isSignedIn () {
      return this.$store.getters['currentUser/isSignedIn']
    },
    userName: {
      get () {
        return this.user.name
      },
      set (newName) {
        this.$store.dispatch('currentUser/name', newName)
      }
    }
  },
  methods: {
    toggleUserSettingsIsVisible () {
      const isVisible = this.userSettingsIsVisible
      this.closeDialogs()
      this.userSettingsIsVisible = !isVisible
    },
    toggleColorPicker () {
      const isVisible = this.colorPickerIsVisible
      this.closeDialogs()
      this.colorPickerIsVisible = !isVisible
    },
    closeDialogs () {
      this.colorPickerIsVisible = false
      this.userSettingsIsVisible = false
    },
    updateUserColor (newColor) {
      this.$store.dispatch('currentUser/color', newColor)
    },
    signOut () {
      cache.removeAll()
      window.history.replaceState({}, 'Kinopio', '/')
      location.reload()
    }
  },
  watch: {
    visible (value) {
      if (value) {
        this.colorPickerIsVisible = false
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

.user-info
  display: flex
  .row
    align-items center
  p
    margin 0
</style>
