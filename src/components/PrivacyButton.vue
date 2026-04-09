<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useGroupStore } from '@/stores/useGroupStore'

import PrivacyPicker from '@/components/dialogs/PrivacyPicker.vue'
import PrivacyIcon from '@/components/PrivacyIcon.vue'
import utils from '@/utils.js'
import privacy from '@/data/privacy.js'

const globalStore = useGlobalStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()
const groupStore = useGroupStore()

const emit = defineEmits(['togglePrivacyPickerIsVisible', 'closeDialogs', 'updateLocalSpaces'])

const props = defineProps({
  privacyPickerIsVisible: Boolean,
  showDescription: Boolean,
  showShortName: Boolean
})

const spaceGroup = computed(() => groupStore.getCurrentSpaceGroup)
const isSpaceMember = computed(() => userStore.getUserIsSpaceMember)
const isInvitedButCannotEditSpace = computed(() => globalStore.currentUserIsInvitedButCannotEditCurrentSpace)

// privacy state

const spacePrivacy = computed(() => spaceStore.privacy)
const privacyState = computed(() => {
  return privacy.states().find(state => {
    return state.name === spacePrivacy.value
  })
})
const description = computed(() => {
  let description = privacyState.value.description
  if (spaceGroup.value) {
    description = privacyState.value.descriptionGroup
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
  button.title-row-flex(
    @click.left.stop="togglePrivacyPickerIsVisible"
    :disabled="isInvitedButCannotEditSpace"
    :class="{ active: props.privacyPickerIsVisible }"
    title="Space Privacy Options"
  )
    //- short name
    template(v-if="props.showShortName")
      PrivacyIcon(:privacy="privacyState.name")
      span {{shortName}}
    //- long name
    template(v-else)
      .badge(:class="privacyState.color")
        PrivacyIcon(:privacy="privacyState.name")
        span {{name}}
    //- down arrow
    template(v-if="!props.showShortName")
      img.icon.down-arrow(src="@/assets/down-arrow.svg")

  PrivacyPicker(:visible="props.privacyPickerIsVisible" @closeDialogs="closeDialogs" @updateLocalSpaces="updateLocalSpaces")
</template>

<style lang="stylus">
.privacy-button
  button
    height initial
    .badge
      margin 0

</style>
