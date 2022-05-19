<template lang="pug">
dialog.sidebar.narrow(v-if="visible" :open="visible" @click.left.stop="closeDialogs" ref="dialog" :style="{'max-height': dialogHeight + 'px'}")
  section
    .row.title-row-flex
      .button-wrap
        .segmented-buttons
          button
            //- (@click.left="toggleTagsIsVisible" :class="{ active: tagsIsVisible}")
            span Tags
          button
            //- (@click.left="toggleLinksIsVisible" :class="{ active: linksIsVisible}")
            span Links
          button
            //- (@click.left="toggleCommentsIsVisible" :class="{ active: commentsIsVisible}")
            img.icon(src="@/assets/comment.svg")

      .button-wrap
        button
          //- (@click.left="toggleRemovedIsVisible" :class="{ active: removedIsVisible}")
          img.icon(src="@/assets/remove.svg")
          img.icon.remove-undo(src="@/assets/undo.svg")

        //- Links(:visible="linksIsVisible")
        //- Tags(:visible="tagsIsVisible")

</template>

<script>
import utils from '@/utils.js'
import Links from '@/components/Links.vue'
import Tags from '@/components/Tags.vue'
import Comments from '@/components/Comments.vue'

export default {
  name: 'Sidebar',
  components: {
    Links,
    Tags,
    Comments
  },
  props: {
    visible: Boolean
  },
  data () {
    return {
      dialogHeight: null
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
  .title-row-flex
    display flex
    justify-content space-between

</style>
