<template lang="pug">
dialog.templates.narrow(v-if="visible" :open="visible" @click.stop ref="dialog")
  section
    p Templates
  section
    p from a baked results list

</template>

<script>
// import scrollIntoView from 'smooth-scroll-into-view-if-needed' // polyfil
// import nanoid from 'nanoid'

// import Loader from '@/components/Loader.vue'
// import cache from '@/cache.js'

export default {
  name: 'Templates',
  // components: {
  //   Loader
  // },
  props: {
    visible: Boolean
  }

  //   this.$emit('updateSpaces')
  // this.$emit('closeDialog')

  // data () {
  //   return {
  //     loading: false,
  //     errors: []
  //   }
  // },
  // methods: {
  //   selectFile () {
  //     if (this.loading) { return }
  //     const input = this.$refs.input
  //     input.click()
  //   },
  //   readFile () {
  //     this.loading = true
  //     const input = this.$refs.input
  //     const file = input.files[0]
  //     const reader = new FileReader()
  //     reader.readAsText(file)
  //     reader.onload = event => {
  //       this.loading = false
  //       const space = JSON.parse(event.target.result)
  //       this.importSpace(space)
  //     }
  //   },
  //   uniqueName (space) {
  //     const spaces = cache.getAllSpaces()
  //     const spaceNames = spaces.map(space => space.name)
  //     if (spaceNames.includes(space.name)) {
  //       return `${space.name}-${space.id}`
  //     } else {
  //       return space.name
  //     }
  //   },
  //   importSpace (space) {
  //     if (this.isValidSpace(space)) {
  //       space.id = nanoid()
  //       space.name = this.uniqueName(space)
  //       const uniqueNewSpace = cache.updateIdsInSpace(space)
  //       cache.saveSpace(uniqueNewSpace)
  //       this.$store.commit('currentSpace/restoreSpace', uniqueNewSpace)
  //       this.$store.dispatch('currentSpace/saveNewSpace')
  //       this.$store.dispatch('currentUser/lastSpaceId', space.id)
  //       this.$emit('updateSpaces')
  //       this.$emit('closeDialog')
  //     }
  //   },
  //   typeCheck (value, type) {
  //     if (type === 'array') {
  //       return Array.isArray(value)
  //     } else {
  //       return typeof value === type // eslint-disable-line valid-typeof
  //     }
  //   },
  //   isValidSpace (space) {
  //     this.errors = []
  //     const schema = {
  //       'name': 'string',
  //       'users': 'array',
  //       'cards': 'array',
  //       'connections': 'array',
  //       'connectionTypes': 'array',
  //       'customFields': 'array'
  //     }
  //     Object.keys(schema).forEach(field => {
  //       if (!this.typeCheck(space[field], schema[field])) {
  //         let error = `Expected ${field} but didn't get a ${schema[field]}`
  //         this.errors.push(error)
  //       }
  //     })
  //     if (this.errors.length) {
  //       return false
  //     } else {
  //       return true
  //     }
  //   },
  //   scrollIntoView () {
  //     const element = this.$refs.dialog
  //     scrollIntoView(element, {
  //       behavior: 'smooth',
  //       scrollMode: 'if-needed'
  //     })
  //   }
  // },
  // watch: {
  //   visible (visible) {
  //     this.$nextTick(() => {
  //       if (visible) {
  //         this.scrollIntoView()
  //       }
  //     })
  //   }
  // }
}
</script>

<style lang="stylus">
.templates
  max-height calc(100vh - 140px)
  overflow scroll
</style>
