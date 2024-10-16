<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

// import utils from '@/utils.js'
import GroupLabel from '@/components/GroupLabel.vue'
// import User from '@/components/User.vue'

// import randomColor from 'randomcolor'

const store = useStore()

const emit = defineEmits(['closeDialogs'])

const props = defineProps({
  visible: Boolean
})
// const state = reactive({
//   count: 0
// })

// const currentUser = computed(() => store.state.currentUser)
// const randomUser = computed(() => {
//   const luminosity = store.state.currentUser.theme
//   const color = randomColor({ luminosity })
//   return { color }
// })
const closeDialogs = () => {
  emit('closeDialogs')
}

const group = computed(() => store.getters['groups/spaceGroup']())

</script>

<template lang="pug">
section.invite-to-group(v-if="visible" @click.stop="closeDialogs")
  .row
    //- p
    GroupLabel(:group="group")
    //- .users
    //-   User(:user="currentUser" :isClickable="false" :key="currentUser.id" :isSmall="true" :hideYouLabel="true")
    //-   User(:user="randomUser" :isClickable="false" :key="currentUser.id" :isSmall="true" :hideYouLabel="true")
    span Invite to Group

  //- p alsdkfj
</template>

<style lang="stylus">
section.invite-to-group
  // .users
  //   margin-right 5px
  //   .user
  //     vertical-align -3px
  //     .anon-avatar
  //       top 6px

</style>
