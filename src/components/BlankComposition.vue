<script setup>
// import utils from '@/utils.js'

import { reactive, computed, onMounted } from 'vue'
// https://vuex.vuejs.org/guide/composition-api.html#accessing-state-and-getters
import { useStore } from 'vuex'
const store = useStore()

onMounted(() => {
  console.log(`the component is now mounted.`, store.state.currentSpace)
})

// reactive data
const state = reactive({
  count: 0
})
// computed
const plusOne = computed(() => {
  return state.count + 1
})
// const fullName = computed({
//   get() {
//     return firstName.value + ' ' + lastName.value
//   },
//   set(newValue) {
//     // Note: we are using destructuring assignment syntax here.
//     [firstName.value, lastName.value] = newValue.split(' ')
//   }
// })
// methods
const incrementBy = (increment) => {
  console.log('💖', state.count, increment, plusOne)
  state.count = state.count + increment
  // store.dispatch('currentSpace/update', value)
  return state.count
}

// export default {
//   props: {
//     visible: Boolean
//   },

//   // setup includes computed, methods, watch
//   setup(props) {
//     //     ...mapState([
//     // ]),
//     // ...mapGetters([
//     // ]),

//     // if you destructure the props object, the destructured variables will lose reactivity. So always access through props.xyz
//     console.log(props.visible)
//     const count = ref(0)
//     const anotherThing = ref(1)
//     // computed are functions
//     const plusOne = computed(() => count.value + 1)
//     // v-model computed
//     // const plusOne = computed({
//     //   get: () => count.value + 1,
//     //   set: (val) => {
//     //     count.value = val - 1
//     //   }
//     // })
//     // methods are also functions
//     const incrementBy = (increment) => {
//       console.log('💖', count.value, increment, plusOne)
//       count.value = count.value + increment
//       return count.value
//     }
//     watch(count, (count, prevCount) => {
//       /* ... */
//     })
//     // expose reactive refs to template and other options API hooks
//     return { count, anotherThing, incrementBy }
//   },
//   mounted() {
//     console.log(this.count, this.anotherThing)
//   },

// functions that mutate state and trigger updates
// const increment = () => {
//   count.value++
// }

// }
</script>

<template lang="pug">
//- incomplete WIP
.component-name(v-if="visible")
  button(@click="incrementBy")
    span Count is: {{ state.count }}
    span will be: {{ plusOne }}
</template>

<style lang="stylus">
// .component-name
</style>
