<template lang="pug">
dialog.links.narrow(v-if="visible" :open="visible" ref="dialog" :style="{'max-height': dialogHeight + 'px'}")
  section
    p Links
</template>

<script>
import ResultsFilter from '@/components/ResultsFilter.vue'
import utils from '@/utils.js'

// import uniq from 'lodash-es/uniq'

export default {
  name: 'Links',
  components: {
    User: () => import('@/components/User.vue'),
    ResultsFilter
  },
  props: {
    visible: Boolean
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'updatePageSizes') {
        this.updateDialogHeight()
        // this.updateResultsSectionHeight()
      }
    })
  },
  data () {
    return {
      // filter: '',
      // filteredItems: [],
      // resultsSectionHeight: null,
      dialogHeight: null,
      links: [],
      loading: false
    }
  },
  computed: {
    currentUser () { return this.$store.state.currentUser }
  },
  methods: {
    updateDialogHeight () {
      if (!this.visible) { return }
      this.$nextTick(() => {
        let element = this.$refs.dialog
        this.dialogHeight = utils.elementHeightFromHeader(element)
      })
    },

    //     urlMetadata (link) {
    //       if (link.isSpace) {
    //         link.spaceId = utils.spaceIdFromUrl(link.url)

    //         // console.log('👯‍♀️',link)

    // // link.space = get from ls, else get from store

    //         // ? link.isUnknownUrl bool
    //       }
    //       return link
    //     },
    // otherSpaceLinks async? () {},
    updateLinks () {
      this.loading = true
      // let currentSpaceLinks = this.$store.getters['currentSpace/ cardsWithSpaceLinks'] reformat

      //       links = links.map(card => {
      //   let link = {}
      //   link.url = utils.urlFromString(card.name)
      //   link.originCardId = card.id
      //   link.originSpaceId = card.spaceId
      //   link.originIsCurrentSpace = card.spaceId === state.id
      //   if (utils.urlIsKinopioSpace(link.url)) {
      //     link.toSpaceId = utils.spaceIdFromUrl(link.url)
      //   }
      //   return link
      // })

      // await?
      // currentSpaceLinks = currentSpaceLinks.map(link => this.urlMetadata(link))

      // map
      // check utils.isSpace => isKinopioSpace: true
      // return also originCardId, url

      this.loading = false
    }

    // updateResultsSectionHeight () {
    //   if (!this.visible) { return }
    //   this.$nextTick(() => {
    //     let element = this.$refs.results
    //     this.resultsSectionHeight = utils.elementHeightFromHeader(element, true)
    //   })
    // },
  },
  watch: {
    visible (visible) {
      if (visible) {
        this.updateDialogHeight()
        this.updateLinks()
        // this.updateResultsSectionHeight()
      }
    }
  }
}
</script>

<style lang="stylus">
.links
  @media(max-width 435px)
    left -100px
</style>
