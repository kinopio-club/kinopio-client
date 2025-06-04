import { defineStore } from 'pinia'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

import utils from '@/utils.js'

const themes = {
  light: {
    name: 'light',
    colors: {
      'color-scheme': 'light',
      primary: 'black',
      'primary-border': 'rgba(0,0,0,0.3)',
      'primary-background': 'white',
      'text-link': '#143997',
      'primary-transparent': 'rgba(0,0,0,0.5)',
      'button-background': 'rgba(255,255,255,1)',
      'button-background-translucent': 'rgba(255,255,255,0.5)',
      'secondary-background': '#e3e3e3',
      'secondary-hover-background': '#d8d8d8',
      'secondary-active-background': '#cdcdcd',
      'tertiary-hover-background': '#c1c1c1',
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
      'inset-heavy-shadow': 'rgba(0,0,0,0.35)',
      // codeblock
      'code-comment': '#898989',
      'code-punctuation': 'black',
      'code-string': '#a2162d',
      'code-keyword': '#00119e',
      // user badges
      'badge-donor': '#ff9dff',
      'badge-upgraded': 'springgreen'
    }
  },
  dark: {
    name: 'dark',
    colors: {
      'color-scheme': 'dark',
      primary: 'white',
      'primary-border': 'rgba(255,255,255,0.3)',
      'primary-background': 'black',
      'text-link': '#788cc9',
      'primary-transparent': 'rgba(0,0,0,0.5)',
      'button-background': 'rgba(0,0,0,1)',
      'button-background-translucent': 'rgba(0,0,0,0.3)',
      'secondary-background': '#262626',
      'secondary-hover-background': '#555',
      'secondary-active-background': '#333',
      'tertiary-hover-background': '444',
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
      'inset-heavy-shadow': 'rgba(0,0,0,0.65)',
      // codeblock
      'code-comment': '#898989',
      'code-punctuation': 'white',
      'code-string': '#fddd88',
      'code-keyword': '#79e6d9',
      // user badges
      'badge-donor': 'blueviolet',
      'badge-upgraded': 'green',
      'badge-moderator': 'olive',
      'badge-ambassador': '#0f9189'
    }
  }
}

export const useThemeStore = defineStore('theme', {
  state: () => ({
    byId: {},
    allIds: [],
    dirtyCardIds: new Set(),
    pendingUpdates: new Map(),
    isUpdating: false
  }),

  getters: {

    systemThemeName () {
      const isDarkModeOS = window.matchMedia('(prefers-color-scheme: dark)').matches
      let themeName
      if (isDarkModeOS) {
        themeName = 'dark'
      } else {
        themeName = 'light'
      }
      return themeName
    },
    isThemeDark () {
      const userStore = useUserStore()
      const systemTheme = this.themeFromSystem()
      const userTheme = userStore.theme
      if (systemTheme) {
        return systemTheme === 'dark'
      } else {
        return userTheme === 'dark'
      }
    },
    currentThemeName () {
      const isThemeDark = this.isThemeDark
      let themeName
      if (isThemeDark) {
        return 'dark'
      } else {
        return 'light'
      }
    },
    themeColors () {
      const themeName = this.currentThemeName
      return themes[themeName].colors
    },
    previewImageThemeOptions () {
      const spaceStore = useSpaceStore()
      const isDarkTheme = this.isThemeDark
      let background = spaceStore.background
      let backgroundTint = spaceStore.backgroundTint
      const backgroundElement = document.querySelector('#space-background-image')
      const backgroundTintElement = document.querySelector('#space-background-tint')
      if (background && backgroundElement) {
        let domBackground = backgroundElement.style.backgroundImage
        domBackground = utils.urlFromCSSBackgroundImage(domBackground)
        background = domBackground || background
      }
      if (isDarkTheme && backgroundTintElement) {
        const domBackgroundTint = backgroundTintElement.style.backgroundColor
        backgroundTint = domBackgroundTint || backgroundTint
      }
      const theme = {
        secondaryBackground: this.themeColors['secondary-background'],
        primaryBorder: this.themeColors['primary-border'],
        primaryBackground: this.themeColors['primary-background'],
        entityRadius: 6,
        backgroundTint,
        background
      }
      return { isDarkTheme, theme }
    }

  },

  actions: {
    themeFromSystem () {
      const userStore = useUserStore()
      const themeIsSystem = userStore.themeIsSystem
      if (!themeIsSystem) { return }
      const theme = window.matchMedia('(prefers-color-scheme: dark)')
      let themeName
      if (theme.matches) {
        themeName = 'dark'
      } else {
        themeName = 'light'
      }
      return themeName
    }

  }
})
