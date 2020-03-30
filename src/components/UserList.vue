<template lang="pug">
ul.results-list.user-list
  template(v-for="(user in users")
    li(:key="user.id" @click.stop="selectSpace($event, user)" tabindex="0" v-on:keyup.stop.enter="selectSpace($event, user)" :class="{ active: userIsSelected(user) }")
      .badge(:style="{background: user.color}")
        User(:user="user" :isClickable="false")
        span {{user.name}}
</template>

<script>

export default {
  name: 'UserList',
  components: {
    User: () => import('@/components/User.vue')
  },
  props: {
    users: Array,
    selectedUser: Object
  },
  methods: {
    selectSpace (event, user) {
      this.$emit('selectSpace', event, user)
    },
    userIsSelected (user) {
      return this.selectedUser.id === user.id
    }
  }
}
</script>

<style lang="stylus">
</style>
