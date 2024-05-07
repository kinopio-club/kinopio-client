<script setup>
import { reactive, computed, onMounted, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import Card from '@/components/Card.vue'
import CardCommentPreview from '@/components/CardCommentPreview.vue'
import utils from '@/utils.js'

const store = useStore()

onMounted(() => {
  store.subscribe((mutation, state) => {
    if (mutation.type === 'triggerUpdateUrlPreviewComplete') {
      store.dispatch('currentCards/checkIfShouldUpdateNewTweetCards')
    }
  })
})

const unlockedCards = computed(() => store.getters['currentCards/isNotLocked'])

const currentHoveredCard = computed(() => {
  const cardId = store.state.currentUserIsHoveringOverCardId
  if (!cardId) { return }
  const card = store.getters['currentCards/byId'](cardId)
  const isComment = card.isComment || utils.isNameComment(name.value)
  console.log('🌷🌷🌷', isComment, cardId)
  return isComment
})

// const cardCommentPreviewIsVisible = computed(() => currentUserIsHoveringOverCardId)

</script>

<template lang="pug">
.cards
  //- locked cards rendered in ItemsLocked
  template(v-for="card in unlockedCards" :key="card.id")
    Card(:card="card")
  p {{currentHoveredCard}}
  //- CardCommentPreview(:visible="isHoveredCardComment" :card="card" :user="createdByUser" :position="")
  //- cardCommentPreviewIsVisible = isComment and is hovering

</template>

<style lang="stylus">
</style>
