<script setup>
import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
const store = useStore()

// earn credits

const props = defineProps({
  earnCreditsIsVisible: Boolean
})
const triggerEarnCreditsIsVisible = () => {
  store.dispatch('closeAllDialogs')
  store.commit('triggerEarnCreditsIsVisible')
}

// student info

const state = reactive({
  descriptionIsVisible: false
})
const toggleDescriptionIsVisible = () => {
  state.descriptionIsVisible = !state.descriptionIsVisible
}

</script>

<template lang="pug">
.row.discount-row
  .button-wrap
    button(@click="triggerEarnCreditsIsVisible")
      span Earn Credits
  .button-wrap
    button(@click="toggleDescriptionIsVisible" :class="{ active: state.descriptionIsVisible }")
      span Student Info
.row.badge.secondary(v-if="state.descriptionIsVisible")
  p If you're a student or teacher,{{' '}}
    a(href="mailto:hi@kinopio.club?subject=Education Discount") email me
    span {{' '}}for a 50% discount
</template>

<style lang="stylus">
.discount-row
  margin-top 10px
  display inline-block
</style>
