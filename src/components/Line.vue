<script setup>
import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
const store = useStore()

// import utils from '@/utils.js'

const props = defineProps({
  line: Object
})

// styles

const styles = computed(() => {
  return {
    top: props.line.y + 'px'
  }
})
const infoStyles = computed(() => {
  return {
    backgroundColor: props.line.color
  }
})
const horizontalLineStyles = computed(() => {
  return {
    backgroundColor: props.line.color,
    width: store.state.pageWidth + 'px'
  }
})
</script>

<template lang="pug">
.line(:key="props.line.id" :data-line-id="props.line.id" :style="styles")
  .line-info.badge.button-badge(:style="infoStyles")
    button.small-button
      img.icon(src="@/assets/brush-y.svg")
    span {{props.line.name}}
  .line-horizontal(:style="horizontalLineStyles")

//- :class="{hover: isHover, active: isDragging}"

  //- .line-info(
  //-   :data-line-id="line.id"
  //-   :style="labelStyles"
  //-   :class="{unselectable: isPainting, 'is-dark': colorIsDark}"
  //-   tabindex="0"

  //-   @mouseover="updateIsHover(true)"
  //-   @mouseleave="updateIsHover(false)"
  //-   @mousedown.left="startBoxInfoInteraction"

  //-   @mouseup.left="endBoxInfoInteraction"
  //-   @keyup.stop.enter="endBoxInfoInteraction"

  //-   @touchstart="startLocking"
  //-   @touchmove="updateCurrentTouchPosition"
  //-   @touchend="endBoxInfoInteractionTouch"
  //- )
  //-   template(v-if="isH1")
  //-     h1 {{h1Name}}
  //-   template(v-else-if="isH2")
  //-     h2 {{h2Name}}
  //-   template(v-else)
  //-     span {{line.name}}
</template>

<style lang="stylus">
.line
  position absolute
  .line-info
    width fit-content
    transform translate(0, 15px)
    cursor pointer
    pointer-events auto
    padding 6px
    box-shadow none
    border-radius var(--entity-radius)
    border-top-left-radius 0
    border-bottom-left-radius 0
    button + span
      margin-left 4px
    button
      background-color transparent
  .line-horizontal
    left 0
    height 1px
    // z-index -1
</style>
