import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import React from "react"
import { Icon, type IconName } from "../App"
import { PlansPage } from "../plans/PlansPage"
import { DeviceConnectionCard } from "../wearable/DeviceConnectionCard"
import { ScoutVaultModal } from "../components/ScoutVaultModal"
import { SocialHighlightCard9x16 } from "../components/SocialHighlightCard9x16"

describe("React Layout & Workflow Component Suite", () => {
  describe("Icon System Layout & Glyphs", () => {
    const icons: IconName[] = [
      "bolt",
      "search",
      "chevron",
      "location",
      "trend",
      "play",
      "close",
      "google",
      "facebook",
      "arrow",
      "shield",
      "menu",
      "video",
      "camera",
      "home",
      "chart",
      "user",
      "settings",
      "activity",
      "cpu",
      "wifi",
      "bell",
    ]

    it("renders all defined icons without runtime errors", () => {
      const { container } = render(
        <div>
          {icons.map((name) => (
            <Icon key={name} name={name} size={24} />
          ))}
        </div>
      )

      const svgs = container.querySelectorAll("svg")
      expect(svgs.length).toBe(icons.length)
      svgs.forEach((svg) => {
        expect(svg).toHaveAttribute("width", "24")
        expect(svg).toHaveAttribute("height", "24")
      })
    })

    it("respects default size of 18px", () => {
      const { container } = render(<Icon name="bolt" />)
      const svg = container.querySelector("svg")
      expect(svg).toHaveAttribute("width", "18")
      expect(svg).toHaveAttribute("height", "18")
    })
  })

  describe("PlansPage Layout & Localization", () => {
    it("renders all 4 subscription plans with default EGP pricing", () => {
      const onBack = vi.fn()
      const onSelectPlan = vi.fn()

      render(
        <PlansPage
          onBack={onBack}
          onSelectPlan={onSelectPlan}
          currentPlan="PRO ACADEMY"
          lang="en"
        />
      )

      expect(screen.getByText("Free Scout")).toBeInTheDocument()
      expect(screen.getByText("Starter Coach")).toBeInTheDocument()
      expect(screen.getByText("Pro Academy")).toBeInTheDocument()
      expect(screen.getByText("Enterprise Club")).toBeInTheDocument()

      // Default EGP prices
      expect(screen.getByText("499")).toBeInTheDocument()
      expect(screen.getByText("1,999")).toBeInTheDocument()
    })

    it("switches currency to USD and updates displayed prices", () => {
      render(<PlansPage onBack={vi.fn()} lang="en" />)

      const usdButton = screen.getByRole("button", { name: /USD \(Global\)/i })
      fireEvent.click(usdButton)

      // In USD mode, prices display 15 and 49 with $
      expect(screen.getByText("15")).toBeInTheDocument()
      expect(screen.getByText("49")).toBeInTheDocument()
      expect(screen.getAllByText("$").length).toBeGreaterThan(0)
    })

    it("triggers onBack when navigation back button is clicked", () => {
      const onBack = vi.fn()
      render(<PlansPage onBack={onBack} lang="en" />)

      const backBtn = screen.getByRole("button", { name: /Back to Profile/i })
      fireEvent.click(backBtn)
      expect(onBack).toHaveBeenCalledTimes(1)
    })

    it("supports Arabic layout mode (lang='ar')", () => {
      render(<PlansPage onBack={vi.fn()} lang="ar" />)

      expect(screen.getByText("المستكشف المجاني")).toBeInTheDocument()
      expect(screen.getByText("المدرب المستقل")).toBeInTheDocument()
      expect(screen.getByText("الأكاديمية المحترفة")).toBeInTheDocument()
      expect(screen.getByText("الأندية والاتحادات")).toBeInTheDocument()
    })
  })

  describe("DeviceConnectionCard Layout & Protocol Validation", () => {
    it("renders hardware status pill and specs layout", () => {
      render(
        <DeviceConnectionCard
          endpoint="http://192.168.4.1/data"
          onEndpointChange={vi.fn()}
          status="connected"
          lastSuccessfulTime={Date.now()}
          totalReadingsCount={250}
          errorCount={0}
          lastErrorMessage={null}
          pollingIntervalMs={200}
          onPollingIntervalChange={vi.fn()}
          isSimulated={false}
          onToggleSimulated={vi.fn()}
          onConnect={vi.fn()}
          onDisconnect={vi.fn()}
          onClearStats={vi.fn()}
        />
      )

      expect(screen.getByText("HARDWARE LINK")).toBeInTheDocument()
      expect(screen.getByText("SCOT MOTION SENSOR")).toBeInTheDocument()
      expect(screen.getByText("CONNECTED")).toBeInTheDocument()
      expect(screen.getByText(/ESP32/)).toBeInTheDocument()
    })

    it("enforces URL security: rejects dangerous protocols like javascript: or file:", () => {
      const onEndpointChange = vi.fn()
      render(
        <DeviceConnectionCard
          endpoint="http://192.168.4.1/data"
          onEndpointChange={onEndpointChange}
          status="disconnected"
          lastSuccessfulTime={null}
          totalReadingsCount={0}
          errorCount={0}
          lastErrorMessage={null}
          pollingIntervalMs={200}
          onPollingIntervalChange={vi.fn()}
          isSimulated={false}
          onToggleSimulated={vi.fn()}
          onConnect={vi.fn()}
          onDisconnect={vi.fn()}
          onClearStats={vi.fn()}
        />
      )

      const input = screen.getByLabelText("ESP32 Sensor Endpoint URL")

      // Attempt injection with javascript:
      fireEvent.change(input, { target: { value: "javascript:alert(1)" } })
      expect(
        screen.getByText("URL must begin with http:// or https://")
      ).toBeInTheDocument()
      expect(onEndpointChange).not.toHaveBeenCalledWith("javascript:alert(1)")

      // Attempt with file: protocol
      fireEvent.change(input, { target: { value: "file:///etc/passwd" } })
      expect(
        screen.getByText("URL must begin with http:// or https://")
      ).toBeInTheDocument()

      // Attempt with invalid URL string
      fireEvent.change(input, { target: { value: "NOT_A_VALID_URL" } })
      expect(
        screen.getByText(/Please enter a valid URL/i)
      ).toBeInTheDocument()

      // Valid URL passes validation
      fireEvent.change(input, { target: { value: "http://192.168.1.100:8080/metrics" } })
      expect(screen.queryByText(/URL must begin with/i)).not.toBeInTheDocument()
      expect(onEndpointChange).toHaveBeenCalledWith(
        "http://192.168.1.100:8080/metrics"
      )
    })

    it("allows switching transport mode between Wi-Fi and Web Serial", () => {
      const onTransportModeChange = vi.fn()
      render(
        <DeviceConnectionCard
          endpoint="http://192.168.4.1/data"
          onEndpointChange={vi.fn()}
          transportMode="wifi"
          onTransportModeChange={onTransportModeChange}
          isSerialSupported={true}
          status="disconnected"
          lastSuccessfulTime={null}
          totalReadingsCount={0}
          errorCount={0}
          lastErrorMessage={null}
          pollingIntervalMs={200}
          onPollingIntervalChange={vi.fn()}
          isSimulated={false}
          onToggleSimulated={vi.fn()}
          onConnect={vi.fn()}
          onDisconnect={vi.fn()}
          onClearStats={vi.fn()}
        />
      )

      const serialBtn = screen.getByRole("button", {
        name: /DIRECT USB \(WEB SERIAL\)/i,
      })
      fireEvent.click(serialBtn)
      expect(onTransportModeChange).toHaveBeenCalledWith("serial")
    })
  })

  describe("Modal & Card Overlays", () => {
    it("ScoutVaultModal renders saved scout dossiers and closes on request", () => {
      const onClose = vi.fn()
      const onSelectReport = vi.fn()

      const { container, rerender } = render(
        <ScoutVaultModal
          isOpen={false}
          onClose={onClose}
          onSelectReport={onSelectReport}
        />
      )
      expect(screen.queryByText(/Scout Vault · Saved Player Reports/i)).not.toBeInTheDocument()

      rerender(
        <ScoutVaultModal
          isOpen={true}
          onClose={onClose}
          onSelectReport={onSelectReport}
        />
      )

      expect(screen.getByText(/Scout Vault · Saved Player Reports/i)).toBeInTheDocument()
      expect(screen.getByText("Omar Khalil")).toBeInTheDocument()
      expect(screen.getByTestId("vault-3d-popover")).toHaveClass("vault-3d-popover")

      // Filter saved dossiers by name
      const filterInput = screen.getByLabelText("Filter saved dossiers")
      fireEvent.change(filterInput, { target: { value: "Tariq" } })
      expect(screen.getByText("Tariq Mansour")).toBeInTheDocument()
      expect(screen.queryByText("Omar Khalil")).not.toBeInTheDocument()

      // Header close button contains the close Icon
      const closeButtons = container.querySelectorAll("button")
      expect(closeButtons.length).toBeGreaterThan(0)
      fireEvent.click(closeButtons[0])
      expect(onClose).toHaveBeenCalled()
    })

    it("SocialHighlightCard9x16 renders athlete score badge and metrics", () => {
      const onClose = vi.fn()
      render(
        <SocialHighlightCard9x16
          isOpen={true}
          onClose={onClose}
          athleteName="Ziad Tarek"
          sport="Basketball"
          position="Shooting Guard"
          overallScore={93}
          overallGrade="A"
          strengths={["Fast Break", "Perimeter Arc Release"]}
        />
      )

      expect(screen.getByText("Ziad Tarek")).toBeInTheDocument()
      expect(screen.getByText(/Shooting Guard/i)).toBeInTheDocument()
      expect(screen.getByText("93")).toBeInTheDocument()
      expect(screen.getByText(/GRADE A/i)).toBeInTheDocument()
      expect(screen.getByText(/1080 × 1920 HD Ready/i)).toBeInTheDocument()
      expect(screen.getByText(/Download 9:16 Social Card/i)).toBeInTheDocument()
    })
  })
})
