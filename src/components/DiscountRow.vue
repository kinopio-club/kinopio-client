<script setup>
import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import consts from '@/consts.js'
import EarnCredits from '@/components/dialogs/EarnCredits.vue'
const store = useStore()

const isSecureAppContextIOS = computed(() => consts.isSecureAppContextIOS)

onMounted(() => {
  store.subscribe((mutation, state) => {
    if (mutation.type === 'triggerCloseChildDialogs') {
      closeDialogs()
    }
  })
})

const state = reactive({
  studentInfoIsVisible: false,
  earnCreditsIsVisible: false
})

const closeDialogs = () => {
  state.studentInfoIsVisible = false
  state.earnCreditsIsVisible = false
}
const toggleEarnCreditsIsVisible = () => {
  const value = !state.earnCreditsIsVisible
  closeDialogs()
  state.earnCreditsIsVisible = value
}
const toggleStudentInfoIsVisible = () => {
  const value = !state.studentInfoIsVisible
  closeDialogs()
  state.studentInfoIsVisible = value
  console.log(state.studentInfoIsVisible)
}

</script>

<template lang="pug">
.row.discount-row(v-if="!isSecureAppContextIOS" @click.stop="closeDialogs")
  .button-wrap
    button(@click.stop="toggleEarnCreditsIsVisible" :class="{ active: state.earnCreditsIsVisible }")
      span Earn Credits
    EarnCredits(:visible="state.earnCreditsIsVisible")
  .button-wrap
    button(@click.stop="toggleStudentInfoIsVisible" :class="{ active: state.studentInfoIsVisible }")
      span Student Info
section.subsection(v-if="state.studentInfoIsVisible" @click.stop)
  p If you're a student or teacher,{{' '}}
    a(href="mailto:hi@kinopio.club?subject=Education Discount") email me
    span {{' '}}for a 50% discount
</template>

<style lang="stylus">
.discount-row
  margin-top 10px
  display inline-block
  dialog.earn-credits
    left 0
</style>
