<template lang="pug">
ul.results-list.user-list
  template(v-for="(user in users")
    p {{user.name}}
    //- li(:key="user.id" @click.stop="showUserDetails($event, user)" tabindex="0" v-on:keyup.stop.enter="showUserDetails(user)" :class="{ active: userIsSelected(user) }")
    //-   .name(v-if="spacesIsVisible") {{user.name}}
    //-   .badge(v-else :style="{background: user.color}")
    //-     User(:user="user" :isClickable="false")
    //-     span {{user.name}}
</template>

<script>

export default {
  name: 'UserList',
  components: {
    // UserDetails: () => import('@/components/dialogs/UserDetails.vue'),
  },
  props: {
    users: Array,
    selectedUser: Object
  },
  // data () {
  //   return {
  // userDetailsIsVisible: false,
  // selectedUser: {},
  // userDetailsPosition: {}
  //   }
  // },
  methods: {

  }
  // watch: {
  //   visible (visible) {
  //     if (visible) {
  //       console.log('🍆visible')
  //     }
  //   }
  // }
}
</script>

<style lang="stylus">
</style>
