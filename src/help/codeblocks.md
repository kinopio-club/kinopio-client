---
title: Codeblocks
description: Add code snippets to cards with syntax highlighting
category: Advanced
updated: 2026-10-05
image: https://updates.kinopio.club/pages/help/posts/adding-images-to-cards/code.webp
---

# Codeblocks

Add code snippets to cards, with syntax highlighting for different programming languages.

<img src="https://updates.kinopio.club/pages/help/posts/adding-images-to-cards/code.webp" alt="code block card" class="medium">

Just like standard markdown, enclose your code between triple backticks to make a codeblock:

````
```
const sum = (a, b) => {
  return a + b
}
```
````

For short snippets inside a sentence, use single backticks to write `inline code`.

## Syntax Highlighting

Use the code language button on the card to select a programming language.

<img src="https://updates.kinopio.club/pages/help/posts/codeblocks/picker.webp" alt="code block language picker" class="medium">

You can also start the codeblock with the language name to skip the language picker:

````
```js
const sum = (a, b) => {
  return a + b
}
```
````

Supported languages are: `c`, `c++`, `cs` (or `c#`), `css`, `go`, `html`, `java`, `js` (or `ts`, `tsx`), `json`, `kotlin`, `latex` (or `tex`), `php`, `python`, `r`, `ruby`, `rust`, `shell`, `sql`, and `swift`.

## LaTeX

Codeblocks with the `latex` language selected are rendered as math equations. Learn more about [LaTeX Support](/help/latex).

## Codeblock Pro-Tips

- use the copy button on the card to copy the code
- you can change the card editing behaviour of `shift-enter` to line break to make multi-line input easier
- you can add multiple codeblocks to a card
