import utils from '@/utils.js'
import consts from '@/consts.js'
import cache from '@/cache.js'
import debounce from 'lodash-es/debounce'

let showDebugMessages = false

window.addEventListener('message', (event) => {
  console.info('🛫 received postmessage', event)
  const isAddPage = window.location.pathname === '/add'
  if (isAddPage) {
    cache.updatePrevAddPageValue(event.data)
    console.info('🛫 cache.updatePrevAddPageValue', event.data)
  }
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
      const messageHandler = window.webkit.messageHandlers[body.name]
      if (!messageHandler) { return }
      messageHandler.postMessage(value)
    } catch (error) {
      console.error('🚒 send postMessage', error, body)
    }
  },

  // https://www.notion.so/kinopio/JS-Bridge-Documentation-35ab7038df63439592b525b918d3acfa
  async sendHaptics (body) {
    if (shouldPrevent()) { return }
    const shouldDisable = await cache.user().shouldDisableHapticFeedback
    if (shouldDisable) { return }
    const name = utils.capitalizeFirstLetter(body.name)
    body.name = `on${name}Feedback`
    debouncedSendHaptics(body)
  },

  logSend (body) {
    const isBackgroundColor = body.name === 'setBackgroundColor'
    if (!showDebugMessages && isBackgroundColor) {
    } else {
      console.info('🛫 sending postmessage', body)
    }
  }
}

export default self
