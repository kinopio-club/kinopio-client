<template lang="pug">
dialog.sidebar.is-pinnable(v-if="visible" :open="visible" @click.left.stop="closeDialogs" ref="dialog" :style="{'max-height': dialogHeight + 'px'}" :data-is-pinned="dialogIsPinned" :class="{'is-pinned': dialogIsPinned}")
  section
    .row.title-row-flex
      .button-wrap.segmented-buttons-wrap
        //- first row
        .segmented-buttons
          //- Tags
          button(@click.left="toggleTagsIsVisible" :class="{ active: tagsIsVisible}")
            span Tags
          //- Links
          button(@click.left="toggleLinksIsVisible" :class="{ active: linksIsVisible}")
            span Links
          //- Comments
          button(@click.left="toggleCommentsIsVisible" :class="{ active: commentsIsVisible}")
            img.icon.comment-icon(src="@/assets/comment.svg")
          //- Removed
          button(@click.left="toggleRemovedIsVisible" :class="{ active: removedIsVisible}")
            img.icon(src="@/assets/remove.svg")
            img.icon.remove-undo(src="@/assets/undo.svg")
        //- second row
        .segmented-buttons
          //- AI Images
          button(@click.left="toggleAIImagesIsVisible" :class="{ active: AIImagesIsVisible}")
            img.icon(src="@/assets/flower.svg")
            span AI
          //- Stats
          button(@click.left="toggleStatsIsVisible" :class="{active: statsIsVisible}")
            img.icon.stats(src="@/assets/stats.svg")
          //- Stats
          button(@click.left="toggleFavoritesIsVisible" :class="{active: favoritesIsVisible}")
            img.icon(src="@/assets/heart-empty.svg")

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
  Favorites(:visible="favoritesIsVisible")

</template>

<script>
import utils from '@/utils.js'
import Links from '@/components/Links.vue'
import Tags from '@/components/Tags.vue'
import Comments from '@/components/Comments.vue'
import Removed from '@/components/Removed.vue'
import AIImages from '@/components/AIImages.vue'
import Stats from '@/components/Stats.vue'
import Favorites from '@/components/dialogs/Favorites.vue'

export default {
  name: 'Sidebar',
  components: {
    Links,
    Tags,
    Comments,
    Removed,
    AIImages,
    Stats,
    Favorites
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
      AIImagesIsVisible: false,
      statsIsVisible: false,
      favoritesIsVisible: false
    }
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'updatePageSizes') {
        this.updateDialogHeight()
      } else if (mutation.type === 'triggerRemovedIsVisible') {
        this.$nextTick(() => {
          this.toggleRemovedIsVisible()
        })
      } else if (mutation.type === 'triggerAIImagesIsVisible') {
        this.$nextTick(() => {
          this.toggleAIImagesIsVisible()
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
    },
    clearIsVisible () {
      this.linksIsVisible = false
      this.tagsIsVisible = false
      this.commentsIsVisible = false
      this.removedIsVisible = false
      this.AIImagesIsVisible = false
      this.statsIsVisible = false
      this.favoritesIsVisible = false
    },
    toggleTagsIsVisible () {
      const value = !this.tagsIsVisible
      if (!value) { return }
      this.clearIsVisible()
      this.tagsIsVisible = value
    },
    toggleLinksIsVisible () {
      const value = !this.linksIsVisible
      if (!value) { return }
      this.clearIsVisible()
      this.linksIsVisible = value
    },
    toggleCommentsIsVisible () {
      const value = !this.commentsIsVisible
      if (!value) { return }
      this.clearIsVisible()
      this.commentsIsVisible = value
    },
    toggleRemovedIsVisible () {
      const value = !this.removedIsVisible
      if (!value) { return }
      this.clearIsVisible()
      this.removedIsVisible = value
    },
    toggleAIImagesIsVisible () {
      const value = !this.AIImagesIsVisible
      if (!value) { return }
      this.clearIsVisible()
      this.AIImagesIsVisible = value
    },
    toggleStatsIsVisible () {
      const value = !this.statsIsVisible
      if (!value) { return }
      this.clearIsVisible()
      this.statsIsVisible = value
    },
    toggleFavoritesIsVisible () {
      const value = !this.favoritesIsVisible
      if (!value) { return }
      this.clearIsVisible()
      this.favoritesIsVisible = value
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
  &.is-pinned
    top -13px
  .title-row-flex
    display flex
    justify-content space-between
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
  .segmented-buttons-wrap
    .segmented-buttons
      &:first-child
        button
          &:first-child
            border-bottom-left-radius 0
      &:last-child
        margin-top -1px
        button
          &:first-child
            border-top-left-radius 0
          &:last-child
            border-top-right-radius 0

</style>
