---
title: LaTeX Support
description: Write math equations in cards with LaTeX code blocks
category: Advanced
updated: 2026-10-05
---

# LaTeX Support

Write math equations in cards using LaTeX.
> what is latex

> wide range of use among academic people, engineers/programmers. Combining math formulas with Kinopio would be great for better math understanding.

> share math formulas 

<!-- img w card back showing latex code -->

<img src="https://media.cleanshot.cloud/media/74811/4pyV96nVAI20SSXyLAvlileluMi8sVptM3MsAjj1.jpeg?Expires=1791250541&Signature=Qp5-d1t3NlhIkVyUcvnzB3jvLahXHntXZETFcTvexUcnpOY6vCK-Z1r0EBujtCo-vNpZwPQ4ujz82sTFjJJOXAilmTtGmCoFkr-I9IPrwwNipKDuQMpwX-ry267LnH4WyuGRPdMc-6vrOG5MJ~-vkqwIsiB6bxciUUK3nZxKh0MyNhEw0NjXKzvS-7QKObiEVX~mnMyzRd-PYWg~Z~53uEzTOOWeqQ0jtGZGKYjsI9DZb3qE~cyStb3psEyvi62I4C4hNckJTM3zD1UMNDC5S27FDTybh4FIXfElPjs4M~s~jiutP-7MVPIsJFYLIvxJ8SvYloQnQ4a5cu-3KGIczA__&Key-Pair-Id=K269JMAT9ZF4GZ" alt="latex cards" class="">


## Writing LaTeX

Enclose your LaTeX between triple backticks to make a code block, then use the code language button on the card to select `latex`.

You can also start the code block with `latex` or `tex` to skip the language picker:

````
```latex
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
```
````

## Examples

Fractions, roots, and exponents

```latex
e^{i\pi} + 1 = 0
```

Integrals and sums

```latex
\int_0^\infty e^{-x^2} \, dx = \frac{\sqrt{\pi}}{2}
```

Multi-line equations

```latex
\begin{aligned}
(a + b)^2 &= (a + b)(a + b) \\
&= a^2 + 2ab + b^2
\end{aligned}
```

Matrices

```latex
A = \begin{pmatrix} a & b \\ c & d \end{pmatrix}
```

## LaTeX Pro-Tips

- each code block is rendered as a single equation, use `{aligned}` for multiple lines
- use `\text{}` to write regular words inside an equation
- if part of your equation is shown in red, that command has a typo or isn't supported
- use the copy button on the card to copy the original LaTeX code
- **only LaTeX math** is supported, not document commands like `\section` or `\usepackage`
