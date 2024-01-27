<script setup>
import { reactive, computed, onMounted, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import UserLabelInline from '@/components/UserLabelInline.vue'
import utils from '@/utils.js'
const store = useStore()

const dialogElement = ref(null)

onMounted(() => {
  store.subscribe((mutation, state) => {
    if (mutation.type === 'updatePageSizes') {
      updateDialogHeight()
    }
  })
})

const emit = defineEmits(['updateCount'])

const props = defineProps({
  visible: Boolean
})
watch(() => props.visible, (value, prevValue) => {
  if (value) {
    updateDialogHeight()
    // trigger space screenshot
  }
})

const state = reactive({
  count: 0,
  dialogHeight: null,
  tipsIsVisible: false
})

const isDarkTheme = computed(() => store.getters['themes/isThemeDark'])
const currentUser = computed(() => store.state.currentUser)
const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  let element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}
const textareaUpdate = (value) => {
  // parse emails
  // save as user default value
}
const toggleTipsIsVisible = () => {
  state.tipsIsVisible = !state.tipsIsVisible
}
const hideUserDetails = () => {
  store.commit('userDetailsIsVisible', false)
}
</script>

<template lang="pug">
dialog.email-invites(v-if="visible" :open="visible" @click.left.stop="hideUserDetails" ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}")
  section
    .row.title-row
      p Email Invites
      button.small-button.extra-options-button(@click="toggleTipsIsVisible" :class="{ active: state.tipsIsVisible }")
        span ?
    p.badge.secondary(v-if="state.tipsIsVisible")
      p Send multiple invites by seperating emails with commas or spaces
    //- Textarea   defaultValue="" placeholder="", @textareaUpdate=textareaUpdate, @handleEnter=handleEnter maxlength 2000 shouldAutoFocus true
    section.subsection.mail-subsection(:class="{ dark: isDarkTheme }")
      p.field-title From
      UserLabelInline(:user="currentUser" :isClickable="true")
      span.badge.danger.add-your-name(v-if="!currentUser.name")
        span Add Your Name
      p.field-title To
      textarea(placeholder="space@jam.com, hi@kinopio.club")
      p.field-title Message
      textarea(placeholder="Check this out fox x reason")
      .row
        button
          img.icon.mail(src="@/assets/mail.svg")
          span Send Invite(s) to Edit
      //- utils.pluralize

    //- .row
    //-   .badge.danger Missing recipients, there may a typo in the email
</template>

<style lang="stylus">
.email-invites
  .mail-subsection
    --color1 #d93125
    --color2 #1240d5
    // background var(--primary-background)
    padding 8px
    border 4px solid transparent
    border-image 4 repeating-linear-gradient(-45deg, var(--color1) 0, var(--color1) 1em, transparent 0, transparent 2em,
              var(--color2) 0, var(--color2) 3em, transparent 0, transparent 4em)
    // border-image-repeat round
    // background-origin: border-box;
    // background-clip: border-box;

    &.dark
      --color1 #9a352e
      --color2 #1240d5

  .add-your-name
    margin-left 6px !important
  .field-title
    margin-bottom 2px

</style>
