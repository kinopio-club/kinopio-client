<template lang="pug">
.user-label.badge(:data-id="user.id" :style="{ background: color }")
  .user-avatar.anon-avatar
  span {{ user.name }}
//-   (
//-   v-if="visible"
//-   :style="{ background: typeColor, left: position.left + 'px', top: position.top + 'px'}"
//-   @click="showConnectionDetails"
//-   :data-id="id"
//-   @mouseover="hover = true"
//-   @mouseleave="hover = false"
//-   :class="{filtered: isFiltered, 'cursor-default': !canEditSpace}"
//-   ref="label"
//- )
  span {{typeName}}
</template>

<script>
// import utils from '@/utils.js'

export default {
  name: 'UserLabel',
  props: {
    user: Object
  },
  mounted () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'triggerAddRemotePaintingCircle') {
        const circle = mutation.payload
        if (circle.userId === this.user.id) {
          this.position.x = circle.x
          this.position.y = circle.y
          this.color = circle.color
        }
      }
    })
  },
  data () {
    return {
      position: {},
      color: ''
    }
  },
  // computed: {
  //   color () {
  //     const spaceMembers = this.$store.getters['currentSpace/members']()
  //     const user = spaceMembers.find(member => member.id === this.user.id)
  //     return user.color
  //   },
  // },
  methods: {
    // same as Connection method
    // showConnectionDetails (event) {
    //   if (!this.canEditSpace) { return }
    //   const detailsPosition = utils.cursorPositionInPage(event)
    //   this.$store.commit('closeAllDialogs')
    //   this.$store.commit('connectionDetailsIsVisibleForConnectionId', this.id)
    //   this.$store.commit('connectionDetailsPosition', detailsPosition)
    //   this.$store.commit('clearMultipleSelected')
    // },
    // setPosition () {
    //   this.$nextTick(() => {
    //     let connection = document.querySelector(`.connection-path[data-id="${this.id}"]`)
    //     connection = connection.getBoundingClientRect()
    //     let label = this.$refs.label
    //     let labelOffset
    //     if (label) {
    //       label = label.getBoundingClientRect()
    //       labelOffset = {
    //         left: label.width / 4,
    //         top: label.height / 4
    //       }
    //     } else {
    //       labelOffset = { left: 0, top: 0 }
    //     }
    //     const basePosition = {
    //       left: connection.x + window.scrollX,
    //       top: connection.y + window.scrollY
    //     }
    //     const connectionOffset = {
    //       left: connection.width / 2,
    //       top: connection.height / 2
    //     }
    //     this.position = {
    //       left: basePosition.left + connectionOffset.left - labelOffset.left,
    //       top: basePosition.top + connectionOffset.top - labelOffset.top
    //     }
    //   })
    // }
  }
  // watch: {
  //   path (value) {
  //     this.setPosition()
  //   },
  //   hover (value) {
  //     if (!this.canEditSpace) { return }
  //     if (value) {
  //       this.$store.commit('currentUserIsHoveringOverConnectionId', this.id)
  //     } else {
  //       this.$store.commit('currentUserIsHoveringOverConnectionId', '')
  //     }
  //   }
  // }

}
</script>

<style lang="stylus">
.user-label
  pointer-events none
  position absolute
  .anon-avatar
    width 15px
    height 15px
    display inline-block
    background-repeat no-repeat
    background-position center
    vertical-align middle
    margin-right 6px
</style>
