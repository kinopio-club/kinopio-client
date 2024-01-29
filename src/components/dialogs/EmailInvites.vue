<script setup>
import { reactive, computed, onMounted, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import UserLabelInline from '@/components/UserLabelInline.vue'
import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'
const store = useStore()

const dialogElement = ref(null)
const textareaWrapElement = ref(null)
const textareaMessageElement = ref(null)

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
  emailsStringWithMatches: '',
  isLoading: false,
  errors: {
    noRecipients: false
  },
  isSuccess: false
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
  })
  // temp msg specitic
  const messageTextarea = textareaMessageElement.value
  messageTextarea.style.height = messageTextarea.scrollHeight + modifier + 'px'
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
  state.emailsStringWithMatches = state.emailsString
  state.emailsList.forEach(email => {
    state.emailsStringWithMatches = state.emailsStringWithMatches.replace(email, `<span class="match">${email}</span>`)
  })
}

// message

const message = computed({
  get () {
    return state.message
  },
  set (value) {
    state.message = value
    updateTextareaSizes()
  }
})

// send button

const invitePlural = computed(() => {
  if (state.emailsList.length === 0) {
    return 'Invite'
  } else {
    return utils.pluralize('Invite', state.emailsList.length)
  }
})
const emailPlural = computed(() => {
  return utils.pluralize('email', state.emailsList.length)
})
const emailsLength = computed(() => {
  if (state.emailsList.length) {
    return state.emailsList.length
  } else {
    return null
  }
})
const clearErrors = () => {
  state.errors.noRecipients = false
  state.isSuccess = false
}
const sendInvites = () => {
  if (state.isLoading) { return }
  if (!state.emailsList.length) {
    state.errors.noRecipients = true
    return
  }
  clearErrors()
  console.log('♥️', state.message, state.emailsList, state.isLoading)
  state.isLoading = true
  state.isSuccess = true
}
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
        textarea(
          placeholder="Check this out fox x reason"
          v-model="message"
          ref="textareaMessageElement"
        )
        .row
          button(@click.stop="sendInvites" :class="{ active: state.isLoading }")
            img.icon.mail(src="@/assets/mail.svg")
            span Email {{emailsLength}} {{invitePlural}}
            Loader(:visible="state.isLoading")

        .row(v-if="state.isSuccess")
          .badge.success Sent {{emailsLength}} {{emailPlural}}
        .row(v-if="state.errors.noRecipients")
          .badge.danger To field is missing valid emails

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
