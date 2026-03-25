<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, onUnmounted, watch, ref, nextTick } from 'vue'

// import { useGlobalStore } from '@/stores/useGlobalStore'
// import { useCardStore } from '@/stores/useCardStore'
// import { useConnectionStore } from '@/stores/useConnectionStore'
// import { useBoxStore } from '@/stores/useBoxStore'
// import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
// import { useApiStore } from '@/stores/useApiStore'

// import Loader from '@/components/Loader.vue'
// import utils from '@/utils.js'

// const globalStore = useGlobalStore()
// const cardStore = useCardStore()
// const connectionStore = useConnectionStore()
// const boxStore = useBoxStore()
// const userStore = useUserStore()
const spaceStore = useSpaceStore()
// const apiStore = useApiStore()

// let unsubscribes

// onMounted(() => {
//   loadFavoriteUsers()
//   const globalActionUnsubscribe = globalStore.$onAction(
//     ({ name, args }) => {
//       if (name === 'triggerCloseChildDialogs') {
//         closeDialogs()
//       }
//     }
//   )
//   unsubscribes = () => {
//     globalActionUnsubscribe()
//   }
// })
// onBeforeUnmount(() => {
//   unsubscribes()
// })

const props = defineProps({
  visible: Boolean
})
watch(() => props.visible, (value, prevValue) => {
  if (value) {
    // loadFavoriteUsers()
    // focusTextarea()
  }
})

// const state = reactive({
//   isLoadingFavorites: false,
//   favoriteUsers: []
// })

// const currentSpace = computed(() => spaceStore.getSpaceAllState)
// const isLoadingSpace = computed(() => globalStore.isLoadingSpace)

const spaceNote = computed({
  get () {
    return spaceStore.note
  },
  set (newValue) {
    spaceStore.update({ note: newValue })
  }
})

</script>

<template lang="pug">
section.note(v-if="visible")
  .row.title-row
    div
      img.icon.lock-icon(src="@/assets/lock.svg")
      span Private Note
  //- .badge.secondary.tips(v-if="!spaceNote")
  //-   p
  //-     img.icon.lock-icon(src="@/assets/lock.svg")
  //-     span note for this space, collaborators can't see this, only be seen by you

  textarea(
    placeholder="Type here note for this space, collaborators can't see this, only be seen by you"
  )
</template>

<style lang="stylus">
section.note
  .tips
    margin-bottom 10px
  // .icon.lock-icon
  //   vertical-align -1px
</style>
