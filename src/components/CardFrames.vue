<template lang="pug">
aside
  .garden-leaves(v-if="isGardenLeaves")
    img.leaves(src="@/assets/frames/garden-leaves/leaves.png")
    img.ivy(src="@/assets/frames/garden-leaves/ivy.png")
    img.flower(src="@/assets/frames/garden-leaves/flower.png")

  .magical-helper(v-if="isMagicalHelper")
    img.cat(src="@/assets/frames/magical-helper/cat.png")
    img.hat(src="@/assets/frames/magical-helper/hat.png")
    img.moon(src="@/assets/frames/magical-helper/moon.png")
</template>

<script>
export default {
  props: {
    // cardId: String
    card: Object
  },
  // data () {
  //   return {
  //     currentFrame: {id: 0}
  //   }
  // },

  // !!!! pass prop as just cardId and get card from currentSpace based on id, should get property updating for free that way

  // mounted () {
  // console.log('🐢 kinopio-client', this.buildHash)
  // this.updateCurrentFrame()
  // },

  computed: {
    // card () {
    //   return this.$store.state.currentSpace.cards.find(card => {
    //     return card.id === this.cardId
    //   })
    // },
    // frames () {
    //   return frames
    // }
    isGardenLeaves () {
      // console.log('isGardenLeaves')
      // return this.updateCurrentFrame(1)
      return Boolean(this.card.frameId === 1)
      // return Boolean(this.currentFrame.id === 1)
    },
    isMagicalHelper () {
      // return this.updateCurrentFrame(2)
      // console.log(this.currentFrame.id)
      // return Boolean(this.currentFrame.id === 2)
      return Boolean(this.card.frameId === 2)
    }
  },
  // methods: {
  // updateCurrentFrame (frameId) {
  //   const cardFrame = this.cardFrame()
  //   // console.log('updateCurrentFrame',cardFrame)
  //   if (cardFrame) {
  //     return Boolean(cardFrame.id === frameId)
  //   }
  // },
  //   updateCurrentFrame () {
  //     // if (!this.card.frameId) { return }
  //     // console.log('🍎', this.currentFrame)
  //     if (!this.card.frameId) {
  //       this.currentFrame = {id: 0}
  //     } else {
  //       this.currentFrame = frames.find(frame => {
  //         return frame.id === this.card.frameId
  //       })
  //     }
  //   },

  // },
  watch: {
    card (newValue) {
      console.log('🍓', newValue)
    }
  }
  //   visible (visible) {
  //     if (visible) {
  //       console.log('visible')
  //       this.updateCurrentFrame()
  //     }
  //   }
  // }
}

</script>

<style lang="stylus" scoped>
// aside
//   pointer-events none
img
  position absolute
.garden-leaves
  .leaves
    left -20px
    width 25px
  .ivy
    right -23px
    top -5px
    width 32px
  .flower
    width 20px
    top -10px
    right 22px

.magical-helper
  .cat
    width 32px
    left -26px
    top -12px
  .hat
    width 32px
    left -25px
    top -10px
  .moon
    width 23px
    right 28px
    top -15px
</style>
