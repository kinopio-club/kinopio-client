export default {

  states () {
    return [
      {
        name: 'open',
        description: 'Everyone can edit',
        color: 'success'
      },
      {
        name: 'closed',
        description: 'everyone can view, only you and collaborators can edit',
        color: 'info'
      },
      {
        name: 'private',
        description: 'only you and collaborators can view and edit',
        color: 'danger'
      }
    ]
  }

}
