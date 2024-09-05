<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, useTemplateRef, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'

const store = useStore()

const props = defineProps({
  team: Object,
  showName: Boolean
})

const isVisible = computed(() => Boolean(props.team))
const shortName = computed(() => {
  let name = props.team.name
  name = utils.normalizeString(name)
  return name.charAt(0).toUpperCase()
})
const classes = computed(() => {
  return utils.textColorClasses({ backgroundColor: props.team.color })
})
</script>

<template lang="pug">
span.team-label(v-if="isVisible" :title="props.team.name")
  .badge.team-badge(:style="{ background: props.team.color }" :class="classes")
    img.icon.team(src="@/assets/team.svg")
    span {{ shortName }}
  span(v-if="props.showName") {{ props.team.name }}
</template>

<style lang="stylus">
.team-label
  flex-shrink 0
  .team-badge
    border-radius 100px
    min-width initial
    min-height initial
    padding 0 6px
    display inline
    .icon.team
      vertical-align 1px
    span
      vertical-align 1.5px
      font-size 12px
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

</style>
