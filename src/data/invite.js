export default {

  privateSpaceStates () {
    return [
      {
        type: 'group',
        friendlyName: 'Invite to Group',
        description: 'Group members can edit all group spaces.'
      },
      {
        type: 'edit',
        friendlyName: 'Invite to Edit Space',
        description: 'Anyone with the link can edit this space and become a collaborator.'
      },
      {
        type: 'read',
        friendlyName: 'Invite to View Only',
        description: 'Anyone with the link can view this space. No account is needed.'
      }
    ]
  },
  publicSpaceStates () {
    return [
      {
        type: 'group',
        friendlyName: 'Invite to Group',
        description: 'Group members can edit all group spaces.'
      },
      {
        type: 'edit',
        friendlyName: 'Invite to Edit Space',
        description: 'Anyone with the link can edit this space and become a collaborator.'
      },
      {
        type: 'read',
        friendlyName: 'Share Public URL',
        description: 'Anyone with the URL can view this space because it is public.'
      }
    ]
  }

}
