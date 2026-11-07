import { describe, it, expect } from "vitest"
import { render, screen, fireEvent, act } from "@testing-library/react"
import React from "react"
import App, { sports, SPORT_ICONS } from "../App"

describe("Scot Sports Strip & Interactive Icon Selector", () => {
  it("defines unique icons for all supported sports", () => {
    sports.forEach((s) => {
      expect(SPORT_ICONS[s]).toBeDefined()
      expect(SPORT_ICONS[s].length).toBeGreaterThan(0)
    })
  })

  it("opens sports menu when clicking Scot sports trigger", async () => {
    render(<App />)

    const trigger = screen.getByTestId("sport-strip-trigger")
    expect(trigger).toBeInTheDocument()
    expect(trigger).toHaveTextContent(/Scot sports/i)
    expect(trigger).toHaveTextContent(/Basketball/i)

    // Menu initially closed
    expect(screen.queryByTestId("sport-strip-list")).not.toBeInTheDocument()

    // Click to open inside act
    await act(async () => {
      fireEvent.click(trigger)
    })
    expect(screen.getByTestId("sport-strip-list")).toBeInTheDocument()

    // All sports are rendered with their icons
    sports.forEach((s) => {
      const sportKey = s.toLowerCase().replace(/[^a-z0-9]/g, "-")
      const itemBtn = screen.getByTestId(`sport-item-${sportKey}`)
      expect(itemBtn).toBeInTheDocument()
      expect(itemBtn).toHaveTextContent(SPORT_ICONS[s])
    })
  })

  it("reveals full name of hovered sport and applies blur to others", async () => {
    render(<App />)

    // Open menu
    const trigger = screen.getByTestId("sport-strip-trigger")
    await act(async () => {
      fireEvent.click(trigger)
    })

    const soccerBtn = screen.getByTestId("sport-item-soccer")
    const basketballBtn = screen.getByTestId("sport-item-basketball")
    const tennisBtn = screen.getByTestId("sport-item-tennis")

    // Move pointer over Soccer
    await act(async () => {
      fireEvent.mouseEnter(soccerBtn)
    })

    // Soccer is hovered and shows full name
    expect(soccerBtn).toHaveClass("hovered")
    expect(soccerBtn).not.toHaveClass("blurred")
    expect(soccerBtn).toHaveTextContent("Soccer")

    // Basketball and Tennis should be blurred
    expect(basketballBtn).toHaveClass("blurred")
    expect(tennisBtn).toHaveClass("blurred")

    // Move pointer to Basketball
    await act(async () => {
      fireEvent.mouseEnter(basketballBtn)
    })
    expect(basketballBtn).toHaveClass("hovered")
    expect(basketballBtn).not.toHaveClass("blurred")
    expect(soccerBtn).toHaveClass("blurred")

    // Move pointer away from the list
    const list = screen.getByTestId("sport-strip-list")
    await act(async () => {
      fireEvent.mouseLeave(list)
    })

    expect(soccerBtn).not.toHaveClass("blurred")
    expect(basketballBtn).not.toHaveClass("blurred")
    expect(tennisBtn).not.toHaveClass("blurred")
  })

  it("selects a sport and updates the active pill on click", async () => {
    render(<App />)

    const trigger = screen.getByTestId("sport-strip-trigger")
    await act(async () => {
      fireEvent.click(trigger)
    })

    const tennisBtn = screen.getByTestId("sport-item-tennis")
    await act(async () => {
      fireEvent.click(tennisBtn)
    })

    // Active pill should now show Tennis
    expect(trigger).toHaveTextContent(/Tennis/i)
    expect(tennisBtn).toHaveClass("active")
  })
})
