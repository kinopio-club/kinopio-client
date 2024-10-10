<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
const store = useStore()

// const props = defineProps({
//   hideActions: Boolean
// })

const currentUserIsSignedIn = computed(() => store.getters['currentUser/isSignedIn'])
const currentUserIsUpgraded = computed(() => store.state.currentUser.isUpgraded)
const actionsIsVisible = computed(() => {
  // if (props.hideActions) { return }
  return !currentUserIsSignedIn.value || !currentUserIsUpgraded.value
})
const triggerSignUpOrInIsVisible = () => {
  store.dispatch('closeAllDialogs')
  store.commit('triggerSignUpOrInIsVisible')
}
const triggerUpgradeUserIsVisible = () => {
  store.dispatch('closeAllDialogs')
  store.commit('triggerUpgradeUserIsVisible')
}
</script>

<template lang="pug">
section.groups-info

  //- what is groups
  //- .row.title-row
  p Use groups to organize related spaces and share them your closest friends or team. Each member of the group can see and edit all Group spaces.
  p
    a(href="https://help.kinopio.club/posts/teams")
      button
        span More Info{{' '}}
        img.icon.visit(src="@/assets/visit.svg")
  //- p
  //-   a(href="mailto:support@kinopio.club?subject=Kinopio Groups Beta")
  //-     button
  //-       img.icon(src="@/assets/mail.svg")
  //-       span Email Support

  //- p
  //-   button
  //-     span Info{{' '}}
  //-     img.icon.visit(src="@/assets/visit.svg")

  img.placeholder(src="@/assets/collaborators.jpg")

section(v-if="actionsIsVisible")
  //- how to use
  template(v-if="!currentUserIsSignedIn")
    p
      span.badge.info Sign Up or In
      span to create and manage groups
    button(@click.left="triggerSignUpOrInIsVisible") Sign Up or In
  template(v-else-if="!currentUserIsUpgraded")
    p
      span.badge.info Upgrade
      span to create and manage groups
    button(@click.left="triggerUpgradeUserIsVisible") Upgrade for Groups

</template>

<style lang="stylus">
section.groups-info
  .title-row
    align-items flex-start
  .small-button
    margin-top 0
  .placeholder
    border-radius var(--small-entity-radius)
    margin-top 10px
</style>
