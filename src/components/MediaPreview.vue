<template lang="pug">
.row.media-preview(v-if="visible")
  p hi i have media
  //- .preview-content(:style="{background: selectedColor}" :class="{'image-card': isImageCard, 'is-card-details': parentIsCardDetails}")
  //-   .card-details-buttons(v-if="parentIsCardDetails" :class="{'has-padding': card.urlPreviewImage}")
  //-     .button-wrap
  //-       button(@click="hidePreview")
  //-         img.icon.cancel(src="@/assets/add.svg")
  //-     .button-wrap
  //-       a(:href="card.urlPreviewUrl")
  //-         button.visit-button
  //-           img.icon.visit(src="@/assets/visit.svg")

  //-   img.preview-image(v-if="card.urlPreviewImage" :src="card.urlPreviewImage" :class="{selected: isSelected, 'side-image': isImageCard || parentIsCardDetails}")
  //-   .text(v-if="isNotGithubRepo" :class="{'side-text badge': !isImageCard && !parentIsCardDetails && card.urlPreviewImage}" :style="{background: selectedColor}")
  //-     img.favicon(v-if="card.urlPreviewFavicon" :src="card.urlPreviewFavicon")
  //-     img.icon.favicon.open(v-else src="@/assets/open.svg")
  //-     .title {{filteredTitle}}
  //-     .description(v-if="shouldShowDescription") {{card.urlPreviewDescription}}

</template>

<script>
export default {
  name: 'MediaPreview',
  // components: {
  // },
  props: {
    visible: Boolean,
    card: Object,
    formats: Object
  },
  mounted () {
    console.log('🍅🌷', this.formats)
  },
  computed: {
  },
  methods: {
    // hidePreview () {
    // this.$store.dispatch('currentSpace/updateCard', update)
    // this.$store.commit('removeUrlPreviewLoadingForCardIds', this.card.id)
    // }
  },
  watch: {
    visible (visible) {
      console.log('🍅', this.formats)
    }
  }
}
</script>

<style lang="stylus">
.media-preview
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
      margin-right 5px
    .visit
      vertical-align middle
</style>
