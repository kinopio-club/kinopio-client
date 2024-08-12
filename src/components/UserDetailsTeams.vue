<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
const store = useStore()

// import utils from '@/utils.js'

onMounted(() => {
  console.log('🐸🐸', props.user)
  // console.log(`🐴 the component is now mounted.`, store.state.currentSpace)
  // store.subscribe(mutation => {
  //   if (mutation.type === 'triggerUpdateOtherCard') {
  //     mutation.payload
  //   }
  // })
})

const props = defineProps({
  user: Object
})

const state = reactive({
  teamIsVisible: false
})

const teams = computed(() => store.getters['teams/byUser'])

const visible = computed(() => teams.value?.length)
watch(() => visible.value, async (value, prevValue) => {
  state.teamIsVisible = false
})

// todo server: public user gets public teammeta

</script>

<template lang="pug">
section.user-details-teams(v-if="visible")
  template(v-for="team in teams")
    button {{team.color}} {{ team.name }}
</template>

<style lang="stylus">
// .user-details-teams
</style>
