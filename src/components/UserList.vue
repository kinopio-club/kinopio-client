<template lang="pug">
span
  ResultsFilter(:items="users" @updateFilter="updateFilter" @updateFilteredItems="updateFilteredUsers")
  ul.results-list.user-list
    template(v-for="user in usersFiltered" :key="user.id")
      li(@click.left.stop="selectUser($event, user)" :tabindex="tabIndex" v-on:keyup.stop.enter="selectUser($event, user)" :class="{ active: userIsSelected(user), 'is-not-clickable': !isClickable }")
        .badge(:style="{background: user.color}" :class="{'narrow-badge': showRemoveUser}")
          User(:user="user" :isClickable="false")
          .name {{user.name}}
        button.remove-user(v-if="showRemoveUser" @click.left.stop="removeUser(user)" title="Remove from space")
          img.icon.leave(src="@/assets/leave.svg")
</template>

<script>
import ResultsFilter from '@/components/ResultsFilter.vue'
import { defineAsyncComponent } from 'vue'
const User = defineAsyncComponent({
  loader: () => import('@/components/User.vue')
})

export default {
  name: 'UserList',
  components: {
    User,
    ResultsFilter
  },
  props: {
    isClickable: Boolean,
    users: Array,
    selectedUser: Object,
    showRemoveUser: Boolean
  },
  data () {
    return {
      filter: '',
      filteredUsers: []
    }
  },
  computed: {
    usersFiltered () {
      if (this.filter) {
        return this.filteredUsers
      } else {
        return this.users
      }
    },
    tabIndex () {
      if (this.isClickable) {
        return '0'
      } else {
        return '-1'
      }
    }
  },
  methods: {
    updateFilteredUsers (users) {
      this.filteredUsers = users
    },
    updateFilter (filter) {
      this.filter = filter
    },
    selectUser (event, user) {
      if (!this.isClickable) { return }
      this.$emit('selectUser', event, user)
    },
    userIsSelected (user) {
      if (!this.isClickable) { return }
      if (!this.selectedUser) { return }
      return this.selectedUser.id === user.id
    },
    removeUser (user) {
      if (!this.isClickable) { return }
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
    &.is-not-clickable
      cursor auto
      padding-left 0
      padding-right 0
      &:hover,
      &:active,
      &:focus
        box-shadow none
        background-color transparent
        outline none
    .user
      .label-badge
        width 21px
        height 10px
        span
          font-size 10px
</style>
