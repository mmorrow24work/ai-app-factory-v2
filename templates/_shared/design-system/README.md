# design-system

A small, reusable SvelteKit design system -- CSS custom properties for a color palette and a
typography scale, plus a themed Button component -- for whenever a generated project needs a
SvelteKit frontend of its own.

## What this is not

**Not auto-applied by `factory-new.sh`.** None of the three current project types
(`nautobot-app`, `netbox-plugin`, `custom-script`) include a SvelteKit frontend --
`nautobot-app`/`netbox-plugin` render through Nautobot's/NetBox's own UI framework, and
`custom-script` is typically UI-less or a hand-written static site (see
`../../custom-script/theme.css`/`theme-toggle.js` for that case instead -- framework-free,
no build step). This exists so a design system is built once and referenced, not reinvented,
for whenever a generated project *does* need a SvelteKit frontend -- copy it in by hand at that
point.

## What's in here

```
src/app.css              CSS custom properties: a single neutral color palette (light + dark,
                          toggled via a `.dark` class on <html>) and a --text-scale typography
                          token, mapped onto Tailwind v4's @theme so bg-primary/text-foreground/
                          etc. utility classes work.
src/lib/theme.js.tmpl     Light/dark store + toggle logic, persisted to localStorage under a
                          {{PROJECT_NAME}}-namespaced key. Needs {{PROJECT_NAME}} substituted.
src/lib/utils.js          cn() helper (clsx + tailwind-merge) -- no placeholders.
src/lib/ui/button.svelte  A Button whose variants are pure semantic-token classes (bg-primary,
                          bg-destructive, ...), never a hardcoded color, so it follows the
                          active theme automatically.
```

Deliberately small: one neutral color palette rather than a multi-palette picker, and no
typography (font-family) picker beyond the single `--text-scale` multiplier -- this is meant as
a solid starting point for a new frontend, not a fully-featured settings page. Add more (a
palette picker, a font-family picker, a nav-accessible toggle button) the same way this was
built: pick tokens, expose them as CSS custom properties, wire a small store around them.

## Wiring it into a fresh SvelteKit project

1. Copy `src/app.css` in as-is (merge with anything already there rather than overwrite).
2. Copy `src/lib/theme.js.tmpl` -> the target's `src/lib/theme.js`, substituting
   `{{PROJECT_NAME}}` for the real project name by hand (a plain find-and-replace -- there is
   no script that does this for `design-system/`, unlike the three project-type templates
   `factory-new.sh` does substitute automatically).
3. Copy `src/lib/utils.js` and `src/lib/ui/button.svelte` in as-is.
4. `npm install clsx tailwind-merge` (needed by `utils.js`'s `cn()`). Confirm the target
   project is already on Tailwind v4 -- this design system's `@theme` mapping in `app.css`
   assumes it.
5. Call `theme.js`'s theme-refresh logic from the root layout's `onMount`, and add an inline
   pre-hydration script to `app.html` that applies the stored/system theme before Svelte
   hydrates (same key as `THEME_STORAGE_KEY` below), to avoid a flash of the wrong theme.

## Verifying it renders

Since no current template type consumes this automatically, there's no `factory-new.sh`
integration test for it. Verify by hand: copy the files into a throwaway SvelteKit + Tailwind
v4 project per the steps above, substitute `{{PROJECT_NAME}}`, `npm run dev`, and confirm the
light/dark toggle and the Button's variants all render and apply immediately.
