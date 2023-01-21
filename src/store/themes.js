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
      'text-link-dark': '#788cc9',
      'secondary-active-background-dark': '#cdcdcd',
      'light-shadow': 'rgba(0,0,0,0.20)',
      'heavy-shadow': 'rgba(0,0,0,0.25)'
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
      'secondary-background': '#262626',
      'secondary-hover-background': '#555',
      'secondary-active-background': '#333',
      'danger-background': '#732b26',
      'danger-hover-background': '#8f3832',
      'danger-active-background': '#a83730',
      'info-background': '#085353',
      'success-background': '#183f24',
      'search-background': '#6f6d01',
      'text-link-dark': '#788cc9',
      'secondary-active-background-dark': '#444',
      'light-shadow': 'rgba(0,0,0,0.25)',
      'heavy-shadow': 'rgba(0,0,0,0.55)'
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
