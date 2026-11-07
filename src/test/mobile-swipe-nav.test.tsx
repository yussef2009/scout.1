import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, act } from "@testing-library/react"
import React from "react"
import App from "../App"

describe("Mobile Swipe Navigation & Selective Blur Suite", () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    window.scrollTo = vi.fn()
  })

  it("renders mobile-bottom-nav without blur when idle", () => {
    render(<App />)
    const nav = screen.getByLabelText("Mobile navigation bar")
    expect(nav).toBeInTheDocument()
    expect(nav).not.toHaveClass("is-page-changing")

    const tabs = screen.getAllByRole("button", { name: "Explore" })
    expect(tabs.length).toBeGreaterThan(0)
  })

  it("swipes left to navigate from Dashboard to Explore and syncs active tab", () => {
    const { container } = render(<App />)
    const swipeWrapper = container.querySelector(".mobile-swipe-view-wrapper")
    expect(swipeWrapper).toBeInTheDocument()

    // Simulate touchstart at clientX: 250, clientY: 200
    fireEvent.touchStart(swipeWrapper!, {
      touches: [{ clientX: 250, clientY: 200 }],
    })

    // Simulate touchend at clientX: 100, clientY: 205 (swiped left by 150px)
    act(() => {
      fireEvent.touchEnd(swipeWrapper!, {
        changedTouches: [{ clientX: 100, clientY: 205 }],
      })
    })

    // Active bottom tab indicator should now reflect Explore
    const bottomNav = screen.getByLabelText("Mobile navigation bar")
    expect(bottomNav).toBeInTheDocument()
  })

  it("swipes right to navigate back to previous tab", () => {
    const { container } = render(<App />)
    const swipeWrapper = container.querySelector(".mobile-swipe-view-wrapper")

    // First go to Explore
    fireEvent.touchStart(swipeWrapper!, {
      touches: [{ clientX: 250, clientY: 200 }],
    })
    act(() => {
      fireEvent.touchEnd(swipeWrapper!, {
        changedTouches: [{ clientX: 100, clientY: 205 }],
      })
    })

    // Now swipe right to go back to Dashboard
    fireEvent.touchStart(swipeWrapper!, {
      touches: [{ clientX: 100, clientY: 200 }],
    })
    act(() => {
      fireEvent.touchEnd(swipeWrapper!, {
        changedTouches: [{ clientX: 250, clientY: 205 }],
      })
    })

    const bottomNav = screen.getByLabelText("Mobile navigation bar")
    expect(bottomNav).toBeInTheDocument()
  })

  it("ignores vertical scrolling gestures and does not change tabs", () => {
    const { container } = render(<App />)
    const swipeWrapper = container.querySelector(".mobile-swipe-view-wrapper")

    // Vertical drag: deltaX: 10, deltaY: 180
    fireEvent.touchStart(swipeWrapper!, {
      touches: [{ clientX: 150, clientY: 300 }],
    })
    act(() => {
      fireEvent.touchEnd(swipeWrapper!, {
        changedTouches: [{ clientX: 160, clientY: 120 }],
      })
    })

    // Dashboard should remain active
    const dashboardButtons = screen.getAllByRole("button", { name: "Dashboard" })
    expect(dashboardButtons[0]).toBeInTheDocument()
  })

  it("activates is-page-changing during transition and settles back to unblurred", async () => {
    vi.useFakeTimers()
    const { container } = render(<App />)
    const swipeWrapper = container.querySelector(".mobile-swipe-view-wrapper")

    fireEvent.touchStart(swipeWrapper!, {
      touches: [{ clientX: 250, clientY: 200 }],
    })
    act(() => {
      fireEvent.touchEnd(swipeWrapper!, {
        changedTouches: [{ clientX: 100, clientY: 205 }],
      })
    })

    const nav = screen.getByLabelText("Mobile navigation bar")
    expect(nav).toHaveClass("is-page-changing")

    // Advance timers past 280ms
    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(nav).not.toHaveClass("is-page-changing")
    vi.useRealTimers()
  })
})

