import utils from '@/utils.js'
import consts from '@/consts.js'
import cache from '@/cache.js'
import debounce from 'lodash-es/debounce'

let showDebugMessages = false

window.addEventListener('message', (event) => {
  console.log('🛫 received postmessage', event)
})

const debouncedSendHaptics = debounce((body) => {
  self.send(body)
}, 10)

const shouldPrevent = () => {
  const shouldSendPostmessages = consts.isSecureAppContext
  if (!shouldSendPostmessages) { return true }
  if (!window.webkit) { return true }
}

const self = {
  send (body) {
    if (shouldPrevent()) { return }
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
    if (shouldPrevent()) { return }
    const shouldDisable = cache.getLocal('user').shouldDisableHapticFeedback
    if (shouldDisable) { return }
    const name = utils.capitalizeFirstLetter(body.name)
    body.name = `on${name}Feedback`
    debouncedSendHaptics(body)
  },

  logSend (body) {
    const isBackgroundColor = body.name === 'setBackgroundColor'
    if (!showDebugMessages && isBackgroundColor) {
    } else {
      console.log('🛫 sending postmessage', body)
    }
  }
}

export default self
