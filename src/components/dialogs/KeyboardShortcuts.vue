<template lang="pug">
dialog.keyboard-shortcuts(v-if="visible" :open="visible" @click.left.stop ref="dialog" :style="{'max-height': dialogHeight + 'px'}" @click="closeDialogs")
  section
    .row
      .badge.title Keyboard Shortcuts
      .badge.keyboard-shortcut ?
    .categories
      template(v-for="category in categories" :key="category.name")
        .badge.secondary.button-badge(:class="{ active: categoryButtonIsVisible(category.name) }" :style="{ 'background-color': category.color }" @click="updateSelectedCategory(category.name)") {{category.name}}
  section
    //- General
    template(v-if="categoryIsVisible('general')")
      .section-title
        .badge.info(:style="{ 'background-color': categoryColor('general') }") General
      article
        .row
          .badge.title
            img.icon(src="@/assets/add.svg")
            span New Space
          .badge.keyboard-shortcut N
      article
        .row
          .badge.title
            img.icon.inbox-icon(src="@/assets/inbox.svg")
            span Add to Inbox
          .badge.keyboard-shortcut I
      article
        .row
          .badge.title
            img.icon.dark(src="@/assets/dark.svg")
            span Toggle Dark Theme
          .badge.keyboard-shortcut T
      article
        .row
          .badge.title
            img.icon.cancel(src="@/assets/add.svg")
            span Close Dialogs
          .badge.keyboard-shortcut Escape

    //- General
    template(v-if="categoryIsVisible('toolbar')")
      .section-title
        .badge.info(:style="{ 'background-color': categoryColor('toolbar') }") Toolbar
      article
        .row
          .badge.title
            img.icon.box-icon(src="@/assets/box.svg")
            span Box Mode
          .badge.keyboard-shortcut B

    //- Navigate
    template(v-if="categoryIsVisible('navigate')")
      .section-title
        .badge.info(:style="{ 'background-color': categoryColor('navigate') }") Navigate
      article
        .row
          .badge.title
            img.icon.minimap(src="@/assets/minimap.svg")
            span Minimap
          .badge.keyboard-shortcut Z
      article
        .row
          .badge.title
            img.icon.presentation(src="@/assets/presentation.svg")
            span Presentation Mode
          .badge.keyboard-shortcut P
      article
        .row
          .badge.title
            img.icon.hand(src="@/assets/hand.svg")
            span Drag to Pan
          .badge.keyboard-shortcut Space/Right-Click Drag
      article
        .row
          .badge.title
            img.icon.magnifying-glass(src="@/assets/magnifying-glass.svg")
            span Zoom In or Out
          .badge.keyboard-shortcut {{meta}}-+/-, {{meta}}-Scroll

    //- Edit
    template(v-if="categoryIsVisible('edit')")
      .section-title
        .badge.info(:style="{ 'background-color': categoryColor('edit') }") Edit
      article
        .row.multiple-items
          .badge.title
            img.icon(src="@/assets/add.svg")
            span Add Card
          .badge.keyboard-shortcut Enter
      article
        .row
          .badge.title
            img.icon(src="@/assets/add.svg")
            span Add Child Card
          .badge.keyboard-shortcut Shift-Enter
        p Subsequent&nbsp;
          span.badge.keyboard-shortcut Enter
          span adds siblings
      article
        .row
          .badge.title
            img.icon(src="@/assets/line-break.svg")
            span Line break in card
          .badge.keyboard-shortcut Ctrl-Enter
      article
        .row
          .badge.title
            img.icon(src="@/assets/constrain-axis.svg")
            span Constrain Card Move to Axis
          .badge.keyboard-shortcut Shift-Drag Card
      article
        .row
          .badge.title Focus Nearest Card
          .badge.keyboard-shortcut Arrow(→↑←↓)
      article
        .row
          .badge.title
            img.icon(src="@/assets/lock.svg")
            span Toggle Lock Cards
          .badge.keyboard-shortcut {{meta}}-Shift-L
      article
        .row
          .badge.title
            img.icon(src="@/assets/undo.svg")
            span Undo/Redo
          .badge.keyboard-shortcut {{meta}}-Z/{{meta}}-Shift-Z

    //- Select
    template(v-if="categoryIsVisible('select')")
      .section-title
        .badge.info(:style="{ 'background-color': categoryColor('select') }") Select
      article
        .row
          .badge.title
            img.icon(src="@/assets/box-select.svg")
            span Box Select
          .badge.keyboard-shortcut Shift-Drag
      article
        .row
          .badge.title
            img.icon(src="@/assets/brush.svg")
            span Select All Cards
          .badge.keyboard-shortcut {{meta}}-A
      article
        .row
          .badge.title
            img.icon(src="@/assets/brush-y.svg")
            span Select All Cards Below Cursor
          .badge.keyboard-shortcut {{meta}}-Shift-A
      article
        .row
          .badge.title
            img.icon(src="@/assets/brush.svg")
            span Select All Connected Cards
          .badge.keyboard-shortcut {{meta}}-Click Card
      article
        .row
          .badge.title
            img.icon(src="@/assets/brush.svg")
            span Select All Cards Inside Box
          .badge.keyboard-shortcut {{meta}}-Click Box
      article
        .row
          .badge.title
            img.icon.box-icon(src="@/assets/box.svg")
            span Move Box Without Moving Cards
          .badge.keyboard-shortcut Shift-Drag on Box
      article
        .row
          .badge.title
            img.icon.cut(src="@/assets/cut.svg")
            span Copy/Cut/Paste Selected Cards
          .badge.keyboard-shortcut {{meta}}-C/{{meta}}-X/{{meta}}-V
        p You can copy and paste cards between spaces
      article
        .row
          .badge.title
            img.icon(src="@/assets/remove.svg")
            span Remove Selected
          .badge.keyboard-shortcut Delete

    //- Filter
    template(v-if="categoryIsVisible('filter')")
      .section-title
        .badge.info(:style="{ 'background-color': categoryColor('filter') }") Filter
      article
        .row
          .badge.title
            UserLabelInline(:user="currentUser" :shouldHideName="true")
            span Toggle Card User Filter
          .badge.keyboard-shortcut 1
      article
        .row
          .badge.title
            img.icon.time(src="@/assets/time.svg")
            span Toggle Card Date Filter
          .badge.keyboard-shortcut 2
      article
        .row
          .badge.title
            img.icon.time(src="@/assets/unchecked.svg")
            span Toggle Cards Unchecked Filter
          .badge.keyboard-shortcut 3
      article
        .row
          .badge.title
            img.icon.time(src="@/assets/comment.svg")
            span Toggle Hide Comment Cards
          .badge.keyboard-shortcut 4

    //- Connect
    template(v-if="categoryIsVisible('connect')")
      .section-title
        .badge.info(:style="{ 'background-color': categoryColor('connect') }") Connect
      article
        .row
          .badge.title
            img.icon.connector-icon(src="@/assets/connector-open.svg")
            span Use {{lastOrNewConnectionTypeControlSetting}} Connection Type
          .badge.keyboard-shortcut Shift-Click on
            img.icon.connector-icon(src="@/assets/connector-open.svg")
        p
          span.badge.keyboard-shortcut Shift-Drag
          span card connector or
          span.badge.keyboard-shortcut Shift-Click
          span 'Connect' button to use {{lastOrNewConnectionTypeControlSetting}} connection type

    //- Search and Jump
    template(v-if="categoryIsVisible('search-and-jump')")
      .section-title
        .badge.info(:style="{ 'background-color': categoryColor('search-and-jump') }") Search and Jump
      article
        .row
          .badge.title
            img.icon(src="@/assets/search.svg")
            span Search/Jump-to Spaces
          .badge.keyboard-shortcut {{meta}}–K
      article
        .row
          .badge.title
            img.icon(src="@/assets/search.svg")
            span Search/Jump-to Cards
          .badge.keyboard-shortcut {{meta}}–F

</template>

<script>
import UserLabelInline from '@/components/UserLabelInline.vue'
import keyboardShortcutsCategories from '@/data/keyboardShortcutsCategories.js'
import utils from '@/utils.js'

export default {
  name: 'KeyboardShortcuts',
  props: {
    visible: Boolean
  },
  components: {
    UserLabelInline
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'updatePageSizes') {
        this.updateDialogHeight()
      }
    })
  },
  data () {
    return {
      dialogHeight: null,
      selectedCategory: 'all'
    }
  },
  computed: {
    categories () { return keyboardShortcutsCategories },
    meta () { return utils.metaKey() },
    currentUser () { return this.$store.state.currentUser },
    isMobile () { return utils.isMobile() },
    shouldUseLastConnectionType () { return this.$store.state.currentUser.shouldUseLastConnectionType },
    lastOrNewConnectionTypeControlSetting () {
      if (this.shouldUseLastConnectionType) {
        return 'New'
      } else {
        return 'Last'
      }
    }
  },
  methods: {
    updateSelectedCategory (categoryName) {
      const name = utils.normalizeString(categoryName)
      this.selectedCategory = name
    },
    categoryButtonIsVisible (categoryName) {
      const name = utils.normalizeString(categoryName)
      return this.selectedCategory === name
    },
    categoryIsVisible (categoryName) {
      const name = utils.normalizeString(categoryName)
      return this.selectedCategory === 'all' || this.selectedCategory === name
    },
    categoryByName (categoryName) {
      const categories = this.categories.map(category => {
        category.name = utils.normalizeString(category.name)
        return category
      })
      return categories.filter(category => category.name === categoryName)[0]
    },
    categoryColor (categoryName) {
      const color = this.categoryByName(categoryName).color
      return color
    },
    updateDialogHeight () {
      if (!this.visible) { return }
      this.$nextTick(() => {
        let element = this.$refs.dialog
        this.dialogHeight = utils.elementHeightFromHeader(element)
      })
    },
    closeDialogs () {
      // this.keyboardShortcutsCategoriesIsVisible = false
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
        this.updateDialogHeight()
        this.selectedCategory = 'all'
      }
    }
  }
}
</script>

<style lang="stylus">
.keyboard-shortcuts
  overflow auto
  max-height calc(100vh - 300px)
  .title
    padding-left 0
  .badge
    display inline-block
  .badge.info
    img
      margin-left 6px

  article
    position static
    margin-bottom 10px
    padding-bottom 10px
    border-bottom 1px solid var(--primary)
    &:last-child
      margin-bottom 0
      padding-bottom 0
      border-bottom 0
  .row
    display flex
    justify-content space-between
  .multiple-items
    .badge
      margin-right 0
    .divider
      padding-left 0
      margin-right 6px
  .badge.title + .badge.info
    margin-right 0
  .connector-icon
    width 11px
  video
    margin-top 10px
  .user
    margin-right 5px !important
  .magnifying-glass
    vertical-align -2px
  .keyboard-shortcut
    margin 0
    .icon
      margin-left 3px
  .keyboard-shortcut + span
    margin-left 6px
  .section-title
    margin-bottom 10px
  .hand
    vertical-align middle

  .categories
    margin-top -6px
    .button-badge + .button-badge
      margin-top 6px

  .inbox-icon
    margin 0

  .icon.minimap,
  .icon.presentation
    width 12px
    vertical-align -1px
</style>
