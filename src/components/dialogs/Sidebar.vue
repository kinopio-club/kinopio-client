<template lang="pug">
dialog#sidebar.sidebar.is-pinnable(v-if="visible" :open="visible" @click.left.stop="closeDialogs" ref="dialog" :style="{'max-height': dialogHeight + 'px'}" :data-is-pinned="dialogIsPinned" :class="{'is-pinned': dialogIsPinned}")
  section
    .row.title-row-flex
      .button-wrap.segmented-buttons-wrap
        //- first row
        .segmented-buttons
          //- Text
          button(@click.left="toggleTextIsVisible" :class="{active: textIsVisible}")
            span Text
          //- Tags
          button(@click.left="toggleTagsIsVisible" :class="{ active: tagsIsVisible}")
            span Tags
          //- Comments
          button(@click.left="toggleCommentsIsVisible" :class="{ active: commentsIsVisible}")
            img.icon.comment-icon(src="@/assets/comment.svg")
          //- Links
          button(@click.left="toggleLinksIsVisible" :class="{ active: linksIsVisible}")
            span Links
        //- second row
        .segmented-buttons
          //- Inbox
          button(@click.left="toggleInboxIsVisible" :class="{ active: inboxIsVisible}")
            img.icon(src="@/assets/inbox.svg")
          //- AI Images
          button(@click.left="toggleAIImagesIsVisible" :class="{ active: AIImagesIsVisible}")
            img.icon.flower(src="@/assets/flower.svg")
            span AI
          //- Stats
          button(@click.left="toggleStatsIsVisible" :class="{active: statsIsVisible}")
            img.icon.stats(src="@/assets/stats.svg")
          //- Removed
          button(@click.left="toggleRemovedIsVisible" :class="{ active: removedIsVisible}")
            img.icon(src="@/assets/remove.svg")
            img.icon.remove-undo(src="@/assets/undo.svg")

      //- Pin
      .title-row
        .button-wrap(@click.left="toggleDialogIsPinned" title="Pin dialog")
          button.small-button(:class="{active: dialogIsPinned}")
            img.icon.pin.right-pin(src="@/assets/pin.svg")

  Tags(:visible="tagsIsVisible" :parentIsPinned="dialogIsPinned")
  Links(:visible="linksIsVisible" :parentIsPinned="dialogIsPinned")
  Comments(:visible="commentsIsVisible")
  Removed(:visible="removedIsVisible")
  AIImages(:visible="AIImagesIsVisible")
  Stats(:visible="statsIsVisible")
  Text(:visible="textIsVisible")

</template>

<script>
import utils from '@/utils.js'
import Links from '@/components/Links.vue'
import Tags from '@/components/Tags.vue'
import Comments from '@/components/Comments.vue'
import Removed from '@/components/Removed.vue'
import AIImages from '@/components/AIImages.vue'
import Stats from '@/components/Stats.vue'
import Text from '@/components/Text.vue'

export default {
  name: 'Sidebar',
  components: {
    Links,
    Tags,
    Comments,
    Removed,
    AIImages,
    Stats,
    Text
  },
  props: {
    visible: Boolean
  },
  data () {
    return {
      dialogHeight: null,
      tagsIsVisible: false,
      linksIsVisible: false,
      commentsIsVisible: false,
      removedIsVisible: false,
      AIImagesIsVisible: false,
      inboxIsVisible: false,
      statsIsVisible: false,
      favoritesIsVisible: false,
      textIsVisible: true
    }
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'updatePageSizes') {
        this.updateDialogHeight()
      } else if (mutation.type === 'triggerRemovedIsVisible') {
        this.$nextTick(() => {
          this.clearVisible()
          this.removedIsVisible = true
        })
      } else if (mutation.type === 'triggerAIImagesIsVisible') {
        this.$nextTick(() => {
          this.clearVisible()
          this.AIImagesIsVisible = true
        })
      }
    })
  },
  computed: {
    dialogIsPinned () { return this.$store.state.sidebarIsPinned }
  },
  methods: {
    toggleDialogIsPinned () {
      const isPinned = !this.dialogIsPinned
      this.$store.dispatch('sidebarIsPinned', isPinned)
    },
    closeDialogs () {
      this.$store.commit('tagDetailsIsVisible', false)
      this.$store.commit('triggerCloseChildDialogs')
    },
    clearVisible () {
      this.linksIsVisible = false
      this.tagsIsVisible = false
      this.commentsIsVisible = false
      this.removedIsVisible = false
      this.AIImagesIsVisible = false
      this.inboxIsVisible = false
      this.statsIsVisible = false
      this.textIsVisible = false
    },
    toggleTagsIsVisible () {
      const value = !this.tagsIsVisible
      this.clearVisible()
      this.tagsIsVisible = value
    },
    toggleLinksIsVisible () {
      const value = !this.linksIsVisible
      this.clearVisible()
      this.linksIsVisible = value
    },
    toggleCommentsIsVisible () {
      const value = !this.commentsIsVisible
      this.clearVisible()
      this.commentsIsVisible = value
    },
    toggleRemovedIsVisible () {
      const value = !this.removedIsVisible
      this.clearVisible()
      this.removedIsVisible = value
    },
    toggleInboxIsVisible () {
      const value = !this.inboxIsVisible
      this.clearVisible()
      this.inboxIsVisible = value
    },
    toggleAIImagesIsVisible () {
      const value = !this.AIImagesIsVisible
      this.clearVisible()
      this.AIImagesIsVisible = value
    },
    toggleStatsIsVisible () {
      const value = !this.statsIsVisible
      this.clearVisible()
      this.statsIsVisible = value
    },
    toggleTextIsVisible () {
      const value = !this.textIsVisible
      this.clearVisible()
      this.textIsVisible = value
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
        this.$store.commit('shouldExplicitlyHideFooter', true)
      } else {
        this.$store.commit('shouldExplicitlyHideFooter', false)
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
  overflow auto
  &.is-pinned
    top -13px
  .title-row-flex
    align-items flex-start
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
  .icon.flower
    vertical-align -1px
    height 11px

</style>
