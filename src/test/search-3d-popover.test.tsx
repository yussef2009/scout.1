import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import React from "react"
import Search3DPopover from "../components/Search3DPopover"
import { directoryProfiles } from "../App"

describe("Search3DPopover Component (3D Anchored Screen under Search Bar)", () => {
  it("renders when isOpen is true and shows 3D header, input, and profiles", () => {
    const onClose = vi.fn()
    const onSelectProfile = vi.fn()

    render(
      <Search3DPopover
        isOpen={true}
        onClose={onClose}
        profiles={directoryProfiles}
        onSelectProfile={onSelectProfile}
      />
    )

    const popover = screen.getByTestId("search-3d-popover")
    expect(popover).toBeInTheDocument()
    expect(popover).toHaveClass("search-3d-popover")

    // Check 3D header elements
    expect(screen.getByText("DISCOVERY ENGINE")).toBeInTheDocument()
    expect(screen.getByText("FIND CLUBS & PLAYERS")).toBeInTheDocument()

    // Default directory profile present
    expect(screen.getByText("Omar Khalil")).toBeInTheDocument()
  })

  it("does not render when isOpen is false", () => {
    render(
      <Search3DPopover
        isOpen={false}
        onClose={vi.fn()}
        profiles={directoryProfiles}
        onSelectProfile={vi.fn()}
      />
    )

    expect(screen.queryByTestId("search-3d-popover")).not.toBeInTheDocument()
  })

  it("filters profiles in real-time by search query", () => {
    render(
      <Search3DPopover
        isOpen={true}
        onClose={vi.fn()}
        profiles={directoryProfiles}
        onSelectProfile={vi.fn()}
      />
    )

    const input = screen.getByLabelText("Search discovery input")
    fireEvent.change(input, { target: { value: "Alexandria" } })

    // Profiles from Alexandria should match
    expect(screen.getByText("Omar Khalil")).toBeInTheDocument()

    // Searching non-existent keyword displays empty state
    fireEvent.change(input, { target: { value: "NON_EXISTENT_QUERY_XYZ" } })
    expect(screen.getByText("NO PROFILES MATCH")).toBeInTheDocument()
  })

  it("filters profiles by role when clicking filter pills", () => {
    render(
      <Search3DPopover
        isOpen={true}
        onClose={vi.fn()}
        profiles={directoryProfiles}
        onSelectProfile={vi.fn()}
      />
    )

    const clubsPill = screen.getByRole("button", { name: "CLUBS" })
    fireEvent.click(clubsPill)

    expect(clubsPill).toHaveClass("active")
  })

  it("triggers onSelectProfile when clicking a profile row or VIEW button", () => {
    const onSelectProfile = vi.fn()
    render(
      <Search3DPopover
        isOpen={true}
        onClose={vi.fn()}
        profiles={directoryProfiles}
        onSelectProfile={onSelectProfile}
      />
    )

    const omarRow = screen.getByTestId("search-result-profile-1")
    fireEvent.click(omarRow)

    expect(onSelectProfile).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Omar Khalil" })
    )
  })

  it("triggers onClose when clicking close button, backdrop, or pressing Escape", () => {
    const onClose = vi.fn()
    const { rerender } = render(
      <Search3DPopover
        isOpen={true}
        onClose={onClose}
        profiles={directoryProfiles}
        onSelectProfile={vi.fn()}
      />
    )

    // Click close button
    const closeBtn = screen.getByRole("button", { name: "Close search popover" })
    fireEvent.click(closeBtn)
    expect(onClose).toHaveBeenCalledTimes(1)

    // Click backdrop
    const backdrop = screen.getByTestId("search-3d-backdrop")
    fireEvent.click(backdrop)
    expect(onClose).toHaveBeenCalledTimes(2)

    // Press Escape
    fireEvent.keyDown(document, { key: "Escape" })
    expect(onClose).toHaveBeenCalledTimes(3)
  })
})

