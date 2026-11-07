import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import React from "react"
import SearchExpand from "../components/SearchExpand"

describe("SearchExpand Component (uimotion.fyi expand animation)", () => {
  it("renders initially in collapsed state with width 36px", () => {
    render(<SearchExpand placeholder="Search..." />)

    const wrapper = screen.getByTestId("search-expand-wrap")
    expect(wrapper).toHaveClass("search-wrap")
    expect(wrapper).not.toHaveClass("open")
    expect(wrapper).toHaveStyle({ width: "36px", height: "36px" })

    const input = screen.getByPlaceholderText("Search...")
    expect(input).toHaveStyle({ opacity: "0" })
  })

  it("expands to 240px and focuses input when search icon is clicked", () => {
    render(<SearchExpand placeholder="Search athletes..." />)

    const button = screen.getByRole("button", { name: /Search/i })
    fireEvent.click(button)

    const wrapper = screen.getByTestId("search-expand-wrap")
    expect(wrapper).toHaveClass("open")
    expect(wrapper).toHaveStyle({ width: "240px" })

    const input = screen.getByPlaceholderText("Search athletes...")
    expect(input).toHaveStyle({ opacity: "1" })
  })

  it("allows entering search text and submits on Enter key", () => {
    const onSearch = vi.fn()
    const onOpenModal = vi.fn()

    render(
      <SearchExpand
        placeholder="Search..."
        onSearch={onSearch}
        onOpenModal={onOpenModal}
      />
    )

    // Expand
    const button = screen.getByRole("button", { name: /Search/i })
    fireEvent.click(button)

    const input = screen.getByPlaceholderText("Search...")
    fireEvent.change(input, { target: { value: "Al Ahly" } })

    // Press Enter
    fireEvent.keyDown(input, { key: "Enter" })
    expect(onSearch).toHaveBeenCalledWith("Al Ahly")
    expect(onOpenModal).toHaveBeenCalledWith("Al Ahly")
  })

  it("submits search when icon is clicked with text present", () => {
    const onSearch = vi.fn()
    render(<SearchExpand placeholder="Search..." onSearch={onSearch} />)

    const button = screen.getByRole("button", { name: /Search/i })
    fireEvent.click(button) // expand

    const input = screen.getByPlaceholderText("Search...")
    fireEvent.change(input, { target: { value: "Mohamed Salah" } })

    fireEvent.click(button) // click with query
    expect(onSearch).toHaveBeenCalledWith("Mohamed Salah")
  })

  it("collapses when Escape key is pressed", () => {
    render(<SearchExpand placeholder="Search..." />)

    const button = screen.getByRole("button", { name: /Search/i })
    fireEvent.click(button) // open

    const wrapper = screen.getByTestId("search-expand-wrap")
    expect(wrapper).toHaveClass("open")

    const input = screen.getByPlaceholderText("Search...")
    fireEvent.keyDown(input, { key: "Escape" })

    expect(wrapper).not.toHaveClass("open")
    expect(wrapper).toHaveStyle({ width: "36px" })
  })
})

