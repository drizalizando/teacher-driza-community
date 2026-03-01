import os
import time
from playwright.sync_api import sync_playwright

def verify_ui():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # Capture console logs
        page.on("console", lambda msg: print(f"CONSOLE: {msg.type} {msg.text}"))
        page.on("pageerror", lambda err: print(f"PAGE ERROR: {err.message}"))

        try:
            # Navigate to the app
            print("Navigating to http://localhost:3000...")
            page.goto("http://localhost:3000")

            # Wait for content
            page.wait_for_selector("text=COMEÇAR")

            # Click COMEÇAR
            page.click("text=COMEÇAR")
            print("Clicked COMEÇAR")

            # Wait for auth page
            time.sleep(2)

            # Take a screenshot
            page.screenshot(path="verification/auth_page.png")
            print("Auth page screenshot saved.")

        except Exception as e:
            print(f"Error during verification: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_ui()
