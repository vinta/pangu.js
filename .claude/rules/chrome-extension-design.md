---
paths:
  - 'browser-extensions/chrome/stylesheets/**'
  - 'browser-extensions/chrome/pages/**'
---

# Chrome Extension Design

The extension's styles follow the pangu.space design system (sibling repo `pangu.space`, `design/system/project/`), and the token names match on purpose. The differences below are deliberate, because an extension page is not the website. Keep them when syncing with the site:

- The popup title and the options section titles use `--text-xl` (22px), a heading level the site's type scale lacks.
- The options page caps at 800px. The popup grows to fit its title on one line, 400px minimum. The site's 1280px shell applies to the website only.
- The options headline stays `--text-3xl` at every width, with no `keep-all` or zero-width space. It may wrap below a 632px window.
- Main actions are filled black `.btn-primary-black` buttons, 46px tall with `--radius`. The site's 28px outlined button is a small tool button.
- Extension pages are desktop only, since Chrome extensions do not run on phones, so they skip the site's 44px touch targets. The 768px layout switch serves narrow desktop windows: it stacks the logo above the title so the 40px title stays on one line.
- The soft green, red, and blue palette (URL list buttons, status toggle, notifications) stays raw hex values until a second page needs tokens for it.
