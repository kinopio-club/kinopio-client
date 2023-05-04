<script setup>
import Loader from '@/components/Loader.vue'
import UserLabelInline from '@/components/UserLabelInline.vue'
import utils from '@/utils.js'

import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
const store = useStore()

const props = defineProps({
  otherSpace: Object,
  isActive: Boolean
})
const emit = defineEmits(['selectOtherSpace'])

const otherSpaceIsPrivate = computed(() => {
  if (!props.otherSpace.privacy) { return }
  return props.otherSpace.privacy === 'private'
})
const isLoadingOtherItems = computed(() => store.state.isLoadingOtherItems)
const url = computed(() => {
  if (!props.otherSpace) { return }
  return `${utils.kinopioDomain()}/${props.otherSpace.id}`
})

// dialog
const selectOtherSpace = (event) => {
  let otherItem = {}
  if (props.otherSpace) {
    otherItem = utils.clone(props.otherSpace)
  }
  console.log(event.target)
  emit('selectOtherSpace', { event, otherItem })
}

</script>

<template lang="pug">
a.other-space-preview(:href="url")
  .badge.button-badge.link-badge(:class="{ active: isActive }" @click.stop.prevent="selectOtherSpace($event)")
    template(v-if="otherSpace")
      template(v-if="otherSpace.users")
        UserLabelInline(:user="otherSpace.users[0]" :shouldHideName="true")
      span {{otherSpace.name}}
      img.icon.private(v-if="otherSpaceIsPrivate" src="@/assets/lock.svg")
    template(v-else)
      Loader(:visible="true" :isSmall="true" :isStatic="!isLoadingOtherItems")
      span Space

</template>

<style lang="stylus">
// .other-space-preview
//   display block
//   text-decoration none
//   word-wrap break-word
//   .link-badge
//     display block
//     margin 0
//   .card-image
//     vertical-align middle
//     border-radius var(--entity-radius)
//     max-height 100px
//     display block
//     margin 4px 0px
//   .tag
//     display inline-block
//   .badge
//     > .loader
//       vertical-align -2px

</style>
