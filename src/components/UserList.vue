<template lang="pug">
span
  ResultsFilter(:items="users" @updateFilter="updateFilter" @updateFilteredItems="updateFilteredUsers")
  ul.results-list.user-list
    template(v-for="(user in usersFiltered")
      li(:key="user.id" @click.left.stop="selectSpace($event, user)" tabindex="0" v-on:keyup.stop.enter="selectSpace($event, user)" :class="{ active: userIsSelected(user) }")
        .badge(:style="{background: user.color}" :class="{'narrow-badge': showRemoveUser}")
          User(:user="user" :isClickable="false")
          .name {{user.name}}
        button.remove-user(v-if="showRemoveUser" @click.left.stop="removeUser(user)")
          img.icon.remove(src="@/assets/remove.svg")
</template>

<script>
import ResultsFilter from '@/components/ResultsFilter.vue'

export default {
  name: 'UserList',
  components: {
    User: () => import('@/components/User.vue'),
    ResultsFilter
  },
  props: {
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
    }
  },
  methods: {
    updateFilteredUsers (users) {
      this.filteredUsers = users
    },
    updateFilter (filter) {
      this.filter = filter
    },
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
