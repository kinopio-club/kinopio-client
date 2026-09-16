---
title: 'Bigger, Better Code Blocks'
date: 2023-10-23
category: New Stuff
image: 'https://updates.kinopio.club/bigger-better-code-blocks-thumb.png'
description: Save code snippets and give them context
---

Kinopio makes it easy to save code snippets and give them context for reference spaces, engineering diagrams, and decision trees.

When you paste code into cards between ``` triple backticks```, your code will get syntax highlighting. You can either type the language name after the backticks (e.g. ```js), or select it from the list.

<p>
<video class="wide" autoplay loop muted playsinline>
  <source src="https://updates.kinopio.club/better-code-blocks.mp4">
</video>
</p>

Relatedly, to accommodate larger code snippets, cards with ``` triple backticks can hold more characters (2000).

(Also new is a Copy code button for easily pasting code into your text editor)

<p>
<video class="" autoplay loop muted playsinline>
  <source src="https://updates.kinopio.club/bigger-code-blocks.mp4">
</video>
</p>

## Backstory

Implementing syntax highlighting was not straightforward. Initially, I thought I had two choices:

1. Use a robust syntax highlighting library that runs in the browser. Which is the fastest and most-straightforward solution, but these libraries are usually 250kb or more – so significantly larger than the rest of Kinopio (and computationally heavy).
2. Use that library on the server instead. This would keep the bloat out of the browser, but I'd have to deal with the lag-time between updating code and having it's highlighted syntax. This would also put more strain on the server.

I didn't love either solution, but was leaning towards #2 because it kept things fastest for the user. Design is often about choosing the least bad tradeoffs.

Then, I received an email from [David Francisco](https://david.tools/ipfs/QmcmSwqEsgscyHbQ4Vi37dhbUTsefA4qRg78wMqKkxzv3L/), whom I'd once interviewed for a job at Glitch. I'm glad he kept in touch because he gave me a suggestion that led me to [macrolight](https://github.com/xyzshantaram/macrolight), a tiny and not-at-all robust syntax highlighting library.

This made me rethink my whole approach.

Syntax highlighting in Kinopio doesn't need the vscode-level accuracy that the popular libraries provide – speed and size matter more here.

<img class="wide" src="https://updates.kinopio.club/codeblocks-wip.png">

So combined with some of my own [custom language grammers](https://gist.github.com/pketh/b80e1a6593829a9d690ea78e0efdca77), I was able to add the good enough + very fast syntax highlighting support that I didn't know I was looking for.
