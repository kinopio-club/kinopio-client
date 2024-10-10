<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import GroupList from '@/components/GroupList.vue'
import GroupsBetaInfo from '@/components/GroupsBetaInfo.vue'
import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'

const store = useStore()

const dialogElement = ref(null)

onMounted(() => {
  window.addEventListener('resize', updateDialogHeight)
})

const emit = defineEmits(['selectGroup', 'clearGroup', 'closeDialogs'])

const props = defineProps({
  visible: Boolean,
  groups: Array,
  selectedGroup: Object
})

watch(() => props.visible, (value, prevValue) => {
  if (value) {
    updateDialogHeight()
  }
})

const state = reactive({
  dialogHeight: null
})

const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  let element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}

const isLoadingUserGroupsSpaces = computed(() => store.state.isLoadingUserGroupsSpaces)

// select group

const clearGroup = () => {
  emit('clearGroup')
}
const selectGroup = (event, group) => {
  emit('selectGroup', group)
}

// is in group

const isOnGroup = computed(() => {
  const groups = store.getters['groups/byUser']()
  return Boolean(groups.length)
})
const groupBetaMessage = computed(() => 'Only groups beta users can add spaces to groups.')

</script>

<template lang="pug">
dialog.narrow.group-picker(v-if="visible" :open="visible" @click.left.stop ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}")
  section.title-section
    .row.title-row
      span Add to Group
      button.small-button(v-if="isOnGroup" @click.left="clearGroup")
        img.icon.cancel(src="@/assets/add.svg")
        span Clear

  //- loading
  template(v-if="isLoadingUserGroupsSpaces")
    section
      Loader(:visible="true")
  //- groups list
  template(v-else-if="isOnGroup")
    section.results-section(v-if="props.groups.length")
      GroupList(:groups="props.groups" :selectedGroup="props.selectedGroup" @selectGroup="selectGroup")
  //- groups beta info
  template(v-else)
    GroupsBetaInfo(:message="groupBetaMessage")
</template>

<style lang="stylus">
// dialog.group-picker
</style>
