<template lang="pug">
dialog.narrow.box-details(v-if="visible" :open="visible" @click.left.stop="closeDialogs" ref="dialog" :style="styles" :data-box-id="box.id")
  section
    .row.info-row
      //- color
      .button-wrap
        button.change-color(:disabled="!canEditBox" @click.left.stop="toggleColorPicker" :class="{active: colorPickerIsVisible}")
          .current-color(:style="{backgroundColor: box.color}")
        ColorPicker(
          :currentColor="box.color"
          :visible="colorPickerIsVisible"
          :recentColors="itemColors"
          @selectedColor="updateColor"
        )
      //- name
      .textarea-wrap
        textarea.name(
          :disabled="!canEditBox"
          ref="name"
          rows="1"
          placeholder="Box Name"
          v-model="name"
          @keydown.enter.stop.prevent="closeAllDialogs"
          maxLength="600"
          :class="{'is-dark': colorisDark}"
        )
    CardBoxActions(:visible="canEditBox" :boxes="[box]" @closeDialogs="closeDialogs" :colorIsHidden="true")
    .row(v-if="canEditBox")
      //- remove
      .button-wrap
        button.danger(@click.left="removeBox")
          img.icon(src="@/assets/remove.svg")
    .row(v-if="!canEditBox")
      span.badge.info
        img.icon(src="@/assets/unlock.svg")
        span Read Only

</template>

<script>
import ColorPicker from '@/components/dialogs/ColorPicker.vue'
import CardBoxActions from '@/components/subsections/CardBoxActions.vue'
import utils from '@/utils.js'

let prevBoxId

export default {
  name: 'BoxDetails',
  components: {
    ColorPicker,
    CardBoxActions
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
    visible () { return utils.objectHasKeys(this.box) },
    spaceCounterZoomDecimal () { return this.$store.getters.spaceCounterZoomDecimal },
    styles () {
      let zoom = this.spaceCounterZoomDecimal
      if (this.$store.state.isTouchDevice) {
        zoom = utils.pinchCounterZoomDecimal()
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
        this.textareaSizes()
      }
    },
    canEditBox () { return this.$store.getters['currentUser/canEditBox'](this.box) },
    itemColors () { return this.$store.getters['currentSpace/itemColors'] },
    colorisDark () {
      const color = this.box.color
      return utils.colorIsDark(color)
    }
  },
  methods: {
    broadcastShowBoxDetails () {
      const updates = {
        boxId: this.box.id,
        userId: this.$store.state.currentUser.id
      }
      this.$store.commit('broadcast/updateStore', { updates, type: 'updateRemoteBoxDetailsVisible' })
    },
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
    closeDialogs () {
      this.colorPickerIsVisible = false
    },
    closeAllDialogs () {
      this.$store.dispatch('closeAllDialogs')
    },
    focusName () {
      this.$nextTick(() => {
        const element = this.$refs.name
        if (!element) { return }
        element.focus()
      })
    },
    selectName () {
      // select all in new boxes, else put cursor at end (like cards)
      const currentBoxIsNew = this.$store.state.currentBoxIsNew
      const element = this.$refs.name
      const length = this.name.length
      let start = length
      if (currentBoxIsNew) {
        start = 0
      }
      if (length && element) {
        element.setSelectionRange(start, length)
      }
      this.$store.commit('currentBoxIsNew', false)
    },
    blur () {
      this.$store.commit('triggerUpdatePositionInVisualViewport')
    },
    scrollIntoView () {
      this.$nextTick(() => {
        const element = this.$refs.dialog
        this.$nextTick(() => {
          utils.scrollIntoView({ element })
        })
      })
    },
    scrollIntoViewAndFocus () {
      this.scrollIntoView()
      if (utils.isMobile()) { return }
      this.$nextTick(() => {
        this.focusName()
        this.selectName()
      })
    },
    textareaSizes () {
      const element = this.$refs.dialog
      let textarea = element.querySelector('textarea')
      let modifier = 0
      if (this.canEditBox) {
        modifier = 1
      }
      textarea.style.height = textarea.scrollHeight + modifier + 'px'
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
          this.broadcastShowBoxDetails()
          this.scrollIntoViewAndFocus()
          this.textareaSizes()
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
  transform-origin top left
  textarea.name
    margin-left 6px
    margin-top 2px
    margin-bottom 0
    width calc(100% - 6px)
    &.is-dark
      color var(--primary-background)
  .info-row
    align-items flex-start
</style>
