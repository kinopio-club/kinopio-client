<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import utils from '@/utils.js'

const props = defineProps({
  group: Object,
  showName: Boolean
})

const isVisible = computed(() => Boolean(props.group))
const shortName = computed(() => {
  let name = props.group.name
  name = utils.normalizeString(name)
  return name.charAt(0).toUpperCase()
})
const classes = computed(() => {
  return utils.colorClasses({ backgroundColor: props.group.color })
})
</script>

<template lang="pug">
span.group-label(v-if="isVisible" :title="props.group.name" :data-group-id="props.group.id")
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
