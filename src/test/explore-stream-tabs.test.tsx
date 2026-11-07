import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import React from "react"
import App from "../App"
import { ExploreStreamTabs } from "../components/ExploreStreamTabs"

describe("ExploreStreamTabs Component Suite", () => {
  const defaultCounts = {
    all: 5,
    reels: 2,
    news: 3,
  }

  it("renders tablist with All, Reels, and News tabs", () => {
    const handleSelect = vi.fn()
    render(
      <ExploreStreamTabs
        activeTab="all"
        onSelectTab={handleSelect}
        counts={defaultCounts}
      />,
    )

    const tablist = screen.getByRole("tablist", { name: /Feed stream filter/i })
    expect(tablist).toBeInTheDocument()

    const allTab = screen.getByRole("tab", { name: "All" })
    const reelsTab = screen.getByRole("tab", { name: "Reels" })
    const newsTab = screen.getByRole("tab", { name: "News" })

    expect(allTab).toBeInTheDocument()
    expect(reelsTab).toBeInTheDocument()
    expect(newsTab).toBeInTheDocument()
  })

  it("displays correct count badges for each stream type", () => {
    const handleSelect = vi.fn()
    render(
      <ExploreStreamTabs
        activeTab="all"
        onSelectTab={handleSelect}
        counts={defaultCounts}
      />,
    )

    expect(screen.getByTestId("stream-count-all")).toHaveTextContent("5")
    expect(screen.getByTestId("stream-count-reels")).toHaveTextContent("2")
    expect(screen.getByTestId("stream-count-news")).toHaveTextContent("3")
  })

  it("marks the active tab with aria-selected true and active CSS class", () => {
    const handleSelect = vi.fn()
    const { rerender } = render(
      <ExploreStreamTabs
        activeTab="reels"
        onSelectTab={handleSelect}
        counts={defaultCounts}
      />,
    )

    const reelsTab = screen.getByRole("tab", { name: "Reels" })
    expect(reelsTab).toHaveAttribute("aria-selected", "true")
    expect(reelsTab).toHaveClass("active")

    const allTab = screen.getByRole("tab", { name: "All" })
    expect(allTab).toHaveAttribute("aria-selected", "false")
    expect(allTab).not.toHaveClass("active")

    // Switch to News
    rerender(
      <ExploreStreamTabs
        activeTab="news"
        onSelectTab={handleSelect}
        counts={defaultCounts}
      />,
    )

    const newsTab = screen.getByRole("tab", { name: "News" })
    expect(newsTab).toHaveAttribute("aria-selected", "true")
    expect(newsTab).toHaveClass("active")
  })

  it("calls onSelectTab with appropriate tab identifier on click", () => {
    const handleSelect = vi.fn()
    render(
      <ExploreStreamTabs
        activeTab="all"
        onSelectTab={handleSelect}
        counts={defaultCounts}
      />,
    )

    const reelsTab = screen.getByRole("tab", { name: "Reels" })
    fireEvent.click(reelsTab)
    expect(handleSelect).toHaveBeenCalledWith("reels")

    const newsTab = screen.getByRole("tab", { name: "News" })
    fireEvent.click(newsTab)
    expect(handleSelect).toHaveBeenCalledWith("news")

    const allTab = screen.getByRole("tab", { name: "All" })
    fireEvent.click(allTab)
    expect(handleSelect).toHaveBeenCalledWith("all")
  })

  it("handles zero counts gracefully without crash", () => {
    const handleSelect = vi.fn()
    render(
      <ExploreStreamTabs
        activeTab="all"
        onSelectTab={handleSelect}
        counts={{ all: 0, reels: 0, news: 0 }}
      />,
    )

    expect(screen.getByTestId("stream-count-all")).toHaveTextContent("0")
    expect(screen.getByTestId("stream-count-reels")).toHaveTextContent("0")
    expect(screen.getByTestId("stream-count-news")).toHaveTextContent("0")
  })
})

describe("Explore Feed Stream Filtering Integration Suite", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("renders ExploreStreamTabs in Explore view with initial counts (All: 5, Reels: 2, News: 3)", async () => {
    render(<App />)

    const exploreNavBtn = screen.getAllByRole("button", { name: "Explore" })[0]
    fireEvent.click(exploreNavBtn)

    const streamTabsContainer = screen.getByTestId("explore-stream-tabs")
    expect(streamTabsContainer).toBeInTheDocument()

    const allTab = screen.getByTestId("stream-tab-all")
    const reelsTab = screen.getByTestId("stream-tab-reels")
    const newsTab = screen.getByTestId("stream-tab-news")

    expect(allTab).toHaveAttribute("aria-selected", "true")
    expect(reelsTab).toHaveAttribute("aria-selected", "false")
    expect(newsTab).toHaveAttribute("aria-selected", "false")

    expect(screen.getByTestId("stream-count-all")).toHaveTextContent("5")
    expect(screen.getByTestId("stream-count-reels")).toHaveTextContent("2")
    expect(screen.getByTestId("stream-count-news")).toHaveTextContent("3")
  })

  it("filters stream to only highlight reels when clicking Reels tab", async () => {
    render(<App />)

    const exploreNavBtn = screen.getAllByRole("button", { name: "Explore" })[0]
    fireEvent.click(exploreNavBtn)

    const reelsTab = screen.getByTestId("stream-tab-reels")
    fireEvent.click(reelsTab)

    expect(reelsTab).toHaveAttribute("aria-selected", "true")

    // Reels (Omar Khalil - vertical jump, Mateo Ruiz - catch-and-shoot) should be present
    expect(screen.getByText(/Vertical takeoff workout today in Alexandria/i)).toBeInTheDocument()
    expect(screen.getByText(/Catch-and-shoot mechanics breakdown/i)).toBeInTheDocument()

    // News/bulletins should NOT be in the filtered feed
    expect(screen.queryByText(/Official lineup assessment for our U-18 squad/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Youth biomechanical audit in Madrid/i)).not.toBeInTheDocument()
  })

  it("filters stream to only news and reports when clicking News tab", async () => {
    render(<App />)

    const exploreNavBtn = screen.getAllByRole("button", { name: "Explore" })[0]
    fireEvent.click(exploreNavBtn)

    const newsTab = screen.getByTestId("stream-tab-news")
    fireEvent.click(newsTab)

    expect(newsTab).toHaveAttribute("aria-selected", "true")

    // News posts should be present
    expect(screen.getByText(/Official lineup assessment for our U-18 squad/i)).toBeInTheDocument()
    expect(screen.getByText(/Youth biomechanical audit in Madrid/i)).toBeInTheDocument()
    expect(screen.getByText(/Scouting bulletin: Evaluating high-pace wingers/i)).toBeInTheDocument()

    // Reels should NOT be in the filtered feed
    expect(screen.queryByText(/Vertical takeoff workout/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Catch-and-shoot mechanics breakdown/i)).not.toBeInTheDocument()
  })

  it("combines stream filter with sport filter pills", async () => {
    render(<App />)

    const exploreNavBtn = screen.getAllByRole("button", { name: "Explore" })[0]
    fireEvent.click(exploreNavBtn)

    // Select News tab
    const newsTab = screen.getByTestId("stream-tab-news")
    fireEvent.click(newsTab)

    // Click 'SOCCER' pill in hero
    const soccerPill = screen.getByRole("button", { name: "SOCCER" })
    fireEvent.click(soccerPill)

    // Soccer news should appear
    expect(screen.getByText(/Official lineup assessment for our U-18 squad/i)).toBeInTheDocument()

    // Basketball reels should not appear
    expect(screen.queryByText(/Vertical takeoff workout/i)).not.toBeInTheDocument()
  })

  it("resets stream filter back to All when clicking Reset All Filters in empty state", async () => {
    render(<App />)

    const exploreNavBtn = screen.getAllByRole("button", { name: "Explore" })[0]
    fireEvent.click(exploreNavBtn)

    // Select News tab
    const newsTab = screen.getByTestId("stream-tab-news")
    fireEvent.click(newsTab)

    // Type a search query that produces 0 results
    const searchInput = screen.getByPlaceholderText(/Search by athlete name/i)
    fireEvent.change(searchInput, { target: { value: "nonexistent-biometric-query-xyz" } })

    expect(screen.getByText("NO INTEL LOGS FOUND")).toBeInTheDocument()

    // Click Reset
    const resetBtn = screen.getByRole("button", { name: /RESET ALL FILTERS/i })
    fireEvent.click(resetBtn)

    // Stream filter should be restored to All
    const allTab = screen.getByTestId("stream-tab-all")
    expect(allTab).toHaveAttribute("aria-selected", "true")
  })
})
