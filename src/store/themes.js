import utils from '@/utils.js'

const themes = {
  light: {
    colors: {
      'primary': 'black',
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
      'button-border': '#999',
      'text-link-dark': '#9ab2ee',
      'secondary-active-background-dark': '#666',
      'light-shadow': 'rgba(0,0,0,0.20)',
      'heavy-shadow': 'rgba(0,0,0,0.25)'
    }
  },
  dark: {
    colors: {
      'primary': 'black',
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
      'button-border': '#999',
      'text-link-dark': '#9ab2ee',
      'secondary-active-background-dark': '#666',
      'light-shadow': 'rgba(0,0,0,0.20)',
      'heavy-shadow': 'rgba(0,0,0,0.25)'
    }
  }
}

export default {
  namespaced: true,
  actions: {
    update: (state, themeName) => {
      // colors
      const colors = state.getters.themeByName(themeName).colors
      let keys = Object.keys(colors)
      keys.forEach(key => {
        utils.setCssVariable(key, colors[key])
      })
      // consts
      const consts = {
        'hover-shadow': `3px 3px 0 var(--heavy-shadow)`,
        'active-shadow': `5px 5px 0 var(--light-shadow)`,
        'active-inset-shadow': `inset 0 2px 3px var(--light-shadow)`,
        'button-hover-shadow': `2px 2px 0 var(--heavy-shadow)`,
        'button-active-inset-shadow': `inset 0 1px 2px var(--heavy-shadow)`
      }
      keys = Object.keys(consts)
      keys.forEach(key => {
        utils.setCssVariable(key, consts[key])
      })
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
