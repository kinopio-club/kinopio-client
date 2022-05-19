<template lang="pug">
dialog.sidebar.narrow.is-pinnable(v-if="visible" :open="visible" @click.left.stop="closeDialogs" ref="dialog" :style="{'max-height': dialogHeight + 'px'}")
  section
    .row.title-row-flex
      .button-wrap
        .segmented-buttons
          button(@click.left="toggleTagsIsVisible" :class="{ active: tagsIsVisible}")
            span Tags
          button(@click.left="toggleLinksIsVisible" :class="{ active: linksIsVisible}")
            span Links
          button(@click.left="toggleCommentsIsVisible" :class="{ active: commentsIsVisible}")
            img.icon.comment-icon(src="@/assets/comment.svg")
      .title-row
        .button-wrap.pin-button-wrap(@click.left="toggleDialogIsPinned"  :class="{active: dialogIsPinned}" title="Pin dialog")
          button
            img.icon.pin.right-pin(src="@/assets/pin.svg")
    .row
      button(@click.left="toggleRemovedIsVisible" :class="{ active: removedIsVisible}")
        img.icon(src="@/assets/remove.svg")
        img.icon.remove-undo(src="@/assets/undo.svg")

  Tags(:visible="tagsIsVisible")
  Links(:visible="linksIsVisible")
  Comments(:visible="commentsIsVisible")
  Removed(:visible="removedIsVisible")

</template>

<script>
import utils from '@/utils.js'
import Links from '@/components/Links.vue'
import Tags from '@/components/Tags.vue'
import Comments from '@/components/Comments.vue'
import Removed from '@/components/Removed.vue'

export default {
  name: 'Sidebar',
  components: {
    Links,
    Tags,
    Comments,
    Removed
  },
  props: {
    visible: Boolean
  },
  data () {
    return {
      dialogHeight: null,
      tagsIsVisible: true,
      linksIsVisible: false,
      commentsIsVisible: false,
      removedIsVisible: false,
      dialogIsPinned: false
    }
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'updatePageSizes') {
        this.updateDialogHeight()
      }
    })
  },
  methods: {
    closeDialogs () {
      this.$store.commit('tagDetailsIsVisible', false)
    },
    clearIsVisible () {
      this.linksIsVisible = false
      this.tagsIsVisible = false
      this.commentsIsVisible = false
      this.removedIsVisible = false
    },
    toggleTagsIsVisible () {
      const value = !this.tagsIsVisible
      this.clearIsVisible()
      this.tagsIsVisible = value
    },
    toggleLinksIsVisible () {
      const value = !this.linksIsVisible
      this.clearIsVisible()
      this.linksIsVisible = value
    },
    toggleCommentsIsVisible () {
      const value = !this.commentsIsVisible
      this.clearIsVisible()
      this.commentsIsVisible = value
    },
    toggleRemovedIsVisible () {
      const value = !this.removedIsVisible
      this.clearIsVisible()
      this.removedIsVisible = value
    },
    toggleDialogIsPinned () {
      this.dialogIsPinned = !this.dialogIsPinned
    },
    updateDialogHeight () {
      if (!this.visible) { return }
      this.$nextTick(() => {
        let element = this.$refs.dialog
        this.dialogHeight = utils.elementHeight(element)
      })
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
        this.updateDialogHeight()
      }
    }
  }
}
</script>

<style lang="stylus">
.sidebar
  top calc(100% - 8px)
  left initial
  right 8px
  max-height calc(100vh - 25px)
  width 215px !important
  .title-row-flex
    display flex
    justify-content space-between
    .comment-icon
      vertical-align -2px
  .right-pin
    transform rotate(180deg)
  // section.no-border
  //   border none
  .tags,
  .links,
  .comments,
  .removed
    section
      &:first-child
        border-top-left-radius 0
        border-top-right-radius 0
</style>
