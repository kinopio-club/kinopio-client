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

  section(v-if="isCurrentUser")
    button(v-if="!removeAllConfirmationVisible" @click="toggleremoveAllConfirmationVisible")
      img.icon(src="@/assets/remove.svg")
      span Remove All Your Data
    span(v-if="removeAllConfirmationVisible")
      p Permanently remove all your spaces and user data?
      .segmented-buttons
        button(@click="toggleremoveAllConfirmationVisible") Cancel
        button.danger(@click="removeAllData")
          img.icon(src="@/assets/remove.svg")
          span Remove All

    // button Sign In or Up
</template>

<script>
import ColorPicker from '@/components/dialogs/ColorPicker.vue'
import cache from '@/cache.js'

export default {
  name: 'UserDetails',
  components: {
    ColorPicker
  },
  props: {
    user: Object,
    detailsOnRight: Boolean,
    visible: Boolean
  },
  data () {
    return {
      colorPickerIsVisible: false,
      removeAllConfirmationVisible: false
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
    toggleremoveAllConfirmationVisible () {
      this.removeAllConfirmationVisible = !this.removeAllConfirmationVisible
    },
    removeAllData () {
      cache.removeAll()
      location.reload()
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
