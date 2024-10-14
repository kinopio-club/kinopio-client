<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import GroupList from '@/components/GroupList.vue'
import AboutGroups from '@/components/AboutGroups.vue'
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

const currentUserIsUpgraded = computed(() => store.state.currentUser.isUpgraded)
const isLoadingUserGroupsSpaces = computed(() => store.state.isLoadingUserGroupsSpaces)

// groups list

const isGroups = computed(() => Boolean(props.groups.length))
const groupsListIsVisible = computed(() => currentUserIsUpgraded.value && isGroups.value)

// select group

const clearGroup = () => {
  emit('clearGroup')
}
const selectGroup = (event, group) => {
  emit('selectGroup', group)
}

// const currentUserIsSignedIn = computed(() => store.getters['currentUser/isSignedIn'])
// const triggerSignUpOrInIsVisible = () => {
//   store.dispatch('closeAllDialogs')
//   store.commit('triggerSignUpOrInIsVisible')
// }
// const triggerUpgradeUserIsVisible = () => {
//   store.dispatch('closeAllDialogs')
//   store.commit('triggerUpgradeUserIsVisible')
// }

// const actionsIsVisible = computed(() => {
//   // if (props.hideActions) { return }
//   return !currentUserIsSignedIn.value || !currentUserIsUpgraded.value
// })

</script>

<template lang="pug">
dialog.narrow.group-picker(v-if="visible" :open="visible" @click.left.stop ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}")
  section(:class="{ 'title-section': groupsListIsVisible }")
    .row.title-row
      span Add to Group
      button.small-button(v-if="isGroups" @click.left="clearGroup")
        img.icon.cancel(src="@/assets/add.svg")
        span Clear
  //- loading
  section(v-if="isLoadingUserGroupsSpaces")
    Loader(:visible="true")
  //- groups list
  section.results-section(v-else-if="groupsListIsVisible")
    GroupList(:groups="props.groups" :selectedGroup="props.selectedGroup" @selectGroup="selectGroup")
  //- about groups
  AboutGroups(v-else)

//- section(v-if="actionsIsVisible")
//-   //- how to use
//-   template(v-if="!currentUserIsSignedIn")
//-     p
//-       span.badge.info Sign Up or In
//-       span to create and manage groups
//-     button(@click.left="triggerSignUpOrInIsVisible") Sign Up or In
//-   template(v-else-if="!currentUserIsUpgraded")
//-     p
//-       span.badge.info Upgrade
//-       span to create and manage groups
//-     button(@click.left="triggerUpgradeUserIsVisible") Upgrade for Groups

</template>

<style lang="stylus">
dialog.group-picker
  overflow auto
</style>
