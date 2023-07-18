import utils from '@/utils.js'
import consts from '@/consts.js'
import cache from '@/cache.js'

export default {
  send (body) {
    const shouldSendPostmessages = consts.isSecureAppContext
    if (!window.webkit) { return }
    if (!window.webkit.messageHandlers[body.name]) { return }
    try {
      console.log('🛫 sending postmessage', body)
      const value = body.value || ''
      console.log(window.webkit.messageHandlers[body.name])
      window.webkit.messageHandlers[body.name].postMessage(value)
    } catch (error) {
      console.error(error)
    }
  },

  // https://www.notion.so/kinopio/JS-Bridge-Documentation-35ab7038df63439592b525b918d3acfa
  sendHaptics (body) {
    const shouldPrevent = cache.getLocal('user').shouldDisableHapticFeedback
    if (shouldPrevent) { return }
    const name = utils.capitalizeFirstLetter(body.name)
    body.name = `on${name}Feedback`
    this.send(body)
  }
}
