import utils from '@/utils.js'
import consts from '@/consts.js'
import cache from '@/cache.js'

let showDebugMessages = false

window.addEventListener('message', (event) => {
  console.log('🛫 received postmessage', event)
})

export default {
  send (body) {
    const shouldSendPostmessages = consts.isSecureAppContext
    if (!shouldSendPostmessages) { return }
    try {
      this.logSend(body)
      const value = body.value || ''
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
  },

  logSend (body) {
    const isBackgroundColor = body.name === 'setBackgroundColor'
    if (!showDebugMessages && isBackgroundColor) {
    } else {
      console.log('🛫 sending postmessage', body)
    }
  }
}
