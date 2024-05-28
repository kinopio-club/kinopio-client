<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'
import consts from '@/consts.js'

const store = useStore()

const dialogElement = ref(null)

const props = defineProps({
  visible: Boolean,
  preventScrollIntoView: Boolean,
  shouldHideAdvanced: Boolean
})
const state = reactive({
  markdownInfoIsVisible: false
})

watch(() => props.visible, (value, prevValue) => {
  if (value) {
    scrollIntoView()
    updateDialogHeight()
  }
})

const maxCardCharacterLimit = computed(() => store.state.currentUser.cardSettingsDefaultCharacterLimit || consts.maxCardCharacterLimit)
const shiftEnterShouldAddChildCard = computed(() => store.state.currentUser.cardSettingsShiftEnterShouldAddChildCard)

// buttons

const toggleMarkdownInfoIsVisible = () => {
  state.markdownInfoIsVisible = !state.markdownInfoIsVisible
  if (state.markdownInfoIsVisible) {
    scrollIntoView()
  }
}
const showCardSettings = () => {
  store.dispatch('currentUser/update', { prevSettingsSection: 'cards' })
  // store.dispatch('closeAllDialogs')
  store.commit('userSettingsIsVisible', true)
}

// dialog position

const scrollIntoView = async () => {
  if (props.preventScrollIntoView) { return }
  if (utils.isMobile()) { return }
  await nextTick()
  const element = dialogElement.value
  utils.scrollIntoView({ element })
}
const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  let element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}
</script>

<template lang="pug">
dialog.card-tips.narrow(v-if="visible" @click.stop :open="visible" ref="dialogElement")
  section
    .row.title-row
      span Tips
      button.small-button(@click="showCardSettings")
        img.settings.icon(src="@/assets/settings.svg")
  section
    article
      p Card character limit is {{maxCardCharacterLimit}}
    article
      .row
        p
          img.icon(src="@/assets/add.svg")
          span Add Card
        span.badge.keyboard-shortcut Enter
    article(v-if="shiftEnterShouldAddChildCard")
      .row
        p
          img.icon(src="@/assets/add.svg")
          span Add Child Card
        span.badge.keyboard-shortcut Shift-Enter
    article
      .row
        p
          img.icon(src="@/assets/line-break.svg")
          span Line Break
        span.badge.keyboard-shortcut
          span(v-if="!shiftEnterShouldAddChildCard") Shift-Enter or{{' '}}
          span Ctrl-Enter
    template(v-if="!shouldHideAdvanced")
      article
        .row
          p
            span Backlinked Tag
          span.badge.keyboard-shortcut [[
      article
        .row
          p
            span Link to Other Spaces
          span.badge.keyboard-shortcut /
      //- article
      //-   .row
      //-     span Comment Card
      //-     span.badge.keyboard-shortcut ((…))

    //- Markdown
    article
      .row
        button(@click.left.stop="toggleMarkdownInfoIsVisible" :class="{ active: state.markdownInfoIsVisible }")
          img.icon.view(v-if="state.markdownInfoIsVisible" src="@/assets/view-hidden.svg")
          img.icon.view(v-else src="@/assets/view.svg")
          span Markdown
      div(v-if="state.markdownInfoIsVisible")
        p
          span.badge.keyboard-shortcut # heading 1
        p
          span.badge.keyboard-shortcut ## heading 2
        p
          span.badge.keyboard-shortcut _italic_ or *italic*
        p
          span.badge.keyboard-shortcut **bold**
        p
          span.badge.keyboard-shortcut ~~strikethrough~~
        p
          span.badge.keyboard-shortcut [link text](url)
        p
          span.badge.keyboard-shortcut `code`
        p
          span.badge.keyboard-shortcut ``` code block ```
</template>

<style lang="stylus">
dialog.card-tips
  left initial
  right 8px
  top 22px
  overflow auto
  overscroll-behavior-y auto
  article
    position static
    margin-bottom 10px
    padding-bottom 10px
    border-bottom 1px solid var(--primary-border)
    &:last-child
      margin-bottom 0
      padding-bottom 0
      border-bottom 0

  label
    margin-left 6px
  .row
    justify-content space-between

</style>
