<template lang="pug">
dialog.narrow.user-details.right-side(v-if="visible" :open="visible" @click.stop :style="{backgroundColor: color}")
  section
    button.change-color(@click.stop="toggleColorPicker" :class="{active: colorPickerIsVisible}")
      .current-color(:style="{backgroundColor: color}")
    // ColorPicker(:currentColor="typeColor" :colorPickerIsVisible="colorPickerIsVisible" @selectedColor="updateUserColor")
    // input(placeholder="Connection" v-model="typeName")
</template>

<script>
import ColorPicker from '@/components/dialogs/ColorPicker.vue'

export default {
  name: 'UserDetails',
  components: {
    ColorPicker
  },
  props: {
    user: Object
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
    color () {
      return this.user.color
    }
  },
  method: {
    toggleColorPicker () {},
    updateUserColor () {}
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
