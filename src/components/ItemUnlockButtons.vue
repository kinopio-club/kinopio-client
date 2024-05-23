<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import BoxUnlockButton from '@/components/BoxUnlockButton.vue'
import CardUnlockButton from '@/components/CardUnlockButton.vue'
import utils from '@/utils.js'

const store = useStore()

const props = defineProps({
  visible: Boolean
})

const lockedBoxes = computed(() => store.getters['currentBoxes/isLocked'])
const lockedCards = computed(() => store.getters['currentCards/isLocked'])
const isThemeDark = computed(() => store.state.currentUser.theme === 'dark')
</script>

<template lang="pug">
//- boxes
template(v-for="box in lockedBoxes")
  BoxUnlockButton(:box="box")
//- cards
template(v-for="card in lockedCards")
  CardUnlockButton(:card="card")
</template>

<style lang="stylus">
// .component-name
</style>
