<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, useTemplateRef, nextTick } from 'vue'
import { useStore } from 'vuex'

import PrivacyPicker from '@/components/dialogs/PrivacyPicker.vue'
import PrivacyIcon from '@/components/PrivacyIcon.vue'
import utils from '@/utils.js'
import privacy from '@/data/privacy.js'
const store = useStore()

const emit = defineEmits(['togglePrivacyPickerIsVisible', 'closeDialogs', 'updateLocalSpaces'])

const props = defineProps({
  privacyPickerIsVisible: Boolean,
  showDescription: Boolean,
  showShortName: Boolean
})

const spaceTeam = computed(() => store.getters['teams/spaceTeam']())
const isSpaceMember = computed(() => store.getters['currentUser/isSpaceMember']())
const isInvitedButCannotEditSpace = computed(() => store.getters['currentUser/isInvitedButCannotEditSpace']())

// privacy state

const spacePrivacy = computed(() => store.state.currentSpace.privacy)
const privacyState = computed(() => {
  return privacy.states().find(state => {
    return state.name === spacePrivacy.value
  })
})
const description = computed(() => {
  let description = privacyState.value.description
  if (spaceTeam.value) {
    description = privacyState.value.descriptionTeam
  }
  return utils.capitalizeFirstLetter(description)
})
const name = computed(() => {
  const name = privacyState.value.friendlyName || privacyState.value.name
  return utils.capitalizeFirstLetter(name)
})
const shortName = computed(() => {
  const name = privacyState.value.shortName || privacyState.value.name
  return utils.capitalizeFirstLetter(name)
})

// handle events

const togglePrivacyPickerIsVisible = () => {
  emit('togglePrivacyPickerIsVisible')
}
const closeDialogs = () => {
  emit('closeDialogs')
}
const updateLocalSpaces = () => {
  emit('updateLocalSpaces')
}
</script>

<template lang="pug">
.button-wrap.privacy-button(v-if="isSpaceMember || isInvitedButCannotEditSpace" :class="privacyState.name")
  button(@click.left.stop="togglePrivacyPickerIsVisible" :disabled="isInvitedButCannotEditSpace" :class="{ active: props.privacyPickerIsVisible }")
    template(v-if="props.showShortName")
      PrivacyIcon(:privacy="privacyState.name")
      span {{shortName}}
    template(v-else)
      .badge(:class="privacyState.color")
        PrivacyIcon(:privacy="privacyState.name")
        span {{name}}
    p.description(v-if="props.showDescription") {{description}}
  PrivacyPicker(:visible="props.privacyPickerIsVisible" @closeDialogs="closeDialogs" @updateLocalSpaces="updateLocalSpaces")
</template>

<style lang="stylus">
.privacy-button
  button
    height initial
dialog.share
  .privacy-button
    width 100%
    button
      width 100%
</style>
