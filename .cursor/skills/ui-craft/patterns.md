# Background patterns (curated)

Used only when theming is in scope. Pick by product mood (one default per mood), apply as a utility class in `app/globals.css`, and map colors onto shadcn variables (`--background`, `--surface` via `--card`, `--primary`, `--accent`, `--border`). Respect `prefers-reduced-motion`. Snippets are written for this repo in the style of the PatternCraft collection; they are not verbatim copies.

| Mood | Default pattern | Alternate |
|---|---|---|
| Technical, calm, dashboard | Dark Radial Glow | Vercel Grid Subtle |
| Developer tooling, precise | Vercel Grid Subtle | Dot Matrix |
| Futuristic, AI | Aurora Midnight Glow | Dark Radial Glow |
| Friendly, consumer | Soft Warm Pastel | Paper Texture |
| Editorial, reading | Paper Texture | Soft Warm Pastel |
| Minimal, neutral | Dot Matrix | Vercel Grid Subtle |

All snippets use `var(--background)`, `var(--primary)`, `var(--border)` so they follow light and dark variants.

## Dark Radial Glow (default: technical, calm)
```css
.bg-radial-glow {
  background-color: var(--background);
  background-image: radial-gradient(60% 50% at 50% 0%, color-mix(in oklab, var(--primary) 22%, transparent), transparent 70%);
}
```

## Vercel Grid Subtle (default: developer tooling)
```css
.bg-grid-subtle {
  background-color: var(--background);
  background-image:
    linear-gradient(to right, color-mix(in oklab, var(--border) 60%, transparent) 1px, transparent 1px),
    linear-gradient(to bottom, color-mix(in oklab, var(--border) 60%, transparent) 1px, transparent 1px);
  background-size: 32px 32px;
  mask-image: radial-gradient(ellipse at center, #000 40%, transparent 85%);
}
```

## Aurora Midnight Glow (default: futuristic, AI)
```css
.bg-aurora {
  background-color: var(--background);
  background-image:
    radial-gradient(40% 40% at 20% 10%, color-mix(in oklab, var(--primary) 30%, transparent), transparent),
    radial-gradient(35% 35% at 80% 20%, color-mix(in oklab, var(--accent) 35%, transparent), transparent);
  background-size: 140% 140%;
  animation: aurora-drift 24s ease-in-out infinite alternate;
}
@keyframes aurora-drift { to { background-position: 30% 20%; } }
@media (prefers-reduced-motion: reduce) { .bg-aurora { animation: none; } }
```

## Soft Warm Pastel (default: friendly, consumer)
```css
.bg-warm-pastel {
  background-color: var(--background);
  background-image: linear-gradient(135deg, color-mix(in oklab, var(--accent) 35%, var(--background)), var(--background) 60%);
}
```

## Paper Texture (default: editorial)
```css
.bg-paper {
  background-color: var(--background);
  background-image: radial-gradient(color-mix(in oklab, var(--foreground) 6%, transparent) 1px, transparent 1px);
  background-size: 3px 3px;
}
```

## Dot Matrix (default: minimal, neutral)
```css
.bg-dots {
  background-color: var(--background);
  background-image: radial-gradient(color-mix(in oklab, var(--border) 90%, transparent) 1px, transparent 1px);
  background-size: 20px 20px;
}
```

## Spotlight Top (alternate: calm focus)
```css
.bg-spotlight {
  background-color: var(--background);
  background-image: conic-gradient(from 180deg at 50% -10%, transparent 40%, color-mix(in oklab, var(--primary) 18%, transparent) 50%, transparent 60%);
}
```

## Diagonal Hairlines (alternate: editorial, structured)
```css
.bg-hairlines {
  background-color: var(--background);
  background-image: repeating-linear-gradient(45deg, transparent 0 11px, color-mix(in oklab, var(--border) 70%, transparent) 11px 12px);
}
```
