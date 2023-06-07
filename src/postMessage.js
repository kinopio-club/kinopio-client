// https://www.notion.so/kinopio/JS-Bridge-Documentation-35ab7038df63439592b525b918d3acfa

import utils from '@/utils.js'

export default {
  send (context, body) {
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

  sendHaptics (context, body) {
    // ??add user preference here to disable haptics??
    const name = utils.capitalizeFirstLetter(body.name)
    body.name = `on${name}Feedback`
    // if (body.name === 'rigid' || body.name === 'soft') {
    //   body.value = '0.75'
    // }
    context.dispatch('send', body)
  }

}

// // Haptic Feedback

// X  on SoftImpact Feedback: painting locked, item drag start locked

// on Selection Feedback: when painting/box-selecting over items

// on MediumImpact Feedback: card details/connection details/box details/multiactions is open or closed,

// on LightImpact Feedback: click list item (eg spacedetails -> spacelist), clicking any <button, label btn>

// for notifications
// on Success Feedback:
// on Warning Feedback:
// on Error Feedback:

// unused

// onHeavyImpactFeedback
// on RigidImpact Feedback:
