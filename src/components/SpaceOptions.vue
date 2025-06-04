<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

import cache from '@/cache.js'
import templates from '@/data/templates.js'
import AskToAddToExplore from '@/components/AskToAddToExplore.vue'
import AddToExplore from '@/components/AddToExplore.vue'
import ImportExportButton from '@/components/ImportExportButton.vue'

const store = useStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()

const emit = defineEmits(['closeDialogsAndEmit', 'updateLocalSpaces', 'removeSpaceId', 'addSpace'])

const props = defineProps({
  visible: Boolean,
  isSpaceMember: Boolean,
  currentSpaceIsHidden: Boolean
})

const currentSpace = computed(() => store.state.currentSpace)
const currentUserIsSpaceCollaborator = computed(() => userStore.getUserIsSpaceCollaborator)
const currentSpaceIsTemplate = computed(() => {
  const id = currentSpace.value.id
  const templateSpaceIds = templates.spaces().map(space => space.id)
  return templateSpaceIds.includes(id)
})

const closeDialogsAndEmit = computed(() => emit('closeDialogsAndEmit'))

// duplicate

const duplicateSpace = async () => {
  await spaceStore.duplicateSpace()
  emit('updateLocalSpaces')
}

// remove

const removeCurrentSpace = async () => {
  const currentSpaceId = store.state.currentSpace.id
  if (currentUserIsSpaceCollaborator.value) {
    spaceStore.removeCollaboratorFromSpace(userStore.getUserAllState)
  } else {
    spaceStore.removeSpace()
    store.commit('notifyCurrentSpaceIsNowRemoved', true)
  }
  emit('removeSpaceId', currentSpaceId)
  await changeToPrevSpace()
  await nextTick()
  emit('updateLocalSpaces')
}
const changeToPrevSpace = async () => {
  const currentSpaceId = store.state.currentSpace.id
  const cachedSpaces = await cache.getAllSpaces()
  const spaces = cachedSpaces.filter(space => space.id !== currentSpaceId)
  const recentSpace = spaces[0]
  if (store.state.prevSpaceIdInSession) {
    spaceStore.loadPrevSpaceInSession()
  } else if (recentSpace) {
    spaceStore.changeSpace(recentSpace)
  } else {
    emit('addSpace')
  }
}

// hide

const toggleHideSpace = async () => {
  const value = !props.currentSpaceIsHidden
  const currentSpaceId = store.state.currentSpace.id
  await userStore.updateUserHiddenSpace(currentSpaceId, value)
  store.commit('notifySpaceIsHidden', value)
  emit('updateLocalSpaces')
}

</script>

<template lang="pug">
section.subsection.space-options(v-if="props.visible")
  .row
    AskToAddToExplore
    AddToExplore
  .row
    //- Import / Export
    ImportExportButton(@closeDialogs="closeDialogsAndEmit")
    //- Duplicate
    .button-wrap
      button(@click.left="duplicateSpace" title="Duplicate this Space")
        img.icon.duplicate(src="@/assets/duplicate.svg")
        span Duplicate
  .row(v-if="props.isSpaceMember")
    .button-wrap
      .segmented-buttons
        //- Remove
        button.danger(@click.left="removeCurrentSpace" :class="{ disabled: currentSpaceIsTemplate }")
          template(v-if="currentUserIsSpaceCollaborator")
            img.icon.cancel(src="@/assets/add.svg")
            span Leave
          template(v-else)
            img.icon.remove(src="@/assets/remove.svg")
            span Remove
        //- Hide
        button(@click.stop="toggleHideSpace" :class="{ active: props.currentSpaceIsHidden }")
          span Hide
</template>

<style lang="stylus">
.space-options
  .background-preview
    vertical-align middle
    margin-right 5px
    .preview-wrap
      height 16px
      width 16px
      vertical-align 0px
      border-radius 4px
  p
    white-space normal
</style>
