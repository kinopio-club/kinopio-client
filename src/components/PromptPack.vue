<template lang="pug">
li.prompt-pack(@click.left="select(pack)" v-on:keyup.enter="select(pack)" :class="{ active: isInUserJournalPrompts }" tabindex="0")
  .name-wrap
    .badge.button-badge(:style="{background: pack.color, active: isInUserJournalPrompts}")
      img.icon.cancel(v-if="isInUserJournalPrompts" src="@/assets/add.svg")
      span.name {{pack.name}}
    button.small-button(@click.stop="toggleViewAllIsActive" :class="{active: viewAllIsActive}" tabindex="0" ref="button")
      img.icon(v-if="viewAllIsActive" src="@/assets/view-hidden.svg")
      img.icon(v-else src="@/assets/view.svg")

  p(v-if="!viewAllIsActive")
    span.label-badge ex
    span {{randomPrompt}}

  template(v-if="viewAllIsActive")
    template(v-for="prompt in pack.prompts" :key="prompt.packId")
      p
        span.label-badge ex
        span {{prompt}}
</template>

<script>
import random from 'lodash-es/random'

export default {
  name: 'JournalPromptPack',
  props: {
    pack: Object
  },
  data () {
    return {
      viewAllIsActive: false
    }
  },
  computed: {
    userJournalPrompts () { return this.$store.state.currentUser.journalPrompts },
    isInUserJournalPrompts () {
      return Boolean(this.userJournalPrompts.find(userPrompt => {
        if (!userPrompt.packId) { return }
        return userPrompt.packId.toString() === this.pack.packId
      }))
    },
    randomPrompt () {
      let index = random(0, this.pack.prompts.length - 1)
      return this.pack.prompts[index]
    }
  },
  methods: {
    toggleViewAllIsActive () {
      this.viewAllIsActive = !this.viewAllIsActive
      this.$refs.button.focus()
      this.$refs.button.blur()
    },
    select () {
      this.$emit('select', this.pack)
    }
  }
}
</script>

<style lang="stylus" scoped>
.prompt-pack
  display block
  .name-wrap
    display flex
    justify-content space-between
    > .badge
      height 19px
      margin-top 2px
  p
    margin-top 6px
  .label-badge
    position static
    display inline
    margin-right 3px
    background-color var(--secondary-background)
    span
      color var(--primary-on-light-background)
      vertical-align 1px
  .name
    color var(--primary-on-light-background)
  .cancel
    filter none
    vertical-align 1px
</style>
