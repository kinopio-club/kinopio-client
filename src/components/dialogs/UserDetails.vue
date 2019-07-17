<template lang="pug">
dialog.narrow.user-details(v-if="visible" :open="visible" @click="closeColorPicker" :style="backgroundColor" :class="{'right-side': detailsIsOnRightSide}")
  section
    button.change-color(@click.stop="toggleColorPicker" :class="{active: colorPickerIsVisible}")
      .current-color(:style="backgroundColor")
    ColorPicker(:currentColor="userColor" :visible="colorPickerIsVisible" @selectedColor="updateUserColor")

    // input(placeholder="What's your name?" v-model="userName")
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
    detailsIsOnRightSide: Boolean
  },
  data () {
    return {
      colorPickerIsVisible: false
    }
  },
  computed: {
    visible () {
      return this.$store.state.userDetailsIsVisible
    },
    userColor () {
      return this.user.color
    },
    backgroundColor () {
      return {
        backgroundColor: this.userColor
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
  cursor initial
.right-side
  left initial
  right 8px
</style>
