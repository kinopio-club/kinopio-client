import utils from '@/utils.js'

const themes = {
  light: {
    name: 'light',
    colors: {
      'primary': 'black',
      'primary-border': 'black',
      'primary-background': 'white',
      'text-link': '#143997',
      'primary-transparent': 'rgba(0,0,0,0.5)',
      'secondary-background': '#e3e3e3',
      'secondary-hover-background': '#d8d8d8',
      'secondary-active-background': '#cdcdcd',
      'danger-background': '#ffb8b3',
      'danger-hover-background': '#ffa49e',
      'danger-active-background': '#ff928b',
      'info-background': '#90ffff',
      'success-background': '#67ffbb',
      'search-background': 'yellow',
      'text-link-dark': '#9ab2ee',
      'secondary-active-background-dark': '#666',
      'light-shadow': 'rgba(0,0,0,0.20)',
      'heavy-shadow': 'rgba(0,0,0,0.25)'
    }
  },
  dark: {
    name: 'dark',
    colors: {
      'primary': 'white',
      'primary-border': '#666',
      'primary-background': 'black',
      'text-link': '#143997',
      'primary-transparent': 'rgba(0,0,0,0.5)',
      'secondary-background': '#222',
      'secondary-hover-background': '#666',
      'secondary-active-background': '#444',
      'danger-background': '#ffb8b3',
      'danger-hover-background': '#ffa49e',
      'danger-active-background': '#ff928b',
      'info-background': '#90ffff',
      'success-background': '#67ffbb',
      'search-background': 'yellow',
      'text-link-dark': '#9ab2ee',
      'secondary-active-background-dark': '#444',
      'light-shadow': 'rgba(0,0,0,0.25)',
      'heavy-shadow': 'rgba(0,0,0,0.35)'
    }
  }
}

export default {
  namespaced: true,
  state: {
    current: {}
  },
  mutations: {
    current: (state, theme) => {
      utils.typeCheck({ value: theme, type: 'object' })
      state.current = theme
    }
  },
  actions: {
    update: (context, themeName) => {
      const normalizedThemeName = themeName || 'light'
      // colors
      const theme = themes[normalizedThemeName]
      const colors = theme.colors
      let keys = Object.keys(colors)
      keys.forEach(key => {
        utils.setCssVariable(key, colors[key])
      })
      context.commit('current', theme)
      // update user pref
      if (themeName) {
        context.dispatch('currentUser/update', { theme: normalizedThemeName }, { root: true })
      }
    },
    restore: (context) => {
      const theme = context.rootState.currentUser.theme
      context.dispatch('update', theme)
    },
    toggle: (context) => {
      const prevTheme = context.rootState.currentUser.theme || 'light'
      let theme
      if (prevTheme === 'light') {
        theme = 'dark'
      } else {
        theme = 'light'
      }
      console.log(prevTheme, theme)
      context.dispatch('update', theme)
    }
  }
}
