<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

import PrivacyIcon from '@/components/PrivacyIcon.vue'
import privacy from '@/data/privacy.js'
import utils from '@/utils.js'

const globalStore = useGlobalStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()

const dialogElement = ref(null)

onMounted(() => {
  window.addEventListener('resize', updateDialogHeight)
})

const emit = defineEmits(['closeDialogs', 'updateLocalSpaces'])

const props = defineProps({
  visible: Boolean
})

const state = reactive({
  dialogHeight: null
})
const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  const element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}

const currentUserIsSignedIn = computed(() => userStore.getUserIsSignedIn)
const currentSpaceIsInGroup = computed(() => spaceStore.groupId)
const triggerSignUpOrInIsVisible = () => {
  globalStore.closeAllDialogs()
  globalStore.triggerSignUpOrInIsVisible()
}

// privacy states

const privacyStates = computed(() => {
  const privacyStates = privacy.states()
  if (currentUserIsSignedIn.value) {
    return privacyStates
  } else {
    return privacyStates.filter(privacy => privacy.name === 'private')
  }
})
const privacyStateName = (privacyState) => {
  const name = privacyState.friendlyName || privacyState.name
  return utils.capitalizeFirstLetter(name)
}
const privacyStateDescription = (privacyState) => {
  let description = privacyState.description
  if (currentSpaceIsInGroup.value) {
    description = privacyState.descriptionGroup
  }
  return utils.capitalizeFirstLetter(description)
}
const privacyStateIsActive = (privacyState) => {
  const currentPrivacy = spaceStore.privacy
  return privacyState.name === currentPrivacy
}

// update

const select = async (privacyState) => {
  await spaceStore.updateSpace({ privacy: privacyState.name })
  updateLocalSpaces()
  emit('closeDialogs')
}
const updateLocalSpaces = () => {
  emit('updateLocalSpaces')
}
</script>

<template lang="pug">
dialog.narrow.privacy-picker(v-if="props.visible" :open="props.visible" @click.left.stop ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}")
  section.results-section
    ul.results-list
      template(v-for="(privacyState in privacyStates")
        li(:class="{ active: privacyStateIsActive(privacyState) }" @click.left="select(privacyState)")
          .badge(:class="privacyState.color")
            PrivacyIcon(:privacy="privacyState.name")
            span {{ privacyStateName(privacyState) }}
          p.description {{ privacyStateDescription(privacyState) }}
  section(v-if="!currentUserIsSignedIn")
    p.badge.info
      span Sign Up or In to make your spaces public
    button(@click.left="triggerSignUpOrInIsVisible") Sign Up or In
</template>

<style lang="stylus" scoped>
.privacy-picker
  .results-section
    padding-top 4px
    max-height calc(92vh - 120px)
  .badge
    display inline-block
  li
    display block
  .description
    margin-top 3px
</style>
