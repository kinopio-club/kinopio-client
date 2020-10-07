<template lang="pug">
li.prompt-pack(@click.left="select(pack)" v-on:keyup.enter="select(pack)" :class="{ active: isInUserJournalPrompts }" tabindex="0")
  .name-wrap
    .badge.button-badge(:style="{background: pack.color}")
      img.icon(v-if="!isInUserJournalPrompts" src="@/assets/add.svg")
      img.icon.minus(v-if="isInUserJournalPrompts" src="@/assets/minus.svg")
      span {{pack.name}}
    button(@click.stop="toggleViewAllIsActive" :class="{active: viewAllIsActive}" tabindex="0" ref="button") View All
  p(v-if="!viewAllIsActive")
    span.label-badge ex
    span {{randomPrompt}}

  template(v-if="viewAllIsActive" v-for="prompt in pack.prompts")
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
        return userPrompt.name === this.pack.name && userPrompt.isPack
      }))
    },
    randomPrompt () {
      let prompt = random(0, this.pack.prompts.length - 1)
      return this.pack.prompts[prompt]
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
  // p + p
  //   margin-bottom 4px
  .label-badge
    position static
    display inline
    margin-right 3px
    background-color var(--secondary-background)
    span
      color var(--primary)
      vertical-align 1px
</style>
