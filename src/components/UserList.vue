<template lang="pug">
ul.results-list.user-list
  template(v-for="(user in users")
    li(:key="user.id" @click.stop="selectSpace($event, user)" tabindex="0" v-on:keyup.stop.enter="selectSpace($event, user)" :class="{ active: userIsSelected(user) }")
      .badge(:style="{background: user.color}" :class="{'narrow-badge': showRemoveUser}")
        User(:user="user" :isClickable="false")
        .name {{user.name}}
      button.remove-user(v-if="showRemoveUser" @click.stop="removeUser")
        img.icon.remove(src="@/assets/remove.svg")
</template>

<script>

export default {
  name: 'UserList',
  components: {
    User: () => import('@/components/User.vue')
  },
  props: {
    users: Array,
    selectedUser: Object,
    showRemoveUser: Boolean
  },
  methods: {
    selectSpace (event, user) {
      this.$emit('selectSpace', event, user)
    },
    userIsSelected (user) {
      return this.selectedUser.id === user.id
    },
    removeUser (user) {
      this.$emit('removeUser', user)
    }
  }
}
</script>

<style lang="stylus">
.user-list
  li
    button
      margin-left auto
    .name
      margin-right 0
      display inline-block
    .narrow-badge
      max-width calc(100% - 32px)
</style>
