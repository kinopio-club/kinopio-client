export default {

  states () {
    return [
      {
        name: 'open',
        description: 'Everyone can view and edit',
        color: 'success',
        icon: 'open'
      },
      {
        name: 'closed',
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
