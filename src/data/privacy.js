export default {

  states () {
    return [
      {
        name: 'open',
        friendlyName: 'Open to Comments',
        description: 'Anyone can view and add comments, only collaborators can edit',
        descriptionTeam: 'Anyone can view and add comments, only team members and collaborators can edit',
        color: 'success',
        icon: 'open'
      },
      {
        name: 'closed',
        shortName: 'public',
        friendlyName: 'Public Read Only',
        description: 'Anyone can view, only collaborators can edit',
        descriptionTeam: 'Anyone can view, only team members and collaborators can edit',
        color: 'info',
        icon: 'unlock'
      },
      {
        name: 'private',
        description: 'Only collaborators can view and edit',
        descriptionTeam: 'Only team members and collaborators can view and edit',
        color: 'danger',
        icon: 'lock'
      }
    ]
  }

}
