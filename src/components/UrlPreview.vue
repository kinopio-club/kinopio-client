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

</style>
