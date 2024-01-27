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
  tipsIsVisible: false,
  emails: []
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

// send button
const invitePlural = computed(() => {
  if (state.emails.length === 0) {
    return 'Invite'
  } else {
    return utils.pluralize('Invite', state.emails.length)
  }
})
const emailsLength = computed(() => {
  if (state.emails.length) {
    return state.emails.length
  } else {
    return null
  }
})
</script>

<template lang="pug">
dialog.email-invites(v-if="visible" :open="visible" @click.left.stop="hideUserDetails" ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}")
  section
    //- .row.title-row
    //-   p Email Invites to Edit
    //-   button.small-button.extra-options-button(@click="toggleTipsIsVisible" :class="{ active: state.tipsIsVisible }")
    //-     span ?
    //- Textarea   defaultValue="" placeholder="", @textareaUpdate=textareaUpdate, @handleEnter=handleEnter maxlength 2000 shouldAutoFocus true
    section.subsection
      .mail-subsection(:class="{ dark: isDarkTheme }")
        //- from
        p.field-title From
        UserLabelInline(:user="currentUser" :isClickable="true")
        span.badge.danger.add-your-name(v-if="!currentUser.name")
          span Add Your Name
        //- to
        .row.title-row
          p.field-title To
          //- button.small-button.extra-options-button(@click="toggleTipsIsVisible" :class="{ active: state.tipsIsVisible }")
          //-   span ?
        textarea(placeholder="space@jam.com, hi@kinopio.club")
        //- ??TIPS NEEDED? not if highlight
        //- p(v-if="state.tipsIsVisible")
        //-   span Send multiple invites by seperating emails with commas or spaces
        //- message
        p.field-title Message
        textarea(placeholder="Check this out fox x reason")
        //- todo handle enter = send??
        .row
          button
            img.icon.mail(src="@/assets/mail.svg")
            span Email {{emailsLength}} {{invitePlural}}
    //- todo btn loading
    //- clear errs on submit

    //- todo success msg

    //- .row
    //-   .badge.danger No recipients found, there may a typo in the To field

</template>

<style lang="stylus">
.email-invites
  .title-row
    margin-bottom 0
  section.subsection
    border-radius var(--entity-radius)
    padding 0
    overflow hidden
  .mail-subsection
    --color1 #d93125
    --color2 #1240d5
    padding 6px 8px
    border 4px solid transparent
    border-image 4 repeating-linear-gradient(
      -45deg,
      var(--color1) 0,
      var(--color1) 1em,
      transparent 0,
      transparent 2em,
      var(--color2) 0,
      var(--color2) 3em,
      transparent 0,
      transparent 4em
    )
    &.dark
      --color1 #bd1f14
      --color2 #1f44bf

  .add-your-name
    margin-left 6px !important
  .field-title
    margin-bottom 2px

</style>
