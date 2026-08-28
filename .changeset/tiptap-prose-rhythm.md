---
"@mcmec/ui": patch
---

Give rendered rich text its documented vertical rhythm

Bulleted lists in Notices, Job Postings and Meeting notes used roughly twice the vertical space they
needed. A four-item list of insecticide products filled a card preview on its own; a thirteen-item
meeting list ran most of a screen.

Two causes, both measured rather than guessed.

**The existing `.prose` overrides had never applied.** `@tailwindcss/typography` emits its rules into
the `utilities` cascade layer, and layer order beats specificity — so `.prose p { @apply my-2 }`
written inside `@layer base` lost to the plugin however specific it was. Paragraphs shipped at the
plugin's 20px the whole time, while DESIGN.md documented 8px. The rules now sit unlayered, which
outranks every layer, and DESIGN.md records why so they do not get tidied back into a layer.

**A list item's paragraph was being treated as a paragraph.** TipTap's StarterKit wraps each list
item's content in its own `<p>`, so the paragraph rule fired *inside* every `<li>`, adding 20px above
and below the text of each bullet on top of the item's own margins. Measured on a real notice: item
pitch dropped from 46px to 26px for a 26px-tall item, and the gap between bullets from 20px to 2px. A
paragraph that is the only child of a list item is now the item and takes no margin; only a second
paragraph within one item is treated as a paragraph.

Also in this pass: rendered bodies are capped at `max-w-[70ch]`, which DESIGN.md has always required
and `max-w-none` had always defeated; the editor uses the same measure so an author lays out the line
breaks a reader will get; and `prose-sm` is gone, so a legal notice is no longer served at 14px on a
phone. Headings, blockquotes and nested lists get the same rhythm, and a rendered body no longer adds
a leading or trailing gap inside the card that already owns its padding.
