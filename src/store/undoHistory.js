let history = [] // [new → old]

const shouldAddUndo = (operation) => {
  const { body, name } = operation
  console.log('♥️', body, name, operation)
  if (name === 'updateCard') {
    // const keys = [name, x, y]
    // Object.keys(body) included in keys
    return true
  } // else if
}

const self = {
  namespaced: true,
  actions: {
    add: (context, operations) => {
      const max = 30
      operations = operations.filter(operation => shouldAddUndo(operation))
      operations.forEach(operation => history.unshift(operation))
      history = history.slice(0, max)

      console.log('😈', operations, history)
    },
    clear: (context) => {
      history = []
    },

    redo: (context) => {
      console.log('▶️TEMP', history)
      // const operation = history.shift()

      // if operation name === 'updateCard'
      // also update cardmap, and connected paths, ?restore urls

      // let cardIds = []
      // temp disable playback
      // operations.forEach(operation => {
      //   let origin = `currentSpace/${operation.name}`
      //   if (operation.origin) {
      //     origin = operation.origin
      //   }
      //   context.dispatch(origin, operation.body, { root: true })
      //   const isCard = operation.name === 'updateCard'
      //   const cardExists = Boolean(document.querySelector(`article [data-card-id="${operation.body.id}"]`))
      //   if (isCard && cardExists) {
      //     cardIds.push(operation.body.id)
      //   }
      // })
      // cardIds = uniq(cardIds)
      // cardIds.forEach(cardId => {
      //   context.dispatch('currentConnections/updatePaths', { cardId }, { root: true })
      // })
    }
  }
}

export default self
