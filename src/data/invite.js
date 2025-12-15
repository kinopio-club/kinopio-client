export default {

  states () {
    return [
      {
        type: 'group',
        friendlyName: 'Invite to Group',
        description: 'Group members can edit all group spaces.'
      },
      {
        type: 'edit',
        friendlyName: 'Invite to Collaborate',
        description: 'Collaborators can edit this space.'
      },
      {
        type: 'read',
        friendlyName: 'Invite to Read Only',
        description: ''
      }
    ]
  }

}
