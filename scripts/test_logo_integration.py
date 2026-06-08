#!/usr/bin/env python3
"""Playwright checks for ASOF logo integration in Social-ASOF."""

from pathlib import Path
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:3000"
SCREENSHOT_DIR = Path(__file__).resolve().parent.parent / "test-results" / "logo-webapp"
SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def logo_theme(page, selector: str) -> str | None:
    return page.locator(selector).first.evaluate(
        """(node) => {
            const svg = node.tagName.toLowerCase() === 'svg'
              ? node
              : node.querySelector('svg');
            return svg ? svg.getAttribute('data-theme') : null;
        }"""
    )


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 900})

    # Login page — avoid networkidle (Firebase keeps connections open)
    page.goto(f"{BASE_URL}/login", wait_until="domcontentloaded")
    page.get_by_role("heading", name="Acesse a plataforma").wait_for(state="visible", timeout=15000)

    login_logo = page.get_by_role("img", name="Logo da ASOF")
    login_logo.first.wait_for(state="visible", timeout=10000)
    assert_true(login_logo.count() >= 1, "Login page should render the ASOF logo")
    assert_true(
        logo_theme(page, '[aria-label="Logo da ASOF"]') == "light",
        "Login logo should use light theme on auth pages",
    )

    favicon_href = page.locator('link[rel="icon"]').get_attribute("href")
    assert_true(favicon_href == "/favicon.svg", f"Expected /favicon.svg favicon, got {favicon_href}")

    page.screenshot(path=str(SCREENSHOT_DIR / "01-login.png"), full_page=True)

    # Dev bypass into authenticated shell
    dev_button = page.get_by_role("button", name="[DEV] Login Rápido (Admin)")
    assert_true(dev_button.count() == 1, "Dev bypass button should be visible in development")
    dev_button.click()
    page.wait_for_url("**/feed", timeout=15000)

    navbar_logo_link = page.get_by_role("link", name="Social-ASOF - Ir para o feed")
    navbar_logo_link.wait_for(state="visible", timeout=15000)
    assert_true(
        logo_theme(page, '[aria-label="Social-ASOF - Ir para o feed"] svg') in {"light", None},
        "Navbar logo should start in light theme",
    )

    page.screenshot(path=str(SCREENSHOT_DIR / "02-feed-light.png"), full_page=False)

    dark_toggle = page.get_by_role("button", name="Mudar para Modo Escuro")
    dark_toggle.click()
    page.wait_for_timeout(300)

    assert_true(
        logo_theme(page, '[aria-label="Social-ASOF - Ir para o feed"]') == "dark",
        "Navbar logo should switch to dark theme after toggle",
    )
    assert_true(
        page.locator("html").evaluate("el => el.classList.contains('dark')"),
        "Document root should have dark class after toggle",
    )

    page.screenshot(path=str(SCREENSHOT_DIR / "03-feed-dark.png"), full_page=False)

    # Static assets
    logo_response = page.request.get(f"{BASE_URL}/logo.svg")
    favicon_response = page.request.get(f"{BASE_URL}/favicon.svg")
    assert_true(logo_response.ok, "logo.svg should be served from /public")
    assert_true(favicon_response.ok, "favicon.svg should be served from /public")
    assert_true(
        "asof-logo" in logo_response.text(),
        "Public logo asset should contain thematic SVG markup",
    )

    print("PASS: logo integration checks")
    print(f"Screenshots: {SCREENSHOT_DIR}")
    browser.close()