<template lang="pug">
dialog.import.narrow(v-if="visible" :open="visible" @click.left.stop="closeDialogs" ref="dialog")
  section
    p Import Space
  section
    p From an exported space
    button(@click.left="selectFile")
      span.badge.info json
      span Select File
    Loader(:visible="loading")
    input.hidden(type="file" ref="input" accept=".json" @change="readFile")

    .errors(v-if="unknownError")
      .badge.danger (シ_ _)シ Something went wrong parsing your json, Please try again or contact support

    .errors(v-if="errors.length")
      span.badge.danger File Errors
      ul
        li(v-for="(error in errors") {{error}}

  section
    .row
      .button-wrap(@click.stop)
        button(@click.left.stop="toggleImportArenaChannelIsVisible" :class="{ active: importArenaChannelIsVisible}")
          img.icon.arena(src="@/assets/arena.svg")
          span Are.na Channel
        ImportArenaChannel(:visible="importArenaChannelIsVisible" @updateSpaces="updateSpaces")

</template>

<script>
import ImportArenaChannel from '@/components/dialogs/ImportArenaChannel.vue'
import Loader from '@/components/Loader.vue'
import cache from '@/cache.js'
import utils from '@/utils.js'

export default {
  name: 'Import',
  components: {
    Loader,
    ImportArenaChannel
  },
  props: {
    visible: Boolean
  },
  data () {
    return {
      loading: false,
      errors: [],
      unknownError: false,
      importArenaChannelIsVisible: false
    }
  },
  methods: {
    toggleImportArenaChannelIsVisible () {
      this.importArenaChannelIsVisible = !this.importArenaChannelIsVisible
    },
    closeDialogs () {
      this.importArenaChannelIsVisible = false
    },
    selectFile () {
      if (this.loading) { return }
      const input = this.$refs.input
      input.click()
      this.unknownError = false
    },
    readFile () {
      this.loading = true
      const input = this.$refs.input
      const file = input.files[0]
      const reader = new FileReader()
      reader.readAsText(file)
      reader.onload = event => {
        this.loading = false
        let space
        try {
          space = JSON.parse(event.target.result)
        } catch (error) {
          console.error('🚒', error)
          this.unknownError = true
        }
        this.importSpace(space)
      }
    },
    updateSpaceItemsUserId (space) {
      const currentUserId = this.$store.state.currentUser.id
      const cards = space.cards.map(card => {
        card.userId = null
        card.z = card.z || 1
        card.x = card.x || 100
        card.y = card.y || 100
        return card
      })
      const connections = space.connections.map(connection => {
        connection.userId = currentUserId
        return connection
      })
      space.cards = cards
      space.connections = connections
      return space
    },
    async importSpace (space) {
      if (!this.isValidSpace(space)) { return }
      space = utils.clearSpaceMeta(space, 'import')
      space = this.updateSpaceItemsUserId(space)
      const uniqueNewSpace = cache.updateIdsInSpace(space)
      console.log('🍋 space to import', uniqueNewSpace)
      cache.saveSpace(uniqueNewSpace)
      this.$store.dispatch('currentSpace/loadSpace', { space: uniqueNewSpace, isLocalSpaceOnly: true })
      try {
        await this.$store.dispatch('currentSpace/saveImportedSpace')
      } catch (error) {
        console.error('🚒', error)
        this.unknownError = true
        return
      }
      this.$store.dispatch('currentUser/lastSpaceId', space.id)
      this.updateSpaces()
      this.$store.commit('triggerFocusSpaceDetailsName')
    },
    updateSpaces () {
      this.$emit('updateSpaces')
      this.closeDialogs()
      this.$emit('closeDialog')
    },
    isValidSpace (space) {
      this.errors = []
      const schema = {
        'name': 'string',
        'users': 'array',
        'cards': 'array',
        'connections': 'array',
        'connectionTypes': 'array',
        'tags': 'array'
      }
      Object.keys(schema).forEach(field => {
        const isValidType = utils.typeCheck({ value: space[field], type: schema[field], origin: 'isValidSpace' })
        if (!isValidType) {
          let error = `Expected ${field} but didn't get a ${schema[field]}`
          this.errors.push(error)
        }
      })
      if (this.errors.length) {
        return false
      } else {
        return true
      }
    },
    scrollIntoView () {
      const element = this.$refs.dialog
      this.$store.commit('triggerScrollIntoView', { element })
    }
  },
  watch: {
    visible (visible) {
      this.$nextTick(() => {
        if (visible) {
          this.scrollIntoView()
          this.closeDialogs()
        }
      })
    }
  }
}
</script>

<style lang="stylus">
.import
  max-height calc(100vh - 140px)
  @media(max-width 350px)
    right -50px
  .hidden
    display none
  .loader
    margin-left 6px
  .errors
    margin-top 10px
  ul
    margin 0
    margin-top 2px
    padding-left 15px
    li
      padding-top 10px
      margin-left 5px
      user-select text
  ul
    list-style-type square
  .arena
    width 18px
  .button-wrap
    dialog
      @media(max-height 500px)
        top initial
        bottom 8px

</style>
