<script setup>
import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

const store = useStore()

const props = defineProps({
  visible: Boolean,
  layers: Array,
  backgroundStyles: Object
})

const layer = (index) => {
  const layer = props.layers[index]
  const isBackgroundLayer = index === props.layers.length - 1
  let styles = { background: `radial-gradient(at ${layer.x}% ${layer.y}%, ${layer.color1} 0%, ${layer.color2} 80%)` }
  if (isBackgroundLayer) {
    styles = { background: layer.color }
  }
  return styles
}
const spaceShouldHaveBorderRadius = computed(() => store.getters.spaceShouldHaveBorderRadius)
</script>

<template lang="pug">
.space-background-gradients(v-if="visible" :style="props.backgroundStyles" :class="{'space-border-radius': spaceShouldHaveBorderRadius}")
  .gradients-layer.layer-0(:style="layer(0)")
  .gradients-layer.layer-1(:style="layer(1)")
  .gradients-layer.layer-2(:style="layer(2)")
  .gradients-layer.layer-3(:style="layer(3)")
  .gradients-layer.layer-4(:style="layer(4)")
  .gradients-layer.layer-5(:style="layer(5)")
  .gradients-layer.layer-6(:style="layer(6)")
</template>

<style lang="stylus">
.space-background-gradients
  overflow hidden
  position absolute
  width 100%
  height 100%
  pointer-events none
  z-index 0
  transform-origin top left
  background var(--primary-background)

  .gradients-layer
    position absolute
    height 100%
    width 100%
    transition opacity 2000ms

  .layer-0
    opacity 0
    z-index 100
  .layer-1
    opacity 1
    z-index 99
  .layer-2
    opacity 0
    z-index 98
  .layer-3
    opacity 1
    z-index 97
  .layer-4
    opacity 0
    z-index 96
  .layer-5
    opacity 1
    z-index 95
  .layer-6
    transition background 1000ms
    opacity 1
    z-index 5
</style>
