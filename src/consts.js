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
  freeCardsCreatedLimit: 100,
  freeUploadSizeLimit: 5, // 5mb
  emptyCard () {
    return { width: this.defaultCardWidth, height: 32 }
  },

  minBoxSize: 70,
  defaultBoxWidth: 224,
  defaultBoxHeight: 105,
  boxSnapGuideWaitingDuration: 100,
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

  prices: {
    standard: {
      mo: {
        price: 8,
        priceId: 'price_1S2cymDFIr5ywhwoxYQpjwwx',
        devPriceId: 'price_1S2YjKDFIr5ywhwo9bTroXjb'
      },
      yr: {
        price: 80,
        priceId: 'price_1S2czcDFIr5ywhwoCiJ3UJFl',
        devPriceId: 'price_1S2YkjDFIr5ywhworJlITrlm'
      },
      life: {
        price: 250,
        priceId: 'price_1S2dCuDFIr5ywhwouB7Mpatd',
        devPriceId: 'price_1S2dahDFIr5ywhwoasGBlzaH'
      }
    },
    education: {
      mo: {
        price: 4,
        priceId: 'price_1S2d01DFIr5ywhwom6FcmrBE',
        devPriceId: 'price_1S2dWBDFIr5ywhwowrCrnKpt'
      },
      yr: {
        price: 40,
        priceId: 'price_1S2d0XDFIr5ywhwoDHendW1U',
        devPriceId: 'price_1S2dWKDFIr5ywhwoioe6WQAo'
      }
    },
    apple: {
      mo: {
        price: 9,
        priceId: 'apple_monthly_2025'
      },
      yr: {
        price: 90,
        priceId: 'apple_yearly_2025'
      }
    }
  },
  price (period, isStudentDiscount) {
    if (period === 'month') {
      return this.monthlyPrice(isStudentDiscount)
    } else if (period === 'year') {
      return this.yearlyPrice(isStudentDiscount)
    } else if (period === 'life') {
      return this.lifetimePrice()
    }
  },
  // mo
  monthlyPrice (isStudentDiscount) {
    if (isStudentDiscount) {
      return this.monthlyStudentPrice()
    } else {
      return this.monthlyStandardPrice()
    }
  },
  monthlyStudentPrice () {
    if (this.isSecureAppContextIOS) {
      return this.monthlyStandardPrice()
    }
    const price = {
      amount: this.prices.education.mo.price,
      period: 'year',
      stripePriceId: this.prices.education.mo.priceId
    }
    if (this.isDevelopment()) {
      price.stripePriceId = this.prices.education.mo.devPriceId
    }
    return price
  },
  monthlyStandardPrice () {
    const price = {
      amount: this.prices.standard.mo.price,
      period: 'month',
      stripePriceId: this.prices.standard.mo.priceId,
      applePriceId: this.prices.apple.mo.priceId
    }
    if (this.isDevelopment()) {
      price.stripePriceId = this.prices.standard.mo.devPriceId
    }
    if (this.isSecureAppContextIOS) {
      price.amount = this.prices.apple.mo.price
    }
    return price
  },
  // yr
  yearlyPrice (isStudentDiscount) {
    if (isStudentDiscount) {
      return this.yearlyStudentPrice()
    } else {
      return this.yearlyStandardPrice()
    }
  },
  yearlyStandardPrice () {
    const price = {
      amount: this.prices.standard.yr.price,
      period: 'year',
      stripePriceId: this.prices.standard.yr.priceId,
      applePriceId: this.prices.apple.yr.priceId
    }
    if (this.isDevelopment()) {
      price.stripePriceId = this.prices.standard.yr.devPriceId
    }
    if (this.isSecureAppContextIOS) {
      price.amount = this.prices.apple.yr.price
    }
    return price
  },
  yearlyStudentPrice () {
    if (this.isSecureAppContextIOS) {
      return this.yearlyStandardPrice()
    }
    const price = {
      amount: this.prices.education.yr.price,
      period: 'year',
      stripePriceId: this.prices.education.yr.priceId
    }
    if (this.isDevelopment()) {
      price.stripePriceId = this.prices.education.yr.devPriceId
    }
    return price
  },
  lifetimePrice () {
    const price = {
      amount: this.prices.standard.life.price,
      period: 'life',
      stripePriceId: this.prices.standard.life.priceId
    }
    if (this.isDevelopment()) {
      price.stripePriceId = this.prices.standard.life.devPriceId
    }
    return price
  }

}
