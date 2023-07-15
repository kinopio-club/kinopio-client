<script setup>
// import utils from '@/utils.js'

import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
const store = useStore()

// onMounted(() => {
//   console.log(`🍆 the dialog is now mounted.`, store.state.currentSpace)
// })

const props = defineProps({
  visible: Boolean
})
// const emit = defineEmits(['updateCount'])

// watch(() => props.visible, (value, prevValue) => {
//   if (value) {
//     console.log('💁‍♀️', value)
//   }
// })

// const state = reactive({
//   count: 0
// })

// const themeName = computed(() => store.state.currentUser.theme)
// const incrementBy = () => {
//   state.count = state.count + 1
//   emit('updateCount', state.count)
//   // store.dispatch('themes/isSystem', false)
// }

// toggleIsFavoriteSpace () {
//   const currentSpace = this.$store.state.currentSpace
//   if (this.isFavoriteSpace) {
//     this.$store.dispatch('currentUser/removeFavorite', { type: 'space', item: currentSpace })
//   } else {
//     this.$store.dispatch('currentUser/addFavorite', { type: 'space', item: currentSpace })
//   }
//   this.updateLocalSpaces()
// },

</script>

<template lang="pug">
//- REMOVE this dialog, 1 click fav
//- button TITLE  = pin , or add to , or remove, from favorites

dialog.narrow.favorite-space(v-if="visible" :open="visible" @click.left.stop ref="dialog")
  section
    p pin your space,
  section
    p add fav space
  section
    p shortcut to open your faves (or just show them here?)
    button
      span My
      img.icon.heart(src="@/assets/heart.svg")
    //- remove from sidebar?
    //- button(@click="incrementBy")
    //-   span Count is: {{ state.count }}
    //- p Current theme is: {{ themeName }}
</template>

<style lang="stylus">
// dialog.favorite-space
  // left initial
  // right 8px

</style>
