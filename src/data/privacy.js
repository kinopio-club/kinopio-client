export default {

  states () {
    return [
      {
        name: 'open',
        friendlyName: 'Open to All',
        description: 'Anyone can view and add cards',
        color: 'success',
        icon: 'open'
      },
      {
        name: 'closed',
        shortName: 'public',
        friendlyName: 'Public Read Only',
        description: 'Anyone can view, only you and collaborators can edit',
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
