// vars referenced by multiple components

const env = import.meta.env

export default {
  spaceZoom: {
    max: 100,
    min: 20
  },
  spaceBetweenCards: 12,
  defaultCharacterLimit: 300,
  highCharacterLimit: 4000,
  defaultCardWidth: 58,
  defaultCardHeight: 70,
  minItemXY: 70,
  normalCardMaxWidth: 200,
  wideCardMaxWidth: 390,
  minCardIframeWidth: 260,
  emptyCard () {
    return { width: this.defaultCardWidth, height: 32 }
  },
  boxSnapGuideWaitingDuration: 1000,
  maxInviteEmailsAllowedToSend: 15,
  defaultConnectionPathCurveControlPoint: 'q90,40',
  defaultTimeout: 40000,
  AIImageLimitUpgradedUser: 50,
  AIImageLimitFreeUser: 10,
  rootUserId: 'euGhpBrR9eBcjKnK16C_g',
  sidebarWidth: 250,
  minBoxSize: 70,
  systemCommands: { explore: 'Explore', newSpace: 'New Space', templates: 'Templates', apps: 'Apps and Extensions' },
  systemCommandIcons: { moonPhase: 'moonPhase' },
  isSecureAppContextIOS: navigator.isSecureAppContextIOS, // true = iOS app
  isSecureAppContext: navigator.isSecureAppContext, // true = iOS app
  cdnHost: 'https://cdn.kinopio.club',
  defaultSpaceBackground: 'https://bk.kinopio.club/grid-large-boxes-2x.png',
  moderatorUserId: 'euGhpBrR9eBcjKnK16C_g',
  uploadPlaceholder: '⬬⬭',
  itemTypesWithPositions: ['boxes', 'cards'],
  nameDateFormat: 'ddd MMM D, YYYY', // Wed Nov 13, 2024
  isDevelopment () {
    if (env.VITE_PROD_SERVER === 'true') {
      return false
    } else {
      return (env.MODE === 'development')
    }
  },
  kinopioDomain () {
    let domain = 'https://kinopio.club'
    if (this.isDevelopment()) {
      domain = 'https://kinopio.local:8080'
    }
    return domain
  },
  apiHost () {
    let host = 'https://api.kinopio.club'
    if (this.isDevelopment()) {
      host = 'https://kinopio.local:3000'
    }
    return host
  },
  websocketHost () {
    let host = 'wss://api.kinopio.club'
    if (this.isDevelopment()) {
      host = 'wss://kinopio.local:3000'
    }
    return host
  },
  userPrefersReducedMotion () {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (query.matches) {
      return true
    } else {
      return false
    }
  },

  // about

  roadmapSpaceId () {
    if (this.isDevelopment()) {
      return 'FiM7akGos18Sfx4yKrwjF'
    } else {
      return '6TRE21gchHI7alHLuwzd5'
    }
  },
  changelogSpaceId () {
    if (this.isDevelopment()) {
      return 'ezP9B9r2U0CUYR8g-Mn9N'
    } else {
      return '6lsytK8ZfOtMl2oqG05Rj'
    }
  },

  // price

  price (period, isStudentDiscount) {
    if (period === 'month') {
      return this.monthlyPrice()
    } else if (period === 'year') {
      return this.yearlyPrice(isStudentDiscount)
    } else if (period === 'life') {
      return this.lifePrice()
    }
  },
  monthlyPrice () {
    let price = {
      amount: 6,
      period: 'month',
      stripePriceId: 'price_1L2GvBDFIr5ywhwobbE35dhA',
      applePriceId: 'apple_monthly_2023'
    }
    if (this.isDevelopment()) {
      price.stripePriceId = 'price_1L7200DFIr5ywhwoAJGkA7yK'
    }
    if (this.isSecureAppContextIOS) {
      price.amount = 7
    }
    return price
  },
  yearlyPrice (isStudentDiscount) {
    if (isStudentDiscount) {
      return this.yearlyStudentPrice()
    } else {
      return this.yearlyStandardPrice()
    }
  },
  yearlyStandardPrice () {
    let price = {
      amount: 60,
      period: 'year',
      stripePriceId: 'price_1L2ErWDFIr5ywhwodsKxEEAq',
      applePriceId: 'apple_yearly_2023'
    }
    if (this.isDevelopment()) {
      price.stripePriceId = 'price_1L720NDFIr5ywhwo0wS5PWAv'
    }
    if (this.isSecureAppContextIOS) {
      price.amount = 70
    }
    return price
  },
  yearlyStudentPrice () {
    if (this.isSecureAppContextIOS) {
      return this.yearlyStandardPrice()
    }
    let price = {
      amount: 30,
      period: 'year',
      stripePriceId: 'price_1NidyHDFIr5ywhwoVSx6JSpP'
    }
    if (this.isDevelopment()) {
      price.stripePriceId = 'price_1Nie0DDFIr5ywhwoesLtHpVu'
    }
    return price
  },
  lifePrice () {
    let price = {
      amount: 200,
      period: 'life',
      stripePriceId: 'price_1O6k3UDFIr5ywhwoeCdzdlAM'
    }
    if (this.isDevelopment()) {
      price.stripePriceId = 'price_1O6k10DFIr5ywhwoXF87uKcl'
    }
    return price
  }

}
