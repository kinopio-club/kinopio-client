<script setup>
import { reactive, computed, onMounted, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

// import utils from '@/utils.js'
import User from '@/components/User.vue'
const store = useStore()

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
    User(:user="kinopioUser" :isClickable="false" :hideYouLabel="true" :isSmall="true" :shouldBounceIn="true")
    span Who Makes Kinopio?
  template(v-if="state.aboutMeIsVisible")
    section.subsection
      .row
        User(:user="kinopioUser" :isClickable="false" :hideYouLabel="true")
        div
          p Hi, you can call me{{' '}}
            a(href="https://pketh.org/about") Piri
            span .{{' '}} I believe in building ethical, economically-sustainable,
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
