<template lang="pug">
dialog.narrow.user-details(v-if="visible" :open="visible" @click.stop="closeColorPicker" :style="backgroundColor" :class="{'right-side': detailsOnRight}")
  section(v-if="isCurrentUser")
    .row
      button.change-color(@click.stop="toggleColorPicker" :class="{active: colorPickerIsVisible}")
        .current-color(:style="backgroundColor")
      ColorPicker(:currentColor="userColor" :visible="colorPickerIsVisible" @selectedColor="updateUserColor")
      input(placeholder="What's your name?" v-model="userName" name="Name")

    // button Sign In or Up
</template>

<script>
import ColorPicker from '@/components/dialogs/ColorPicker.vue'

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
      colorPickerIsVisible: false
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
  .row
    margin 0
  &.right-side
    left initial
    right 8px
</style>
