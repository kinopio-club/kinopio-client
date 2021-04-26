<template lang="pug">
.row.url-preview(v-if="visible")
  Loader(:visible="loading")
  template(v-if="!loading")
    a(:href="card.urlPreviewUrl")
      img.url-image(v-if="card.urlPreviewImage" :src="card.urlPreviewImage")
      span(v-if="card.urlPreviewTitle") {{card.urlPreviewTitle}}
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
    card: Object
  }
}
</script>

<style lang="stylus">
.url-preview
  border-radius 3px
  padding 4px
  background var(--secondary-hover-background)
  &:hover
    background var(--secondary-active-background)
    box-shadow var(--hover-shadow)
  &:active
    box-shadow var(--active-inset-shadow)

  a
    display flex
    align-items start !important
    color var(--primary)
    text-decoration none

  .url-image
    max-width 40%
    max-height 80px
    border-radius 3px
    margin-right 6px
  p
    margin-top 0
</style>
