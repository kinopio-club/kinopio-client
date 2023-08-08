<script setup>
import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import ReferredNewUserCredits from '@/components/ReferredNewUserCredits.vue'
import DiscountRow from '@/components/DiscountRow.vue'
import User from '@/components/User.vue'
import UserLabelInline from '@/components/UserLabelInline.vue'
import CardsCreatedProgress from '@/components/CardsCreatedProgress.vue'
import consts from '@/consts.js'
import utils from '@/utils.js'
const store = useStore()

const props = defineProps({
  visible: Boolean
})
const dialog = ref(null)

onMounted(() => {
  store.subscribe((mutation, state) => {
    if (mutation.type === 'updatePageSizes') {
      updateDialogHeight()
    }
  })
})

const state = reactive({
  aboutMeIsVisible: false,
  dialogHeight: null
})

watch(() => props.visible, (value, prevValue) => {
  if (value) {
    updateDialogHeight()
    store.commit('shouldExplicitlyHideFooter', true)
  } else {
    store.commit('shouldExplicitlyHideFooter', false)
  }
})

const monthlyPrice = computed(() => consts.price('month').amount)
const yearlyPrice = computed(() => consts.price('year').amount)

const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  state.dialogHeight = utils.elementHeight(dialog.value)
}

// free cards from space member

const spaceUserIsUpgraded = computed(() => store.getters['currentSpace/spaceUserIsUpgraded'])
const spaceUser = computed(() => store.state.currentSpace.users[0])

// about me

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
dialog.pricing(v-if="visible" :open="visible" @click.left.stop ref="dialog" :style="{'max-height': state.dialogHeight + 'px'}")
  section
    p Kinopio is free for 100 cards, afterwards it's ${{monthlyPrice}}/month or ${{yearlyPrice}}/year
    DiscountRow
    ReferredNewUserCredits
    table
      tbody
        tr.table-header
          td
            span Free
          td
            span.badge.success Upgraded
        tr
          td 100 Cards
          td Unlimited Cards
        tr
          td 5mb file upload size limit
          td No upload limit
        tr
          td 10 AI images
          td 50 AI images/mo

    CardsCreatedProgress

    //- free cards from space member
    section.subsection(v-if="spaceUserIsUpgraded")
      p
        UserLabelInline(:user="spaceUser")
        span is upgraded, so cards you create in this space won't increase your free card count

  //- about me
  section.about-me
    button(:class="{active: state.aboutMeIsVisible}" @click="toggleAboutMeIsVisible")
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
              span that's designed by artists, built by craftspeople, and funded by the people who enjoy it.
</template>

<style lang="stylus">
dialog.pricing
  overflow auto
  left initial
  right 8px
  max-height calc(100vh - 25px)
  p
    user-select text
  .subsection
    margin-top 10px
  .about-me
    .row
      align-items flex-start
      .user
        margin-right 6px
  table
    td
      max-width 120px
</style>
