The Kinopio API is used to find, save, and update the spaces of signed up users. You can use it to make your own integrations and tools.

<div class="table-wrap all">

Base Path for All Routes | Description
--- | --- 
<code class="all">`https://api.kinopio.club`</code> | Confirm that the API server is online

</div>

-----

## Authentication

You can auth requests with either your user or an app api key, both can be found in `User → Settings → Account → API`.

API Key Type | Header | Permissions | Description
--- | --- | --- | ---
App API Key | `App-Authorization` | Scope is either `user`, `read`, `edit`, or `delete` | For projects, apps, and integrations
User API Key | `Authorization` | Root, be careful | For legacy projects

App API Key Scopes | Description
--- | ---
`user` | Can only read <a href="#users" class="badge button-badge users">User</a> data
`read` | Can read content (<a href="#users" class="badge button-badge users">User</a>, <a href="#spaces" class="badge button-badge spaces">Spaces</a>, <a href="#cards" class="badge button-badge cards">Cards</a>, etc.)
`edit` | Can read and edit content
`delete` | Can read, edit, and delete content

<p class="badge danger"><img class="icon key" src="@/assets/key.svg"/> API Keys are secrets, so be sure to keep them safe. For safety, prefer keys with the narrowest scope possible.</p>

-----

## Rate Limits

The API is limited to 5 requests per second. If you exceed this rate, you will receive a `429` response and will need to wait 30 seconds before subsequent requests will succeed.

-----

<section class="section-wrap users">
<a class="anchor" data-section="👯‍♀️" name="users"></a>
<h2 class="badge users">Users</h2>

Users are representations of any account on Kinopio. Users are created by the server when they sign up.

<h3 class="badge users">User Routes</h3>

<div class="table-wrap users routes-table-wrap">

Method | Path | Description | Scope
--- | --- | --- | ---
`GET`   | <code class="users">/user/public/:userId</code>         | Gets public info on a user                                                                                                                                | —
`GET`   | <code class="users">/user/public/explore-spaces/:userId</code>   | The a list of spaces with `showInExplore: true` created by the user                                                          | —
`GET`   | <code class="users">/user/hidden-spaces</code>          | Get hidden spaces for the authenticating user                                                         | `read`
`GET`   | <code class="users">/user/public/multiple?userIds=id1,id2</code>        | Gets public info for multiple userIds, up to 60 userIds at a time                                      | —
`GET`   | <code class="users">/user</code>                        | Get all info on the authenticating user                                                                                                                   | `user`
`GET`   | <code class="users">/user/favorite-spaces</code>        | Get favorite spaces for the authenticating user. Favorited spaces which have unread updates will have `isEdited: true`                      | `read`
`GET`   | <code class="users">/user/favorite-users</code>         | Get favorite users for the authenticating user                                                          | `read`
`GET`   | <code class="users">/user/favorite-colors</code>        | Get favorite colors for the authenticating user                                                         | `read`
`GET`   | <code class="users">/user/spaces</code>                 | Get a list of the user's <a href="#spaces" class="badge button-badge spaces">Spaces</a>. Use `/user/group-spaces` for spaces created by other members of groups they belong to           | `read`
`GET`   | <code class="users">/user/groups</code>                 | Get a list of the user's groups. Their role in each group (`member` or `admin`) is inside the `groupUser` object                                    | `read`
`GET`   | <code class="users">/user/group-spaces</code>           | Get a list of the user's group <a href="#spaces" class="badge button-badge spaces">Spaces</a> created by other members of groups they belong to                                          | `read`
`GET`   | <code class="users">/user/template-spaces</code>        | Get a list of the user's template <a href="#spaces" class="badge button-badge spaces">Spaces</a>. These include template spaces you made or are a collaborator in                        | `read`
`GET`   | <code class="users">/user/removed-spaces</code>         | Get <a href="#spaces" class="badge button-badge spaces">Spaces</a> removed by the authenticating user                                                                  | `read`
`GET`   | <code class="users">/user/inbox-space</code>            | Get info on the user's `Inbox` space. whether a space is an inbox or not is based on name only, so it's possible to have multiple `Inbox` spaces, but only one the most recently updated Inbox will be returned | `read`
`GET`   | <code class="users">/user/tags</code>                   | Get a list of the last edited <a href="#tags" class="badge button-badge tags">Tags</a> in your spaces                                                                  | `read`
`GET`   | <code class="users">/user/todos</code>                  | Get todo cards and boxes (item names start with `[]`, `[ ]`, or `[x]`), grouped by space                                                                            | `read`
`PATCH` | <code class="users">/user</code>                        | Update the user based on an object body with updated user attributes. You can't patch `apiKey`, `password`, `emailIsVerified`, or `email`       | `edit`

</div>

<h3 class="badge users">User Attributes</h3>

<div class="table-wrap users attributes-table-wrap">

Name | Type | Description
--- | --- | ---
<code class="users">id</code>                               | `String`  | The unique ID of the user. Is not user updateable
<code class="users">apiKey</code>                           | `UUID`    | Used in Authentication headers to make API calls as the currentUser. Generated and returned only when user signs up or in. Is not user updateable
<code class="users">cardsCreatedCount</code>                | `Integer` | The number of cards the user has created if they're not a paid user, used to enforce the free user limit. Is not user updatable.
<code class="users">cardsCreatedCountRaw</code>                | `Integer` | Similar to `cardsCreatedCount` except the raw version increments even if your're a free user on a paid user space. This is a vanity metric and is not used to enforce free user limits.
<code class="users">cardSettingsDefaultCharacterLimit</code>            | `Integer` | The max number of characters you can enter in a card. Either 300 (default) or 4000 (max). Constrained character limits are meant to encourage using cards to represent single ideas. But this override exists for those who don't want that.
<code class="users">cardSettingsCardWrapWidth</code>               | `Integer` | Sets the maximum default length of a card before it starts wrapping on cards created by the user
<code class="users">cardSettingsShiftEnterShouldAddChildCard</code>   | `Boolean` | Sets whether shift-enter while editing a card creates a new-child (`true`) or a line break (`false`)
<code class="users">color</code>                            | `String`  | User color changes your paint stroke and default avatar color
<code class="users">createdAt</code>                        | `String`  | The date when the user was created
<code class="users">creditsEarned</code>                    | `Integer` | The number of $ credits earned by referring or inviting new users to Kinopio. Is not user updateable
<code class="users">creditsUsed</code>                      | `Integer` | The number of $ credits subtracted from your payments so far. Is not user updateable
<code class="users">defaultCardBackgroundColor</code>       | `String` | User preference for a default background color to use for new cards
<code class="users">defaultSpaceBackground</code>           | `String` | User preference for a default background url to use for new spaces. This becomes `null` if `defaultSpaceBackgroundGradient` is set.
<code class="users">defaultSpaceBackgroundGradient</code>   | `Object`   | User preference for the default background gradient to use for new spaces. This becomes `null` if `defaultSpaceBackground` is set.
<code class="users">defaultSpaceBackgroundTint</code>       | `String` | User preference for a default background color used to tint new spaces
<code class="users">defaultConnectionControlPoint</code>    | `String` | User preference for the default control point for new connections. `null` makes a curved path, `q00,00` makes a straight line
<code class="users">description</code>                      | `String`  | A description of this particular user
<code class="users">email</code>                            | `String`  | The unique email address of the user required to create an account
<code class="users">emailIsVerified</code>                  | `Boolean` | Whether the user has verified their email address
<code class="users">filterShowAbsoluteDates</code>          | `Boolean` | Whether card dates are displayed as absolute (false is default relative)
<code class="users">filterComments</code>                   | `Boolean` | Whether comment cards are hidden to the user
<code class="users">filterShowDateUpdated</code>            | `Boolean` | Whether the user has has toggled the card date filter
<code class="users">filterShowUsers</code>                  | `Boolean` | Whether the user has has toggled the card user filter
<code class="users">isAmbassador</code>                     | `Boolean` | Whether the user is in the [friends of kinopio](https://kinopio.club/friends-of-kinopio-ambassadors-YNmS6C3fofN3R9mYgO1Bu) affiliate program. Is not user updatable.
<code class="users">isDonor</code>                          | `Boolean` | Whether the user has donated to Kinopio. Is not user updatable.
<code class="users">isModerator</code>                      | `Boolean` | Whether the user is a moderator of the community forums or discord. Is not user updatable.
<code class="users">isDebugMode</code>                      | `Boolean` | Whether the user has debug mode enabled, which displays item ids and other attributes in the kinopio-client.
<code class="users">isUpgraded</code>                       | `Boolean` | Whether the user currently has a paid subscription. Is not user updatable.
<code class="users">lastReadNewStuffId</code>               | `String`  | The id of the last read article from the 'new stuff' newsfeed
<code class="users">lastUsedImagePickerService</code>       | `String`  | The user's last used image picker service, is either `stickers`, `gifs`, `bing`, `backgrounds`, `recent`, `ai`
<code class="users">lastSidebarSection</code>               | `String`  | The shortname of the sidebar section last viewed. Can be `stats`, `inbox`, `removed`, `links`, `favorites`, `history`, `minimap`, `tags`, `todos`, `note`. Defaults to `inbox`.
<code class="users">lastSpaceId</code>                      | `String`  | The spaceId of the last space edited. Used to return you to the same space the next time you visit kinopio.club
<code class="users">name</code>                             | `String`  | The unique name of the user. Is a url-safe string (no spaces or special characters) because it's also used for url slugs
<code class="users">prevHeaderFontId</code>                 | `Integer` | The id of the previous header font selected. Default value is `0` for Recoleta
<code class="users">prevInviteEmails</code>                 | `String` | The emails you last used when emailing space invites. Is private user info.
<code class="users">shouldEmailBulletin</code>              | `Boolean` | Whether the user has chosen to allow bulletin emails (default to true)
<code class="users">shouldEmailNotifications</code>         | `Boolean` | Whether the user has chosen to allow notification emails (default to true)
<code class="users">shouldEmailWeeklyReview</code>          | `Boolean` | Whether the user has chosen to allow weekly review emails (default to true)
<code class="users">shouldIncreaseUIContrast</code>         | `Boolean` | User preference for whether the header and footer buttons should not be translucent or transparent in any way
<code class="users">shouldUseLastConnectionColor</code>      | `Boolean` | Whether the user has chosen to use last connection color for new connections (default to true)
<code class="users">shouldShowMoreAlignOptions</code>       | `Boolean` | Whether the user has chosen to view more card position alignment and distribution options (default to true)
<code class="users">shouldShowCurrentSpaceTags</code>       | `Boolean` | Whether the user has chosen should only tags in the current space in the Tags dialog
<code class="users">shouldShowItemActions</code>            | `Boolean` | Whether extra card formatting options (h1, h2, etc.) buttons are visible in the card details dialog
<code class="users">shouldShowMultipleSelectedBoxActions</code>     | `Boolean` | Whether extra box formatting options (color, fill, etc.) buttons are visible in the multiple selected items dialog
<code class="users">shouldShowMultipleSelectedLineActions</code>    | `Boolean` | Whether extra connection formatting options (type, reverse, etc.) buttons are visible in the multiple selected items dialog
<code class="users">shouldShowMultipleSelectedListActions</code>    | `Boolean` | Whether extra list formatting options (color, etc.) buttons are visible in the multiple selected items dialog
<code class="users">shouldNotifyUnlockedStickyCards</code>  | `Boolean` | Whether to eventually notify users that they've unlocked sticky cards (true for new users only, triggered after they create 20 cards)
<code class="users">shouldPauseConnectionDirections</code>  | `Boolean` | User pereference for whether connection directions should be static, instead of animating along their connection path
<code class="users">shouldUseStickyCards</code>             | `Boolean` | User pereference for whether cards should stick to their mouse cursor
<code class="users">shouldShowMinimapJumpToList</code>      | `Boolean` | Whether the list of boxes to jump to is expanded in the Minimap dialog
<code class="users">showInExploreUpdatedAt</code>           | `String` | When the user last opened the Explore dialog. Used to determine new/unread Explore spaces
<code class="users">showItemActions</code>                  | `Boolean` | Whether the user has chosen to show expanded options and info in both the `card-details` and `multiple-selected-actions` dialogs
<code class="users">sidebarResizeWidth</code>              | `Integer` | Manually resized width of the sidebar dialog
<code class="users">groups</code>                             | `JSON Array` | The groups a user belongs to, including public metadata on the other `users` in each group
<code class="users">updatedAt</code>                        | `String`  | The date when any changes to the user was made. Also is updated whenever the user starts a Kinopio session
<code class="users">website</code>                          | `String`  | The user's website, url validity is not checked
<code class="users">prevSettingsSection</code>            | `String`  | The last used settings section. Can be `general`, `controls`, or `cards`
<code class="users">outsideSpaceBackgroundIsStatic</code>   | `Boolean` | User preference for whether the outside space area should use dynamically cycling colors, or whether it should be static grey
<code class="users">studentDiscountIsAvailable</code>       | `Boolean` | Whether the user is eligible for a student discount. Is not user updateable
<code class="users">shouldShowMinimap</code>                | `Boolean` | Whether the bottom-right minimap is persistently visible

</div>
</section>

------

<section class="section-wrap spaces">
<a class="anchor" data-section="🍓" name="spaces"></a>
<h2 class="badge spaces">Spaces</h2>

Spaces are where your <a href="#cards" class="badge button-badge cards">Cards</a> and <a href="#connections" class="badge button-badge connections">Connections</a> live.

<h3 class="badge spaces">Space Routes</h3>

<div class="table-wrap spaces routes-table-wrap">

Method | Path | Description | Scope
--- | --- | --- | ---
`GET`    | <code class="spaces">/space/:spaceId</code>              | Get info on a space by id. Use `?textOnly=true` for card names only                               | `read`
`GET`    | <code class="spaces">/space/:spaceId/public-meta</code>    | Get public space info on non-private spaces                                                     | —
`GET`    | <code class="spaces">/space/:spaceId/favorites</code>    | Get a list of users who have favorited the spaceId                                                | `read`
`GET`    | <code class="spaces">/space/:spaceId/feed.json</code>    | `RSS feed` for cards recently created or updated in a space. Use `?apiKey=` for private spaces    | —
`GET`    | <code class="spaces">/space/:spaceId/removed-cards</code> | Get <a href="#cards" class="badge button-badge cards">Cards</a> removed in a space                         | `read`
`GET`    | <code class="spaces">/space/explore-spaces</code>            | Get a list of recently updated public spaces which have been added to Explore. Sorted by date `showInExploreUpdatedAt` | —
`GET`    | <code class="spaces">/space/explore-spaces/feed.json</code>  | `RSS feed` for new spaces added to Explore                                                    | —
`GET`    | <code class="spaces">/space/live-spaces</code>           | Get a list of currently being edited spaces which are `open` or `closed` (Public Read Only)       | —
`GET`    | <code class="spaces">/space/multiple?spaceIds=id1,id2</code> | Get info on multiple spaces, up to 60 spaceIds at a time                                      | `read`
`GET`    | <code class="spaces">/space/public/multiple?spaceIds=id1,id2</code>        | Gets public info for multiple public spaces, up to 60 spaceIds at a time. | —
`GET`    | <code class="spaces">/space/inbox</code>         | Get the current user's inbox space                                                                        | `read`
`GET`    | <code class="spaces">/space/everyone-spaces</code>            | Get a list of recent public spaces sorted by date `createdAt`                               | —
`GET`    | <code class="spaces">/space/everyone-spaces/feed.json</code>  | `RSS feed` for recent public spaces                                                         | —
`GET`    | <code class="spaces">/space/date-image</code>        | Get the image url for today's date card image                                                         | —
`POST`   | <code class="spaces">/space</code>                       | Create a new space(s) from object(s) in request body. The owner will be the apiKey user           | `edit`
`POST`   | <code class="spaces">/space/search-explore-spaces</code>   | Get all `showInExplore` spaces based on space name. Body object must contain `query`. Searches are not case-insensitive           | —
`PATCH`  | <code class="spaces">/space</code>                       | Update space(s) from object(s) in request body                                                    | `edit`
`PATCH`  | <code class="spaces">/space/restore/:spaceId</code>               | Restore removed space(s)  from object(s) in request body                                          | `edit`
`DELETE` | <code class="spaces">/space</code>                       | Remove space(s) specified in request body                                                         | `delete`
`DELETE` | <code class="spaces">/space/permanent</code>             | Permanently remove space(s) specified in request body                                             | `delete`
`DELETE` | <code class="spaces">/space/collaborator</code>          | Removes collaborator user from space. Request Body Keys: `spaceId`, `userId`                      | `edit`

</div>

<h3 class="badge spaces">Space Attributes</h3>

<div class="table-wrap spaces attributes-table-wrap">

Name | Type | Description
--- | --- | ---
<code class="spaces">id</code>                  | `String`  | The unique ID of the space. Is not user updateable
<code class="spaces">background</code>          | `String`  | The image url used by the space background
<code class="spaces">backgroundIsGradient</code>  | `Boolean`  | Whether the space background uses `backgroundGradient` (instead of the default `background`)
<code class="spaces">backgroundGradient</code>  | `Object`    | An array of gradient layer data that's used to build the space background gradient. The gradients are layered and animated using the technique described by [Shelby Wilson](https://shelby.cool/#/gradients)
<code class="spaces">backgroundTint</code>      | `String`  | The background color used to tint the space background
<code class="spaces">boxes</code>               | `Array`   | A list of <a href="#boxes" class="badge button-badge boxes">Boxes</a> in the space
<code class="spaces">cards</code>               | `Array`   | A list of <a href="#cards" class="badge button-badge cards">Cards</a> in the space
<code class="spaces">collaboratorKey</code>     | `String`  | Used like an apikey to allow editing, but just for that space. allows anonymous users who aren't signed in to edit a space. You can rotate this key, but you should still treat it as a secret
<code class="spaces">collaborators</code>       | `Array`   | A list of users that can also edit the space
<code class="spaces">connections</code>         | `Array`   | A list of <a href="#connections" class="badge button-badge connections">Connections</a>
<code class="spaces">createdAt</code>           | `String`  | The date when the space was created
<code class="spaces">drawingImage</code>        | `String`  | The image url for drawings on the space. The image is regenerated on the server after each drawing stroke.
<code class="spaces">editedAt</code>            | `String`  | The date when card contents in the space was last added or changed
<code class="spaces">editedByUserId</code>      | `String`  | The user id of the last user who edited or created a card in the space
<code class="spaces">isFromTweet</code>         | `Boolean` | Whether the space was created by replying to a tweet with `@kinopioclub save`
<code class="spaces">isHidden</code>            | `Boolean` | Whether the space is hidden by the current user
<code class="spaces">isFavorite</code>          | `Boolean` | Whether the space is favorited by the current user
<code class="spaces">isRemoved</code>           | `Boolean` | Whether the space has been soft-removed. (can then be restored or permanently removed)
<code class="spaces">isRestrictedByModerator</code> | `Boolean` | Whether the space has been marked as restricted. Restricted spaces are not shown in Explore, Live, or in the Everyone feed. This value cannot be patched, it is set manually by a moderator only when necessary.
<code class="spaces">isTemplate</code>          | `Boolean` | Whether the space is a <a href="https://kinopio.club/help/posts/templates/">personal template</a>
<code class="spaces">lines</code>                | `Array`   | A list of the Line dividers in the space
<code class="spaces">lists</code>                | `Object`   | A list of the <a href="#lists" class="badge button-badge lists">Lists</a> in the space
<code class="spaces">moonPhase</code>           | `String`  | Name of the moonPhase icon representing when the space was created. Possible values are `new-moon`, `waxing-crescent`, `waxing-quarter`, `waxing-gibbous`, `full-moon`, `waning-gibbous`, `waning-quarter`, `waning-crescent`
<code class="spaces">name</code>                | `String`  | The name of the space
<code class="spaces">note</code>                | `String`  | The sidebar space note associated with the current user
<code class="spaces">ownerUserId</code>         | `String`  | The userId of the user who created the space. Used to create url slugs
<code class="spaces">originSpaceId</code>       | `String`  | If the space was created by duplicating another space, the origin space id is recorded
<code class="spaces">privacy</code>             | `String`  | Can be `open`, `closed`, `private`
<code class="spaces">removedByUserId</code>     | `String`  | The user who soft-removed the space. All space users can restore it via the API, but only the user who removed it will see it listed
<code class="spaces">previewImage</code>           | `String`  | URL for the large-sized preview jpg image associated with the space
<code class="spaces">previewThumbnailImage</code>  | `String`  | URL for the thumbnail-sized preview jpg image associated with the space
<code class="spaces">previewImagePrivate</code>           | `String`  | Same as `previewImage`, except images in cards are not rendered. This is used for private space unfurling.
<code class="spaces">previewThumbnailImagePrivate</code>  | `String`  | Same as `previewImageThumbnail`, except images in cards are not rendered. This is used for private space unfurling.
<code class="spaces">url</code>                 | `String`  | The url of a space is determined by its `name` and `id`. For example, `kinopio.club/:space-name-:id`
<code class="spaces">users</code>               | `Array`   | The user who created/owns the space (a space will always have only one user)
<code class="spaces">showInExplore</code>       | `Boolean` | Whether the space is shown in explore
<code class="spaces">tags</code>                | `Array`   | A list of <a href="#tags" class="badge button-badge tags">Tags</a>
<code class="spaces">group</code>                | `Object`   | Information on the group that a space belongs to (if any), including public metadata on the other group `users`
<code class="spaces">groupId</code>              | `String` | The group id that the space belongs to. A space can only belong to one group.
<code class="spaces">addedTogroupByUserId</code> | `String` | The user who added the space to the group
<code class="spaces">updatedAt</code>           | `String`  | The date when any changes in the space were made including a member visiting it
<code class="spaces">visits</code>              | `Integer` | The number of times the space has been loaded by a person
<code class="spaces">readOnlyKey</code>         | `String`  | Similar to `collaboratorKey` but only allows users and non-signed-in users to read a private space

</div>
</section>

------

<section class="section-wrap cards">
<a class="anchor" data-section="🎑" name="cards"></a>
<h2 class="badge cards">Cards</h2>

Cards are the building blocks of <a href="#spaces" class="badge spaces">Spaces</a>. They have `x`, `y`, and `z` positions, `height`, `width`, and a `name`.

<h3 class="badge cards">Cards Routes</h3>

<div class="table-wrap cards routes-table-wrap">

Method | Path | Description | Scope
--- | --- | --- | ---
`GET`     | <code class="cards">/card/:cardId</code>                | Get info on a card                                                                                                                                                                  | `read`
`GET`     | <code class="cards">/card/multiple?cardIds=id1,id2</code> | Get info on multiple cards, up to 60 cardIds at a time                                                                                                                    | `read`
`GET`     | <code class="cards">/card/by-tag-name/:tagName</code>   | Get all cards with tag matching tagName in your <a href="#spaces" class="badge button-badge spaces">Spaces</a>                                                                                   | `read`
`GET`     | <code class="cards">/card/by-link-to-space/:spaceId</code>   | Get the cards and <a href="#spaces" class="badge button-badge spaces">Spaces</a> where `linkToSpaceId` is `spaceId`. Will only return spaces that the user can view                         | `read`
`POST`    | <code class="cards">/card/search</code>                 | Get all cards that match a query. Body object must contain `query`. Only matches cards created by the user. Does not return removed cards, or cards from removed spaces. Searches are not case-insensitive                                       | `read`
`POST`    | <code class="cards">/card</code>                        | Create card from object in request body. Body object must contain `spaceId` and `name`. If not included, `x`, `y`, `z` will be positioned near the top left of the space, in a cascade pattern to prevent overlaps | `edit`
`POST`    | <code class="cards">/card/to-inbox</code>               | Create card saved to the user's `Inbox` space from object in request body and . Body object must contain `name`. Will return `404` if the user does not already have an `Inbox` space. Positioning works just like `POST /card`        | `edit`
`POST`    | <code class="cards">/card/multiple</code>               | Creates multiple cards from an array of objects in request body. Works just like `POST /card`                                                                                | `edit`
`PATCH`    | <code class="cards">/card/list</code>                   | Add card to a <a href="#lists" class="badge button-badge lists">List</a> specified in request body. Body object must contain card `id`, and `listId`. If body object has `shouldPrepend: true`, the card will be added to the top of the list     | `edit`
`PATCH`   | <code class="cards">/card</code>                        | Update card from object in request body. Body object must contain `id`. `spaceId` cannot be patched                                                                          | `edit`
`PATCH`   | <code class="cards">/card/multiple</code>               | Updates multiple cards from an array of objects in request body. Works just like `PATCH /card`                                                                               | `edit`
`PATCH`   | <code class="cards">/card/update-counter</code>         | Increment or decrement a card counter for voting. Body object must contain `cardId`, and either `shouldIncrement: true` or `shouldDecrement: true`              | `edit`
`PATCH`   | <code class="cards">/card/restore</code>                | Restore removed card specified in body                                                                                                                                              | `edit`
`DELETE`  | <code class="cards">/card/list</code>                   | Remove card from the <a href="#lists" class="badge button-badge lists">List</a> that it's in. Body object must contain card `id`. The card's position will be shifted to the right of the list.                                       | `edit`
`DELETE`  | <code class="cards">/card</code>                        | Remove card specified in body                                                                                                                                                       | `delete`
`DELETE`  | <code class="cards">/card/permanent</code>              | Permanently remove card specified in body                                                                                                                                           | `delete`

</div>

<h3 class="badge cards">Card Attributes</h3>

<div class="table-wrap cards attributes-table-wrap">

Name | Type | Description
--- | --- | ---
<code class="cards">id</code>                       | `String`  | The unique ID of the card. Is not user updateable
<code class="cards">backgroundColor</code>          | `String`  | The background color for the card
<code class="cards">createdAt</code>                | `String`  | The date when the card was created
<code class="cards">codeBlockLanguage</code>        | `String`  | Code language syntax highlighting to use for markdown <code>```</code> code blocks
<code class="cards">counterIsVisible</code>         | `Boolean`  | Whether the card counter for voting is visible
<code class="cards">counterValue</code>             | `Integer`  | The incremented number of the card counter. Default value is `0`
<code class="cards">frameId</code>                  | `Integer`  | The id of type of frame applied to the card, if any
<code class="cards">headerFontId</code>             | `Integer`  | An id representing the card's header font. Default value is `0` for Recoletta
<code class="cards">headerFontSize</code>       | `String`  | The header font size of the card. Can be either `s`(small-size, default), `m`(medium-size), or `l`(large-size)
<code class="cards">height</code>                  | `String`  | The reference height of the card. Used to generate space preview images
<code class="cards">isCreatedThroughPublicApi</code>      | `Boolean` | Whether the card was created through the public API. Cards that created through `POST /card/` will automatically receive this attribute
<code class="cards">isComment</code>                    | `Boolean` | Whether the card is a comment (an alternative to the `((comment))` name syntax)
<code class="cards">isLocked</code>                 | `Boolean` | Whether the card is locked and cannot be selected or edited in the client unless unlocked
<code class="cards">isRemoved</code>                | `Boolean` | Whether the card has been soft-removed. (Can be restored or permanently removed by space users)
<code class="cards">isTodo</code>                   | `Boolean` | Whether the card has a checkbox (either completed `[x]` or uncompleted `[]`)
<code class="cards">linkToSpaceId</code>              | `String`  | The `spaceId` linked to in the card name
<code class="cards">linkToCardId</code>               | `String`  | The `cardId` linked to in the card name. A card link will always also include `linkToSpaceId` (but not vice versa)
<code class="cards">linkToSpaceCollaboratorKey</code> | `String`  | The `collaboratorKey` used to invite someone to the space specified in `linkToSpaceId`. Indicates the the space has a space invite link
<code class="cards">maxWidth</code>         | `Boolean` | Sets the default maximum width before cards text starts wrapping
<code class="cards">name</code>                       | `String`  | The name of the card is its main text. Limited to 4000 characters
<code class="cards">nameUpdatedAt</code>            | `String`  | The date when the card name was last updated
<code class="cards">nameUpdatedByUserId</code>      | `String`  | The user id that last updated the name of the card
<code class="cards">resizeWidth</code>              | `Integer` | The width of a card that's been manually resized by the user
<code class="cards">shouldHideUrlPreviewImage</code>    | `Boolean` | Whether the card will display it's url preview image
<code class="cards">shouldHideUrlPreviewInfo</code>     | `Boolean` | Whether the card will display it's url preview title and description
<code class="cards">shouldUpdateUrlPreview</code>       | `Boolean` | Whether the card should be checked for a url preview the next time it's space is loaded in the kinopio-client app. This attribute is automatically assigned to cards created by /card POSTs
<code class="cards">spaceId</code>                  | `String`  | The space that the card belongs to
<code class="cards">tilt</code>                     | `Integer`  | The amount a card is rotated in degrees. Default value is `0`
<code class="cards">updatedAt</code>                | `String`  | The date when any changes in the card was made, including to it's position. Use `nameUpdatedAt` instead to see when the card name was changed
<code class="cards">urlIsVisible</code>             | `Boolean`  | Whether the url string is displayed on the card
<code class="cards">urlPreviewDescription</code>    | `String`  | The description displayed in the line of the url preview. Because most sites stuff their description tags with SEO gibberish, descriptions are only displayed for whitelisted domains. Contact support to add a domain to the whitelist.
<code class="cards">urlPreviewErrorUrl</code>       | `String`  | The last url that the preview failed on (could be a private or broken url). If this matches `urlPreviewUrl`, the url preview won't be created
<code class="cards">urlPreviewFavicon</code>        | `String`  | The url for the url preview favicon image
<code class="cards">urlPreviewImage</code>          | `String`  | The url for the url preview image
<code class="cards">urlPreviewIsVisible</code>      | `Boolean` | Whether the card will display a url preview (aka link unfurl)
<code class="cards">urlPreviewTitle</code>          | `String`  | The title displayed in the url preview
<code class="cards">urlPreviewUrl</code>            | `String`  | The url that the card url preview is based on
<code class="cards">urlPreviewEmbedHtml</code>            | `String`  | `DEPRECATED` html embed code returned by iframely. Used to display url previews when available (like youtube videos). Html containing `<script>` tags is run inside an iframe.
<code class="cards">urlPreviewIframeUrl</code>            | `String`  | Iframe url returned by iframely. Used to display url previews when available (like youtube videos). Cannot be patched.
<code class="cards">videoIsPaused</code>                | `Boolean` | Whether video file (mp4) playback in a card will be paused
<code class="cards">width</code>                  | `String`  | The reference width of the card. Used to generate space preview images
<code class="cards">x</code>                        | `Integer` | The x-axis position
<code class="cards">y</code>                        | `Integer` | The y-axis position
<code class="cards">z</code>                        | `Integer` | The z-axis position

</div>
</section>

------

<section class="section-wrap connections">
<a class="anchor" data-section="🍆" name="connections"></a>
<h2 class="badge connections">Connections</h2>

Connections are lines that visually connect a `startItemId` to an `endItemId`.

<h3 class="badge connections">Connection Routes</h3>

<div class="table-wrap connections routes-table-wrap">

Method | Path | Description | Scope
--- | --- | --- | ---
`GET`     | <code class="connections">/connection/<br/>:connectionId</code> | Get info on a connection                                                                                    | `read`
`POST`    | <code class="connections">/connection</code>                    | Create connection(s) from object in request body. Object must contain `spaceId` and `color`                 | `edit`
`PATCH`   | <code class="connections">/connection</code>                    | Update connection(s) from object in request body. `spaceId` cannot be patched.                              | `edit`
`DELETE`  | <code class="connections">/connection</code>                    | Permenently remove connection(s) speced in req body                                                         | `delete`

</div>

<h3 class="badge connections">Connection Attributes</h3>

<div class="table-wrap connections attributes-table-wrap">

Name | Type | Description
--- | --- | ---
<code class="connections">id</code>                | `String` | The unique ID of the connection. Is not user updateable
<code class="connections">color</code>             | `String` | The connection color
<code class="connections">controlPoint</code>      | `String` | Custom control point for a connection path curve. `q00,00` makes a straight line
<code class="connections">createdAt</code>         | `String`  | The date when the connection was created
<code class="connections">directionIsVisible</code>   | `Boolean` | The connection has a directional arrow, in the direction of start card to end card
<code class="connections">endItemId</code>         | `String` | The card or box that the connection line ends at
<code class="connections">labelIsVisible</code>    | `Boolean` | The connection has a connection label
<code class="connections">labelRelativePositionX</code>    | `Float` | Label's `horizontal` position relative to the DOM box of it's parent connection. Is between `0` (max left) and `1` (max right). Default is `0.5` (middle)
<code class="connections">labelRelativePositionY</code>    | `Float` | Label's `vertical` position relative to the DOM box of it's parent connection. Is between `0` (max top) and `1` (max bottom). Default is `0.5` (middle)
<code class="connections">name</code>              | `String` | The connection name, is displayed if `labelIsVisible`
<code class="connections">path</code>              | `String` | <a href="https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths">SVG path</a> that defines the connection line and its curve, e.g. 'm524,138 q90,40 49,123' is a quadratic bezier curve made up of origin XY, control point XY, and end XY points.
<code class="connections">point1Cardinal</code>    | `String` | The cardinal direction used to connect to the `startItem`. Possible values are `north`, `south`, `west`, `east`, `northEast`, `southEast`, `southWest`, `northWest`.
<code class="connections">point2Cardinal</code>    | `String` | Same as `point1Cardinal`, but for connecting to the `endItem`
<code class="connections">spaceId</code>           | `String` | The space that the connection belongs to
<code class="connections">startItemId</code>       | `String` | The card or box that the connection line starts from
<code class="connections">updatedAt</code>         | `String`  | The date when any changes to the connection were made

</div>
</section>

------

<section class="section-wrap boxes">
<a class="anchor" data-section="🍱" name="boxes"></a>
<h2 class="badge boxes">Boxes</h2>

Boxes are items used by users to contain or organize cards in a space. They can be named, colored, and positioned

<h3 class="badge boxes">Box Routes</h3>

<div class="table-wrap boxes routes-table-wrap">

Method | Path | Description | Scope
--- | --- | --- | ---
`GET`     | <code class="boxes">/box/:boxId</code>  | Get info on a box                                                         | `read`
`POST`    | <code class="boxes">/box</code>         | Create a box from object in request body. Object must contain `spaceId`   | `edit`
`PATCH`   | <code class="boxes">/box</code>         | Update box from object in request body                                    | `edit`
`DELETE`  | <code class="boxes">/box</code>         | Permenently remove box, from object in request body                       | `delete`

</div>

<h3 class="badge boxes">Box Attributes</h3>

<div class="table-wrap boxes attributes-table-wrap">

Name | Type | Description
--- | --- | ---
<code class="boxes">id</code>             | `String` | The unique ID of the connection. Is not user updateable
<code class="boxes">background</code>     | `String`  | The image url used by the box background
<code class="boxes">backgroundIsStretch</code>     | `Boolean`  | Whether the box background image is stretched (default is `false`, to display images tiled)
<code class="boxes">color</code>          | `String` | The color of the box
<code class="boxes">createdAt</code>      | `String`  | The date when the box was created
<code class="boxes">headerFontId</code>   | `Integer`  | An id representing the header font of the box. Default value is `0` for Recoletta. Similar to `card.headerFontId`
<code class="boxes">headerFontSize</code> | `String`  | The header font size of the box. Can be either `s`(small-size, default), `m`(medium-size), or `l`(large-size). Similar to `card.headerFontSize`
<code class="boxes">infoHeight</code>     | `String`  | The reference height of the box info area. Used to generate space preview images
<code class="boxes">infoWidth</code>      | `String`  | The reference width of the box info area. Used to generate space preview images
<code class="boxes">isLocked</code>       | `Boolean` | Whether the box is locked and cannot be selected or edited in the client unless unlocked
<code class="boxes">isTodo</code>         | `Boolean` | Whether the box has a checkbox (either completed `[x]` or uncompleted `[]`)
<code class="boxes">fill</code>           | `String` | The fill type for the box. Possible values are `filled`, `empty`
<code class="boxes">name</code>           | `String` | The name of the box
<code class="boxes">resizeHeight</code>   | `String` | The height of the box
<code class="boxes">resizeWidth</code>    | `String` | The width of the box
<code class="boxes">spaceId</code>        | `String` | The space that the box belongs to
<code class="boxes">userId</code>         | `String` | The user that created the box
<code class="boxes">updatedAt</code>      | `String`  | The date when any changes were made to the box
<code class="boxes">x</code>              | `Integer` | The x-axis position of the box origin (top-left point)
<code class="boxes">y</code>              | `Integer` | The y-axis position of the box origin
<code class="boxes">z</code>              | `Integer` | The z-axis position

</div>
</section>

------

<section class="section-wrap lists">
<a class="anchor" data-section="🍱" name="lists"></a>
<h2 class="badge lists">Lists</h2>

Lists are items used by users to vertically contain and organize <a href="#cards" class="badge button-badge cards">Cards</a>in a space. They can be named, colored, and positioned. Cards that belong to lists have a `listId`, and `listPositionIndex`.

<h3 class="badge lists">List Routes</h3>

<div class="table-wrap lists routes-table-wrap">

Method | Path | Description | Scope
--- | --- | --- | ---
`GET`     | <code class="lists">/list/:listId</code>    | Get info on a list, including cards                                                             | `read`
`POST`    | <code class="lists">/list</code>            | Create a list from object in request body. Body object must contain `spaceId`                   | `edit`
`PATCH`   | <code class="lists">/list</code>            | Update list from object in request body. Body object must contain `id` and `spaceId`            | `edit`

</div>

<h3 class="badge lists">List Attributes</h3>

<div class="table-wrap lists attributes-table-wrap">

Name | Type | Description
--- | --- | ---
<code class="lists">id</code>                                         | `String` | The unique ID of the list. Is not user updateable
<code class="lists">color</code>                                      | `String` | The color of the list
<code class="lists">createdAt</code>                                  | `String`  | The date when the list was created
<code class="lists">name</code>                                       | `String` | The name of the list
<code class="lists">height</code>                                     | `String` | The rendered height of the list
<code class="lists">frameId</code>                                    | `Integer`  | The id of type of frame applied to the list, if any
<code class="lists">resizeWidth</code>                                | `String` | The width of the list
<code class="lists">shouldUpdateList</code>                           | `Boolean` | Whether the list dimensions, and the positions of the cards inside it, should be updated the next time the space is loaded. This is set automatically when adding cards to a list via the API.
<code class="lists">spaceId</code>                                    | `String` | The space that the list belongs to
<code class="lists">userId</code>                                     | `String` | The user that created the list
<code class="lists">updatedAt</code>                                  | `String`  | The date when any changes were made to the list
<code class="lists">x</code>                                          | `Integer` | The x-axis position of the list origin (top-left point)
<code class="lists">y</code>                                          | `Integer` | The y-axis position of the list origin
<code class="lists">z</code>                                          | `Integer` | The z-axis position

</div>
</section>

------

<section class="section-wrap tags">
<a class="anchor" data-section="🦚" name="tags"></a>
<h2 class="badge tags">Tags</h2>

Each tag you add to a card is considered a seperate entity. So if you have multiple <a href="#cards" class="badge button-badge cards">Cards</a>which both have the tag `[[balloon]]` in their `name`, you'll have multiple tag objects named `'balloon'` with different cardIds.

<h3 class="badge tags">Tags Routes</h3>

<div class="table-wrap tags routes-table-wrap">

Method | Path | Description | Scope
--- | --- | --- | ---
`GET`     | <code class="tags">/tag/:tagName</code>          | Get all tags with tagName in your <a href="#spaces" class="badge button-badge spaces">Spaces</a>                                                                      | `read`
`GET`     | <code class="tags">/tag/by-card/:cardId</code>   | Get all tags in a <a href="#cards" class="badge button-badge cards">Cards</a>                                                                                        | `read`
`PATCH`   | <code class="tags">/tag/color</code>             | Change the color of all tags with the name specified in request body. Object must contain `name`, `color`     | `edit`

</div>

<h3 class="badge tags">Tags Attributes</h3>

<div class="table-wrap tags attributes-table-wrap">

Name | Type | Description
--- | --- | ---
<code class="tags">id</code>      | `String` | The unique ID of the tag. Is not user updateable
<code class="tags">cardId</code>  | `String` | The card that the tag belongs to
<code class="tags">color</code>   | `String` | Tag color, displayed on a card
<code class="tags">createdAt</code>      | `String`  | The date when the tag was created
<code class="tags">name</code>    | `String` | The name of the tag
<code class="tags">spaceId</code> | `String` | The space that the tag belongs to
<code class="tags">updatedAt</code>      | `String`  | The date when any changes were made to the tag
<code class="tags">userId</code> | `String` | The user who created the tag

</div>
</section>

------

<section class="section-wrap notifications">
<a class="anchor" data-section="🛎" name="notifications"></a>
<h2 class="badge notifications">Notifications</h2>

Notifications are created when another user adds a card in a space that you're a member and not currently viewing. The notifying user can be either a space collaborator, or anyone viewing an open space.

<h3 class="badge notifications">Notifications Routes</h3>

<div class="table-wrap notifications routes-table-wrap">

Method | Path | Description | Scope
--- | --- | --- | ---
`GET`   | <code class="notifications">/notification</code>  | Get the last 50 notifications for the current user | `read`

</div>

<h3 class="badge notifications">Notifications Attributes</h3>

<div class="table-wrap notifications attributes-table-wrap">

Name | Type | Description
--- | --- | ---
<code class="notifications">id</code>      | `String` | The unique ID of the notification. Is not user updateable
<code class="notifications">card</code>    | `Object` | Basic information about the <a href="#cards" class="badge button-badge cards">Card</a> `id`, `name`
<code class="notifications">cardId</code>  | `String` | The card that the notification involves
<code class="notifications">createdAt</code>      | `String`  | The date when the notification was created
<code class="notifications">isEmailed</code>  | `Boolean` | Has the notification been emailed to the recipient. Emails are only sent if `user.shouldEmailNotifications = true`
<code class="notifications">isRead</code>  | `Boolean` | Has the notification been read by the recipient in Kinopio
<code class="notifications">recipientUserId</code>   | `String` | The user that'll receive the notification
<code class="notifications">space</code>   | `Object` | Basic information about the <a href="#spaces" class="badge button-badge spaces">Space</a> `id`, `name`, `privacy`, `background`
<code class="notifications">spaceId</code> | `String` | The space that the notification involves
<code class="notifications">type</code>    | `String` | The action that created the notification (e.g. `addCard`)
<code class="notifications">user</code>    | `Object` | Basic information about the <a href="#users" class="badge button-badge users">User</a> `id`, `name`, `color`
<code class="notifications">userId</code>  | `String` | The user that created the notification
<code class="notifications">updatedAt</code>      | `String`  | The date when any changes were made to the notification

</div>
</section>

------

<section class="section-wrap other">
<a class="anchor" data-section="🛎" name="other"></a>
<h2 class="badge other">Other</h2>

Other routes used by the `kinopio-client` app, which you can also use in your integrations

<h3 class="badge other">other Routes</h3>

<div class="table-wrap other routes-table-wrap">

Method | Path | Description | Scope
--- | --- | --- | ---
`GET`   | <code class="other">/affiliate</code>  | returns affiliate info, promo url, commissions earned, and pending payout | `read`
`GET`   | <code class="other">/services/community-backgrounds</code>  | Lists the space background images aded to the <a href="https://www.are.na/kinopio/community-backgrounds">are.na channel</a> | —
`GET`   | <code class="other">/meta/date</code>  | Current time/timezone of kinopio-server | —
`GET`   | <code class="other">/meta/changelog</code>  | Lists recent Kinopio new feature updates | —
`GET`   | <code class="other">/meta/emojis</code>  | List of [unicode emojis](https://github.com/muan/unicode-emoji-json/blob/main/data-by-group.json) for the emoji picker | —
`GET`   | <code class="other">/meta/random-name</code>  | returns a random word space name – based on the logic formerly used to generate space names | —

</div>
</section>
