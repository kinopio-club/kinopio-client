<template lang="pug">
dialog.narrow.user-details(v-if="visible" :open="visible" @click="closeDialogs" :class="{'right-side': detailsOnRight}")
  section(v-if="isCurrentUser")
    .row
      .button-wrap
        button.change-color(@click.stop="toggleColorPicker" :class="{active: colorPickerIsVisible}")
          .current-color(:style="backgroundColor")
        ColorPicker(:currentColor="userColor" :visible="colorPickerIsVisible" @selectedColor="updateUserColor")
      input.name(placeholder="What's your name?" v-model="userName" name="Name")

  section(v-if="!isCurrentUser")
    .user-info
      User(:user="user" :clickable="false" :detailsOnRight="false" :key="user.id" :shouldCloseAllDialogs="false")
      p {{user.name}}

  section(v-if="isCurrentUser")
    .button-wrap
      button(@click.stop="toggleSettingsIsVisible" :class="{active: settingsIsVisible}") Settings
      Settings(:user="user" :visible="settingsIsVisible" @removeUser="signOut")

    button(v-if="isSignedIn" @click="signOut") Sign Out

</template>

<script>
import ColorPicker from '@/components/dialogs/ColorPicker.vue'
import Settings from '@/components/dialogs/Settings.vue'
import cache from '@/cache.js'

export default {
  name: 'UserDetails',
  components: {
    ColorPicker,
    Settings,
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
      settingsIsVisible: false
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
        this.$store.dispatch('currentUser/name', newName)
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
      this.$store.dispatch('currentUser/color', newColor)
    },
    signOut () {
      cache.removeAll()
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
   align-items center
   margin-bottom 10px
   p
     margin 0
   .user
     float none
     pointer-events none
     margin-bottom 0
     margin-right 6px

</style>
