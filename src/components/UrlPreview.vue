<template lang="pug">
.row.url-preview(v-if="visible")
  Loader(:visible="loading")
  template(v-if="loading")
    .card-details-buttons(v-if="parentIsCardDetails")
      .button-wrap
        button(@click="hidePreview")
          img.icon(src="@/assets/remove.svg")

  template(v-if="!loading")
    .preview-content(:style="{background: selectedColor}" :class="{'image-card': isImageCard, 'is-card-details': parentIsCardDetails}")
      .card-details-buttons(v-if="parentIsCardDetails" :class="{'has-padding': card.urlPreviewImage}")
        .button-wrap
          button(@click="hidePreview")
            img.icon(src="@/assets/remove.svg")
        .button-wrap
          a(:href="card.urlPreviewUrl")
            button.visit-button
              img.icon.visit(src="@/assets/visit.svg")

      img.preview-image(v-if="card.urlPreviewImage" :src="card.urlPreviewImage" :class="{selected: isSelected, 'side-image': isImageCard || parentIsCardDetails}")
      .text(v-if="isNotGithubRepo" :class="{'side-text badge': !isImageCard && !parentIsCardDetails && card.urlPreviewImage}" :style="{background: selectedColor}")
        img.favicon(v-if="card.urlPreviewFavicon" :src="card.urlPreviewFavicon")
        img.icon.favicon.open(v-else src="@/assets/open.svg")
        .title {{filteredTitle}}
        .description(v-if="shouldShowDescription") {{card.urlPreviewDescription}}

</template>

<script>
import Loader from '@/components/Loader.vue'

export default {
  name: 'UrlPreview',
  components: {
    Loader
  },
  props: {
    visible: Boolean,
    loading: Boolean,
    card: Object,
    parentIsCardDetails: Boolean,
    isSelected: Boolean,
    updatedByUser: Object,
    isImageCard: Boolean
  },
  computed: {
    selectedColor () {
      if (!this.isSelected) { return }
      return this.updatedByUser.color
    },
    shouldShowDescription () {
      if (!this.card.urlPreviewDescription) { return }
      const noPreviewImage = !this.card.urlPreviewImage
      // https://regexr.com/5ror4
      const domainPattern = new RegExp(/(?:(futureland.tv)|(spotify.com)|(twitter.com)|(wikipedia.org)|(tumblr.com)|(medium.com))/igm)
      const isDomain = this.card.urlPreviewUrl.match(domainPattern)
      return noPreviewImage || isDomain
    },
    filteredTitle () {
      let title = this.card.urlPreviewTitle
      title = title.replace('on Twitter', '')
      return title
    },
    isNotGithubRepo () {
      const image = this.card.urlPreviewImage
      if (image.includes('opengraph.githubassets.com')) { return false }
      return true
    }
  },
  methods: {
    hidePreview () {
      const update = {
        id: this.card.id,
        urlPreviewIsVisible: false
      }
      this.$store.dispatch('currentSpace/updateCard', update)
      this.$store.commit('removeUrlPreviewLoadingForCardIds', this.card.id)
    }
  }
}
</script>

<style lang="stylus">
.url-preview
  &.row
    display flex
  .preview-content
    width 100%
    position relative
    display flex
    align-items start !important
    color var(--primary)
    text-decoration none
    word-break break-word
    background var(--secondary-hover-background)
    border-radius 3px
    &.image-card
      padding 4px
      border-top-left-radius 0
      border-top-right-radius 0
    &.is-card-details
      padding 4px

  .preview-image
    width 100%
    border-radius 3px
    background var(--primary-background)
    pointer-events none
    -webkit-touch-callout none // prevents safari mobile press-and-hold from interrupting
    &.selected
      mix-blend-mode color-burn
    &.side-image
      max-width 40%
      margin-right 6px

  .side-text
    position absolute
    margin 8px
    max-width calc(100% - 24px)
    background var(--secondary-hover-background)

  .favicon
    border-radius 3px
    width 14px
    vertical-align -3px
    display inline
    margin-right 5px
    &.open
      width 12px
      vertical-align -2px
  .title
    display inline
  .description
    margin-top 10px

  .card-details-buttons
    z-index 1
    position absolute
    right 0
    top 0
    display flex
    flex-direction row-reverse
    &.has-padding
      padding 4px
    .visit-button
      margin-right 6px
</style>
