import utils from '@/utils.js'

const themes = {
  light: {
    name: 'light',
    colors: {
      'primary': 'black',
      'primary-border': 'rgba(0,0,0,0.3)',
      'primary-background': 'white',
      'text-link': '#143997',
      'primary-transparent': 'rgba(0,0,0,0.5)',
      'button-background': 'rgba(255,255,255,1)',
      'button-background-translucent': 'rgba(255,255,255,0.5)',
      'secondary-background': '#e3e3e3',
      'secondary-hover-background': '#d8d8d8',
      'secondary-active-background': '#cdcdcd',
      'danger-background': '#ffb8b3',
      'danger-hover-background': '#ffa49e',
      'danger-active-background': '#ff928b',
      'info-background': '#90ffff',
      'success-background': '#67ffbb',
      'search-background': 'yellow',
      'new-unread-background': '#57a8ff',
      'secondary-active-background-dark': '#cdcdcd',
      'light-shadow': 'rgba(0,0,0,0.20)',
      'heavy-shadow': 'rgba(0,0,0,0.25)',
      // codeblock
      'code-comment': '#898989',
      'code-punctuation': 'black',
      'code-string': '#a2162d',
      'code-keyword': '#00119e'
    }
  },
  dark: {
    name: 'dark',
    colors: {
      'primary': 'white',
      'primary-border': 'rgba(255,255,255,0.3)',
      'primary-background': 'black',
      'text-link': '#788cc9',
      'primary-transparent': 'rgba(0,0,0,0.5)',
      'button-background': 'rgba(0,0,0,1)',
      'button-background-translucent': 'rgba(0,0,0,0.3)',
      'secondary-background': '#262626',
      'secondary-hover-background': '#555',
      'secondary-active-background': '#333',
      'danger-background': '#732b26',
      'danger-hover-background': '#8f3832',
      'danger-active-background': '#a83730',
      'info-background': '#085353',
      'success-background': '#183f24',
      'search-background': '#6f6d01',
      'new-unread-background': '#2f6fb5',
      'secondary-active-background-dark': '#444',
      'light-shadow': 'rgba(0,0,0,0.25)',
      'heavy-shadow': 'rgba(0,0,0,0.55)',
      // codeblock
      'code-comment': '#898989',
      'code-punctuation': 'white',
      'code-string': '#fddd88',
      'code-keyword': '#79e6d9'
    }
  }
}

export default {
  namespaced: true,
  actions: {
    isSystem: (context, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      context.dispatch('currentUser/update', { themeIsSystem: value }, { root: true })
      context.commit('triggerUpdateTheme', null, { root: true })
    },
    toggleIsSystem: (context) => {
      const value = !context.rootState.currentUser.themeIsSystem
      context.dispatch('isSystem', value)
      if (value) {
        const themeName = context.getters.systemThemeName
        context.dispatch('update', themeName)
      }
    },
    update: (context, themeName) => {
      const normalizedThemeName = themeName || 'light'
      // colors
      const theme = themes[normalizedThemeName]
      const colors = theme.colors
      let keys = Object.keys(colors)
      keys.forEach(key => {
        utils.setCssVariable(key, colors[key])
      })
      context.dispatch('currentUser/update', { theme: normalizedThemeName }, { root: true })
      context.commit('triggerUpdateTheme', null, { root: true })
    },
    restore: (context) => {
      let themeName = context.rootState.currentUser.theme
      const themeIsSystem = context.rootState.currentUser.themeIsSystem
      if (themeIsSystem) {
        themeName = context.getters.systemThemeName || themeName
      }
      context.dispatch('update', themeName)
    },
    toggle: (context) => {
      const prevTheme = context.rootState.currentUser.theme || 'light'
      let theme
      if (prevTheme === 'light') {
        theme = 'dark'
      } else {
        theme = 'light'
      }
      context.dispatch('update', theme)
    }
  },
  getters: {
    systemThemeName: (state) => {
      const isDarkModeOS = window.matchMedia('(prefers-color-scheme: dark)').matches
      let themeName
      if (isDarkModeOS) {
        themeName = 'dark'
      } else {
        themeName = 'light'
      }
      return themeName
    }
  }
}
