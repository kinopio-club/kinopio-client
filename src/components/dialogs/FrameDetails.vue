// copy results-list component formatting from ConnectionDetails,

// pass props from carddetails
// {id and name} that frames reference is specified on Card (common parent), or in a seperate json file or /Store file w hardcoded values
// currentSpace/cards have a new property , frameId

// 'frames' button has 'new' or 'updated'
// based on new property currentUser.latestFrameIdSeen (exact name should be close to the latest newstuff seen one)

// if prop is undefined/false
  // src is 'new'
// else if prop is < latestFrame id number
  //, then src is 'updated'
// else
  // blank (no image or img-margin,etc. displayed in 'frames' button)

// ALSO remove latest mood from new stuff? (it's fun but kinda jank and not really part of the job to be done for this component and adds noise and hierarchical complexity)
