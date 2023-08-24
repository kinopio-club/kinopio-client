<script setup>
import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
const store = useStore()

// import utils from '@/utils.js'
import User from '@/components/User.vue'

const state = reactive({
  aboutMeIsVisible: false
})

const toggleAboutMeIsVisible = () => {
  state.aboutMeIsVisible = !state.aboutMeIsVisible
}
const kinopioUser = computed(() => {
  return {
    id: 'euGhpBrR9eBcjKnK16C_g',
    color: 'rgb(160, 247, 240)'
  }
})
</script>

<template lang="pug">
.about-me
  button(:class="{active: state.aboutMeIsVisible}" @click="toggleAboutMeIsVisible")
    User(:user="kinopioUser" :isClickable="false" :hideYouLabel="true")
    span Who Makes Kinopio?
  template(v-if="state.aboutMeIsVisible")
    section.subsection
      .row
        User(:user="kinopioUser" :isClickable="false" :hideYouLabel="true")
        div
          p Hi, my name is{{' '}}
            a(href="https://pketh.org") Pirijan
            span {{' '}}and I'm the creator of Kinopio.
          p I believe in building ethical, economically-sustainable,
            span {{' '}}
            a(href="https://pketh.org/organic-software.html") organic software
            span {{' '}}
            span designed by artists, built by craftspeople, and funded by the people who enjoy it.

</template>

<style lang="stylus">
.about-me
  .row
    align-items flex-start
    .user
      margin-right 6px
  .subsection
    margin-top 10px
</style>
