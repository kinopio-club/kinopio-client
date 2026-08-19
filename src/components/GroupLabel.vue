<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useUserStore } from '@/stores/useUserStore'

import utils from '@/utils.js'

const userStore = useUserStore()

const props = defineProps({
  group: Object,
  showName: Boolean,
  isButton: Boolean
})

const emit = defineEmits(['selectGroup'])

const isVisible = computed(() => Boolean(props.group))
const shortName = computed(() => {
  let name = props.group.name
  name = utils.normalizeString(name)
  return name.charAt(0).toUpperCase()
})
const isActive = computed(() => userStore.dialogSpaceFilterByGroup?.id === props.group.id)
const classes = computed(() => {
  const value = utils.colorClasses({ backgroundColor: props.group.color })
  if (props.isButton) {
    value.push('button-badge')
  }
  if (isActive.value) {
    value.push('active')
  }
  return value
})
const selectGroup = () => {
  emit('selectGroup', props.group)
}
</script>

<template lang="pug">
span.group-label(v-if="isVisible" :title="props.group.name" :data-group-id="props.group.id" @click="selectGroup")
  .badge.group-badge(:style="{ background: props.group.color }" :class="classes")
    span.emoji(v-if="props.group.emoji") {{props.group.emoji}}
    img.icon.group(v-else src="@/assets/group.svg")
    span(v-if="props.showName") {{ props.group.name }}
    span(v-else) {{ shortName }}
</template>

<style lang="stylus">
.group-label
  flex-shrink 0
  .group-badge
    padding 0 8px
    border-radius var(--entity-radius)
    min-width initial
    min-height initial
    display inline
    word-break keep-all
    &.is-background-light
      span
        color var(--primary-on-light-background)
      .icon
        filter none

    &.is-background-dark
      span
        color var(--primary-on-dark-background)
      .icon
        filter invert(1)
  .emoji
    margin-right 5px
</style>
