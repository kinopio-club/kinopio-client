<script setup>
import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import SpacePicker from '@/components/dialogs/SpacePicker.vue'
const store = useStore()

const props = defineProps({
  isCurrentUser: Boolean,
  loadingUserspaces: Boolean,
  user: Object,
  userSpaces: Array
})
const emit = defineEmits(['closeDialogs', 'getUserSpaces'])

const state = reactive({
  personalSpacePickerIsVisible: false,
  personalSpaceTipsIsVisible: false
})

const personalSpaceName = computed(() => {
  let name = store.state.currentUser.personalSpaceName
  if (name) {
    return name
  } else {
    return 'Personal Space'
  }
})

const personalSpace = computed(() => {
  return { id: store.state.currentUser.personalSpaceId }
})

// toggle state

const closeDialogs = () => {
  state.personalSpacePickerIsVisible = false
  emit('closeDialogs')
}
const togglePersonalSpaceTipsIsVisible = () => {
  const isVisible = state.personalSpaceTipsIsVisible
  closeDialogs()
  state.personalSpaceTipsIsVisible = !isVisible
}
const togglePersonalSpacePickerIsVisible = () => {
  const isVisible = state.personalSpacePickerIsVisible
  closeDialogs()
  state.personalSpacePickerIsVisible = !isVisible
  if (state.personalSpacePickerIsVisible) {
    emit('getUserSpaces')
  }
}

// update

const updatePersonalSpace = (space) => {
  state.personalSpacePickerIsVisible = false
  store.dispatch('currentUser/update', {
    personalSpaceId: space.id,
    personalSpaceName: space.name
  })
}
const removePersonalSpace = () => {
  console.log('♥️')
  store.dispatch('currentUser/update', { personalSpaceId: null, personalSpaceName: null })
}

</script>

<template lang="pug">
template(v-if="props.isCurrentUser")
  .row.title-row
    .segmented-buttons
      button.personal-space-button(@click.left.stop="togglePersonalSpacePickerIsVisible" :class="{active: state.personalSpacePickerIsVisible}")
        span {{personalSpaceName}}
        img.down-arrow(src="@/assets/down-arrow.svg")
      SpacePicker(:visible="state.personalSpacePickerIsVisible" :loading="props.loadingUserspaces" :user="props.user" :userSpaces="props.userSpaces" @selectSpace="updatePersonalSpace" :selectedSpace="personalSpace")
      button(@click.stop="removePersonalSpace")
        img.icon.cancel(src="@/assets/add.svg")
    button.small-button(title="tips" @click.stop="togglePersonalSpaceTipsIsVisible" :class="{active: state.personalSpaceTipsIsVisible}")
      span ?
  section.subsection(v-if="state.personalSpaceTipsIsVisible")
    p Share a space that introduces yourself, and what you're into and up to

</template>

<style lang="stylus">
.personal-space-button
  max-width 150px
  white-space nowrap
  overflow hidden
  text-overflow ellipsis
</style>
