<template lang="pug">
dialog.narrow.box-details(v-if="visible" :open="visible" @click.left.stop="closeDialogs" ref="dialog" :style="styles" :data-box-id="box.id")
  //- .opening-frame(v-if="isOpening" :style="openingFrameStyle")
  section
    .row
      .button-wrap
        button.change-color(:disabled="!canEditSpace" @click.left.stop="toggleColorPicker" :class="{active: colorPickerIsVisible}")
          .current-color(:style="{backgroundColor: box.color}")
        ColorPicker(:currentColor="box.color" :visible="colorPickerIsVisible" @selectedColor="updateColor")
      input.name(
        :disabled="!canEditSpace"
        placeholder="Box Name"
        v-model="name"
        ref="name"
        @blur="blur"
        @keydown.enter.stop.prevent="closeAllDialogs"
        maxLength="600"
      )
    .row
      .button-wrap
        button(:disabled="!canEditSpace" @click.left="removeBox")
          img.icon(src="@/assets/remove.svg")
          span Remove
      .segmented-buttons
        button(:class="{active: fillIsFilled}" @click="updateFill('filled')")
          img.icon.box-icon(src="@/assets/box.svg")
        button(:class="{active: fillIsEmpty}" @click="updateFill('empty')")
          img.icon.box-icon(src="@/assets/box-empty.svg")

</template>

<script>
import ColorPicker from '@/components/dialogs/ColorPicker.vue'
import utils from '@/utils.js'

let prevBoxId

export default {
  name: 'BoxDetails',
  components: {
    ColorPicker
  },
  data () {
    return {
      colorPickerIsVisible: false,
      isUpdated: false
    }
  },
  computed: {
    box () {
      const id = this.$store.state.boxDetailsIsVisibleForBoxId
      return this.$store.getters['currentBoxes/byId'](id) || {}
    },
    fillIsEmpty () { return this.box.fill === 'empty' },
    fillIsFilled () { return this.box.fill === 'filled' },
    visible () { return utils.objectHasKeys(this.box) },
    spaceCounterZoomDecimal () { return this.$store.getters.spaceCounterZoomDecimal },
    styles () {
      let zoom = this.spaceCounterZoomDecimal
      const viewport = utils.visualViewport()
      const pinchCounterScale = utils.roundFloat(1 / viewport.scale)
      if (zoom === 1) {
        zoom = pinchCounterScale
      }
      const styles = {
        transform: `scale(${zoom})`,
        left: `${this.box.x + 8}px`,
        top: `${this.box.y + 8}px`,
        backgroundColor: this.box.color
      }
      return styles
    },
    canEditSpace () { return this.$store.getters['currentUser/canEditSpace']() },
    name: {
      get () {
        return this.box.name
      },
      set (name) {
        this.update({ name })
      }
    }
  },
  methods: {
    removeBox () {
      this.$store.dispatch('history/resume')
      this.$store.dispatch('currentBoxes/remove', this.box)
    },
    toggleColorPicker () {
      this.colorPickerIsVisible = !this.colorPickerIsVisible
    },
    update (updates) {
      const keys = Object.keys(updates)
      let box = { id: this.box.id }
      keys.forEach(key => {
        box[key] = updates[key]
      })
      this.$store.dispatch('currentBoxes/update', box)
      this.isUpdated = true
    },
    updateColor (color) {
      this.update({ color })
    },
    updateFill (fill) {
      this.update({ fill })
    },
    closeDialogs () {
      this.colorPickerIsVisible = false
    },
    closeAllDialogs () {
      this.$store.dispatch('closeAllDialogs', 'boxDetails')
    },
    focusName () {
      this.$nextTick(() => {
        const element = this.$refs.name
        if (!element) { return }
        element.focus()
      })
    },
    blur () {
      this.$store.commit('triggerUpdatePositionInVisualViewport')
    },
    scrollIntoView () {
      this.$nextTick(() => {
        const element = this.$refs.dialog
        this.$nextTick(() => {
          utils.scrollIntoView(element)
        })
      })
    },
    scrollIntoViewAndFocus () {
      this.scrollIntoView()
      if (utils.isMobile()) { return }
      const element = this.$refs.name
      const length = this.name.length
      this.$nextTick(() => {
        this.focusName()
        if (length && element) {
          element.setSelectionRange(length, length)
        }
      })
    }
  },
  watch: {
    box (current) {
      this.$nextTick(() => {
        // open
        if (this.visible) {
          this.$store.dispatch('history/pause')
          prevBoxId = current.id
          this.closeDialogs()
          this.scrollIntoViewAndFocus()
        // close
        } else {
          this.$store.dispatch('history/resume')
          if (!this.isUpdated) { return }
          this.isUpdated = false
          const box = this.$store.getters['currentBoxes/byId'](prevBoxId)
          if (!box) { return }
          this.$store.dispatch('history/add', { boxes: [box], useSnapshot: true })
        }
      })
    }
  }
}
</script>

<style lang="stylus">
.box-details
  input.name
    margin-left 6px
</style>
