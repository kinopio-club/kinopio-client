<template lang="pug">
aside.notifications-with-position
  .item.badge(
    v-for="item in items"
    v-bind:key="item.id"
    :data-notification-id="item.id"
    :style="{ left: item.position.x + 'px', top: item.position.y + 'px' }"
    :class="item.type"
    @animationend="remove"
  )
    template(v-if="item.icon === 'cancel'")
      img.icon.cancel(src="@/assets/add.svg")
      span {{item.message}}
</template>
<script>
export default {
  name: 'NotificationsWithPosition',
  props: {
    layer: String // app, space
  },
  computed: {
    items () {
      const itemsInLayer = this.$store.state.notificationsWithPosition.filter(item => item.layer === this.layer)
      return itemsInLayer
    }
  },
  methods: {
    remove () {
      this.$store.commit('removeNotificationWithPosition')
    }
  }
}
</script>

<style lang="stylus">
.notifications-with-position
  .item
    position absolute
    z-index var(--max-z)
    pointer-events none
    animation-name hideme
    animation-delay 5s
    animation-duration 0.1s
    animation-iteration-count 1
    animation-direction forward
    animation-fill-mode forwards
    animation-timing-function ease-out
</style>
