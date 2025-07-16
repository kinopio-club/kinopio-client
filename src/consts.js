// vars referenced by multiple components

const env = import.meta.env

export default {
  spaceZoom: {
    max: 100,
    min: 20
  },
  spaceBetweenCards: 12,
  cardCharacterLimit: 4000,
  defaultCardWidth: 58,
  defaultCardHeight: 70,
  minItemXY: 70,
  normalCardMaxWidth: 200,
  wideCardMaxWidth: 390,
  minCardIframeWidth: 260,
  cardsCreatedLimit: 100,
  emptyCard () {
    return { width: this.defaultCardWidth, height: 32 }
  },

  minBoxSize: 70,
  defaultBoxWidth: 224,
  defaultBoxHeight: 105,
  boxSnapGuideWaitingDuration: 200,
  maxInviteEmailsAllowedToSend: 15,
  defaultConnectionPathCurveControlPoint: 'q90,40',
  straightLineConnectionPathControlPoint: 'q00,00',
  defaultTimeout: 40000,
  rootUserId: 'euGhpBrR9eBcjKnK16C_g',
  sidebarWidth: 250,
  systemCommands: { explore: 'Explore', newSpace: 'New Space', templates: 'Templates', apps: 'Apps and Extensions' },
  isSecureAppContextIOS: navigator.isSecureAppContextIOS, // true = iOS app
  isSecureAppContext: navigator.isSecureAppContext, // true = iOS app
  cdnHost: 'https://cdn.kinopio.club',
  imgproxyHost: 'https://img.kinopio.club',
  defaultSpaceBackground: 'https://bk.kinopio.club/squiggle-background-2x.png',
  moderatorUserId: 'euGhpBrR9eBcjKnK16C_g',
  uploadPlaceholder: '⬬⬭',
  itemTypesWithPositions: ['boxes', 'cards'],
  nameDateFormat: 'MMMM D, YYYY', // August 16, 2025
  itemDetailsDebugIsVisible: true,
  isDevelopment () {
    if (env.VITE_PROD_SERVER === 'true') {
      return false
    } else {
      return (env.MODE === 'development')
    }
  },
  kinopioDomain () {
    const domain = 'https://kinopio.club'
    // if (this.isDevelopment()) {
    //   domain = 'https://kinopio.local:8080'
    // }
    return domain
  },
  apiHost () {
    const host = 'https://api.kinopio.club'
    // if (this.isDevelopment()) {
    //   host = 'https://kinopio.local:3000'
    // }
    return host
  },
  websocketHost () {
    const host = 'wss://api.kinopio.club'
    // if (this.isDevelopment()) {
    //   host = 'wss://kinopio.local:3000'
    // }
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
  drawingBrushSizeDiameter: {
    l: 40,
    m: 20,
    s: 10
  },

  // about

  roadmapSpaceId () {
    if (this.isDevelopment()) {
      return 'FiM7akGos18Sfx4yKrwjF'
    } else {
      return '3CBHtivu7X7nTzrcaTFQV'
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
    const price = {
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
    const price = {
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
    const price = {
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
    const price = {
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
