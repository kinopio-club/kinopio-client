<template lang="pug">
aside.notifications
  .item(v-for="(item in items" v-bind:key="item.id" :data-notification-id="item.id") {{item.message}}
</template>

<script>
export default {
  name: 'Notifications',
  created () {
    this.update()
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'addNotification') {
        this.update()
      }
    })
  },
  computed: {
    items () {
      return this.$store.state.notifications
    }
  },
  methods: {
    update () {
      const notifications = this.$store.state.notifications
      notifications.forEach(item => {
        this.$nextTick(() => {
          const element = document.querySelector(`.notifications .item[data-notification-id="${item.id}"]`)
          element.addEventListener('animationend', this.remove, false)
        })
      })
    },
    remove () {
      this.$store.commit('removeNotification')
    }
  }
}
</script>

<style lang="stylus">
.notifications
  pointer-events all
  margin-bottom 10px
  .item
    border-radius 3px
    margin-bottom 10px
    margin-right 0
    background-color var(--info-background)
    padding 5px 8px
    animation-name hideme
    animation-delay 5s
    animation-duration 0.1s
    animation-iteration-count 1
    animation-direction forward
    animation-fill-mode forwards
    animation-timing-function ease-out
    // &.success
    //   background-color var(--success-background)
    // &.danger
    //   background-color var(--danger-background)

@keyframes hideme
  from
    opacity 1
  to
    opacity 0
</style>
