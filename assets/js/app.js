/* ==========================================================================
   ReadmeForge — app.js
   A dependency-light README.md generator that runs entirely in the browser.
   Markdown is rendered with marked + DOMPurify (both vendored locally).
   ========================================================================== */
(function () {
  "use strict";

  /* ---------- tiny helpers ---------- */
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var FENCE = "```";
  var esc = function (s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  };
  var uid = function () { return "b" + Math.random().toString(36).slice(2, 9); };
  var slugify = function (s) {
    return String(s).toLowerCase().trim()
      .replace(/[^\p{L}\p{N}\s-]/gu, "")
      .replace(/\s+/g, "-");
  };
  var shieldEnc = function (s) {
    return encodeURIComponent(String(s == null ? "" : s).replace(/-/g, "--").replace(/ /g, "_"));
  };
  var lines = function (arr) {
    return (arr || []).map(function (x) { return String(x).trim(); }).filter(Boolean);
  };

  var toastTimer = null;
  function toast(msg) {
    var t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, 2200);
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve) {
      var ta = document.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); } catch (e) {}
      document.body.removeChild(ta); resolve();
    });
  }

  function download(filename, text) {
    var blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  }

  /* ---------- badge + social helpers ---------- */
  function badgeUrl(item, g) {
    var style = item.style || "flat-square";
    var logo = item.logo || "";
    var logoColor = item.logoColor || "";
    var type = item.type || "custom";
    var owner = item.owner || g.owner || "user";
    var repo = item.repo || g.repo || "repo";
    var pkg = item.pkg || "package";
    var base;
    switch (type) {
      case "stars":        base = "https://img.shields.io/github/stars/" + owner + "/" + repo; break;
      case "forks":        base = "https://img.shields.io/github/forks/" + owner + "/" + repo; break;
      case "issues":       base = "https://img.shields.io/github/issues/" + owner + "/" + repo; break;
      case "license":      base = "https://img.shields.io/github/license/" + owner + "/" + repo; break;
      case "last-commit":  base = "https://img.shields.io/github/last-commit/" + owner + "/" + repo; break;
      case "contributors": base = "https://img.shields.io/github/contributors/" + owner + "/" + repo; break;
      case "repo-size":    base = "https://img.shields.io/github/repo-size/" + owner + "/" + repo; break;
      case "npm-version":  base = "https://img.shields.io/npm/v/" + pkg; break;
      case "npm-downloads":base = "https://img.shields.io/npm/dm/" + pkg; break;
      case "pypi-version": base = "https://img.shields.io/pypi/v/" + pkg; break;
      case "pypi-downloads": base = "https://img.shields.io/pypi/dm/" + pkg; break;
      default:
        base = "https://img.shields.io/badge/" + shieldEnc(item.label || "label") +
               "-" + shieldEnc(item.message || "message") + "-" + (item.color || "blue");
    }
    var q = [];
    if (style) q.push("style=" + style);
    if (logo) q.push("logo=" + logo);
    if (logoColor) q.push("logoColor=" + logoColor);
    return base + (q.length ? "?" + q.join("&") : "");
  }

  var SOCIALS = {
    github:       { label: "GitHub",        color: "181717", logo: "github",        url: "https://github.com/{u}" },
    twitter:      { label: "X",             color: "000000", logo: "x",             url: "https://x.com/{u}" },
    linkedin:     { label: "LinkedIn",      color: "0A66C2", logo: "linkedin",      url: "https://linkedin.com/in/{u}" },
    instagram:    { label: "Instagram",     color: "E4405F", logo: "instagram",     url: "https://instagram.com/{u}" },
    youtube:      { label: "YouTube",       color: "FF0000", logo: "youtube",       url: "https://youtube.com/@{u}" },
    devto:        { label: "Dev.to",        color: "0A0A0A", logo: "devdotto",      url: "https://dev.to/{u}" },
    medium:       { label: "Medium",        color: "12100E", logo: "medium",        url: "https://medium.com/@{u}" },
    hashnode:     { label: "Hashnode",      color: "2962FF", logo: "hashnode",      url: "https://hashnode.com/@{u}" },
    stackoverflow:{ label: "Stack Overflow",color: "FE7A16", logo: "stackoverflow", url: "https://stackoverflow.com/users/{u}" },
    reddit:       { label: "Reddit",        color: "FF4500", logo: "reddit",        url: "https://reddit.com/user/{u}" },
    discord:      { label: "Discord",       color: "5865F2", logo: "discord",       url: "https://discord.gg/{u}" },
    telegram:     { label: "Telegram",      color: "26A5E4", logo: "telegram",      url: "https://t.me/{u}" },
    whatsapp:     { label: "WhatsApp",      color: "25D366", logo: "whatsapp",      url: "https://wa.me/{u}" },
    email:        { label: "Email",         color: "D14836", logo: "gmail",         url: "mailto:{u}" },
    website:      { label: "Website",       color: "6d5efc", logo: "",              url: "{u}" }
  };

  function socialBadge(item) {
    var key = item.platform || "github";
    var p = SOCIALS[key] || { label: key, color: "555555", logo: "", url: "" };
    var style = item.style || "for-the-badge";
    var color = item.color || p.color;
    var logo = p.logo;
    var label = item.label || p.label;
    var handle = item.handle || "";
    var link = item.url || (p.url ? p.url.replace("{u}", handle) : "");
    // With no handle, use the brand colour as the badge message so it renders
    // as a clean single-word pill (the common profile-README style).
    var msg = handle || (key === "website" ? "example.com" : color);
    var img = "https://img.shields.io/badge/" + shieldEnc(label) + "-" + shieldEnc(msg) + "-" + color +
              "?style=" + style + (logo ? "&logo=" + logo + "&logoColor=white" : "");
    return link ? "[![" + label + "](" + img + ")](" + link + ")" : "![" + label + "](" + img + ")";
  }

  /* ==========================================================================
     Block registry — every README section is one entry here.
     Each block: { label, icon, group, defaults(g), fields[], render(data, g) }
     ========================================================================== */
  var BLOCKS = {

    header: {
      label: "Title & tagline", icon: "📛", group: "Essentials",
      defaults: function (g) { return { name: g.name || "", tagline: "", logo: "", align: "center", emoji: "" }; },
      fields: [
        { k: "name", label: "Project name", type: "text", ph: "Awesome Project" },
        { k: "emoji", label: "Greeting emoji (optional)", type: "text", ph: "👋" },
        { k: "tagline", label: "Tagline", type: "text", ph: "A one-line description" },
        { k: "logo", label: "Logo image URL (optional)", type: "text", ph: "https://…/logo.png" },
        { k: "align", label: "Alignment", type: "select", opts: ["center", "left"] }
      ],
      render: function (d) {
        var name = d.name || "Project Name";
        var emoji = d.emoji ? d.emoji + " " : "";
        var out = "";
        if (d.align === "center") {
          if (d.logo) out += '<p align="center"><img src="' + d.logo + '" alt="' + name + ' logo" width="120" /></p>\n\n';
          out += "<h1 align=\"center\">" + emoji + name + "</h1>";
          if (d.tagline) out += "\n<p align=\"center\">" + d.tagline + "</p>";
          return out;
        }
        if (d.logo) out += '<img src="' + d.logo + '" alt="' + name + ' logo" width="120" />\n\n';
        out += "# " + emoji + name;
        if (d.tagline) out += "\n\n" + d.tagline;
        return out;
      }
    },

    description: {
      label: "Description", icon: "📝", group: "Essentials",
      defaults: function () { return { text: "" }; },
      fields: [{ k: "text", label: "About this project", type: "textarea", ph: "What does it do, and why should someone care?" }],
      render: function (d) { return (d.text || "").trim(); }
    },

    badges: {
      label: "Badges", icon: "🏷️", group: "Essentials",
      defaults: function () {
        return { items: [
          { type: "stars", label: "", message: "", color: "blue", style: "flat-square", logo: "", logoColor: "", owner: "", repo: "", pkg: "", alt: "stars" },
          { type: "license", label: "", message: "", color: "blue", style: "flat-square", logo: "", logoColor: "", owner: "", repo: "", pkg: "", alt: "license" }
        ] };
      },
      fields: [{ k: "items", label: "Badges", type: "badges" }],
      render: function (d, g) {
        var items = d.items || [];
        if (!items.length) return "";
        return items.map(function (it) {
          var alt = it.alt || it.label || it.type || "badge";
          return "![" + alt + "](" + badgeUrl(it, g) + ")";
        }).join(" ");
      }
    },

    features: {
      label: "Features", icon: "✨", group: "Essentials",
      defaults: function () { return { heading: "Features", items: ["Feature one", "Feature two", "Feature three"] }; },
      fields: [
        { k: "heading", label: "Heading", type: "text" },
        { k: "items", label: "Features (one per line)", type: "list", ph: "⚡ Blazing fast" }
      ],
      render: function (d) {
        var list = lines(d.items);
        if (!list.length) return "";
        return "## " + (d.heading || "Features") + "\n\n" + list.map(function (i) { return "- " + i; }).join("\n");
      }
    },

    installation: {
      label: "Installation", icon: "📦", group: "Essentials",
      defaults: function () { return { text: "Install the dependencies:", lang: "bash", code: "npm install" }; },
      fields: [
        { k: "text", label: "Intro text", type: "textarea" },
        { k: "lang", label: "Code language", type: "text", ph: "bash" },
        { k: "code", label: "Commands / code", type: "textarea", ph: "npm install" }
      ],
      render: function (d) {
        var out = "## Installation\n";
        if (d.text) out += "\n" + d.text + "\n";
        if (d.code) out += "\n" + FENCE + (d.lang || "") + "\n" + d.code + "\n" + FENCE;
        return out;
      }
    },

    usage: {
      label: "Usage", icon: "🚀", group: "Essentials",
      defaults: function () { return { text: "Get started quickly:", lang: "bash", code: "npm start" }; },
      fields: [
        { k: "text", label: "Intro text", type: "textarea" },
        { k: "lang", label: "Code language", type: "text", ph: "bash" },
        { k: "code", label: "Example code", type: "textarea" }
      ],
      render: function (d) {
        var out = "## Usage\n";
        if (d.text) out += "\n" + d.text + "\n";
        if (d.code) out += "\n" + FENCE + (d.lang || "") + "\n" + d.code + "\n" + FENCE;
        return out;
      }
    },

    license: {
      label: "License", icon: "⚖️", group: "Essentials",
      defaults: function (g) { return { type: "MIT", author: g.name || "", year: String(new Date().getFullYear()) }; },
      fields: [
        { k: "type", label: "Licence", type: "select", opts: ["MIT", "Apache-2.0", "GPL-3.0", "BSD-3-Clause", "ISC", "Unlicense", "MPL-2.0", "Custom"] },
        { k: "author", label: "Copyright holder (optional)", type: "text" },
        { k: "year", label: "Year", type: "text", ph: "2026" }
      ],
      render: function (d) {
        var type = d.type || "MIT";
        var who = d.author ? " © " + d.year + " " + d.author : "";
        return "## License\n\nReleased under the **" + type + "** License" + who +
               ". See the [LICENSE](LICENSE) file for more information.";
      }
    },

    demo: {
      label: "Demo & links", icon: "🔗", group: "Showcase",
      defaults: function () { return { text: "", url: "", label: "Live Demo" }; },
      fields: [
        { k: "text", label: "Intro text", type: "textarea" },
        { k: "label", label: "Link label", type: "text", ph: "Live Demo" },
        { k: "url", label: "Link URL", type: "text", ph: "https://example.com" }
      ],
      render: function (d) {
        var out = "## Demo\n";
        if (d.text) out += "\n" + d.text + "\n";
        if (d.url) out += "\n**[" + (d.label || "Live Demo") + "](" + d.url + ")**";
        return out;
      }
    },

    screenshots: {
      label: "Screenshots", icon: "🖼️", group: "Showcase",
      defaults: function () { return { items: [{ src: "", caption: "" }] }; },
      fields: [{ k: "items", label: "Images", type: "pairs", fields: ["src", "caption"], ph: ["https://…/shot.png", "Caption"], long: [false, false], addLabel: "Add image" }],
      render: function (d) {
        var items = (d.items || []).filter(function (i) { return i.src; });
        if (!items.length) return "";
        return "## Screenshots\n\n" + items.map(function (i) {
          return "![" + (i.caption || "screenshot") + "](" + i.src + ")";
        }).join("\n\n");
      }
    },

    techstack: {
      label: "Tech stack", icon: "🧰", group: "Showcase",
      defaults: function () { return { heading: "Tech Stack", style: "badges", items: ["JavaScript|javascript|F7DF1E", "Node.js|nodedotjs|5FA04E"] }; },
      fields: [
        { k: "heading", label: "Heading", type: "text" },
        { k: "style", label: "Style", type: "select", opts: ["badges", "list"] },
        { k: "items", label: "One per line — Name|logo|color (logo & color optional)", type: "list", ph: "React|react|61DAFB" }
      ],
      render: function (d) {
        var list = lines(d.items);
        if (!list.length) return "";
        var head = "## " + (d.heading || "Tech Stack") + "\n\n";
        if (d.style === "list") return head + list.map(function (i) { return "- " + i.split("|")[0]; }).join("\n");
        return head + list.map(function (i) {
          var parts = i.split("|");
          var name = parts[0], logo = parts[1] || "", color = parts[2] || "555555";
          var url = "https://img.shields.io/badge/" + shieldEnc(name) + "-" + color +
                    "?style=flat-square" + (logo ? "&logo=" + logo + "&logoColor=white" : "");
          return "![" + name + "](" + url + ")";
        }).join(" ");
      }
    },

    structure: {
      label: "Project structure", icon: "🗂️", group: "Showcase",
      defaults: function () { return { text: "A quick look at the folder layout:", tree: "├── src/\n├── public/\n├── package.json\n└── README.md" }; },
      fields: [
        { k: "text", label: "Intro text", type: "textarea" },
        { k: "tree", label: "Tree", type: "textarea" }
      ],
      render: function (d) {
        var out = "## Project Structure\n";
        if (d.text) out += "\n" + d.text + "\n";
        if (d.tree) out += "\n" + FENCE + "\n" + d.tree + "\n" + FENCE;
        return out;
      }
    },

    toc: {
      label: "Table of contents", icon: "🧭", group: "Showcase",
      defaults: function () { return { heading: "Table of Contents", depth: "3" }; },
      fields: [
        { k: "heading", label: "Heading", type: "text" },
        { k: "depth", label: "Max heading level", type: "select", opts: ["2", "3", "4"] }
      ],
      render: function () { return ""; } // filled in by compile()
    },

    contributing: {
      label: "Contributing", icon: "🤝", group: "Community",
      defaults: function () {
        return { text: "Contributions are what make the open-source community amazing. Any contribution you make is **greatly appreciated**.\n\n1. Fork the project\n2. Create your feature branch (`git checkout -b feature/amazing`)\n3. Commit your changes (`git commit -m 'Add amazing feature'`)\n4. Push to the branch (`git push origin feature/amazing`)\n5. Open a Pull Request" };
      },
      fields: [{ k: "text", label: "Contributing text", type: "textarea", rows: 8 }],
      render: function (d) { return (d.text || "").trim() ? "## Contributing\n\n" + d.text : ""; }
    },

    roadmap: {
      label: "Roadmap", icon: "🗺️", group: "Community",
      defaults: function () { return { heading: "Roadmap", items: ["[x] Project setup", "[ ] Add more features", "[ ] Write tests"] }; },
      fields: [
        { k: "heading", label: "Heading", type: "text" },
        { k: "items", label: "Items (use [x] for done)", type: "list", ph: "[ ] Upcoming feature" }
      ],
      render: function (d) {
        var list = lines(d.items);
        if (!list.length) return "";
        return "## " + (d.heading || "Roadmap") + "\n\n" + list.map(function (i) {
          return /^-\s*\[/.test(i) ? i : "- [ ] " + i.replace(/^-\s*/, "");
        }).join("\n");
      }
    },

    faq: {
      label: "FAQ", icon: "❓", group: "Community",
      defaults: function () { return { heading: "FAQ", items: [{ q: "How do I install it?", a: "Run the install command above." }] }; },
      fields: [
        { k: "heading", label: "Heading", type: "text" },
        { k: "items", label: "Questions", type: "pairs", fields: ["q", "a"], ph: ["Question", "Answer"], long: [false, true], addLabel: "Add question" }
      ],
      render: function (d) {
        var items = (d.items || []).filter(function (i) { return i.q; });
        if (!items.length) return "";
        return "## " + (d.heading || "FAQ") + "\n\n" + items.map(function (i) {
          return "<details>\n<summary>" + i.q + "</summary>\n\n" + (i.a || "") + "\n\n</details>";
        }).join("\n\n");
      }
    },

    acknowledgements: {
      label: "Acknowledgements", icon: "🙏", group: "Community",
      defaults: function () { return { heading: "Acknowledgements", items: ["[Shields.io](https://shields.io) for the badges", "[Choose an Open Source License](https://choosealicense.com)"] }; },
      fields: [
        { k: "heading", label: "Heading", type: "text" },
        { k: "items", label: "Credits (one per line)", type: "list" }
      ],
      render: function (d) {
        var list = lines(d.items);
        if (!list.length) return "";
        return "## " + (d.heading || "Acknowledgements") + "\n\n" + list.map(function (i) { return "- " + i; }).join("\n");
      }
    },

    support: {
      label: "Support / star", icon: "⭐", group: "Community",
      defaults: function () {
        return { text: "If this project helped you, please consider giving it a ⭐ — it really helps!\n\n[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-support-FFDD00?style=for-the-badge&logo=buymeacoffee&logoColor=black)](https://www.buymeacoffee.com/)" };
      },
      fields: [{ k: "text", label: "Support text", type: "textarea", rows: 6 }],
      render: function (d) { return (d.text || "").trim() ? "## Support\n\n" + d.text : ""; }
    },

    contact: {
      label: "Social links", icon: "📬", group: "Community",
      defaults: function (g) {
        return { heading: "Connect with me", items: [{ platform: "github", handle: g.owner || "", url: "" }, { platform: "linkedin", handle: "", url: "" }] };
      },
      fields: [
        { k: "heading", label: "Heading", type: "text" },
        { k: "items", label: "Links", type: "pairs", fields: ["platform", "handle"], ph: ["platform", "username"], select: [Object.keys(SOCIALS)], addLabel: "Add link", long: [false, false] }
      ],
      render: function (d) {
        var items = (d.items || []).filter(function (i) { return i.platform; });
        if (!items.length) return "";
        return "## " + (d.heading || "Connect with me") + "\n\n" + items.map(socialBadge).join("\n");
      }
    },

    stats: {
      label: "GitHub stats cards", icon: "📊", group: "Profile",
      defaults: function (g) { return { owner: g.owner || "", theme: "radical", show: ["stats", "langs", "streak", "trophies", "activity"] }; },
      fields: [
        { k: "owner", label: "GitHub username", type: "text", ph: "octocat" },
        { k: "theme", label: "Theme", type: "select", opts: ["radical", "dark", "tokyonight", "dracula", "gruvbox", "merko", "onedark", "synthwave", "cobalt", "vision-friendly-dark"] },
        { k: "show", label: "Cards to include", type: "checks", opts: [["stats", "Stats"], ["langs", "Top languages"], ["streak", "Streak"], ["trophies", "Trophies"], ["activity", "Activity graph"]] }
      ],
      render: function (d) {
        var u = d.owner || "username";
        var theme = d.theme || "radical";
        var show = d.show || [];
        var parts = [];
        if (show.indexOf("stats") > -1) parts.push('<img src="https://github-readme-stats.vercel.app/api?username=' + u + '&show_icons=true&theme=' + theme + '&hide_border=true" alt="GitHub stats" height="165" />');
        if (show.indexOf("langs") > -1) parts.push('<img src="https://github-readme-stats.vercel.app/api/top-langs/?username=' + u + '&layout=compact&theme=' + theme + '&hide_border=true" alt="Top languages" height="165" />');
        if (show.indexOf("streak") > -1) parts.push('<img src="https://github-readme-streak-stats.herokuapp.com/?user=' + u + '&theme=' + theme + '&hide_border=true" alt="GitHub streak" />');
        if (show.indexOf("trophies") > -1) parts.push('<img src="https://github-profile-trophy.vercel.app/?username=' + u + '&theme=' + theme + '&no-frame=true&row=1&column=6" alt="Trophies" />');
        if (show.indexOf("activity") > -1) parts.push('<img src="https://github-readme-activity-graph.vercel.app/graph?username=' + u + '&theme=' + theme + '&hide_border=true" alt="Activity graph" />');
        if (!parts.length) return "";
        return '<p align="center">\n' + parts.map(function (p) { return "  " + p; }).join("\n") + "\n</p>";
      }
    },

    divider: {
      label: "Divider", icon: "➖", group: "More",
      defaults: function () { return {}; },
      fields: [],
      render: function () { return "---"; }
    },

    custom: {
      label: "Custom Markdown", icon: "✍️", group: "More",
      defaults: function () { return { text: "" }; },
      fields: [{ k: "text", label: "Your Markdown", type: "textarea", rows: 10, ph: "Anything GitHub-flavoured Markdown…" }],
      render: function (d) { return (d.text || "").trim(); }
    }
  };

  var GROUPS = ["Essentials", "Showcase", "Community", "Profile", "More"];

  /* ==========================================================================
     Templates
     ========================================================================== */
  function blk(type, data) { return { id: uid(), type: type, data: data }; }

  var TEMPLATES = {
    starter: {
      label: "Starter project", desc: "A clean, complete project README to get going fast.",
      build: function (g) {
        var repo = g.repo || "my-project";
        return [
          blk("header", { name: g.name || "My Project", emoji: "✨", tagline: "A short, punchy one-line description of what this does.", logo: "", align: "center" }),
          blk("badges", { items: [
            { type: "stars", alt: "stars", style: "flat-square", owner: g.owner || "", repo: repo },
            { type: "license", alt: "license", style: "flat-square", owner: g.owner || "", repo: repo },
            { type: "last-commit", alt: "last commit", style: "flat-square", owner: g.owner || "", repo: repo }
          ] }),
          blk("description", { text: "Explain the problem this project solves and who it is for. Keep it friendly and concrete — a visitor should understand the value in ten seconds." }),
          blk("features", { heading: "Features", items: ["⚡ Fast and lightweight", "🧩 Easy to extend", "📱 Responsive by default", "🔒 Secure and private"] }),
          blk("installation", { text: "Clone the repository and install dependencies:", lang: "bash", code: "git clone https://github.com/" + (g.owner || "user") + "/" + repo + ".git\ncd " + repo + "\nnpm install" }),
          blk("usage", { text: "Run the project locally:", lang: "bash", code: "npm start" }),
          blk("license", { type: "MIT", author: g.name || "", year: String(new Date().getFullYear()) })
        ];
      }
    },
    minimal: {
      label: "Minimal", desc: "Just the essentials — name, description, install and licence.",
      build: function (g) {
        return [
          blk("header", { name: g.name || "My Project", emoji: "", tagline: "A short description.", logo: "", align: "center" }),
          blk("description", { text: "A paragraph about your project." }),
          blk("installation", { text: "", lang: "bash", code: "npm install" }),
          blk("usage", { text: "", lang: "bash", code: "npm start" }),
          blk("license", { type: "MIT", author: g.name || "", year: String(new Date().getFullYear()) })
        ];
      }
    },
    library: {
      label: "Library / package", desc: "For npm / PyPI packages with badges, usage and FAQ.",
      build: function (g) {
        var pkg = g.repo || "my-package";
        return [
          blk("header", { name: g.name || "my-package", emoji: "📦", tagline: "A tiny, focused library that does one thing well.", logo: "", align: "center" }),
          blk("badges", { items: [
            { type: "npm-version", pkg: pkg, alt: "npm version", style: "flat-square" },
            { type: "npm-downloads", pkg: pkg, alt: "npm downloads", style: "flat-square" },
            { type: "license", owner: g.owner || "", repo: pkg, alt: "license", style: "flat-square" }
          ] }),
          blk("description", { text: "Describe the library, its API surface and when to use it." }),
          blk("installation", { text: "Install from npm:", lang: "bash", code: "npm install " + pkg }),
          blk("usage", { text: "Import and use it:", lang: "javascript", code: "import { thing } from \"" + pkg + "\";\n\nthing();" }),
          blk("techstack", { heading: "Built with", style: "badges", items: ["TypeScript|typescript|3178C6", "Node.js|nodedotjs|5FA04E"] }),
          blk("faq", { heading: "FAQ", items: [{ q: "Does it work in the browser?", a: "Yes — it ships as ESM and CJS." }] }),
          blk("contributing", { text: "Pull requests are welcome! Please open an issue first to discuss what you would like to change." }),
          blk("license", { type: "MIT", author: g.name || "", year: String(new Date().getFullYear()) })
        ];
      }
    },
    api: {
      label: "API / backend", desc: "Endpoints, auth, request/response examples.",
      build: function (g) {
        return [
          blk("header", { name: g.name || "My API", emoji: "🛠️", tagline: "A fast, RESTful API for your application.", logo: "", align: "center" }),
          blk("badges", { items: [{ type: "license", owner: g.owner || "", repo: g.repo || "", alt: "license", style: "flat-square" }] }),
          blk("description", { text: "Describe the API, its base URL and authentication model." }),
          blk("installation", { text: "Install and run the server:", lang: "bash", code: "npm install\nnpm run dev" }),
          blk("usage", { text: "Make a request:", lang: "bash", code: "curl -X GET http://localhost:3000/api/items \\\n  -H \"Authorization: Bearer <token>\"" }),
          blk("custom", { text: "## Endpoints\n\n| Method | Endpoint | Description |\n| --- | --- | --- |\n| GET | `/api/items` | List all items |\n| POST | `/api/items` | Create an item |\n| GET | `/api/items/:id` | Get one item |\n| DELETE | `/api/items/:id` | Delete an item |" }),
          blk("license", { type: "MIT", author: g.name || "", year: String(new Date().getFullYear()) })
        ];
      }
    },
    profile: {
      label: "GitHub profile README", desc: "For your username repo — greeting, stats and socials.",
      build: function (g) {
        return [
          blk("header", { name: g.name || "Your Name", emoji: "👋", tagline: "Full-stack developer · building things on the web.", logo: "", align: "center" }),
          blk("description", { text: "Hi! I'm a developer who loves building fast, useful products. I work mostly with JavaScript, TypeScript and Python, and I'm always learning something new.\n\n- 🔭 Currently working on **my next side project**\n- 🌱 Learning **system design**\n- 💬 Ask me about **web development**\n- ⚡ Fun fact: I debug faster with coffee ☕" }),
          blk("stats", { owner: g.owner || "your-username", theme: "radical", show: ["stats", "langs", "streak", "trophies", "activity"] }),
          blk("contact", { heading: "Connect with me", items: [{ platform: "github", handle: g.owner || "", url: "" }, { platform: "linkedin", handle: "", url: "" }, { platform: "twitter", handle: "", url: "" }, { platform: "email", handle: "", url: "" }] }),
          blk("support", { text: "⭐ From [Your Name](https://github.com/" + (g.owner || "") + ")" })
        ];
      }
    },
    awesome: {
      label: "Awesome list", desc: "A curated list with a table of contents and sections.",
      build: function (g) {
        return [
          blk("header", { name: g.name || "Awesome List", emoji: "🌟", tagline: "A curated list of awesome things.", logo: "", align: "center" }),
          blk("toc", { heading: "Contents", depth: "2" }),
          blk("custom", { text: "## Getting Started\n\n- [Resource one](https://example.com) — why it is useful\n- [Resource two](https://example.com) — why it is useful" }),
          blk("custom", { text: "## Tools\n\n- [Tool one](https://example.com) — what it does\n- [Tool two](https://example.com) — what it does" }),
          blk("contributing", { text: "Your contributions are always welcome! Please read the contribution guidelines first." }),
          blk("license", { type: "MIT", author: g.name || "", year: String(new Date().getFullYear()) })
        ];
      }
    }
  };

  /* ==========================================================================
     State
     ========================================================================== */
  var STORE_KEY = "readmeforge.v1";
  var state = {
    mode: "builder",
    blocks: [],
    globals: { name: "", owner: "", repo: "" },
    rawDirty: false
  };
  var mdInput, previewEl;

  function save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({
        mode: state.mode,
        blocks: state.blocks,
        globals: state.globals
      }));
    } catch (e) { /* storage may be full or blocked */ }
  }

  function load() {
    var raw;
    try { raw = localStorage.getItem(STORE_KEY); } catch (e) { raw = null; }
    if (!raw) return false;
    try {
      var d = JSON.parse(raw);
      if (!d || !Array.isArray(d.blocks)) return false;
      state.blocks = d.blocks;
      state.globals = d.globals || state.globals;
      state.mode = d.mode === "markdown" ? "markdown" : "builder";
      return true;
    } catch (e) { return false; }
  }

  /* ==========================================================================
     Compile blocks -> Markdown
     ========================================================================== */
  function renderBlock(b, g) {
    var def = BLOCKS[b.type];
    if (!def) return "";
    try { return def.render(b.data || {}, g) || ""; } catch (e) { return ""; }
  }

  function buildToc(md, heading, maxDepth) {
    var rows = md.split("\n");
    var items = [];
    var inFence = false;
    for (var i = 0; i < rows.length; i++) {
      var line = rows[i];
      if (/^\s*```/.test(line)) { inFence = !inFence; continue; }
      if (inFence) continue;
      var m = line.match(/^(#{2,4})\s+(.+?)\s*$/);
      if (!m) continue;
      var level = m[1].length;
      if (level > maxDepth) continue;
      var text = m[2].replace(/[*_`~]/g, "").replace(/<[^>]+>/g, "").trim();
      if (!text) continue;
      items.push({ level: level, text: text, slug: slugify(text) });
    }
    if (!items.length) return "";
    var out = items.map(function (it) {
      return new Array(it.level - 2 + 1).join("  ") + "- [" + it.text + "](#" + it.slug + ")";
    });
    return "## " + (heading || "Table of Contents") + "\n\n" + out.join("\n");
  }

  function compile(blocks, g) {
    var nonToc = [];
    blocks.forEach(function (b) { if (b.type !== "toc") nonToc.push(renderBlock(b, g)); });
    var baseMd = nonToc.filter(Boolean).join("\n\n");

    var parts = [];
    blocks.forEach(function (b) {
      if (b.type === "toc") {
        parts.push(buildToc(baseMd, b.data.heading, parseInt(b.data.depth, 10) || 3));
      } else {
        parts.push(renderBlock(b, g));
      }
    });
    return parts.filter(Boolean).join("\n\n").trim() + "\n";
  }

  function currentMarkdown() {
    if (state.mode === "markdown") return mdInput.value;
    return compile(state.blocks, state.globals);
  }

  /* ==========================================================================
     Form rendering
     ========================================================================== */
  function fieldHTML(b, f) {
    var v = (b.data || {})[f.k];
    var id = "f_" + b.id + "_" + f.k;
    var h = '<div class="field">';
    if (f.type !== "checks" && f.type !== "badges") {
      h += '<label for="' + id + '">' + esc(f.label) + "</label>";
    }

    if (f.type === "text") {
      h += '<input type="text" id="' + id + '" data-key="' + f.k + '" value="' + esc(v || "") + '" placeholder="' + esc(f.ph || "") + '" autocomplete="off" />';
    } else if (f.type === "textarea") {
      h += '<textarea id="' + id + '" data-key="' + f.k + '" rows="' + (f.rows || 3) + '" placeholder="' + esc(f.ph || "") + '">' + esc(v || "") + "</textarea>";
    } else if (f.type === "list") {
      h += '<textarea id="' + id + '" data-key="' + f.k + '" data-list="1" rows="' + (f.rows || 4) + '" placeholder="' + esc(f.ph || "") + '">' + esc((v || []).join("\n")) + "</textarea>";
    } else if (f.type === "select") {
      h += '<select id="' + id + '" data-key="' + f.k + '">' + (f.opts || []).map(function (o) {
        return '<option value="' + esc(o) + '"' + (String(v) === String(o) ? " selected" : "") + ">" + esc(o) + "</option>";
      }).join("") + "</select>";
    } else if (f.type === "checks") {
      h += '<div class="subhead">' + esc(f.label) + "</div>";
      h += (f.opts || []).map(function (o) {
        var checked = (v || []).indexOf(o[0]) > -1 ? " checked" : "";
        return '<label class="check" style="margin-bottom:6px"><input type="checkbox" data-key="' + f.k + '" data-check="' + esc(o[0]) + '"' + checked + " /> " + esc(o[1]) + "</label>";
      }).join("");
    } else if (f.type === "pairs") {
      var arr = v || [];
      h += '<div class="subhead">' + esc(f.label) + "</div>";
      arr.forEach(function (row, i) {
        h += '<div class="pair">';
        f.fields.forEach(function (sub, j) {
          var val = row[sub] || "";
          var ph = f.ph ? (f.ph[j] || "") : "";
          if (f.select && f.select[j]) {
            h += '<select data-key="' + f.k + '" data-idx="' + i + '" data-sub="' + sub + '">' +
              f.select[j].map(function (o) { return '<option value="' + esc(o) + '"' + (val === o ? " selected" : "") + ">" + esc(o) + "</option>"; }).join("") +
              "</select>";
          } else if (f.long && f.long[j]) {
            h += '<textarea class="grow" rows="2" data-key="' + f.k + '" data-idx="' + i + '" data-sub="' + sub + '" placeholder="' + esc(ph) + '">' + esc(val) + "</textarea>";
          } else {
            h += '<input class="grow" type="text" data-key="' + f.k + '" data-idx="' + i + '" data-sub="' + sub + '" value="' + esc(val) + '" placeholder="' + esc(ph) + '" autocomplete="off" />';
          }
        });
        h += '<button class="btn btn-ghost btn-icon btn-danger" type="button" data-act="pair-del" data-key="' + f.k + '" data-idx="' + i + '" title="Remove">✕</button>';
        h += "</div>";
      });
      h += '<button class="btn btn-sm" type="button" data-act="pair-add" data-key="' + f.k + '">+ ' + esc(f.addLabel || "Add row") + "</button>";
    } else if (f.type === "badges") {
      var items = v || [];
      h += '<div class="subhead">' + esc(f.label) + "</div>";
      items.forEach(function (it, i) {
        var t = it.type || "custom";
        var isRepo = ["stars", "forks", "issues", "license", "last-commit", "contributors", "repo-size"].indexOf(t) > -1;
        var isPkg = ["npm-version", "npm-downloads", "pypi-version", "pypi-downloads"].indexOf(t) > -1;
        var sel = function (k, opts, cls) {
          return '<select data-key="' + f.k + '" data-idx="' + i + '" data-sub="' + k + '"' + (cls ? ' class="' + cls + '"' : "") + ">" +
            opts.map(function (o) {
              var val = o[0], lab = o[1] || o[0];
              return '<option value="' + esc(val) + '"' + (String(it[k]) === val ? " selected" : "") + ">" + esc(lab) + "</option>";
            }).join("") + "</select>";
        };
        var txt = function (k, ph, cls) {
          return '<input type="text" data-key="' + f.k + '" data-idx="' + i + '" data-sub="' + k + '" value="' + esc(it[k] || "") + '" placeholder="' + esc(ph) + '" autocomplete="off"' + (cls ? ' class="' + cls + '"' : "") + " />";
        };
        h += '<div class="badge-row">';
        h += '<div class="pair">' + sel("type", [
          ["custom", "Custom label"], ["stars", "GitHub stars"], ["forks", "GitHub forks"], ["issues", "Open issues"],
          ["license", "Licence"], ["last-commit", "Last commit"], ["contributors", "Contributors"], ["repo-size", "Repo size"],
          ["npm-version", "npm version"], ["npm-downloads", "npm downloads"], ["pypi-version", "PyPI version"], ["pypi-downloads", "PyPI downloads"]
        ], "grow") + sel("style", [["flat-square", "flat-square"], ["flat", "flat"], ["plastic", "plastic"], ["for-the-badge", "for-the-badge"], ["social", "social"]]) +
          '<button class="btn btn-ghost btn-icon btn-danger" type="button" data-act="pair-del" data-key="' + f.k + '" data-idx="' + i + '" title="Remove">✕</button></div>';
        if (t === "custom") {
          h += '<div class="pair">' + txt("label", "label", "grow") + txt("message", "message", "grow") +
            '<input type="color" data-key="' + f.k + '" data-idx="' + i + '" data-sub="color" value="' + esc(it.color || "#6d5efc") + '" title="Colour" />' + "</div>";
          h += '<div class="pair">' + txt("logo", "logo (e.g. react)", "grow") + txt("logoColor", "logo colour", "grow") + "</div>";
        } else if (isRepo) {
          h += '<div class="pair">' + txt("owner", "owner", "grow") + txt("repo", "repo", "grow") + "</div>";
        } else if (isPkg) {
          h += '<div class="pair">' + txt("pkg", "package name", "grow") + "</div>";
        }
        h += "</div>";
      });
      h += '<button class="btn btn-sm" type="button" data-act="pair-add" data-key="' + f.k + '">+ Add badge</button>';
    }
    h += "</div>";
    return h;
  }

  function blockHTML(b) {
    var def = BLOCKS[b.type];
    var fields = def.fields || [];
    var body = fields.length
      ? fields.map(function (f) { return fieldHTML(b, f); }).join("")
      : '<p style="margin:0;color:var(--muted);font-size:13px">No options — just drop it in.</p>';
    return '<div class="block" data-id="' + b.id + '">' +
      '<div class="block-head">' +
        '<span class="drag" aria-hidden="true">⠿</span>' +
        '<span class="ico">' + def.icon + "</span>" +
        '<span class="name">' + esc(def.label) + "</span>" +
        '<span class="spacer"></span>' +
        '<div class="block-actions">' +
          '<button class="btn btn-ghost btn-icon btn-sm" type="button" data-act="up" title="Move up">↑</button>' +
          '<button class="btn btn-ghost btn-icon btn-sm" type="button" data-act="down" title="Move down">↓</button>' +
          '<button class="btn btn-ghost btn-icon btn-sm" type="button" data-act="dup" title="Duplicate">⧉</button>' +
          '<button class="btn btn-ghost btn-icon btn-sm btn-danger" type="button" data-act="del" title="Delete">✕</button>' +
        "</div>" +
      "</div>" +
      '<div class="block-body">' + body + "</div>" +
    "</div>";
  }

  function renderBlocks() {
    var wrap = $("#blocks");
    if (!state.blocks.length) {
      wrap.innerHTML = '<div class="blocks-empty"><strong>Your README is empty</strong>Add a section from the Library, or pick a template to get started.</div>';
    } else {
      wrap.innerHTML = state.blocks.map(blockHTML).join("");
    }
    updateCounts();
  }

  function renderLibrary() {
    var wrap = $("#libraryList");
    var html = "";
    GROUPS.forEach(function (gr) {
      var entries = Object.keys(BLOCKS).filter(function (k) { return BLOCKS[k].group === gr; });
      if (!entries.length) return;
      html += '<div class="lib-section"><h3>' + gr + "</h3>";
      entries.forEach(function (k) {
        html += '<button class="lib-item" type="button" data-add="' + k + '"><span class="ico">' + BLOCKS[k].icon + "</span>" +
          esc(BLOCKS[k].label) + '<span class="plus">+</span></button>';
      });
      html += "</div>";
    });
    wrap.innerHTML = html;
    $("#libCount").textContent = Object.keys(BLOCKS).length + " blocks";
  }

  function updateCounts() {
    var n = state.blocks.length;
    $("#editorCount").textContent = state.mode === "builder"
      ? (n + (n === 1 ? " block" : " blocks"))
      : (mdInput.value.length + " chars");
  }

  /* ==========================================================================
     Preview
     ========================================================================== */
  function renderPreview() {
    var md = currentMarkdown();
    var html = "";
    try {
      if (window.marked && typeof window.marked.parse === "function") {
        html = window.marked.parse(md, { gfm: true, breaks: false });
      } else {
        html = "<pre>" + esc(md) + "</pre>";
      }
    } catch (e) { html = "<pre>" + esc(md) + "</pre>"; }
    if (window.DOMPurify) {
      html = window.DOMPurify.sanitize(html, { ADD_ATTR: ["align", "target", "width", "height"], ADD_TAGS: ["details", "summary"] });
    }
    previewEl.innerHTML = html && html.trim()
      ? html
      : '<p style="color:var(--muted)">Your live preview will appear here as you build. 🚀</p>';
    updateCounts();
  }

  /* ==========================================================================
     Block operations
     ========================================================================== */
  function addBlock(type, data) {
    var def = BLOCKS[type];
    if (!def) return;
    var b = { id: uid(), type: type, data: data || def.defaults(state.globals) };
    state.blocks.push(b);
    renderBlocks(); renderPreview(); save();
    var el = $('.block[data-id="' + b.id + '"]');
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function findIndex(id) {
    for (var i = 0; i < state.blocks.length; i++) if (state.blocks[i].id === id) return i;
    return -1;
  }

  function moveBlock(id, dir) {
    var i = findIndex(id);
    if (i < 0) return;
    var j = i + dir;
    if (j < 0 || j >= state.blocks.length) return;
    var tmp = state.blocks[i]; state.blocks[i] = state.blocks[j]; state.blocks[j] = tmp;
    renderBlocks(); renderPreview(); save();
  }

  function deleteBlock(id) {
    var i = findIndex(id);
    if (i < 0) return;
    state.blocks.splice(i, 1);
    renderBlocks(); renderPreview(); save();
  }

  function duplicateBlock(id) {
    var i = findIndex(id);
    if (i < 0) return;
    var copy = JSON.parse(JSON.stringify(state.blocks[i]));
    copy.id = uid();
    state.blocks.splice(i + 1, 0, copy);
    renderBlocks(); renderPreview(); save();
  }

  /* ==========================================================================
     Editor events
     ========================================================================== */
  function bindEditor() {
    var blocksWrap = $("#blocks");

    // structural buttons (up/down/dup/del) + add/remove rows
    blocksWrap.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-act]");
      if (!btn) return;
      var act = btn.getAttribute("data-act");
      var blockEl = e.target.closest(".block");
      var id = blockEl ? blockEl.getAttribute("data-id") : null;
      var key = btn.getAttribute("data-key");
      var idx = parseInt(btn.getAttribute("data-idx"), 10);

      if (act === "up") return moveBlock(id, -1);
      if (act === "down") return moveBlock(id, 1);
      if (act === "dup") return duplicateBlock(id);
      if (act === "del") return deleteBlock(id);

      if (act === "pair-add" || act === "pair-del") {
        var b = state.blocks[findIndex(id)];
        if (!b) return;
        if (!Array.isArray(b.data[key])) b.data[key] = [];
        if (act === "pair-add") {
          if (key === "items" && b.type === "badges") {
            b.data[key].push({ type: "custom", label: "", message: "", color: "#6d5efc", style: "flat-square", logo: "", logoColor: "", owner: "", repo: "", pkg: "", alt: "" });
          } else if (key === "items" && b.type === "contact") {
            b.data[key].push({ platform: "github", handle: "", url: "" });
          } else if (key === "items" && b.type === "faq") {
            b.data[key].push({ q: "", a: "" });
          } else if (key === "items" && b.type === "screenshots") {
            b.data[key].push({ src: "", caption: "" });
          } else {
            b.data[key].push({});
          }
        } else {
          b.data[key].splice(idx, 1);
        }
        renderBlocks(); renderPreview(); save();
      }
    });

    // field input
    function onEdit(e) {
      var el = e.target;
      if (!el || !el.matches("[data-key]")) return;
      var blockEl = el.closest(".block");
      if (!blockEl) return;
      var b = state.blocks[findIndex(blockEl.getAttribute("data-id"))];
      if (!b) return;
      var key = el.getAttribute("data-key");
      var sub = el.getAttribute("data-sub");
      var idx = el.getAttribute("data-idx");

      if (el.getAttribute("data-list") === "1") {
        b.data[key] = el.value.split("\n");
      } else if (el.getAttribute("data-check")) {
        var v = b.data[key] || [];
        var cv = el.getAttribute("data-check");
        var pos = v.indexOf(cv);
        if (el.checked && pos < 0) v.push(cv);
        if (!el.checked && pos > -1) v.splice(pos, 1);
        b.data[key] = v;
      } else if (sub != null) {
        if (!Array.isArray(b.data[key])) b.data[key] = [];
        if (!b.data[key][idx]) b.data[key][idx] = {};
        b.data[key][idx][sub] = el.value;
      } else {
        b.data[key] = el.value;
      }
      renderPreview(); save();

      // badge "type" select changes the visible fields — re-render that block
      if (el.tagName === "SELECT" && sub === "type") {
        var bid = b.id;
        var tmp = document.createElement("div");
        tmp.innerHTML = blockHTML(b);
        blockEl.parentNode.replaceChild(tmp.firstChild, blockEl);
      }
    }
    blocksWrap.addEventListener("input", onEdit);
    blocksWrap.addEventListener("change", onEdit);

    // drag to reorder (only when grabbing the header)
    var dragId = null;
    blocksWrap.addEventListener("mousedown", function (e) {
      var head = e.target.closest(".block-head");
      var blk = e.target.closest(".block");
      $$(".block", blocksWrap).forEach(function (x) { x.draggable = false; });
      if (head && blk && !e.target.closest("button")) blk.draggable = true;
    });
    blocksWrap.addEventListener("dragstart", function (e) {
      var blk = e.target.closest(".block");
      if (!blk) return;
      dragId = blk.getAttribute("data-id");
      blk.classList.add("dragging");
      try { e.dataTransfer.setData("text/plain", dragId); e.dataTransfer.effectAllowed = "move"; } catch (err) {}
    });
    blocksWrap.addEventListener("dragend", function () {
      $$(".block.dragging,.block.drop-target", blocksWrap).forEach(function (x) { x.classList.remove("dragging", "drop-target"); });
      dragId = null;
    });
    blocksWrap.addEventListener("dragover", function (e) {
      var blk = e.target.closest(".block");
      if (!blk || blk.getAttribute("data-id") === dragId) return;
      e.preventDefault();
      $$(".block.drop-target", blocksWrap).forEach(function (x) { x.classList.remove("drop-target"); });
      blk.classList.add("drop-target");
    });
    blocksWrap.addEventListener("drop", function (e) {
      var blk = e.target.closest(".block");
      if (!blk || !dragId) return;
      e.preventDefault();
      var from = findIndex(dragId), to = findIndex(blk.getAttribute("data-id"));
      if (from < 0 || to < 0 || from === to) return;
      var moved = state.blocks.splice(from, 1)[0];
      state.blocks.splice(to, 0, moved);
      renderBlocks(); renderPreview(); save();
    });
  }

  /* ---------- globals fields ---------- */
  function bindGlobals() {
    ["gName", "gOwner", "gRepo"].forEach(function (id) {
      var el = document.getElementById(id);
      el.value = state.globals[id === "gName" ? "name" : id === "gOwner" ? "owner" : "repo"] || "";
      el.addEventListener("input", function () {
        state.globals.name = $("#gName").value;
        state.globals.owner = $("#gOwner").value;
        state.globals.repo = $("#gRepo").value;
        renderPreview(); save();
      });
    });
  }

  /* ==========================================================================
     Markdown mode + toolbar
     ========================================================================== */
  var MD_TOOLS = [
    { t: "H1", b: "# ", a: "", ph: "Heading", title: "Heading 1" },
    { t: "H2", b: "## ", a: "", ph: "Heading", title: "Heading 2" },
    { t: "H3", b: "### ", a: "", ph: "Heading", title: "Heading 3" },
    { t: "B", b: "**", a: "**", ph: "bold", title: "Bold" },
    { t: "I", b: "_", a: "_", ph: "italic", title: "Italic" },
    { t: "S", b: "~~", a: "~~", ph: "strike", title: "Strikethrough" },
    { t: "🔗", b: "[", a: "](https://)", ph: "link text", title: "Link" },
    { t: "🖼", b: "![", a: "](https://)", ph: "alt text", title: "Image" },
    { t: "`", b: "`", a: "`", ph: "code", title: "Inline code" },
    { t: "{ }", b: FENCE + "\n", a: "\n" + FENCE, ph: "code", title: "Code block" },
    { t: "•", b: "- ", a: "", ph: "item", title: "Bullet list" },
    { t: "1.", b: "1. ", a: "", ph: "item", title: "Numbered list" },
    { t: "☑", b: "- [ ] ", a: "", ph: "task", title: "Task list" },
    { t: "▦", b: "\n| Column | Column |\n| --- | --- |\n| Cell | Cell |\n", a: "", ph: "", title: "Table" },
    { t: "❝", b: "> ", a: "", ph: "quote", title: "Blockquote" },
    { t: "▾", b: "<details>\n<summary>", a: "</summary>\n\n\n\n</details>", ph: "Summary", title: "Collapsible section" },
    { t: "—", b: "\n---\n", a: "", ph: "", title: "Horizontal rule" }
  ];

  function buildToolbar() {
    var bar = $("#mdToolbar");
    bar.innerHTML = MD_TOOLS.map(function (tool, i) {
      return '<button class="btn btn-ghost btn-icon" type="button" data-tool="' + i + '" title="' + esc(tool.title) + '">' + tool.t + "</button>";
    }).join("");
    bar.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-tool]");
      if (!btn) return;
      insertTool(MD_TOOLS[parseInt(btn.getAttribute("data-tool"), 10)]);
    });
  }

  function insertTool(tool) {
    var ta = mdInput;
    var s = ta.selectionStart, en = ta.selectionEnd;
    var sel = ta.value.slice(s, en) || tool.ph || "";
    var text = tool.b + sel + tool.a;
    ta.setRangeText(text, s, en, "end");
    if (!tool.a && tool.b.indexOf("\n") === -1) {
      // leave cursor at end of inserted text
    }
    ta.focus();
    onMarkdownInput();
  }

  function onMarkdownInput() {
    state.rawDirty = true;
    renderPreview(); save();
  }

  function setMode(mode) {
    if (mode === state.mode) return;
    if (mode === "markdown") {
      mdInput.value = compile(state.blocks, state.globals);
      state.rawDirty = false;
      state.mode = "markdown";
    } else {
      if (state.rawDirty && mdInput.value.trim() && mdInput.value !== compile(state.blocks, state.globals)) {
        var ok = window.confirm("Your raw Markdown differs from the builder blocks.\n\nImport it as a single Custom block? (Cancel keeps your builder blocks.)");
        if (ok) {
          state.blocks = [{ id: uid(), type: "custom", data: { text: mdInput.value.replace(/\s+$/, "") } }];
          renderBlocks();
        }
      }
      state.mode = "builder";
      renderBlocks();
    }
    syncModeUI();
    renderPreview(); save();
  }

  function syncModeUI() {
    var isB = state.mode === "builder";
    $("#tabBuilder").setAttribute("aria-selected", isB ? "true" : "false");
    $("#tabMarkdown").setAttribute("aria-selected", isB ? "false" : "true");
    $("#builderPane").hidden = !isB;
    $("#markdownPane").hidden = isB;
    updateCounts();
  }

  /* ==========================================================================
     Modals
     ========================================================================== */
  function closeModal() {
    var m = $("#modalOverlay");
    if (m) m.remove();
    document.removeEventListener("keydown", onModalKey);
  }
  function onModalKey(e) { if (e.key === "Escape") closeModal(); }

  function openModal(title, bodyHTML, footerHTML) {
    closeModal();
    var ov = document.createElement("div");
    ov.className = "modal-overlay";
    ov.id = "modalOverlay";
    ov.innerHTML =
      '<div class="modal" role="dialog" aria-modal="true" aria-label="' + esc(title) + '">' +
        '<div class="modal-head"><h3>' + esc(title) + "</h3>" +
          '<button class="btn btn-ghost btn-icon" type="button" data-close title="Close">✕</button></div>' +
        '<div class="modal-body">' + bodyHTML + "</div>" +
        (footerHTML ? '<div class="modal-foot">' + footerHTML + "</div>" : "") +
      "</div>";
    document.body.appendChild(ov);
    ov.addEventListener("click", function (e) {
      if (e.target === ov || e.target.closest("[data-close]")) closeModal();
    });
    document.addEventListener("keydown", onModalKey);
    return ov;
  }

  function openTemplates() {
    var html = '<div class="tpl-grid">' + Object.keys(TEMPLATES).map(function (k) {
      var t = TEMPLATES[k];
      return '<button class="tpl-card" type="button" data-tpl="' + k + '"><strong>' + esc(t.label) + "</strong><span>" + esc(t.desc) + "</span></button>";
    }).join("") + "</div>";
    var ov = openModal("Start from a template", html);
    ov.addEventListener("click", function (e) {
      var card = e.target.closest("[data-tpl]");
      if (!card) return;
      var key = card.getAttribute("data-tpl");
      if (state.blocks.length && !window.confirm("This replaces your current README. Continue?")) return;
      state.blocks = TEMPLATES[key].build(state.globals);
      closeModal(); renderBlocks(); renderPreview(); save();
      toast("Loaded the " + TEMPLATES[key].label + " template");
    });
  }

  function openImport() {
    var html = '<p style="margin-top:0;color:var(--muted);font-size:13.5px">Paste an existing README to edit it here.</p>' +
      '<textarea id="importArea" rows="12" style="font-family:var(--mono);font-size:12.5px" placeholder="# My Project&#10;&#10;Paste Markdown…"></textarea>';
    var foot = '<button class="btn" type="button" data-close>Cancel</button>' +
      '<button class="btn" type="button" id="importAppend">Append as Custom block</button>' +
      '<button class="btn btn-primary" type="button" id="importReplace">Replace everything</button>';
    var ov = openModal("Import Markdown", html, foot);
    ov.addEventListener("click", function (e) {
      var val = ($("#importArea") || {}).value || "";
      if (e.target.id === "importAppend") {
        if (!val.trim()) return;
        state.blocks.push({ id: uid(), type: "custom", data: { text: val.replace(/\s+$/, "") } });
        closeModal(); renderBlocks(); renderPreview(); save(); toast("Markdown appended");
      }
      if (e.target.id === "importReplace") {
        if (!val.trim()) return;
        state.blocks = [{ id: uid(), type: "custom", data: { text: val.replace(/\s+$/, "") } }];
        closeModal(); renderBlocks(); renderPreview(); save(); toast("Markdown imported");
      }
    });
  }

  /* ==========================================================================
     Theme
     ========================================================================== */
  function initTheme() {
    var saved = null;
    try { saved = localStorage.getItem("readmeforge.theme"); } catch (e) {}
    var theme = saved || (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    applyTheme(theme);
    $("#themeToggle").addEventListener("click", function () {
      applyTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark");
    });
  }
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem("readmeforge.theme", theme); } catch (e) {}
    var sun = $("#iconSun");
    if (sun) sun.style.opacity = theme === "dark" ? ".55" : "1";
  }

  /* ==========================================================================
     Boot
     ========================================================================== */
  function init() {
    mdInput = $("#mdInput");
    previewEl = $("#preview");
    $("#year").textContent = new Date().getFullYear();

    initTheme();
    renderLibrary();
    buildToolbar();
    bindEditor();
    bindGlobals();

    var restored = load();
    if (!restored) {
      state.blocks = TEMPLATES.starter.build(state.globals);
    }
    // reflect globals into inputs
    $("#gName").value = state.globals.name || "";
    $("#gOwner").value = state.globals.owner || "";
    $("#gRepo").value = state.globals.repo || "";

    renderBlocks();
    syncModeUI();
    renderPreview();

    // library add
    $("#libraryList").addEventListener("click", function (e) {
      var btn = e.target.closest("[data-add]");
      if (!btn) return;
      addBlock(btn.getAttribute("data-add"));
    });

    // tabs
    $("#tabBuilder").addEventListener("click", function () { setMode("builder"); });
    $("#tabMarkdown").addEventListener("click", function () { setMode("markdown"); });

    // toolbar buttons
    $("#btnTemplates").addEventListener("click", openTemplates);
    $("#btnImport").addEventListener("click", openImport);
    $("#btnReset").addEventListener("click", function () {
      if (!window.confirm("Clear everything and start over?")) return;
      state.blocks = [];
      state.globals = { name: "", owner: "", repo: "" };
      $("#gName").value = $("#gOwner").value = $("#gRepo").value = "";
      if (state.mode === "markdown") { mdInput.value = ""; state.rawDirty = false; }
      renderBlocks(); renderPreview(); save();
      toast("Cleared");
    });
    $("#btnCopy").addEventListener("click", function () {
      var md = currentMarkdown();
      if (!md.trim()) { toast("Nothing to copy yet"); return; }
      copyText(md).then(function () { toast("Markdown copied to clipboard ✓"); });
    });
    $("#btnDownload").addEventListener("click", function () {
      var md = currentMarkdown();
      if (!md.trim()) { toast("Nothing to download yet"); return; }
      download("README.md", md);
      toast("Downloaded README.md ✓");
    });

    // markdown textarea
    mdInput.addEventListener("input", onMarkdownInput);
    mdInput.addEventListener("keydown", function (e) {
      var meta = e.ctrlKey || e.metaKey;
      if (!meta) return;
      if (e.key === "b") { e.preventDefault(); insertTool(MD_TOOLS[3]); }
      if (e.key === "i") { e.preventDefault(); insertTool(MD_TOOLS[4]); }
      if (e.key === "k") { e.preventDefault(); insertTool(MD_TOOLS[6]); }
    });

    // mobile pane switch
    var grid = $("#appGrid");
    $$(".mobile-panes button").forEach(function (b) {
      b.addEventListener("click", function () {
        var pane = b.getAttribute("data-pane");
        grid.setAttribute("data-pane", pane);
        $$(".mobile-panes button").forEach(function (x) { x.setAttribute("aria-selected", x === b ? "true" : "false"); });
      });
    });

    // warn before leaving with unsaved-looking work is unnecessary (auto-saved),
    // but surface the keyboard shortcut for download
    document.addEventListener("keydown", function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); $("#btnDownload").click(); }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
