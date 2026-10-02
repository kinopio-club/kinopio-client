---
title: Are You Sure You Want to Do What You Wanted to Do?
date: 2026-11-02
category: How It's Made
description: Security and usability often exist on a spectrum where you have to make trade-offs to one to strengthen the other. Like most spectrums, it's possible to go too far to the extreme on either side. 
image: 'https://kinopio-updates.us-east-1.linodeobjects.com/pages/blog/posts/are-you-sure/double-tea-cup.jpg'
---

Security and usability often exist on a spectrum where you have to make trade-offs to one to strengthen the other. Like most spectrums, it's possible to go too far to the extreme on either side. 

This is a look back at a rejected feature request that made sense to everyone but the requester. Tea will be spilled. 

<img src="https://kinopio-updates.us-east-1.linodeobjects.com/pages/blog/posts/are-you-sure/double-tea-cup.jpg" class="">


A couple months ago, someone joined the Discord and requested a reasonable sounding change: 

> Right now, Kinopio takes you straight to a link when you click on it, but that can be abused by bad actors. Do you think you can add a confirmation dialog that warns people 'do you want to go to link'?

Find a restaurant on Yelp and click the 'website' link to view their website? Instead of immediately opening the site, Yelp will display a message telling you that you're opening a site. Gamer platforms like Discord and Steam are even more aggressive, forcing you to confirm that you understand you're opening a website everytime. 

Thanks for the warning, I know I'm doing the thing I asked to do. It's pointless security theatre in 99.99% of cases. But what about that 0.01% case? Theoretically, someone could make a website that looked exactly like a bank sign in page and trick you into fake signing in and stealing your credentials. For someone to fall prey to this, **all** of these have to be true:

1. The user doesn't understand what a URL is, why they clicked it, and where they intended to go.
2. Their browser doesn't block the site from loading because it's SSL certificate was revoked for phishing.
3. The scam website looks convincing.
4. They ignore the warning from the password manager that's built into every browser and OS these days.

So unlikely, but it's still possible. The security above all else side of the spectrum would add the warning. Make it extra scary. You can't get hit by a bus if you never leave home.

<img src="https://kinopio-updates.us-east-1.linodeobjects.com/pages/blog/posts/are-you-sure/error.gif" class="">

But design is about weighing compromises by looking at the larger picture. Kinopio is a citizen of the web first and treating the open web as inherently unsafe goes against the principles of the app.

## A Tool for Enthusiasts First

Because Kinopio is funded by the community, rather than VCs, I don't need to chase growth above quality. But great products aren't great for everyone. 

Photography enthusiasts prefer cameras with big sensors, easy to hold ergonomics, and physical controls for shutter speed and aperture. But way more people don't care and prefer taking photos with their phone. 

<img src="https://kinopio-updates.us-east-1.linodeobjects.com/pages/blog/posts/are-you-sure/leica-m11.webp" class="">
<figcaption>
Leica M11-P, a dream camera for some, that costs as much as a used car and deliberately doesn't have autofocus.
</figcaption>


Even the most casual user of Kinopio is someone who dared to venture outside the walled garden. They deserve tools that aspire to become an extension on themselves. 

Enthusiasts enjoy learning more about their tools. Creative computer users can and do learn about fake urls, password managers, and how to stay safe on the web. 

## Doing the Wrong Easy Thing Is Worse Than Doing Nothing

The discussion about adding a warning got pretty heated from the requester. Why not just add the warning? Don't you care about your users? Think of the children? How dare you? 

Making the requester happy would come at the expense of everyone else adding links to their spaces. 

Especially in large organizations, the easiest thing to do is just add the thing to end the conversation and make everyone happy. Slow, bloated, annoying products don't just happen, they slowly decay into that shape, one easy decision at a time. I've been guilty of being a people pleaser even when I knew it was wrong, and I saw the incremental rot that followed. 

## There Is a Solution, It's Just Not Worth It

As unlikely a risk as I believe this is, the core of the concern is technically valid. But being partly right, but rude, isn't so far from being wrong. 

I regularly come back to problems and feature requests that look daunting or technically challenging, sometimes even years later when I figure out a good way to do them. If they'd moved their request to the [community forum](https://kinopio.club/forum), I would've eventually been able to come up with a spec to show warnings **only** on known phishing URLs:

<div class="kinopio-embed" style="height: 420px; width: 100%;">
  <iframe src="https://kinopio.club/embed/?spaceId=kiINNnzu3qzyxiqbcHPz9&zoom=100" style="height: 100%; width: 100%; border: 0; border-radius: 6px;">
  </iframe>
</div>

This extra complexity still doesn't eliminate **all** risk because phishing sites have to be used at least once before they can be submitted to a blacklist. The extremely low risk, low user benefits, and high server maintainance burden makes this something I'd consider extremely low priority project right now.

Unfortunately, we never got to have that conversation. Maybe they would've understood, maybe they wouldn't have. I consider it a personal and company failure when people leave on bad terms. But you can't please everyone, you can only be transparent.