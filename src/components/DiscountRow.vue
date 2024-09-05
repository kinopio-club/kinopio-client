<script setup>
import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import consts from '@/consts.js'
const store = useStore()

const isSecureAppContextIOS = computed(() => consts.isSecureAppContextIOS)

onMounted(() => {
  store.subscribe((mutation, state) => {
    if (mutation.type === 'triggerCloseChildDialogs') {
      closeChildDialogs()
    }
  })
})

const state = reactive({
  studentInfoIsVisible: false
})

const closeChildDialogs = () => {
  state.studentInfoIsVisible = false
}
const toggleStudentInfoIsVisible = () => {
  const value = !state.studentInfoIsVisible
  store.commit('triggerCloseChildDialogs')
  state.studentInfoIsVisible = value
}
</script>

<template lang="pug">
.row.discount-row(v-if="!isSecureAppContextIOS" @click.stop="closeChildDialogs")
  .button-wrap
    button(@click.stop="toggleStudentInfoIsVisible" :class="{ active: state.studentInfoIsVisible }")
      span Student Info
section.subsection(v-if="state.studentInfoIsVisible" @click.stop)
  p If you're a student or teacher,{{' '}}
    a(href="mailto:hi@kinopio.club?subject=Education Discount") email me
    span {{' '}}for a 50% discount off the yearly plan
</template>

<style lang="stylus">
.discount-row
  margin-top 10px
  display inline-block
</style>
