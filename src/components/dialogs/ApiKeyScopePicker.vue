<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import utils from '@/utils.js'
import apiKeyScopes from '@/data/apiKeyScopes.js'

const dialogElement = ref(null)

onMounted(() => {
  window.addEventListener('resize', updateDialogHeight)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', updateDialogHeight)
})

const emit = defineEmits(['updateCurrentScope'])

const props = defineProps({
  visible: Boolean,
  currentScopeName: String
})
const state = reactive({
  dialogHeight: null
})

watch(() => props.visible, (value, prevValue) => {
  if (value) {
    updateDialogHeight()
  }
})

const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  const element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}

const scopeIsActive = (scope) => {
  return scope.name === props.currentScopeName
}

const select = (scope) => {
  emit('updateCurrentScope', scope.name)
}
</script>

<template lang="pug">
dialog.narrow.api-key-scope-picker(v-if="props.visible" :open="props.visible" @click.left.stop ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}")
  section.results-section
    ul.results-list
      template(v-for="(scope in apiKeyScopes")
        li(:class="{ active: scopeIsActive(scope) }" @click.left="select(scope)")
          span.badge.secondary {{ scope.friendlyName }}
          p.description {{ scope.description }}
</template>

<style lang="stylus">
dialog.api-key-scope-picker
  overflow auto
  .results-section
    padding-top 4px
  .badge
    display inline-block
  li
    display block
  .description
    margin-top 3px
</style>
