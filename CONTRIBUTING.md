# Contributing to ReadmeForge

Thanks for your interest in improving ReadmeForge.

## Ways to help

- Report a bug by opening an issue with steps to reproduce it.
- Suggest a feature by opening an issue describing the problem it solves.
- Add a section block. This is the most useful contribution.
- Improve the documentation.

## Local development

There is no build step. It is a static site.

```bash
git clone https://github.com/rajforsuree/readme-forge.git
cd readme-forge
python3 -m http.server 8080
```

Open `http://localhost:8080`. Edit `index.html`, `assets/css/style.css` or `assets/js/app.js` and refresh the page.

## Adding a section block

Every section is an entry in the `BLOCKS` registry in `assets/js/app.js`.

```js
myblock: {
  label: "My section",
  icon: "tag",
  group: "Content",
  defaults: function () { return { heading: "My section", items: ["First item"] }; },
  fields: [
    { k: "heading", label: "Heading", type: "text" },
    { k: "items", label: "One per line", type: "list" }
  ],
  render: function (d) {
    var list = (d.items || []).filter(Boolean);
    if (!list.length) return "";
    return "## " + d.heading + "\n\n" + list.map(function (i) { return "- " + i; }).join("\n");
  }
}
```

The `group` is one of Basics, Content, Community, Profile or More. The `icon` is a key in the `ICONS` map.

Field types: `text`, `textarea`, `list`, `select`, `checks`, `pairs` and `badges`.

## Pull request checklist

- The change is focused on one thing.
- `node --check assets/js/app.js` passes.
- It was tested in a browser in both light and dark mode.
- No external dependencies or trackers were added.

## Code style

- Plain JavaScript with no framework and no bundler.
- Two-space indentation.
- Keep everything accessible: labels, ARIA attributes and keyboard support.

## Licence

By contributing, you agree that your contributions are licensed under the MIT Licence.
