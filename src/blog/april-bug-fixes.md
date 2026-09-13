---
title: 'April Bug Fixes and Enhancements'
metaDate: 'Apr 26, 2024'
date: 2024-04-26
category: New Stuff
image: 'https://updates.kinopio.club/bug-fixes-april.webp'
description: All the bug fixes and little improvements from the last two weeks
---

A summary of all the bug fixes and little improvements from the last two weeks:

![Marqueyssac Topiary Gardens](https://updates.kinopio.club/bug-fixes-april.webp)


[Fixed] Sidebar → Inbox: Dark colored cards rendered black text, instead of white text when looking at the space.

[Fixed] Links to spaces that have long names without spaces had their text render outside of the card if it isn't explicitly widened.

[Fixed] `((` at the beginning of a card didn't add the closing parentheses on Windows.

[Fixed] `Ctrl-Shift-F` shortcut on Windows to search all spaces wasn't being triggered.

[Fixed] When editing a card, pressing `esc` to close the edit dialog and then `b` would not toggle Box drawing mode.

[Fixed] `Hide URL` button did nothing when Kinopio is unable to get any URL preview information. e.g.: When linking to something on a private intranet that isn't publicly accessible

[Fixed] Card, space, and website URLPreviews in cards now only appear if the card name still includes the url. So if you add a URL and then remove it, then the URL preview will no longer render

[Improved] URLPreview website name and favicon are now clickable in CardDetails to visit that URL

[Fixed] signing in was creating duplicate copies of Inbox and Hello Kinopio space

[Improved] You can now upload multiple files at once through the Card → ImagePicker → `Upload` button

[Improved] Added more robust support for localhost urls with :port numbers instead of TLDs. So stuff like `http://localhost:8080/foo` or `https://bastion.alionscience.com:8080/index.php/Autogen` are now recognized as urls too

[API Docs] attr `user.shouldShowMultipleSelectedItemActions` replaced by `user.shouldShowMultipleSelectedCardActions` and `user.shouldShowMultipleSelectedLineActions`

[Improved] Updated max card length for cards with code snippets (using triple backticks ```) to 4000 chars

[Fixed] Selecting transparent colors in the Colorpicker correctly updates the transparency slider

[Fixed] Card votes by non-signed-up users were not being saved

[API Docs] The route `PATCH /card/update-counter` has been added

[Improved] Improved the robustness of checking if the space in your browser is out of sync with the latest version

[Fixed] If you visit a favorite space that you no longer have permission to view (which can happen when a public space later becomes private), that space would remain in your favorite spaces list

[Improved] Added user Setting → Controls → 'Invert Zoom Direction' to change the behaviour of zooming in/out of a space via mousewheel. This setting is not synced, instead it's saved per device

[Improved] You can now tilt a card by dragging in any direction from the bottom-right (before tilting was adjusted by dragging along the x-axis only)

[Fixed] The vertical position of text on Linux rendered incorrectly

(Cover Image from Marqueyssac Topiary Gardens)