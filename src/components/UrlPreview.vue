<template lang="pug">
.row.url-preview(v-if="visible")
  Loader(:visible="loading")
  template(v-if="!loading")
    img(v-if="card.urlPreviewImage" :src="card.urlPreviewImage")
    p(v-if="card.urlPreviewTitle") {{card.urlPreviewTitle}}
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
  align-items start !important
  img
    max-width 80px
    max-height 80px
    border-radius 3px
    margin-right 6px
  p
    margin-top 0
</style>
