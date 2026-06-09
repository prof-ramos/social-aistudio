#!/usr/bin/env python3
"""Multi-viewport UI audit: horizontal scroll, touch targets, skip link."""

from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = "http://localhost:3000"
WIDTHS = [320, 360, 375, 390, 412, 430, 768, 1024, 1280, 1440]
OUT = Path(__file__).resolve().parent.parent / "test-results" / "ui-audit"
OUT.mkdir(parents=True, exist_ok=True)

results: list[dict] = []


def audit_page(page, width: int, path: str, label: str) -> None:
    page.set_viewport_size({"width": width, "height": 844 if width < 768 else 900})
    page.goto(f"{BASE}{path}", wait_until="domcontentloaded")
    page.wait_for_timeout(400)

    metrics = page.evaluate(
        """() => {
          const doc = document.documentElement;
          const overflowX = doc.scrollWidth > doc.clientWidth + 1;
          const smallTargets = [...document.querySelectorAll('button, a, [role="button"]')]
            .filter((el) => {
              const s = getComputedStyle(el);
              if (s.display === 'none' || s.visibility === 'hidden') return false;
              const r = el.getBoundingClientRect();
              return r.width > 0 && r.height > 0 && (r.width < 44 || r.height < 44);
            })
            .slice(0, 8)
            .map((el) => ({
              tag: el.tagName.toLowerCase(),
              text: (el.textContent || '').trim().slice(0, 24),
              w: el.getBoundingClientRect().width,
              h: el.getBoundingClientRect().height,
            }));
          const inputs = [...document.querySelectorAll('input, select, textarea')]
            .filter((el) => getComputedStyle(el).display !== 'none')
            .map((el) => ({
              tag: el.tagName.toLowerCase(),
              fontSize: getComputedStyle(el).fontSize,
            }));
          return {
            overflowX,
            scrollWidth: doc.scrollWidth,
            clientWidth: doc.clientWidth,
            smallTargets,
            inputs,
            skipTarget: !!document.getElementById('main-content'),
          };
        }"""
    )

    results.append({"width": width, "path": path, "label": label, **metrics})
    if overflow := metrics["overflowX"]:
        page.screenshot(path=str(OUT / f"overflow-{label}-{width}.png"), full_page=True)
        print(f"FAIL overflow {label} @ {width}px (scroll {metrics['scrollWidth']} > {metrics['clientWidth']})")
    else:
        print(f"OK {label} @ {width}px")


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    # Auth
    for w in WIDTHS:
        if w >= 768:
            continue
        audit_page(page, w, "/login", "login")

    # Authenticated feed
    page.goto(f"{BASE}/login", wait_until="domcontentloaded")
    dev = page.get_by_role("button", name="[DEV] Login Rápido (Admin)")
    if dev.count():
        dev.click()
        page.wait_for_url("**/feed", timeout=15000)
        for w in WIDTHS:
            audit_page(page, w, "/feed", "feed")

    browser.close()

overflows = [r for r in results if r["overflowX"]]
small_input = [
    r
    for r in results
    for i in r["inputs"]
    if i.get("fontSize") and float(i["fontSize"].replace("px", "")) < 16
]
print("\n=== SUMMARY ===")
print(f"viewports tested: {len(results)}")
print(f"horizontal overflow cases: {len(overflows)}")
print(f"inputs <16px samples: {len(small_input)}")
print(f"skip link target present (feed): {any(r.get('skipTarget') for r in results if r['label']=='feed')}")

if overflows:
    raise SystemExit(1)