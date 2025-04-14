export default {

  states () {
    return [
      {
        name: 'open',
        friendlyName: 'Open to Comments',
        description: 'Anyone can view and add comments. Only collaborators can edit.',
        descriptionGroup: 'Anyone can view and add comments. Only group members and collaborators can edit.',
        color: 'success',
        icon: 'comment'
      },
      {
        name: 'closed',
        shortName: 'public',
        friendlyName: 'Public Read Only',
        description: 'Anyone can view. Only collaborators can edit.',
        descriptionGroup: 'Anyone can view. Only group members and collaborators can edit.',
        color: 'info',
        icon: 'unlock'
      },
      {
        name: 'private',
        friendlyName: 'Private',
        description: 'Only collaborators can view and edit.',
        descriptionGroup: 'Only group members and collaborators can view and edit.',
        color: 'danger',
        icon: 'lock'
      },
      {
        name: 'local-only',
        friendlyName: 'Local Only',
        description: 'Only you can view and edit. Does not sync.',
        descriptionGroup: 'Only you can view and edit. Does not sync.',
        color: 'secondary',
        icon: 'local'
      }

    ]
  }

}
