#!/usr/bin/env python3
"""Build the canonical AI-readable Markdown mirror from the public HTML pages."""

from __future__ import annotations

import json
import re
from datetime import date
from html import unescape
from pathlib import Path
from urllib.parse import urljoin

from bs4 import BeautifulSoup, NavigableString, Tag


ROOT = Path(__file__).resolve().parents[1]
SITE_URL = "https://elara-aerospace.com/"
OUTPUT = ROOT / "llms-full.md"

PAGE_PATHS = [
    "index.html", "about.html", "starleap.html", "starlight.html", "tb30.html",
    "other-projects.html", "regulation-valve.html", "payload.html", "team.html",
    "partners.html", "partner-with-us.html", "donate.html", "contact.html",
    "events.html", "news.html", "glossary.html", "legal.html", "competition.html",
]
NEWS_PATHS = sorted(p.relative_to(ROOT).as_posix() for p in (ROOT / "news").glob("*.html"))


def clean_text(value: str) -> str:
    value = unescape(value.replace("\xa0", " "))
    value = re.sub(r"\s+", " ", value).strip()
    value = re.sub(r"\s+([,.;:!?%)\]])", r"\1", value)
    value = re.sub(r"([([])\s+", r"\1", value)
    return value


def absolute_url(href: str, source: Path) -> str:
    if href.startswith(("http://", "https://", "mailto:", "tel:", "#")):
        return href
    relative = href.lstrip("./")
    if source.parent.name == "news":
        relative = relative.removeprefix("../")
    return urljoin(SITE_URL, relative)


def inline_text(node: Tag | NavigableString, source: Path) -> str:
    if isinstance(node, NavigableString):
        return clean_text(str(node))
    if not isinstance(node, Tag) or node.get("aria-hidden") == "true":
        return ""
    if node.name == "br":
        return " "
    if node.name == "img":
        alt = clean_text(node.get("alt", ""))
        return f"[Image: {alt}]" if alt else ""
    if node.name == "a":
        label = clean_text("".join(inline_text(child, source) for child in node.children))
        href = node.get("href")
        return f"[{label}]({absolute_url(href, source)})" if href and label else label
    parts = [inline_text(child, source) for child in node.children]
    return clean_text(" ".join(part for part in parts if part))


def table_markdown(table: Tag, source: Path) -> list[str]:
    rows: list[list[str]] = []
    for row in table.find_all("tr"):
        cells = row.find_all(["th", "td"], recursive=False)
        values = [clean_text(inline_text(cell, source)).replace("|", "\\|") for cell in cells]
        if values:
            rows.append(values)
    if not rows:
        return []
    width = max(len(row) for row in rows)
    rows = [row + [""] * (width - len(row)) for row in rows]
    lines = ["| " + " | ".join(rows[0]) + " |", "| " + " | ".join("---" for _ in range(width)) + " |"]
    lines.extend("| " + " | ".join(row) + " |" for row in rows[1:])
    return lines


def render_blocks(container: Tag, source: Path) -> list[str]:
    lines: list[str] = []

    def visit(node: Tag) -> None:
        name = node.name
        if node.get("aria-hidden") == "true" or name in {"script", "style", "noscript", "form", "button", "input", "select", "textarea", "svg"}:
            return
        if name in {"h1", "h2", "h3", "h4", "h5", "h6"}:
            text = clean_text(inline_text(node, source))
            if text:
                lines.extend([f"{'#' * int(name[1])} {text}", ""])
            return
        if name in {"p", "blockquote", "figcaption", "dt", "dd"}:
            text = clean_text(inline_text(node, source))
            if text:
                lines.extend([f"> {text}" if name == "blockquote" else text, ""])
            return
        if name == "li":
            text = clean_text(inline_text(node, source))
            if text:
                lines.append(f"- {text}")
            return
        if name == "table":
            lines.extend(table_markdown(node, source))
            lines.append("")
            return
        if name == "img":
            alt = clean_text(node.get("alt", ""))
            if alt:
                lines.extend([f"[Image: {alt}]", ""])
            return
        for child in node.children:
            if isinstance(child, Tag):
                visit(child)

    for child in container.children:
        if isinstance(child, Tag):
            visit(child)
    compact: list[str] = []
    for line in lines:
        if line == "" and compact and compact[-1] == "":
            continue
        compact.append(line)
    while compact and compact[-1] == "":
        compact.pop()
    return compact


def page_section(relative_path: str) -> list[str]:
    source = ROOT / relative_path
    soup = BeautifulSoup(source.read_text(encoding="utf-8", errors="ignore"), "html.parser")
    main = soup.find("main") or soup.body
    if not main:
        return []
    for element in main.select(".hero-actions, .carousel-controls, .newsletter-form, .cookie-banner"):
        element.decompose()
    title = clean_text(soup.title.get_text(" ", strip=True)) if soup.title else relative_path
    description = soup.find("meta", attrs={"name": "description"})
    lines = [f"## {title}", "", f"Source: [{SITE_URL}{relative_path}]({SITE_URL}{relative_path})", ""]
    if description and description.get("content"):
        lines.extend([f"> {clean_text(description['content'])}", ""])
    lines.extend(render_blocks(main, source))
    return lines


def main() -> None:
    payload_config = {}
    config_path = ROOT / "payload_config.json"
    if config_path.exists():
        payload_config = json.loads(config_path.read_text(encoding="utf-8"))
    lines = [
        "# Elara Aerospace — AI-readable site mirror", "",
        "> Canonical, machine-readable reference for the public Elara Aerospace website.",
        "> Generated from the public page content; use the linked source page when a detail is time-sensitive or operational.", "",
        f"Last generated: {date.today().isoformat()}",
        "Canonical URL: [https://elara-aerospace.com/llms-full.md](https://elara-aerospace.com/llms-full.md)", "",
        "## How to use this file", "",
        "This single Markdown document is intended for AI systems, search tools, researchers, journalists, partners, and payload customers who need the substance of the site without scanning its navigation, styling, scripts, or forms. It includes the main content of the public site, technical tables, glossary entries, company information, event information, partnership information, legal reference, and newsroom articles.", "",
        "## Quick facts", "",
        "- Organization: Elara Aerospace gGmbH, a German aerospace organization based in Garching bei München, Germany.",
        "- Focus: reusable suborbital vehicles, rocket propulsion systems, ground-test infrastructure, European research flights, and hypersonic flight development.",
        "- Team: 45+ engineers and a network of 30+ partner organizations, as stated on the homepage.",
        "- Primary vehicles and infrastructure: Starleap VTVL hopper, Starlight suborbital research rocket, TB30 universal test stand, 28 kN engine, and supporting propulsion R&D.",
        "- Contact: [team@elara-aerospace.com](mailto:team@elara-aerospace.com). Headquarters: Freisinger Landstr. 51, 85748 Garching, Germany.", "",
        "## Current machine-readable payload state", "",
        "The static payload configuration currently exposes the following values:", "",
        "| Field | Value |", "| --- | --- |",
        f"| Total capacity | {payload_config.get('total_capacity_kg', 'not published')} kg |",
        f"| Available capacity | {payload_config.get('available_capacity_kg', 'not published')} kg |",
        f"| Founding price | ${payload_config.get('price_per_kg_usd', 'not published')} USD/kg |", "",
        "If the rendered payload page shows a different live value, treat the live page and its current configuration endpoint as authoritative.", "",
        "## Public page index", "",
    ]
    for path in PAGE_PATHS + NEWS_PATHS:
        lines.append(f"- [{path}]({SITE_URL}{path})")
    lines.extend(["", "---", ""])
    for path in PAGE_PATHS + NEWS_PATHS:
        lines.extend(page_section(path))
        lines.extend(["", "---", ""])
    OUTPUT.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")
    print(f"Wrote {OUTPUT} ({OUTPUT.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()
