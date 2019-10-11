<template lang="pug">
dialog.narrow.user-details(
  v-if="visible"
  :open="visible"
  @click="closeColorPicker"
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
    button(v-if="!removeAllConfirmationVisible" @click="toggleRemoveAllConfirmationVisible")
      img.icon(src="@/assets/remove.svg")
      span Remove All Your Data
    span(v-if="removeAllConfirmationVisible")
      p
        span.badge.danger Permanently remove
        span(v-if="isSignedIn") all your spaces and user data from this computer and Kinopio's servers?
        span(v-else) all your spaces and user data from this computer?
      .segmented-buttons
        button(@click="toggleRemoveAllConfirmationVisible")
          span Cancel
        button.danger(@click="permanentlyRemoveUser")
          img.icon(src="@/assets/remove.svg")
          span Remove All
          Loader(:visible="loading.permanentlyRemoveUser")
</template>

<script>
import ColorPicker from '@/components/dialogs/ColorPicker.vue'
import cache from '@/cache.js'
import api from '@/api.js'
import Loader from '@/components/Loader.vue'

export default {
  name: 'UserDetails',
  components: {
    ColorPicker,
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
      removeAllConfirmationVisible: false,
      loading: {
        permanentlyRemoveUser: false
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
    toggleColorPicker () {
      this.colorPickerIsVisible = !this.colorPickerIsVisible
    },
    closeColorPicker () {
      this.colorPickerIsVisible = false
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
    async permanentlyRemoveUser () {
      this.loading.permanentlyRemoveUser = true
      await api.permanentlyDeleteUser()
      this.loading.permanentlyRemoveUser = false
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
