# Contributing to ReadmeForge

Thanks for taking the time to contribute! 🧡

## Ways to help

- 🐛 **Report bugs** — open an issue with steps to reproduce.
- 💡 **Suggest features** — open an issue describing the problem it solves.
- 🧩 **Add a section block** — the most valuable contribution. See below.
- 📝 **Improve the docs** — README, comments, wording.
- 🌍 **Translate** — help make the UI available in more languages.

## Local development

There is no build step — it is a static site.

```bash
git clone https://github.com/rajforsuree/readme-forge.git
cd readme-forge
python3 -m http.server 8080
```

Open <http://localhost:8080>. Edit `index.html`, `assets/css/style.css` or `assets/js/app.js` and refresh.

## Adding a new section block

All sections live in the `BLOCKS` registry in `assets/js/app.js`. Add one entry:

```js
myblock: {
  label: "My section",
  icon: "🎯",
  group: "Showcase",                 // Essentials | Showcase | Community | Profile | More
  defaults: function (g) { return { heading: "My section", items: ["First item"] }; },
  fields: [
    { k: "heading", label: "Heading", type: "text" },
    { k: "items", label: "Items (one per line)", type: "list" }
  ],
  render: function (d) {
    var list = (d.items || []).filter(Boolean);
    if (!list.length) return "";
    return "## " + d.heading + "\n\n" + list.map(function (i) { return "- " + i; }).join("\n");
  }
}
```

Field types available: `text`, `textarea`, `list`, `select`, `checks`, `pairs`, `badges`.

## Pull request checklist

- [ ] The change is focused on one thing.
- [ ] `node --check assets/js/app.js` passes.
- [ ] You tested it in a browser (light and dark mode).
- [ ] No external dependencies or trackers were added.

## Code style

- Plain ES5-compatible JavaScript, no framework, no bundler.
- Two-space indentation, single quotes in HTML, double quotes in JS.
- Keep everything accessible: labels, `aria-*`, keyboard support.

## Licence

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
