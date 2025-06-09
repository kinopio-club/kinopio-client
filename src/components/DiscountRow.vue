<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'

import consts from '@/consts.js'

const globalStore = useGlobalStore()

const isSecureAppContextIOS = computed(() => consts.isSecureAppContextIOS)

let unsubscribes

onMounted(() => {
  const globalStoreUnsubscribe = globalStore.$onAction(
    ({ name, args }) => {
      if (name === 'triggerCloseChildDialogs') {
        closeChildDialogs()
      }
    }
  )
  unsubscribes = () => {
    globalStoreUnsubscribe()
  }
})
onBeforeUnmount(() => {
  unsubscribes()
})

const state = reactive({
  studentInfoIsVisible: false
})

const closeChildDialogs = () => {
  state.studentInfoIsVisible = false
}
const toggleStudentInfoIsVisible = () => {
  const value = !state.studentInfoIsVisible
  globalStore.triggerCloseChildDialogs()
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
    span {{' '}}for a 50% discount off the yearly plan. Be sure to include your Kinopio account email address.
</template>

<style lang="stylus">
.discount-row
  margin-top 10px
  display inline-block
</style>
