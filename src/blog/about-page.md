---
title: 'About Page'
date: 2025-10-14
category: New Stuff

description: New visitors to kinopio (and search engine robots) will see a new static About Kinopio page when visiting the site.

image: 'https://updates.kinopio.club/pages/blog/posts/about-page/overview.webp'

---

New visitors to kinopio (and search engine robots) will see a new static [About Kinopio](https://kinopio.club/about) page when visiting the site.

<img src="https://updates.kinopio.club/pages/blog/posts/about-page/hero.webp" class="wide">


For everyone else, opening the website, or the app, will open your last space, just like it did before.

<p>
<video class="" autoplay loop muted playsinline>
  <source src="https://updates.kinopio.club/pages/blog/posts/about-page/flowchart.mp4">
</video>
</p>


Philosophical, this is a big change from the original behaviour of greeting new users directly with the `Hello Kinopio` space. So I wanted to write a bit here about _why_ and _how_ we did it.

Radically removing friction by skipping the marketing page helped some people fall in love with the app, but had some issues:

- From a user perspective: people who already understood what Kinopio is, and why they should use it, enjoyed being able to jump right in, but the majority of people had to figure that out while also learning a new interface.
- From a sustainable biz perspective, Kinopio’s biggest challenge is reaching new users (i.e. distribution). Google Search rarely shows Kinopio to people looking for whiteboarding, mind-mapping etc. because its crawlers can’t understand spaces (which are dynamically generated).

# Technical Details

Over the last month, [Lucas](https://lucas.love) and I re-architected the app to be able to compile static pages that could be crawled by search engines.

Just like how succinct, clear, writing takes more effort, it took a lot of time to find the right approach that didn’t compromise the clarity of the Vue/Vite codebase.

We captured our goals and findings in a [space](https://kinopio.club/vike-vue-notes-7k41MNfYhkzbXFUYyul1s),

<img src="https://updates.kinopio.club/pages/blog/posts/about-page/vite-ssg-space.webp" class="wide">

Then we built prototypes using different approaches:

- `Vike`: I sort of got this to work, but hit a brick wall. Vike uses node to compile files (not Vite), and I couldn't register a Pinia plugin (which we need for websocket handling) because those use @alias-ed paths, which are not supported by Vike config files.
- `Nuxt`: basically a replacement for using Vue/Vite directly in favor of a comprehensive and opinionated set of build and debugging tools. Our prototype revealed that this was the least maintainable option because in the Nuxt world breaking API changes are common, and you can’t do small upgrades of internal systems because packages like Vue/Vite are completely subsumed by it. Also while we were evaluating it, the project was acquired by Vercel, which has a history of [enshittifying](https://en.wikipedia.org/wiki/Enshittification) projects. I think we dodged a bullet.
- `Vite-SSG` is what we ended up going with. It’s a relatively simple solution designed only for compiling static pages from within our existing Vue/Vite setup.

# Designing the Marketing Site

I have a long history of making marketing pages. Years ago, when I worked at Freshbooks, I coded up the marketing sites for their small business accounting software. These were based on the desktop sized mockups made by their design team. Later on, at FogCreek/Glitch, I designed and built the last versions of their corporate homepage, and did the marketing pages for new products.

It’s another challenge entirely to build a marketing website for your own product though. Ironically, the more passionate I am about something, the harder it is to explain it to other people.

The design goals for the Kinopio marketing website were to:

- Communicate _what_ Kinopio is, _how_ to use it, and _why_ I made it, and _why_ you should use it.
- Stand out from the status quo enterprise-oriented [software whiteboards](https://pketh.org/towards-a-better-whiteboard.html), which all look the same, and say the same generic teamwork/productivity things.
- Feel like just another part of the app, using the same colors, typefaces, sizes, and overall feel.
- Show > Tell where possible. While still being understandable to Search Robots.
- Intrigue and reassure just enough to encourage you to click the `Open Kinopio` button to jump into the app.

# An Easter Egg in the Intro Video

I really wracked my brain on what to show in the intro/hero video at the top of the page. I wanted it to be a video of the real UI in use, rather than something polished but fake created with a professional video editing tool.

For the video, I recreated the space from the first mockup of Kinopio I ever made:

<a href="https://www.are.na/block/4251114">
<img src="https://updates.kinopio.club/pages/blog/posts/about-page/og.webp" class="wide">
</a>

Then it was just a painful process of trial and error to make a series of smooth specific edits.

<p>
<video class="" autoplay loop muted playsinline>
  <source src="https://updates.kinopio.club/pages/blog/posts/about-page/vid.mp4">
</video>
</p>


# Special Features

One of my favorite things about using `Vite-SSG` is that I can mix in components and features from the real app, like the Apps and Pricing dialogs.

I especially like how the Explore/Live buttons in the footer `shows > tells` new users about the awesome Kinopio community way more than words ever could.

P.S. Toggling dark mode works on the page too.

<img src="https://updates.kinopio.club/pages/blog/posts/about-page/footer.webp" class="">

---

Anywho, although we’re doing all these technical backflips to reach new people, there’s still nothing better than word of mouth. So if you enjoy using Kinopio, be sure to tell your friends about it!