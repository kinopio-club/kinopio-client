<template lang="pug">
dialog.links.narrow(v-if="visible" :open="visible" ref="dialog" :style="{'max-height': dialogHeight + 'px'}")
  section
    p Links to This Space
  section.results-section(v-if="!loading && spaces.length" ref="results" :style="{'max-height': resultsSectionHeight + 'px'}")
    SpaceList(:spaces="spaces" :showUser="true" @selectSpace="changeSpace")
  section(v-else-if="loading")
    Loader(:visible="loading")
  section(v-else)
    p instructionssss
    //- TODO section handle no links: (if u canEdit:) add url or '/' in card,
    //- if not signed in, then prompt to sign up [sign up or in]
</template>

<script>
import Loader from '@/components/Loader.vue'
import SpaceList from '@/components/SpaceList.vue'
import utils from '@/utils.js'

export default {
  name: 'Links',
  components: {
    Loader,
    SpaceList
  },
  props: {
    visible: Boolean
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'updatePageSizes') {
        this.updateDialogHeight()
        this.updateResultsSectionHeight()
      }
    })
  },
  data () {
    return {
      resultsSectionHeight: null,
      dialogHeight: null,
      links: [],
      loading: false,
      spaces: [],
      prevSpaceId: ''
    }
  },
  computed: {
    currentUser () { return this.$store.state.currentUser }
  },
  methods: {
    changeSpace (space) {
      this.$store.dispatch('currentSpace/changeSpace', { space, isRemote: true })
    },
    updateDialogHeight () {
      if (!this.visible) { return }
      this.$nextTick(() => {
        let element = this.$refs.dialog
        this.dialogHeight = utils.elementHeightFromHeader(element)
      })
    },
    async updateLinks () {
      const spaceId = this.$store.state.currentSpace.id
      console.log(this.prevSpaceId)
      if (this.prevSpaceId === spaceId) { return }
      this.spaces = []
      this.loading = true
      const links = await this.$store.dispatch('api/getCardsWithLinkToSpaceId', spaceId) || []
      console.log('🎢', links, links.spaces)
      this.spaces = links.spaces
      this.loading = false
      this.prevSpaceId = spaceId
    },
    updateResultsSectionHeight () {
      if (!this.visible) { return }
      this.$nextTick(() => {
        let element = this.$refs.results
        this.resultsSectionHeight = utils.elementHeightFromHeader(element, true)
      })
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
        this.updateDialogHeight()
        this.updateLinks()
        this.updateResultsSectionHeight()
      }
    },
    loading (loading) {
      this.updateResultsSectionHeight()
    }
  }
}
</script>

<style lang="stylus">
.links
  @media(max-width 435px)
    left -100px
  .results-section
    border-top 1px solid var(--primary)
    padding-top 4px
</style>
