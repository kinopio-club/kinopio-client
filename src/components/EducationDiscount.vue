<script setup>
import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
const store = useStore()

const state = reactive({
  descriptionIsVisible: false
})

const toggleDescriptionIsVisible = () => {
  state.descriptionIsVisible = !state.descriptionIsVisible
}
</script>

<template lang="pug">
.row.education-discount
  .button-wrap
    button(@click="toggleDescriptionIsVisible" :class="{ active: state.descriptionIsVisible }")
      span Student Discount
.row.badge.secondary(v-if="state.descriptionIsVisible")
  p If you're a student or teacher,{{' '}}
    a(href="mailto:hi@kinopioclub?subject=Education Discount") email me
    span {{' '}}for a 50% discount
</template>

<style lang="stylus">
.education-discount
  margin-top 10px
  display inline-block
</style>
