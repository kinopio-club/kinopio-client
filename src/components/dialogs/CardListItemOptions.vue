<template lang="pug">
dialog.narrow.card-list-item-options(v-if="visible" :open="visible" @click.left.stop ref="dialog" :style="positionStyles")
  section
    .row
      button
        //- img.icon.visit(src="@/assets/visit.svg")
        span Move / copy?
      //- .segmented-buttons.move-or-copy-wrap
      //-   button(@click.left.stop="toggleCopyCardsIsVisible" :class="{ active: copyCardsIsVisible }")
      //-     span Copy
      //-     MoveOrCopyItems(:visible="copyCardsIsVisible" :actionIsMove="false" :exportData="exportData")
      //-   button(@click.left.stop="toggleMoveCardsIsVisible" :class="{ active: moveCardsIsVisible }" :disabled="!canEditAll.cards")
      //-     span Move
      //-     MoveOrCopyItems(:visible="moveCardsIsVisible" :actionIsMove="true" :exportData="exportData")

    .row
      button
        span Jump to Card
</template>

<script>
// import utils from '@/utils.js'

import { mapState, mapGetters } from 'vuex'

export default {
  name: 'cardListItemOptions',
  components: {
  },
  props: {
    visible: Boolean,
    card: Object,
    cardListItemRect: Object
  },
  data () {
    return {
    }
  },
  computed: {
    ...mapState([
    ]),
    ...mapGetters([
    ]),
    positionStyles () {
      const styles = {
        left: this.cardListItemRect.x + 'px',
        bottom: this.cardListItemRect.y + 'px'
      }
      console.log(styles)
      return styles
    }
  },
  methods: {
  }
}
</script>

<style lang="stylus">
dialog.card-list-item-options
  position absolute
  // top 130px !important
  width 190px !important
</style>
