<script setup>
import { reactive, computed, onMounted, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import Loader from '@/components/Loader.vue'
import cache from '@/cache.js'
import utils from '@/utils.js'
const store = useStore()

const inputElement = ref(null)

const emit = defineEmits(['updateSpaces', 'closeDialog'])

const props = defineProps({
  visible: Boolean
})

const state = reactive({
  loading: false,
  errors: [],
  unknownError: false
})

const toggleImportArenaChannelIsVisible = () => {
  store.commit('closeAllDialogs')
  store.commit('importArenaChannelIsVisible', true)
}
const selectFile = () => {
  if (state.loading) { return }
  const input = inputElement.value
  input.click()
  state.unknownError = false
}
const readFile = () => {
  state.loading = true
  const input = inputElement.value
  const file = input.files[0]
  const reader = new FileReader()
  reader.readAsText(file)
  reader.onload = event => {
    state.loading = false
    let space
    try {
      space = JSON.parse(event.target.result)
    } catch (error) {
      console.error('🚒', error)
      state.unknownError = true
    }
    importSpace(space)
  }
}
const importSpace = async (space) => {
  const currentUserId = store.state.currentUser.id
  if (!isValidSpace(space)) { return }
  space = utils.clearSpaceMeta(space, 'import')
  space = utils.spaceItemUsersToCurrentUser(space, currentUserId)
  space.userId = currentUserId
  const uniqueNewSpace = cache.updateIdsInSpace(space)
  console.log('🍋 space to import', uniqueNewSpace)
  cache.saveSpace(uniqueNewSpace)
  store.dispatch('currentSpace/loadSpace', { space: uniqueNewSpace, isLocalSpaceOnly: true })
  try {
    await store.dispatch('currentSpace/saveImportedSpace')
  } catch (error) {
    console.error('🚒', error)
    state.unknownError = true
    return
  }
  store.dispatch('currentUser/lastSpaceId', space.id)
  updateSpaces()
  store.commit('triggerFocusSpaceDetailsName')
}
const updateSpaces = () => {
  emit('updateSpaces')
  emit('closeDialog')
}
const isValidSpace = (space) => {
  state.errors = []
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
      state.errors.push(error)
    }
  })
  if (state.errors.length) {
    return false
  } else {
    return true
  }
}
</script>

<template lang="pug">
template(v-if="visible")
  section.import
    input.hidden(type="file" ref="inputElement" accept=".json" @change="readFile")
    .row
      button(@click.left="selectFile" :class="{active: state.loading}")
        span Kinopio Space JSON File
        Loader(:visible="state.loading")
    //- .row
    //-   button(@click.left="selectFile" :class="{active: state.loading}")
    //-     img.icon.json-canvas(src="@/assets/json-canvas.svg")
    //-     span JSON Canvas File
    //-     Loader(:visible="state.loading")
    .row(v-if="state.unknownError || state.errors.length")
      .errors(v-if="state.unknownError")
        .badge.danger (シ_ _)シ Something went wrong parsing your json, Please try again or contact support
      .errors(v-if="state.errors.length")
        span.badge.danger File Errors
        ul
          li(v-for="(error in state.errors") {{error}}
  section.import
    .row
      .button-wrap(@click.stop)
        button(@click.left.stop="toggleImportArenaChannelIsVisible")
          img.icon.arena(src="@/assets/arena.svg")
          span Are.na Channel
</template>

<style lang="stylus">
section.import
  .hidden
    display none
  .loader
    margin-left 6px
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
