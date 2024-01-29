<script setup>
import { reactive, computed, onMounted, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import UserLabelInline from '@/components/UserLabelInline.vue'
import utils from '@/utils.js'
const store = useStore()

const dialogElement = ref(null)
const textareaWrapElement = ref(null)

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
  emailsList: [],
  emailsString: '',
  emailsStringWithMatches: ''
})

const isDarkTheme = computed(() => store.getters['themes/isThemeDark'])
const currentUser = computed(() => store.state.currentUser)
const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  let element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}
const hideUserDetails = () => {
  store.commit('userDetailsIsVisible', false)
}

// textarea

const updateTextareaSizes = () => {
  const element = textareaWrapElement.value
  let textareas = element.querySelectorAll('textarea')
  let modifier = 1
  textareas.forEach(textarea => {
    const highlight = element.querySelector('.textarea-highlight')
    highlight.style.height = textarea.scrollHeight + modifier + 'px'
    textarea.style.height = textarea.scrollHeight + modifier + 'px'
    // console.log('🍇',textarea)
  })
}

// emails

const textareaEmails = computed({
  get () {
    return state.emailsString
  },
  set (value) {
    state.emailsString = value
    state.emailsList = utils.emailsFromString(value)
    updateTextareaSizes()
    updateEmailsWithMatches()

    // state.emailsList.forEach(x => console.log(x))

    // updateEmailsList(value)
    //
  }
})
const updateEmailsWithMatches = () => {
  // if (!emailsList.length) {
  state.emailsStringWithMatches = state.emailsString
  // return
  // }

  state.emailsList.forEach(email => {
    console.log('♥️', email)
    state.emailsStringWithMatches = state.emailsStringWithMatches.replace(email, `<span class="match">${email}</span>`)
  })
  // state.emails = state.emails.replace(emailsStringWithMatches)
}

// send button

const invitePlural = computed(() => {
  if (state.emailsList.length === 0) {
    return 'Invite'
  } else {
    return utils.pluralize('Invite', state.emailsList.length)
  }
})
const emailsLength = computed(() => {
  if (state.emailsList.length) {
    return state.emailsList.length
  } else {
    return null
  }
})
</script>

<template lang="pug">
dialog.email-invites(v-if="visible" :open="visible" @click.left.stop="hideUserDetails" ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}")
  section
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

        .textarea-wrap(ref="textareaWrapElement")
          p.textarea-highlight(
            v-html="state.emailsStringWithMatches"
          )
          textarea.textarea-sizer(
            v-model="textareaEmails"
            maxLength="600"
          )
          textarea.textarea-input(
            placeholder="space@jam.com, hi@kinopio.club"
            v-model="textareaEmails"
            maxLength="600"
          )

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
    //-   .badge.danger To field cannot be empty

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

  .textarea-wrap
    position relative
    textarea
      margin-bottom 0
    .textarea-sizer
      pointer-events none
      opacity 0
    .textarea-input
      position absolute
      top 0
      left 0
    p.textarea-highlight
      pointer-events none
      position absolute
      top 1px
      left 1px
      color transparent
      .match
        background-color var(--search-background)

</style>
