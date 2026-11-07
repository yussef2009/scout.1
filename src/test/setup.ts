import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import { afterEach } from "vitest"

// Automatically cleanup after each test
afterEach(() => {
  cleanup()
  localStorage.clear()
  sessionStorage.clear()
})

// Polyfill window.scrollTo if missing in JSDOM
if (typeof window !== "undefined") {
  window.scrollTo = window.scrollTo || (() => {})
}

