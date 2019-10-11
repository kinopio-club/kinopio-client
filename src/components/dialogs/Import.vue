<template lang="pug">
dialog.import.narrow(v-if="visible" :open="visible" @click.stop ref="dialog")
  section
    p Import Space
  section
    p From an exported space
    button(@click="selectFile")
      span.badge.info json
      span Select File
    Loader(:visible="loading")
    input.hidden(type="file" ref="input" accept=".json" @change="readFile")

    .errors(v-if="errors.length")
      span.badge.danger File Errors
      ul
        li(v-for="(error in errors") {{error}}

</template>

<script>
import scrollIntoView from 'smooth-scroll-into-view-if-needed' // polyfil
import nanoid from 'nanoid'

import Loader from '@/components/Loader.vue'
import cache from '@/cache.js'

export default {
  name: 'Import',
  components: {
    Loader
  },
  props: {
    visible: Boolean
  },
  data () {
    return {
      loading: false,
      errors: []
    }
  },
  methods: {
    selectFile () {
      if (this.loading) { return }
      const input = this.$refs.input
      input.click()
    },
    readFile () {
      this.loading = true
      const input = this.$refs.input
      const file = input.files[0]
      const reader = new FileReader()
      reader.readAsText(file)
      reader.onload = event => {
        this.loading = false
        const space = JSON.parse(event.target.result)
        this.importSpace(space)
      }
    },
    uniqueName (space) {
      const spaces = cache.getAllSpaces()
      const spaceNames = spaces.map(space => space.name)
      if (spaceNames.includes(space.name)) {
        return `${space.name}-${space.id}`
      } else {
        return space.name
      }
    },
    importSpace (space) {
      if (this.isValidSpace(space)) {
        space.id = nanoid()
        space.name = this.uniqueName(space)
        cache.saveSpace(space)
        this.$store.dispatch('currentSpace/changeSpace', space)
        this.$emit('updateSpaces')
        this.$emit('closeDialog')
      }
    },
    typeCheck (value, type) {
      if (type === 'array') {
        return Array.isArray(value)
      } else {
        return typeof value === type // eslint-disable-line valid-typeof
      }
    },
    isValidSpace (space) {
      this.errors = []
      const schema = {
        'name': 'string',
        'users': 'array',
        'cards': 'array',
        'connections': 'array',
        'connectionTypes': 'array',
        'customFields': 'array'
      }
      Object.keys(schema).forEach(field => {
        if (!this.typeCheck(space[field], schema[field])) {
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
      scrollIntoView(element, {
        behavior: 'smooth',
        scrollMode: 'if-needed'
      })
    }
  },
  watch: {
    visible (visible) {
      this.$nextTick(() => {
        if (visible) {
          this.scrollIntoView()
        }
      })
    }
  }
}
</script>

<style lang="stylus">
.import
  max-height calc(100vh - 140px)
  overflow scroll
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

</style>
