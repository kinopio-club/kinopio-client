<template lang="pug">
dialog.narrow.multiple-connections-picker(v-if="visible" :open="visible" ref="dialog" @click.stop)
  section.results-actions
    button(@click="addConnectionType")
      img.icon(src="@/assets/add.svg")
      span Add

  section.results-section
    ul.results-list
      template(v-for="(type in connectionTypes")
        li(:class="{ active: connectionTypeIsActive(type) }" @click="changeConnectionTypes(type)" :key="type.id" tabindex="0" v-on:keyup.enter="changeConnectionTypes(type)")
          .badge(:style="{backgroundColor: type.color}" :class="{checked: connectionTypeIsDefault(type)}")
          .name {{type.name}}
</template>

<script>
import last from 'lodash-es/last'
import scrollIntoView from '@/scroll-into-view.js'

import utils from '@/utils.js'

export default {
  name: 'MultipleConnectionsPicker',
  props: {
    visible: Boolean,
    selectedConnections: Array,
    selectedConnectionTypes: Array
  },
  computed: {
    connectionTypes () {
      return this.$store.state.currentSpace.connectionTypes
    }
  },
  methods: {
    changeConnectionTypes (type) {
      this.selectedConnections.forEach(connection => {
        this.$store.dispatch('currentSpace/updateConnectionTypeForConnection', {
          connectionId: connection.id,
          connectionTypeId: type.id
        })
      })
    },
    connectionTypeIsDefault (type) {
      const typePref = this.$store.state.currentUser.defaultConnectionTypeId
      return typePref === type.id
    },
    connectionTypeIsActive (type) {
      return this.selectedConnections.find(connection => {
        return connection.connectionTypeId === type.id
      })
    },
    addConnectionType () {
      this.$store.dispatch('currentSpace/addConnectionType')
      const types = utils.clone(this.connectionTypes)
      const newType = last(types)
      this.changeConnectionTypes(newType)
    },
    scrollIntoView () {
      const element = this.$refs.dialog
      scrollIntoView.scroll(element)
    }
  },
  watch: {
    visible (visible) {
      this.$nextTick(() => {
        if (visible) {
          this.scrollIntoView()
        }
      })
    }
  }
}
</script>

<style lang="stylus">
.connection-details
  .type-name
    margin-left 6px
</style>
