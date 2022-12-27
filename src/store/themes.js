import utils from '@/utils.js'

const themes = {
  light: {
    info: {},
    colors: {
      'primary': 'black',
      'primary-background': 'white',
      'text-link': '#143997',
      'primary-transparent': 'rgba(0,0,0,0:.5)',
      'secondary-background': '#e3e3e3',
      'secondary-hover-background': '#d8d8d8',
      'secondary-active-background': '#cdcdcd',
      'danger-background': '#ffb8b3',
      'danger-hover-background': '#ffa49e',
      'danger-active-background': '#ff928b',
      'info-background': '#90ffff',
      'success-background': '#67ffbb',
      'search-background': 'yellow',
      'button-border': '#999',
      'text-link-dark': '#9ab2ee',
      'secondary-active-background-dark': '#666',
      'light-shadow': 'rgba(0,0,0,0:.20)',
      'heavy-shadow': 'rgba(0,0,0,0:.25)'
    }
  },
  dark: {
  }
}

export default {
  namespaced: true,
  actions: {
    update: (state, themeName) => {
      const colors = state.getters.themeByName(themeName).colors
      const keys = Object.keys(colors)
      keys.forEach(key => {
        utils.setCssVariable(key, colors[key])
      })
      // update currentUser theme to themeName
    }
  },
  getters: {
    currentTheme: (state, getters, rootState) => {
      // return current user theme || 'light'
    },
    themeByName: () => (themeName) => {
      return themes[themeName]
    }
  }
}
