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
        friendlyName: 'Invite to Edit',
        description: 'Anyone with the link can edit this space and become a collaborator.'
        // ppl will become
      },
      {
        type: 'read',
        friendlyName: 'Invite to View Only',
        description: 'Anyone with the link can view this space. No account is needed.'
      }
    ]
  }

}
