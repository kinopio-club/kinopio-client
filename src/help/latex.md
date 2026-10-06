---
title: LaTeX Support
description: Write math equations in cards with LaTeX code blocks
category: Advanced
updated: 2026-10-05
---

# LaTeX Support

Write math equations in cards using [LaTeX](https://en.wikibooks.org/wiki/LaTeX/Mathematics). Formulas for your scientific, academic, and engineering papers and projects can live right alongside where you think through problems and collect research.

<img src="https://updates.kinopio.club/pages/help/posts/latex/cards.webp" alt="latex cards" class="">

Enclose your LaTeX between triple backticks to make a [codeblock](/help/codeblocks), then use the code language button on the card to select `latex`.

<img src="https://updates.kinopio.club/pages/help/posts/latex/carddetails.webp" alt="latex cards" class="small">


You can also start the code block with `latex` or `tex` to skip the language picker step:

````
```latex
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
```
````

## More Examples

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
