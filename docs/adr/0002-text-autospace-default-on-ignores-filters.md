# Native autospacing ships default-on and ignores site filters

The Chrome extension registers a second, CSS-only content script that turns on native autospacing (`text-autospace`, Chrome 140+) at the root of every http(s) page and frame. The `is_enable_text_autospace` setting defaults to true, and the layer deliberately ignores `spacing_mode`, `filter_mode`, `blacklist`, and `whitelist`. The rendering is visual-only, inserting no character and leaving copied text unchanged, so the destructive-edit concerns behind those filters do not apply. Blanket coverage is the point: it fills the holes the DOM engine leaves (the cramped flash before processing, iframes, excluded sites, click-to-space pages before the click). Injection is author-level with no `!important`, so a site that declares `text-autospace` itself wins through the cascade with zero detection code.

## Consequences

- Sites excluded by blacklist or whitelist still show native spacing. This is intentional and the options copy says so. Do not "fix" it by gating the registration on filters.
- The gap is fixed by the platform at 1/8 ic and only covers CJK against letters and digits. Real U+0020 insertion stays the extension's core value, and real spaces (including those rendered by Pangu elements) suppress the native gap, so the two layers never double up.
- Toggle changes take effect on subsequent page loads only, matching how `spacing_mode` changes behave. Already-open tabs keep whatever was injected.
- If Chrome ever enables autospacing by default, this layer becomes redundant but harmless, and the default-on decision can be revisited.
