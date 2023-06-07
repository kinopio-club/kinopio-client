export default {
  send (context, body) {
    // https://www.notion.so/kinopio/JS-Bridge-Documentation-35ab7038df63439592b525b918d3acfa
    const shouldSendPostmessages = window.navigator.isSecureAppContext
    if (!window.webkit) { return }
    try {
      console.log('🛫 sending postmessage', body)
      const value = body.value || ''
      window.webkit.messageHandlers[body.name].postMessage(value)
    } catch (error) {
      console.error(error)
    }
  }
}

// X onLogout: createHandler('onLogout'),
// X setApiKey: createHandler('setApiKey'), {apiKey}
// X setBackgroundColor: createHandler('setBackgroundColor'), {color}

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
