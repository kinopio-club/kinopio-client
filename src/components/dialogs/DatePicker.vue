<template lang="pug">
dialog.narrow.date-picker(v-if="visible" :open="visible" ref="dialog" @click.left.stop)
  section(v-if="title")
    // img moonphase of current selected date
    p {{title}}
  section
    input(type="date" :value="initialDate" @change="updateDate")

    .row
      .moonphase-wrap
        MoonPhase(:moonPhase="moonPhase.name")
      p The moonphase for this date is {{moonPhaseName}}
    // initial input val = date
    // on change: emit new date
  //- show moonphase , w moonphase name, kind of an explanation "the moonphase for this date is ..."
</template>

<script>
import MoonPhase from '@/components/MoonPhase.vue'
import moonphase from '@/moonphase.js'

import scrollIntoView from '@/scroll-into-view.js'
import dayjs from 'dayjs'

export default {
  name: 'DatePicker',
  components: {
    MoonPhase
  },
  props: {
    visible: Boolean,
    date: Object,
    title: String
  },
  data () {
    return {
      updatedDate: null
    }
  },
  computed: {
    initialDate () {
      return dayjs(this.date).format('YYYY-MM-DD')
    },
    currentDate () {
      return this.updatedDate || this.date
    },
    moonPhase () {
      return moonphase(this.currentDate)
    },
    moonPhaseName () {
      let name = this.moonPhase.name
      name = name.replace('-', ' ')
      return name
    }
  },
  methods: {
    updateDate (event) {
      let date = new Date(event.target.value)
      date = dayjs(date)
      this.updatedDate = date
      this.$emit('date', date)
    },
    scrollIntoView () {
      this.$nextTick(() => {
        const element = this.$refs.dialog
        if (!element) { return }
        const isTouchDevice = this.$store.state.isTouchDevice
        scrollIntoView.scroll(element, isTouchDevice)
      })
    }
  },
  watch: {
    visible (visible) {
      this.scrollIntoView()
    }
  }
}
</script>

<style lang="stylus">
.date-picker
  input
    margin-bottom 0
  .moonphase-wrap
    margin-right 6px
    margin-top -4px
    width 18px
    height 14px
</style>
