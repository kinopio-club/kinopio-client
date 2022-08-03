<template lang="pug">
dialog.narrow.box-details(v-if="visible" :open="visible" @click.left.stop="closeDialogs" ref="dialog" :style="styles" :data-box-id="box.id")
  //- .opening-frame(v-if="isOpening" :style="openingFrameStyle")
  section
    .row
      .button-wrap
        button.change-color(:disabled="!canEditSpace" @click.left.stop="toggleColorPicker" :class="{active: colorPickerIsVisible}")
          .current-color(:style="{backgroundColor: box.color}")
        ColorPicker(:currentColor="box.color" :visible="colorPickerIsVisible" @selectedColor="updateBoxColor")
      input.name(:disabled="!canEditSpace" placeholder="Box Name" v-model="name" ref="name" @focus="focus" @blur="blur")
    .row
      .button-wrap
        button(:disabled="!canEditSpace" @click.left="removeBox")
          img.icon(src="@/assets/remove.svg")
          span Remove
      .segmented-buttons
        button(:class="{active: fillIsFilled}" @click="updateBoxFill('filled')")
          img.icon.box-icon(src="@/assets/box.svg")
        button(:class="{active: fillIsEmpty}" @click="updateBoxFill('empty')")
          img.icon.box-icon(src="@/assets/box-empty.svg")

</template>

<script>
import ColorPicker from '@/components/dialogs/ColorPicker.vue'
import utils from '@/utils.js'

export default {
  name: 'BoxDetails',
  components: {
    ColorPicker
  },
  data () {
    return {
      colorPickerIsVisible: false,
      inputIsFocused: false
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
        console.log('🍅', name)
        // this.updateBox({name})
      }
    }
  },
  methods: {
    removeBox () {
      this.$store.dispatch('currentBoxes/remove', this.box)
    },
    toggleColorPicker () {
      this.colorPickerIsVisible = !this.colorPickerIsVisible
    },
    updateBox (updates) {
      const keys = Object.keys
      let box = { id: this.box.id }
      keys.forEach(key => {
        box[key] = updates[key]
      })
      this.$store.dispatch('currentBoxes/update', box)
    },
    updateBoxColor (color) {
      console.log('🌈', color)
      // this.updateBox({color})
    },
    updateBoxFill (fill) {
      const box = { id: this.box.id, fill }
      this.$store.dispatch('currentBoxes/update', box)
    },
    closeDialogs () {
      this.colorPickerIsVisible = false
    },
    focusName () {
      this.$nextTick(() => {
        const element = this.$refs.name
        if (!element) { return }
        element.focus()
      })
      this.inputIsFocused = true
    },
    focus () {
      this.$store.commit('pinchCounterZoomDecimal', 1)
      this.$store.dispatch('history/pause')
      this.inputIsFocused = true
    },
    blur () {
      this.$store.commit('triggerUpdatePositionInVisualViewport')
      this.$store.dispatch('history/resume')
      const box = utils.clone(this.box)
      this.$store.dispatch('history/add', { boxes: [box], useSnapshot: true })
      this.inputIsFocused = false
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
        if (this.visible) {
          this.closeDialogs()
          this.scrollIntoViewAndFocus()
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
