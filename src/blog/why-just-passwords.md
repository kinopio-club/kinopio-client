---
title: Why Just Passwords?
date: 2026-10-09
category: How It's Made
description: I get it, no one wants to be responsible for screwing up critical security, so authentication has become scary. 
image: 'https://kinopio-updates.us-east-1.linodeobjects.com/pages/blog/posts/passwords/1.webp'
---


From all the confusing and annoying ways to sign in to software we wade through everyday, developers must fear storing/encrypting/hashing passwords. I get it, no one wants to be responsible for screwing up critical security, so authentication has become one of those [“no one ever got fired for buying IBM”](https://www.goodreads.com/quotes/12058538-no-one-ever-got-fired-for-hiring-ibm-goes-the) type of problem that considers the user last.

So why has Kinopio only had password-based login since it launched in 2018? Because all the other options are still worse.

Let's go through them:

<img src="https://kinopio-updates.us-east-1.linodeobjects.com/pages/blog/posts/passwords/1.webp" class="">


## Password-Less Auth With an Emailed Token

You go to sign in and type in your email address, then you need to switch to your email app to click the ‘magic link’ to sign in. 

Using email to authenticate is much less intimidating to build because you don't have to store or encrypt passwords. But as a user, the result is pain: 

- If you're lucky the email is ready in your inbox, but usually you'll be waiting a minute or two for it to show up. (Assuming it doesn't get silently swallowed up by spam filters).
- Because mobile email clients open links in their own sandboxed embedded browsers, the magic link has become a decidedly less magical 2FA code that you have to manually copy and paste yourself, like an animal. 

<img src="https://kinopio-updates.us-east-1.linodeobjects.com/pages/blog/posts/passwords/2.webp" class="">

Defenders of the pattern are correct that storing minimum user data is a [good security practice](https://idlewords.com/talks/haunted_by_data.htm). But the ad-trackers, AI training, and unredacted and never-purged logs in most modern apps make this a practically meaningless gesture.

The weirdest thing is that even huge VC-funded companies with unlimited engineering resources rely on email sign-in, maybe what it's really about is passing the responsibility (and the liability) downstream to the email provider.

## Sign in With Google/Facebook/GitHub/Hell

Signing in with third party OAuth providers like Google is the easiest thing to implement, and you even get 2FA support for free.  

The major advantage of this pattern is low friction. New users don't have to type anything and create a new password to make a new account. 

But in exchange for the convenience, you're giving over user data to big-tech corporations and the advertising-industrial complex that's sloppifying the web, and subverting democracy. 

<img src="https://kinopio-updates.us-east-1.linodeobjects.com/pages/blog/posts/passwords/3.webp" class="small">


Also you can't just do one of them because someone will inevitably tell you that they don't have a [Google] account, but they do use [Microsoft] at work. So your sign in screen ends up looking like a rainbow colored mess of corporate logos, and users have to remember which of these providers they used with your app. 

And lord help you if they sign in with a different provider later and think that their data has disappeared. This is a very common support issue. You'll lose the time you've saved to figuring out how to safely merge user accounts associated with different providers.

But "who cares about all that" you might say. "Friction is the enemy of conversion, and we don't want anyone hesitating for even a second before signing up to use our app". 

Actually, people leave without signing up because they're not really sure that the app will solve their problem, or be enjoyable to use. If you focus on communicating that instead, (e.g. through clearer and more focused messaging, or by letting people use the app without an account), the right people will be excited to sign up. An email and password field certainly won't stop them. 

## Are We Overthinking Passwords?

When I met my wife, she was using the same Lord of the Rings-related password for everything. So I explained how if the most security-lax service she uses got hacked (exhibit [A](https://frameworksecurity.com/post/the-target-breach-a-historic-cyberattack-with-lasting-consequences), [B](https://www.eurogamer.net/sony-admitted-the-great-psn-hack-five-years-ago-today), [C](https://www.csoonline.com/article/567833/equifax-data-breach-faq-what-happened-who-was-affected-what-was-the-impact.html)), all of her accounts could be trivially taken over. I also taught her how to use 1Password instead of memorizing passwords. 

It used to take a lot of personal diligence to stay safe on the web. But these days, practicing safe password habits is easy for everyone to do because every browser/OS now automatically suggests and autofills passwords.

That said, hopefully one day, basic internet safety education is something everyone is taught in school.

## What About Passkeys?

It's hard to think of a more confusingly introduced technology than Passkeys. They were promoted as a new safer alternative to passwords, but what they ended up being is a convenient *additional* way to sign in to an existing account, which still needs a password or OAuth provider.

## Storing Passwords Safely Is Not as Hard as You Think

Ideally it's a liability developers wouldn't need to have. But mature and [boring](https://boringtechnology.club/) encryption libraries (like bcrypt) and best practices like API rate-limiting are documented well-enough that providing safe password-based auth is not as intimidating as many developers think it is. 

In the future, I'll add optional 2FA support, which shouldn't be too hard. 

(For extra safety, I also prevent users from making passwords less than 4 characters long, and disallow passwords that match a part or whole of the email address. Which I'm told people still do sadly.)
