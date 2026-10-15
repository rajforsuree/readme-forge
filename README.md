<div align="center">

<img src="assets/img/logo.svg" alt="ReadmeForge" width="300" />

# ReadmeForge

**A README.md generator for GitHub.**

Add sections, build badges, check the live preview and export a README. Everything runs in your browser.

[![Licence: MIT](https://img.shields.io/badge/licence-MIT-4f46e5?style=flat-square)](LICENSE)
[![JavaScript](https://img.shields.io/badge/made%20with-JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](https://developer.mozilla.org/docs/Web/JavaScript)
[![No dependencies](https://img.shields.io/badge/dependencies-0-0ea5e9?style=flat-square)](#how-it-works)
[![Pull requests welcome](https://img.shields.io/badge/PRs-welcome-1a7f37?style=flat-square)](CONTRIBUTING.md)

[Live site](https://rajforsuree.github.io/readme-forge/)

</div>

---

## Features

- 22 section blocks: title, badges, description, features, installation, usage, screenshots, table, tech stack, project structure, table of contents, contributing, roadmap, FAQ, acknowledgements, support and social links.
- Drag to reorder sections, or use the arrow buttons. Duplicate or delete them at any time.
- Undo and redo, with Ctrl+Z and Ctrl+Shift+Z.
- Search the section list to find a block quickly.
- Badge builder for shields.io badges: stars, forks, licence, last commit, npm and PyPI versions, or a custom label.
- Live preview using GitHub-flavoured Markdown, including tables, task lists and aligned images.
- GitHub profile mode with stats, streak, top languages, trophies and an activity graph.
- Six templates: Starter, Minimal, Library, API, Profile and Awesome list.
- Raw Markdown editor with a formatting toolbar.
- Copy to clipboard or download as README.md. Drafts are saved in local storage.
- Dark mode, keyboard shortcuts and a responsive layout.
- Works offline after the first visit, and can be installed as a web app.

## Quick start

There is no build step. Clone the repository and open the page:

```bash
git clone https://github.com/rajforsuree/readme-forge.git
cd readme-forge
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## How it works

| File | Purpose |
| --- | --- |
| `index.html` | Page structure and metadata |
| `assets/css/style.css` | Layout, theming and dark mode |
| `assets/js/app.js` | Section registry, Markdown compiler, editor and preview |
| `assets/js/marked.min.js` | Markdown to HTML |
| `assets/js/purify.min.js` | HTML sanitising |
| `assets/img/` | Logo, icons and social preview image |
| `sw.js` | Service worker for offline use |
| `sitemap.xml`, `robots.txt` | Search engine files |
| `manifest.webmanifest` | Installable web app metadata |

Each section is an entry in the `BLOCKS` registry. The compiler renders every section to Markdown, then `marked` converts it to HTML and `DOMPurify` sanitises it for the preview pane.

## Adding it to your repository

1. Click **Download README.md**.
2. In your repository, choose **Add file** then **Upload files**, add `README.md` and commit.
3. The file now appears on your repository home page.

For a profile README, create a repository named exactly after your username and add the file there.

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening an issue or pull request.

## Acknowledgements

- [Shields.io](https://shields.io) for the badge service.
- [marked](https://github.com/markedjs/marked) and [DOMPurify](https://github.com/cure53/DOMPurify) for Markdown parsing and sanitising.

## Licence

Released under the MIT Licence. See [LICENSE](LICENSE) for details.
