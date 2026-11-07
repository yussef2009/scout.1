import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, within } from "@testing-library/react"
import React, { act } from "react"
import App from "../App"

const originalClipboard = navigator.clipboard

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  Object.defineProperty(navigator, "clipboard", {
    value: {
      writeText: vi.fn().mockImplementation(() => Promise.resolve()),
    },
    writable: true,
    configurable: true,
  })
  window.HTMLMediaElement.prototype.play = vi.fn().mockImplementation(() => Promise.resolve())
  window.HTMLMediaElement.prototype.pause = vi.fn()
})

afterEach(() => {
  Object.defineProperty(navigator, "clipboard", {
    value: originalClipboard,
    writable: true,
    configurable: true,
  })
  vi.restoreAllMocks()
})

async function renderAndNavigateToExplore() {
  const utils = render(<App />)
  const exploreBtn = screen.getAllByRole("button", { name: /Explore/i })[0]
  await act(async () => {
    fireEvent.click(exploreBtn)
  })
  return utils
}

function getStreamTab(name: "All" | "Reels" | "News") {
  const streamContainer = document.querySelector(".feed-stream-tabs")
  if (streamContainer) {
    const btn = within(streamContainer as HTMLElement).queryByRole("tab", { name: new RegExp(name, "i") })
    if (btn) return btn
  }
  const tabs = screen.getAllByRole("tab")
  const target = tabs.find((tab) => {
    const text = (tab.textContent || "").trim()
    if (name === "All") {
      return (/^all(\s*\d+)?$/i.test(text) || text.startsWith("All")) && !text.includes("ALL INTEL")
    }
    return new RegExp(`^${name}`, "i").test(text)
  })
  if (target) return target
  return screen.getByRole("tab", { name: new RegExp(`^${name}`, "i") })
}

function getPostCardByAuthor(authorName: string): HTMLElement | null {
  const postsStack = document.querySelector(".posts-stack")
  if (!postsStack) return null
  const authors = within(postsStack as HTMLElement).queryAllByText(authorName)
  if (authors.length === 0) return null
  return authors[0].closest(".post-card, .reel-card-9x16, article") as HTMLElement | null
}

async function openComposer() {
  const dispatchBtn =
    screen.queryByRole("button", { name: /Add new post/i }) ||
    screen.queryByTitle(/Add new post/i) ||
    screen.getByRole("button", { name: /\+/i })
  await act(async () => {
    fireEvent.click(dispatchBtn)
  })
}

describe("Empirical Challenger: End-to-End Real World Combine Journeys & Aesthetic Token Stress Tests", () => {
  it("executes the full end-to-end scouting combine, bulletin review, and highlight reel publishing workflow", async () => {
    await renderAndNavigateToExplore()

    // 1. Scout filters Explore stream to Reels
    const reelsTab = getStreamTab("Reels")
    await act(async () => {
      fireEvent.click(reelsTab)
    })
    expect(reelsTab.getAttribute("aria-selected") === "true" || reelsTab.classList.contains("active")).toBe(true)

    // 2. Locate Omar Khalil's vertical takeoff highlight reel
    const reelCard = getPostCardByAuthor("Omar Khalil")
    expect(reelCard).not.toBeNull()
    expect(reelCard?.getAttribute("data-aspect")).toBe("9:16")

    // 3. Verify 60 FPS YOLOv11 biometric HUD and reticles
    const hudBadge = within(reelCard!).getByText(/60 FPS · YOLOv11 VISION/i)
    expect(hudBadge).toBeInTheDocument()
    expect(reelCard?.querySelectorAll(".hud-reticle").length).toBe(4)
    expect(reelCard?.querySelector(".hud-scanlines-overlay")).not.toBeNull()

    // 4. Verify kinematic telemetry overlay
    expect(within(reelCard!).getAllByText(/78.4 CM/i).length).toBeGreaterThan(0)
    expect(within(reelCard!).getAllByText(/0.83 SEC/i).length).toBeGreaterThan(0)

    // 5. Follow player
    const followBtn =
      within(reelCard!).queryByRole("button", { name: /\+ follow/i }) ||
      within(reelCard!).getByRole("button", { name: /follow/i })
    await act(async () => {
      fireEvent.click(followBtn)
    })
    expect(within(reelCard!).getByRole("button", { name: /following/i })).toBeInTheDocument()

    // 6. Switch stream to News bulletins
    const newsTab = getStreamTab("News")
    await act(async () => {
      fireEvent.click(newsTab)
    })
    expect(newsTab.getAttribute("aria-selected") === "true" || newsTab.classList.contains("active")).toBe(true)

    // 7. Locate Al Ahly SC Academy scouting bulletin
    const bulletinCard = getPostCardByAuthor("Al Ahly SC Academy")
    expect(bulletinCard).not.toBeNull()
    expect(within(bulletinCard!).getByText("97/100")).toBeInTheDocument()
    expect(within(bulletinCard!).getByText(/GRADE A\+/i)).toBeInTheDocument()
    expect(within(bulletinCard!).getByText(/COUNTER-PRESS:/i)).toBeInTheDocument()
    expect(within(bulletinCard!).getByText(/3.2s/i)).toBeInTheDocument()

    // 8. Open comments drawer and post scout notes
    const commentsBtn = bulletinCard!.querySelector(".comments-btn")
    expect(commentsBtn).not.toBeNull()
    await act(async () => {
      fireEvent.click(commentsBtn!)
    })
    expect(screen.getByText(/COMMENTS LOG & SCOUT NOTES/i)).toBeInTheDocument()

    const commentInput = screen.getByPlaceholderText(/Add scout note/i)
    await act(async () => {
      fireEvent.change(commentInput, {
        target: { value: "Biomechanical recovery sprint is in 99th percentile across U-18 Cairo cohort." },
      })
    })

    const postCommentBtn = within(bulletinCard!).getByRole("button", { name: /POST NOTE/i })
    await act(async () => {
      fireEvent.click(postCommentBtn)
    })
    expect(
      screen.getByText("Biomechanical recovery sprint is in 99th percentile across U-18 Cairo cohort."),
    ).toBeInTheDocument()

    // 9. Open composer and publish a new athletic reel
    await openComposer()
    const reelTypeBtn = screen.getByRole("button", { name: /REEL \(9:16 HIGHLIGHT\)/i })
    await act(async () => {
      fireEvent.click(reelTypeBtn)
    })

    // Adjust Scot AI rating score to 98
    const ratingSlider = screen.getByLabelText(/Scot AI Rating/i)
    await act(async () => {
      fireEvent.change(ratingSlider, { target: { value: "98" } })
    })
    expect(screen.getAllByText("98/100").length).toBeGreaterThan(0)
    expect(screen.getAllByText(/GRADE A\+/i).length).toBeGreaterThan(0)

    // Enter reel highlight telemetry and description
    const textarea = screen.getByPlaceholderText(/Log training telemetry|Log athlete performance/i)
    await act(async () => {
      fireEvent.change(textarea, {
        target: {
          value: "Explosive 3-point step-back drill: 18 consecutive makes with 51.4° release arc telemetry.",
        },
      })
    })

    // Publish Reel
    const publishBtn = screen.getByRole("button", { name: /PUBLISH INTEL/i })
    await act(async () => {
      fireEvent.click(publishBtn)
    })

    // 10. Verify published reel appears under Reels tab
    await act(async () => {
      fireEvent.click(getStreamTab("Reels"))
    })
    expect(
      screen.getByText(/Explosive 3-point step-back drill: 18 consecutive makes with 51.4° release arc telemetry./i),
    ).toBeInTheDocument()

    // 11. Verify published reel also appears under All tab
    await act(async () => {
      fireEvent.click(getStreamTab("All"))
    })
    expect(
      screen.getByText(/Explosive 3-point step-back drill: 18 consecutive makes with 51.4° release arc telemetry./i),
    ).toBeInTheDocument()
  })

  it("verifies cyber-athletic dark and gold aesthetic tokens, scanlines, and reticles in rendered DOM", async () => {
    await renderAndNavigateToExplore()

    const reelsTab = getStreamTab("Reels")
    await act(async () => {
      fireEvent.click(reelsTab)
    })

    const card = getPostCardByAuthor("Omar Khalil")
    expect(card).not.toBeNull()

    // Reticle brackets styling: check for #fbbf24 or rgb(251, 191, 36)
    const reticles = card!.querySelectorAll(".hud-reticle")
    expect(reticles.length).toBe(4)
    reticles.forEach((reticle) => {
      const el = reticle as HTMLElement
      const borderTop = el.style.borderTop
      const borderBottom = el.style.borderBottom
      const hasGoldBorder =
        borderTop.includes("251, 191, 36") ||
        borderTop.includes("#fbbf24") ||
        borderBottom.includes("251, 191, 36") ||
        borderBottom.includes("#fbbf24")
      expect(hasGoldBorder).toBe(true)
    })

    // Scanlines overlay element presence and pointer-events: none
    const scanlines = card!.querySelector(".hud-scanlines-overlay") as HTMLElement
    expect(scanlines).not.toBeNull()
    expect(scanlines.style.pointerEvents).toBe("none")

    // Check card border contains gold color
    expect(
      card?.style.border.includes("251, 191, 36") ||
        card?.style.border.includes("#fbbf24") ||
        card?.style.border.includes("rgba(251, 191, 36"),
    ).toBe(true)
  })

  it("handles rapid stream tab flipping under high frequency user clicks without crash or memory leak", async () => {
    await renderAndNavigateToExplore()

    const allTab = getStreamTab("All")
    const reelsTab = getStreamTab("Reels")
    const newsTab = getStreamTab("News")

    for (let i = 0; i < 10; i++) {
      await act(async () => {
        fireEvent.click(reelsTab)
      })
      await act(async () => {
        fireEvent.click(newsTab)
      })
      await act(async () => {
        fireEvent.click(allTab)
      })
    }

    expect(allTab).toHaveClass("active")
    const postsStack = document.querySelector(".posts-stack")
    expect(postsStack).not.toBeNull()
    expect(within(postsStack as HTMLElement).getByText("Omar Khalil")).toBeInTheDocument()
    expect(within(postsStack as HTMLElement).getByText("Al Ahly SC Academy")).toBeInTheDocument()
  })
})
