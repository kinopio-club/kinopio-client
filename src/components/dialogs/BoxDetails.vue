<template lang="pug">
dialog.narrow.box-details(v-if="visible" :open="visible" @click.left.stop="closeDialogs" ref="dialog" :style="styles" :data-box-id="box.id")
  section
    .row
      //- color
      .button-wrap
        button.change-color(:disabled="!canEditBox" @click.left.stop="toggleColorPicker" :class="{active: colorPickerIsVisible}")
          .current-color(:style="{backgroundColor: box.color}")
        ColorPicker(:currentColor="box.color" :visible="colorPickerIsVisible" @selectedColor="updateColor")
      //- name
      input.name(
        :disabled="!canEditBox"
        placeholder="Box Name"
        v-model="name"
        ref="name"
        @blur="blur"
        @keydown.enter.stop.prevent="closeAllDialogs"
        maxLength="600"
      )
    .row
      //- h1
      .button-wrap
        button(:disabled="!canEditBox" @click="toggleHeader('h1Pattern')" :class="{ active: isH1 }")
          span h1
      //- h2
      .button-wrap
        button(:disabled="!canEditBox" @click="toggleHeader('h2Pattern')" :class="{ active: isH2 }")
          span h2
      //- fill
      .segmented-buttons
        button(:class="{active: fillIsFilled}" @click="updateFill('filled')")
          img.icon.box-icon(src="@/assets/box.svg")
        button(:class="{active: fillIsEmpty}" @click="updateFill('empty')")
          img.icon.box-icon(src="@/assets/box-empty.svg")
    .row
      //- remove
      .button-wrap
        button(:disabled="!canEditBox" @click.left="removeBox")
          img.icon(src="@/assets/remove.svg")
          span Remove

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
    name: {
      get () {
        return this.box.name
      },
      set (name) {
        this.update({ name })
      }
    },
    isH1 () {
      const pattern = 'h1Pattern'
      return this.nameHasPattern(pattern)
    },
    isH2 () {
      const pattern = 'h2Pattern'
      return this.nameHasPattern(pattern)
    },
    canEditBox () { return this.$store.getters['currentUser/canEditBox']() }
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
    },

    // h1, h2

    nameHasPattern (pattern) {
      const result = utils.markdown()[pattern].exec(this.name)
      return Boolean(result)
    },
    toRemovePattern (pattern) {
      if (pattern === 'h1Pattern') {
        return 'h2Pattern'
      } else if (pattern === 'h2Pattern') {
        return 'h1Pattern'
      }
    },
    toggleHeader (pattern) {
      let hasPattern
      if (pattern === 'h1Pattern') {
        hasPattern = this.isH1
      } else if (pattern === 'h2Pattern') {
        hasPattern = this.isH2
      }
      const toRemovePattern = this.toRemovePattern(pattern)
      if (hasPattern) {
        this.removeFromName(pattern)
      } else {
        this.removeFromName(toRemovePattern)
        this.prependToName(pattern)
      }
    },
    markdown (pattern) {
      if (pattern === 'h1Pattern') {
        return '# '
      } else if (pattern === 'h2Pattern') {
        return '## '
      }
    },
    removeFromName (pattern) {
      const markdown = this.markdown(pattern)
      const newName = this.name.replace(markdown, '')
      if (newName === this.name) { return }
      this.update({ name: newName })
    },
    prependToName (pattern) {
      const markdown = this.markdown(pattern)
      const newName = markdown + this.name
      this.update({ name: newName })
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
