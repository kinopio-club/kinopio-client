<template lang="pug">
dialog.narrow.tag-picker-style-actions(v-if="visible" :open="visible" ref="dialog" @click.left.stop="closeDialogs")
  section
    .row
      button(@click="toggleNewTagIsVisible" :class="{ active: newTagIsVisible }")
        img.icon(src="@/assets/add.svg")
        span New Tag
    template(v-if="newTagIsVisible")
      .row
        .button-wrap
          button.change-color(@click.stop="toggleColorPickerIsVisible")
            .current-color(:style="{ background: newTagColor }")
          ColorPicker(:currentColor="newTagColor" :visible="colorPickerIsVisible" @selectedColor="updateNewTagColor")
        input(placeholder="name" v-model="newTagName" @keyup.space.prevent @keyup.escape.stop="toggleNewTagIsVisible" @keyup.stop)
      .row
        button(@click="createNewTag")
          span Create New Tag
      .row(v-if="errorNewTagNameIsBlank")
        .badge.danger Tag name cannot be blank

  TagList(:tags="tags" :isLoading="loading" :shouldEmitSelectTag="true" @selectTag="selectTag")
</template>

<script>
import TagList from '@/components/TagList.vue'
import scrollIntoView from '@/scroll-into-view.js'
import cache from '@/cache.js'
import utils from '@/utils.js'
import ColorPicker from '@/components/dialogs/ColorPicker.vue'

import randomColor from 'randomcolor'

export default {
  name: 'TagPickerStyleActions',
  components: {
    TagList,
    ColorPicker
  },
  props: {
    visible: Boolean,
    cards: Array
  },
  data () {
    return {
      tags: [],
      loading: false,
      newTagIsVisible: false,
      colorPickerIsVisible: false,
      newTagName: '',
      newTagColor: '',
      errorNewTagNameIsBlank: false
    }
  },
  // computed: {
  //   frames () {
  //     return frames
  //   }
  // },
  methods: {
    scrollIntoView () {
      this.$nextTick(() => {
        const element = this.$refs.dialog
        const isTouchDevice = this.$store.state.isTouchDevice
        scrollIntoView.scroll(element, isTouchDevice)
      })
    },
    createNewTag () {
      this.errorNewTagNameIsBlank = false
      if (!this.newTagName) {
        this.errorNewTagNameIsBlank = true
      }
      // create tag w name and color
      // get the model version?
      // selectTag
    },
    selectTag (tag) {
      this.closeDialogs()
      console.log('🐢', tag)
    },
    toggleNewTagIsVisible () {
      this.newTagIsVisible = !this.newTagIsVisible
      this.newTagColor = randomColor({ luminosity: 'light' })
    },
    toggleColorPickerIsVisible () {
      this.colorPickerIsVisible = !this.colorPickerIsVisible
    },
    updateNewTagColor (color) {
      this.newTagColor = color
    },
    closeDialogs () {
      this.colorPickerIsVisible = false
    },
    clearState () {
      this.newTagIsVisible = false
      this.errorNewTagNameIsBlank = false
      this.newTagName = ''
    },

    // same as TagPicker

    updateTags () {
      const spaceTags = this.$store.getters['currentSpace/spaceTags']()
      this.tags = spaceTags || []
      const cachedTags = cache.allTags()
      const mergedTags = utils.mergeArrays({ previous: spaceTags, updated: cachedTags, key: 'name' })
      this.tags = mergedTags
      this.updateRemoteTags()
    },
    async updateRemoteTags () {
      if (!this.currentUserIsSignedIn) { return }
      const remoteTagsIsFetched = this.$store.state.remoteTagsIsFetched
      let remoteTags
      if (remoteTagsIsFetched) {
        remoteTags = this.$store.state.remoteTags
      } else {
        this.loading = true
        remoteTags = await this.$store.dispatch('api/getUserTags') || []
        this.$store.commit('remoteTags', remoteTags)
        this.$store.commit('remoteTagsIsFetched', true)
        this.loading = false
      }
      const mergedTags = utils.mergeArrays({ previous: this.tags, updated: remoteTags, key: 'name' })
      this.tags = mergedTags
      this.scrollIntoView()
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
        this.scrollIntoView()
        this.updateTags()
        this.clearState()
        this.closeDialogs()
      }
    }
  }
}
</script>

<style lang="stylus">
.tag-picker-style-actions
  .change-color
    margin-right 6px
</style>
