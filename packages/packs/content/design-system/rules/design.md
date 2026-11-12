---
title: Design tokens
description: Use app/tokens.css and never hardcode colors
alwaysApply: true
---

Read DESIGN.md before changing UI.

Use the CSS variables in `app/tokens.css`. Do not introduce hex, rgb, hsl, named colors, or raw spacing when a token already covers the job.

If a screen needs a new color, add it to `app/tokens.css` and to the `@theme` block in `app/globals.css`, then use the new token. Do not skip that step for a one-off class.
