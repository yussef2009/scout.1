import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import React from "react"
import App from "../App"

describe("Explore Page UI/UX Redesign Suite", () => {
  it("renders Explore view with Hero, Spotlights, and Sport Pills", async () => {
    render(<App />)

    // Navigate to Explore
    const exploreNavBtn = screen.getAllByRole("button", { name: "Explore" })[0]
    fireEvent.click(exploreNavBtn)

    // 1. Hero Kicker & Headline
    expect(screen.getByText(/LIVE TALENT RADAR · 60 FPS COMPUTER VISION/i)).toBeInTheDocument()
    expect(screen.getByText("EXPLORE ATHLETIC INTEL & SCOUT NETWORK")).toBeInTheDocument()

    // 2. High-Tech Stat Badges
    expect(screen.getByText("12.8K+")).toBeInTheDocument()
    expect(screen.getByText("1,420+")).toBeInTheDocument()
    expect(screen.getByText("60 FPS")).toBeInTheDocument()
    expect(screen.getByText("99.2%")).toBeInTheDocument()

    // 3. Weekly Talent Spotlights Carousel
    expect(screen.getByText("SCOUT RADAR · TOP RECRUITS OF THE WEEK")).toBeInTheDocument()
    expect(screen.getByText("Elena Rostova")).toBeInTheDocument()
    expect(screen.getAllByText("Omar Khalil").length).toBeGreaterThan(0)
    expect(screen.getByText("Tariq Mansour")).toBeInTheDocument()
    expect(screen.getByText("Maya Lin")).toBeInTheDocument()
  })

  it("filters feed dispatches when clicking hero sport quick-pills", async () => {
    render(<App />)

    const exploreNavBtn = screen.getAllByRole("button", { name: "Explore" })[0]
    fireEvent.click(exploreNavBtn)

    // Click 'BASKETBALL' pill in hero
    const basketballPill = screen.getByRole("button", { name: "BASKETBALL" })
    fireEvent.click(basketballPill)

    // Verify basketball dispatches are displayed
    expect(screen.getByText("Mateo Ruiz")).toBeInTheDocument()
  })

  it("toggles the New Dispatch composer with the + sign button", async () => {
    render(<App />)

    const exploreNavBtn = screen.getAllByRole("button", { name: "Explore" })[0]
    fireEvent.click(exploreNavBtn)

    const dispatchBtn = screen.getByRole("button", { name: /Add new post/i })
    fireEvent.click(dispatchBtn)

    // Composer opens
    expect(screen.getByText("AI BIOMECHANICS LOG")).toBeInTheDocument()
    expect(screen.getByText("ATTACH TELEMETRY TAG:")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /PUBLISH INTEL/i })).toBeInTheDocument()

    // Toggle close
    const closeDispatchBtn = screen.getByRole("button", { name: /Close dispatch/i })
    fireEvent.click(closeDispatchBtn)
    expect(screen.queryByText("AI BIOMECHANICS LOG")).not.toBeInTheDocument()
  })

  it("filters feed dispatches when clicking role filter tabs", async () => {
    render(<App />)

    const exploreNavBtn = screen.getAllByRole("button", { name: "Explore" })[0]
    fireEvent.click(exploreNavBtn)

    const scoutsTab = screen.getByRole("tab", { name: /PRO SCOUTS/i })
    fireEvent.click(scoutsTab)
    expect(scoutsTab).toHaveClass("active")
  })
})
