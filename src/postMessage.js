// import utils from '@/utils.js'
// import uniq from 'lodash-es/uniq'

export default {
  send (context, body) {
    const shouldSendPostmessages = window.navigator.isSecureAppContext
    if (!window.webkit) { return }
    try {
      console.log('🛫 sending postmessage', body)
      window.webkit.messageHandlers[body.name].postMessage(body)
    } catch (error) {
      console.error(error)
    }
  }
}

// onLogout: createHandler('onLogout'),
// X setApiKey: createHandler('setApiKey'),
// setBackgroundColor: createHandler('setBackgroundColor'),

// // Haptic Feedback
// onSelectionFeedback: createHandler('onSelectionFeedback'),
// onRigidImpactFeedback: createHandler('onRigidImpactFeedback'),
// onSoftImpactFeedback: createHandler('onSoftImpactFeedback'),
// onLightImpactFeedback: createHandler('onLightImpactFeedback'),
// onMediumImpactFeedback: createHandler('onMediumImpactFeedback'),
// onHeavyImpactFeedback: createHandler('onHeavyImpactFeedback'),
// onSuccessFeedback: createHandler('onSuccessFeedback'),
// onWarningFeedback: createHandler('onWarningFeedback'),
// onErrorFeedback: createHandler('onErrorFeedback'),
