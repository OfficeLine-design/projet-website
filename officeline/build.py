#!/usr/bin/env python3
"""
Office Line — static multilingual site generator.
Renders Jinja2 templates x3 languages (fr, en, ar) into dist/{lang}/*.html
Falls back to French for any untranslated string so the site always works,
even before EN/AR translations are supplied.

Usage: python3 build.py
"""
import json
import shutil
from pathlib import Path
from jinja2 import Environment, FileSystemLoader, select_autoescape

ROOT = Path(__file__).parent
DATA = ROOT / "data"
TEMPLATES = ROOT / "templates"
STATIC = ROOT / "static"
DIST = ROOT / "dist"

LANGS = ["fr", "en", "ar"]


def load(name):
    with open(DATA / name, encoding="utf-8") as f:
        return json.load(f)


def deep_fallback(value, fallback):
    """Recursively fill empty strings/lists in `value` with `fallback` (French)."""
    if isinstance(fallback, dict):
        result = {}
        for k, fb_v in fallback.items():
            v = value.get(k) if isinstance(value, dict) else None
            result[k] = deep_fallback(v, fb_v)
        return result
    if isinstance(fallback, list):
        if isinstance(value, list) and len(value) > 0:
            return value
        return fallback
    if isinstance(fallback, str):
        if isinstance(value, str) and value.strip():
            return value
        return fallback
    return value if value is not None else fallback


def catalog_fallback(families):
    """Catalog JSON stores {fr,en,ar} inline per field; nothing to do here,
    template already does `s[lang] or s.fr`. Kept for clarity/extension."""
    return families


def main():
    if DIST.exists():
        shutil.rmtree(DIST)
    DIST.mkdir(parents=True)

    # ---- copy static assets ----
    shutil.copytree(STATIC, DIST / "assets")

    env = Environment(
        loader=FileSystemLoader(str(TEMPLATES)),
        autoescape=select_autoescape(["html"]),
        trim_blocks=True,
        lstrip_blocks=True,
    )

    company = load("company.json")
    bureautique = load("bureautique.json")
    equipements = load("equipements.json")
    strings_fr = load("strings.fr.json")

    for lang in LANGS:
        lang_dir = DIST / lang
        lang_dir.mkdir(parents=True, exist_ok=True)

        strings_raw = load(f"strings.{lang}.json") if lang != "fr" else strings_fr
        t = deep_fallback(strings_raw, strings_fr) if lang != "fr" else strings_fr

        common_ctx = {
            "lang": lang,
            "t": t,
            "company": company,
            "bureautique": bureautique,
            "equipements": equipements,
        }

        # ---- Home ----
        tpl = env.get_template("home.html")
        html = tpl.render(
            **common_ctx,
            page_id="home",
            page_path="index.html",
            meta_title=t["meta"]["home_title"],
            meta_description=t["meta"]["home_description"],
        )
        (lang_dir / "index.html").write_text(html, encoding="utf-8")

        # ---- Homepage concepts for review ----
        for concept_id in [1, 2, 3]:
            tpl = env.get_template(f"home-template-{concept_id}.html")
            html = tpl.render(
                **common_ctx,
                page_id=f"home-template-{concept_id}",
                page_path=f"template-{concept_id}.html",
                meta_title=f"Office Line — Template {concept_id}",
                meta_description=t["meta"]["home_description"],
            )
            (lang_dir / f"template-{concept_id}.html").write_text(html, encoding="utf-8")

        # ---- Bureautique catalog ----
        tpl = env.get_template("catalog.html")
        html = tpl.render(
            **common_ctx,
            page_id="bureautique",
            page_path="bureautique.html",
            meta_title=t["meta"]["bureautique_title"],
            meta_description=t["meta"]["bureautique_description"],
            families=bureautique["families"],
            accent_color="#333366",
            catalog_title=t["nav"]["bureautique"],
            catalog_intro=t["catalog"]["families_intro"],
        )
        (lang_dir / "bureautique.html").write_text(html, encoding="utf-8")

        # ---- Equipements catalog ----
        html = tpl.render(
            **common_ctx,
            page_id="equipements",
            page_path="equipements.html",
            meta_title=t["meta"]["equipements_title"],
            meta_description=t["meta"]["equipements_description"],
            families=equipements["families"],
            accent_color="#6699CC",
            catalog_title=t["nav"]["equipements"],
            catalog_intro=t["catalog"]["equip_intro"],
        )
        (lang_dir / "equipements.html").write_text(html, encoding="utf-8")

        # ---- Services / About ----
        tpl = env.get_template("services.html")
        html = tpl.render(
            **common_ctx,
            page_id="services",
            page_path="services.html",
            meta_title=t["services"]["meta_title"],
            meta_description=t["services"]["meta_description"],
        )
        (lang_dir / "services.html").write_text(html, encoding="utf-8")

        # ---- Contact ----
        tpl = env.get_template("contact.html")
        html = tpl.render(
            **common_ctx,
            page_id="contact",
            page_path="contact.html",
            meta_title=t["meta"]["contact_title"],
            meta_description=t["meta"]["contact_description"],
        )
        (lang_dir / "contact.html").write_text(html, encoding="utf-8")

        # ---- Distributor login ----
        tpl = env.get_template("distributor.html")
        html = tpl.render(
            **common_ctx,
            page_id="distributor",
            page_path="espace-distributeurs.html",
            meta_title=t["distributor"]["title"] + " | Office Line",
            meta_description=t["distributor"]["subtitle"],
        )
        (lang_dir / "espace-distributeurs.html").write_text(html, encoding="utf-8")

        # ---- Legal pages ----
        tpl = env.get_template("legal.html")
        for key, filename in [
            ("mentions", "mentions-legales.html"),
            ("privacy", "confidentialite.html"),
            ("compliance", "conformite-18-07.html"),
        ]:
            legal = t["legal"][key]
            html = tpl.render(
                **common_ctx,
                page_id="legal",
                page_path=filename,
                meta_title=legal["meta_title"],
                meta_description=legal["meta_description"],
                legal_title=legal["title"],
                legal_body=legal["body"],
            )
            (lang_dir / filename).write_text(html, encoding="utf-8")

    # ---- sitemap.xml ----
    pages = ["index.html", "bureautique.html", "equipements.html", "services.html", "contact.html",
             "espace-distributeurs.html", "mentions-legales.html", "confidentialite.html",
             "conformite-18-07.html"]
    urls = []
    for page in pages:
        for lang in LANGS:
            urls.append(f"  <url><loc>{company['domain']}/{lang}/{page}</loc></url>")
    sitemap = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "\n".join(urls) + "\n</urlset>\n"
    )
    (DIST / "sitemap.xml").write_text(sitemap, encoding="utf-8")

    # ---- robots.txt ----
    robots = f"User-agent: *\nAllow: /\nSitemap: {company['domain']}/sitemap.xml\n"
    (DIST / "robots.txt").write_text(robots, encoding="utf-8")

    # ---- root redirect (defaults to French) ----
    redirect_html = """<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<meta http-equiv="refresh" content="0; url=/fr/index.html">
<link rel="canonical" href="/fr/index.html">
<title>Office Line</title>
</head><body>
<p>Redirection vers <a href="/fr/index.html">officeline-dz.com/fr</a>...</p>
</body></html>"""
    (DIST / "index.html").write_text(redirect_html, encoding="utf-8")

    print("Build complete →", DIST)


if __name__ == "__main__":
    main()
