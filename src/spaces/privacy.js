export default {

  states () {
    return [
      // {
      //   name: 'open',
      //   shortDescription: 'anyone can add',
      //   longDescription: 'everyone can view and edit',
      //   everyone: 'everyone can view and edit',
      //   collaborators: ''
      //   color: 'success'
      // },
      {
        name: 'closed',
        // shortDescription: 'only you can add', // only collaborators can add
        // everyone: 'everyone can view',
        // collaborators: 'and only you can edit',
        description: 'everyone can view and only you can edit', // only you and your collaborators
        color: 'info'
      },
      {
        name: 'private',
        // shortDescription: 'only you can view', // only collaborators can add
        description: 'only you can view and edit', // only you and your collaborators
        // everyone: 'only you can view and edit',
        // collaborators: ''
        color: 'danger'
      }
    ]
  }

}
