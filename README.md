<div align="center">

<img src="assets/img/logo.svg" alt="ReadmeForge logo" width="320" />

# ReadmeForge

**Build a stunning `README.md` for your GitHub project — in minutes.**

Drag in ready-made sections, add shields.io badges, watch the live preview and export a polished README. No sign-up. Nothing ever leaves your browser.

[![Made with JavaScript](https://img.shields.io/badge/made%20with-JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](https://developer.mozilla.org/docs/Web/JavaScript)
[![License: MIT](https://img.shields.io/badge/license-MIT-6d5efc?style=flat-square)](LICENSE)
[![No dependencies](https://img.shields.io/badge/dependencies-0-0ea5e9?style=flat-square)](#-how-it-works)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square)](CONTRIBUTING.md)

[**Live demo →**](https://rajforsuree.github.io/readme-forge/)

</div>

---

## ✨ Features

- 🧩 **Drag-and-drop sections** — 20+ blocks: title, badges, features, installation, usage, FAQ, roadmap, screenshots, tech stack, social links and more.
- 🏷️ **Badge builder** — generate shields.io badges for stars, forks, licence, last commit, npm/PyPI version and custom labels. No URL guessing.
- 👁️ **Live GitHub-style preview** — see exactly how your README will render, including tables, task lists, aligned images and `<details>` sections.
- 👤 **GitHub profile READMEs** — add stats, streak, top languages, trophies, an activity graph and social badges in one click.
- 📄 **Templates** — start from Starter, Minimal, Library, API, Profile or Awesome-list layouts.
- ⌨️ **Raw Markdown mode** — a full editor with a formatting toolbar when you want to go hands-on.
- 💾 **Auto-save** — your draft is kept in `localStorage`, so you can close the tab and come back.
- 🌓 **Dark mode**, fully responsive, keyboard friendly.
- 🔒 **Private by design** — 100% client-side. No backend, no tracking, no uploads.
- 🔎 **SEO-ready** — meta tags, Open Graph, Twitter cards, JSON-LD, `sitemap.xml` and `robots.txt` are all included.

## 🚀 Quick start

ReadmeForge is a static site with **zero build step**. Clone it and open the page:

```bash
git clone https://github.com/rajforsuree/readme-forge.git
cd readme-forge
# just open index.html, or serve it locally:
python3 -m http.server 8080
# → http://localhost:8080
```

## 🧱 How it works

Everything runs in the browser — there is no server and no database.

```
index.html                 the app shell + SEO head
assets/css/style.css       design system, dark mode, responsive layout
assets/js/app.js           block registry, Markdown compiler, editor, preview
assets/js/marked.min.js    Markdown → HTML (vendored, MIT)
assets/js/purify.min.js    HTML sanitising (vendored, Apache-2.0 / MPL-2.0)
assets/img/                logo, favicon and social preview images
sitemap.xml, robots.txt    search-engine files
manifest.webmanifest       installable PWA metadata
```

1. Every README section is a **block** described in the `BLOCKS` registry.
2. The compiler walks the blocks and renders each one to GitHub-flavoured Markdown (the table of contents is built in a second pass from the compiled headings).
3. `marked` turns that Markdown into HTML and `DOMPurify` sanitises it before it hits the preview pane.
4. **Copy** puts the Markdown on your clipboard; **Download** saves it as `README.md`.

## 📁 Adding it to your repository

1. Click **Download README.md**.
2. In your GitHub repo, choose **Add file → Upload files**, drop in `README.md`, and commit.
3. It now appears on your repository home page. For a profile README, create a repository named exactly after your username and add the file there.

## 🤝 Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) first, then open an issue or a pull request.

## 🙏 Acknowledgements

- [Shields.io](https://shields.io) for the badge service.
- [marked](https://github.com/markedjs/marked) and [DOMPurify](https://github.com/cure53/DOMPurify) for Markdown parsing and sanitising.
- [Choose an Open Source License](https://choosealicense.com) for licence guidance.

## 📄 License

Released under the **MIT** License — see the [LICENSE](LICENSE) file for details.

<div align="center">

Made with 🧡 for the GitHub community.

</div>
