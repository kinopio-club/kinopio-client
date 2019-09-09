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
    button(v-if="!deleteAllConfirmationVisible" @click="toggleDeleteAllConfirmationVisible")
      img.icon(src="@/assets/remove.svg")
      span Delete All Your Data
    span(v-if="deleteAllConfirmationVisible")
      p Permanently delete all your spaces and user data?
      .segmented-buttons
        button(@click="toggleDeleteAllConfirmationVisible") Cancel
        button.danger(@click="deleteAllData")
          img.icon(src="@/assets/remove.svg")
          span Delete All

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
      deleteAllConfirmationVisible: false
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
    toggleDeleteAllConfirmationVisible () {
      this.deleteAllConfirmationVisible = !this.deleteAllConfirmationVisible
    },
    deleteAllData () {
      cache.removeAll()
      location.reload()
    }
  },
  watch: {
    visible (value) {
      if (value) {
        this.colorPickerIsVisible = false
        this.deleteAllConfirmationVisible = false
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
