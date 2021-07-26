export default {

  states () {
    return [
      {
        name: 'open',
        description: 'Everyone can view and add cards',
        color: 'success',
        icon: 'open'
      },
      {
        name: 'closed',
        friendlyName: 'Public Read Only',
        description: 'everyone can view, only you and collaborators can edit',
        color: 'info',
        icon: 'unlock'
      },
      {
        name: 'private',
        description: 'only you and collaborators can view and edit',
        color: 'danger',
        icon: 'lock'
      }
    ]
  }

}
