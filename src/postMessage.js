// https://www.notion.so/kinopio/JS-Bridge-Documentation-35ab7038df63439592b525b918d3acfa

import utils from '@/utils.js'

export default {
  send (body) {
    const shouldSendPostmessages = window.navigator.isSecureAppContext
    if (!window.webkit) { return }
    try {
      console.log('🛫 sending postmessage', body)
      const value = body.value || ''
      window.webkit.messageHandlers[body.name].postMessage(value)
    } catch (error) {
      console.error(error)
    }
  },
  sendHaptics (body) {
    // ??add user preference here to disable haptics??
    const name = utils.capitalizeFirstLetter(body.name)
    body.name = `on${name}Feedback`
    this.send(body)
  },
  sendLightHaptics () {
    this.sendHaptics({ name: 'lightImpact' })
  }
}

// // Haptic Feedback

// import postMessage from '@/postMessage.js'
// postMessage.sendHaptics({ name: 'soft' })

// X  on SoftImpact Feedback: painting locked, item drag start locked
// X on Selection Feedback: when painting/box-selecting over items
// X on MediumImpact Feedback: x card details/ x connection details/ x box details/x multiactions is open,

// on LightImpact Feedback: click list item (eg spacedetails -> spacelist), clicking any <button, label btn> , clicking button-badge
//
// .results-list li
// .button-badge
// button, label

// postMessage.sendLightHaptics()

// for notifications
// on Success Feedback:
// on Warning Feedback:
// on Error Feedback:

// unused

// onHeavyImpactFeedback
// on RigidImpact Feedback:
