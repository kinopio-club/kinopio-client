<script setup>
import { reactive, computed, onMounted, onUnmounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'

const store = useStore()

const emit = defineEmits(['clickTag'])

const props = defineProps({
  tag: Object,
  isActive: Boolean,
  isClickable: Boolean,
  badgeLabel: String
})

const tagStyle = computed(() => utils.tagStyle(props.tag))
const isDark = computed(() => utils.colorIsDark(props.tag.color))
const clickTag = (event) => {
  emit('clickTag', event, props.tag)
}
</script>

<template lang="pug">
.tag.badge(
  @click.left.stop="clickTag"
  @touchend.stop="clickTag"
  @keyup.stop.enter="clickTag"
  :data-tag-id="props.tag.id"
  :data-tag-name="props.tag.name"
  :class="{ 'button-badge': props.isClickable, 'active': props.isActive }"
  :style="tagStyle"
)
  span.tag-name(:class="{ 'is-dark': isDark }") {{props.tag.name}}
  .badge.label-badge(v-if="props.badgeLabel")
    span {{props.badgeLabel}}
</template>

<style lang="stylus">
.tag
  .tag-name
    color var(--primary-on-light-background)
    &.is-dark
      color var(--primary-on-dark-background)
</style>
