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
  normalCardMaxWidth: 200,
  wideCardMaxWidth: 390,
  minCardEmbedWidth: 235,
  maxInviteEmailsAllowedToSend: 15,
  defaultConnectionPathCurveControlPoint: 'q90,40',
  defaultTimeout: 40000,
  AIImageLimitUpgradedUser: 50,
  AIImageLimitFreeUser: 10,
  pexelsApiKey: '4kZOQl4a0OjcWLrMHzj6sEJMarmlZzJiP6P67lqZpOrxbtITfwpKyC4j',
  iframelyApiKey: '0788beaa34f65adc0fe7ac',
  rootUserId: 'euGhpBrR9eBcjKnK16C_g',
  sidebarWidth: 250,
  systemCommands: { explore: 'Explore', newSpace: 'New Space', templates: 'Templates', apps: 'Apps and Extensions' },
  isSecureAppContextIOS: navigator.isSecureAppContextIOS, // true = iOS app
  isSecureAppContext: navigator.isSecureAppContext, // true = iOS app
  cdnHost: 'https://cdn.kinopio.club',
  defaultSpaceBackground: 'https://bk.kinopio.club/grid-large-boxes-2x.png',
  moderatorUserId: 'euGhpBrR9eBcjKnK16C_g',
  isDevelopment () {
    console.log(env.VITE_PROD_SERVER, env, env.MODE)
    if (env.VITE_PROD_SERVER === 'true') {
      return false
    } else {
      return (env.MODE === 'development')
    }
  },
  roadmapSpaceId () {
    if (this.isDevelopment()) {
      return 'FiM7akGos18Sfx4yKrwjF'
    } else {
      return '6TRE21gchHI7alHLuwzd5'
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
  blogHost () {
    let host = 'https://blog.kinopio.club'
    if (this.isDevelopment()) {
      host = 'http://localhost:8082'
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
