<template lang="pug">
dialog.narrow.multiple-connections-picker(v-if="visible" :open="visible" ref="dialog" @click.left.stop)
  section.results-actions
    button(@click.left="addConnectionType")
      img.icon(src="@/assets/add.svg")
      .badge.badge-in-button(:style="{backgroundColor: nextConnectionTypeColor}")
      span Type

  section.results-section
    ul.results-list
      template(v-for="type in connectionTypes" :key="type.id")
        li(:class="{ active: connectionTypeIsActive(type) }" @click.left="changeConnectionTypes(type)" tabindex="0" v-on:keyup.enter="changeConnectionTypes(type)")
          .badge(:style="{backgroundColor: type.color}")
          .name {{type.name}}
</template>

<script>
import utils from '@/utils.js'

import last from 'lodash-es/last'
import randomColor from 'randomcolor'

export default {
  name: 'MultipleConnectionsPicker',
  props: {
    visible: Boolean,
    selectedConnections: Array,
    selectedConnectionTypes: Array
  },
  data () {
    return {
      nextConnectionTypeColor: ''
    }
  },
  computed: {
    connectionTypes () {
      return this.$store.getters['currentConnections/allTypes']
    }
  },
  methods: {
    changeConnectionTypes (type) {
      this.selectedConnections.forEach(connection => {
        this.$store.dispatch('currentConnections/update', {
          id: connection.id,
          connectionTypeId: type.id
        })
      })
    },
    connectionTypeIsActive (type) {
      return this.selectedConnections.find(connection => {
        return connection.connectionTypeId === type.id
      })
    },
    addConnectionType () {
      this.$store.dispatch('currentConnections/addType', { color: this.nextConnectionTypeColor })
      const types = utils.clone(this.connectionTypes)
      const newType = last(types)
      this.changeConnectionTypes(newType)
      this.updateNextConnectionColor()
    },
    scrollIntoView () {
      const element = this.$refs.dialog
      utils.scrollIntoView(element)
    },
    updateNextConnectionColor () {
      this.nextConnectionTypeColor = randomColor({ luminosity: 'light' })
    }
  },
  watch: {
    visible (visible) {
      this.$nextTick(() => {
        if (visible) {
          this.scrollIntoView()
          this.updateNextConnectionColor()
        }
      })
    }
  }
}
</script>

<style lang="stylus">
.multiple-connections-picker
  .badge-in-button
    margin-left 5px
</style>
