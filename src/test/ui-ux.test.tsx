import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import React from "react"
import { SensorMetricCard } from "../wearable/SensorMetricCard"
import { BoundingBoxOverlay } from "../components/BoundingBoxOverlay"
import {
  OnboardingChoiceModal,
  InteractiveTutorialTour,
  TUTORIAL_DATA,
} from "../components/InteractiveTutorial"
import { PitchHeatmap2D } from "../components/PitchHeatmap2D"
import type { DetectedPlayer } from "../video-analysis"

describe("UI & UX Component Test Suite", () => {
  describe("SensorMetricCard UI Component", () => {
    it("renders label, formatted decimal value, and units correctly", () => {
      render(
        <SensorMetricCard
          label="Peak Acceleration"
          value={14.829}
          unit="m/s²"
          decimals={2}
          axis="MAG"
        />
      )

      expect(screen.getByText("Peak Acceleration")).toBeInTheDocument()
      expect(screen.getByText(/14.83/)).toBeInTheDocument()
      expect(screen.getByText("m/s²")).toBeInTheDocument()
      expect(screen.getByText("MAG")).toBeInTheDocument()
      expect(screen.getByText("LIVE SIGNAL")).toBeInTheDocument()
    })

    it("displays placeholder '--' and 'UNAVAILABLE' when value is null, undefined, or NaN", () => {
      const { rerender } = render(
        <SensorMetricCard label="Heart Rate" value={null} unit="BPM" />
      )
      expect(screen.getByText(/--/)).toBeInTheDocument()
      expect(screen.getByText("UNAVAILABLE")).toBeInTheDocument()

      rerender(<SensorMetricCard label="Heart Rate" value={undefined} unit="BPM" />)
      expect(screen.getByText(/--/)).toBeInTheDocument()

      rerender(<SensorMetricCard label="Heart Rate" value={Number.NaN} unit="BPM" />)
      expect(screen.getByText(/--/)).toBeInTheDocument()
    })

    it("applies featured class and custom delta labels with status colors", () => {
      const { container } = render(
        <SensorMetricCard
          label="Ground Contact Time"
          value={185}
          unit="ms"
          decimals={0}
          featured={true}
          deltaLabel="-12ms vs avg"
          statusColor="green"
          subtext="Elite reactive elasticity"
        />
      )

      const card = container.querySelector(".wearable-metric-card")
      expect(card).toHaveClass("featured")

      const delta = screen.getByText("-12ms vs avg")
      expect(delta).toHaveClass("safe")
      expect(screen.getByText("Elite reactive elasticity")).toBeInTheDocument()
    })
  })

  describe("BoundingBoxOverlay CV Tracking Component", () => {
    const mockPlayers: DetectedPlayer[] = [
      {
        id: "p1",
        label: "Forward #10",
        confidence: 0.94,
        bbox: [100, 200, 500, 600],
        teamColorHex: "#3b82f6",
      },
      {
        id: "p2",
        label: "Defender #4",
        confidence: 0.88,
        bbox: [300, 400, 700, 800],
        teamColorHex: "#ef4444",
      },
    ]

    it("renders SVG overlays for detected players with coordinates", () => {
      const { container } = render(
        <BoundingBoxOverlay players={mockPlayers} visible={true} />
      )

      const svg = container.querySelector("svg")
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveAttribute("viewBox", "0 0 1000 1000")

      expect(screen.getByText(/Forward #10/)).toBeInTheDocument()
      expect(screen.getByText(/Defender #4/)).toBeInTheDocument()
    })

    it("returns null when visible is false or players array is empty", () => {
      const { container, rerender } = render(
        <BoundingBoxOverlay players={mockPlayers} visible={false} />
      )
      expect(container.firstChild).toBeNull()

      rerender(<BoundingBoxOverlay players={[]} visible={true} />)
      expect(container.firstChild).toBeNull()
    })

    it("handles player selection click callbacks", () => {
      const onSelectPlayer = vi.fn()
      render(
        <BoundingBoxOverlay
          players={mockPlayers}
          selectedPlayerId="p1"
          onSelectPlayer={onSelectPlayer}
          visible={true}
        />
      )

      const playerGroup = screen.getByText(/Defender #4/).closest("g")
      expect(playerGroup).toBeInTheDocument()

      fireEvent.click(playerGroup!)
      expect(onSelectPlayer).toHaveBeenCalledWith(mockPlayers[1])
    })
  })

  describe("InteractiveTutorial UX Workflows", () => {
    it("OnboardingChoiceModal opens with accessible dialog attributes and role info", () => {
      const onStart = vi.fn()
      const onAlone = vi.fn()

      const { rerender } = render(
        <OnboardingChoiceModal
          isOpen={false}
          userName="Capt. Hany"
          role="Club Manager"
          onStartTutorial={onStart}
          onDiscoverAlone={onAlone}
        />
      )
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()

      rerender(
        <OnboardingChoiceModal
          isOpen={true}
          userName="Capt. Hany"
          role="Club Manager"
          onStartTutorial={onStart}
          onDiscoverAlone={onAlone}
        />
      )

      const dialog = screen.getByRole("dialog")
      expect(dialog).toBeInTheDocument()
      expect(dialog).toHaveAttribute("aria-modal", "true")

      expect(screen.getByText(/WELCOME TO SCOT AI/i)).toBeInTheDocument()
      expect(screen.getByText(/CLUB \/ ACADEMY COMMAND/i)).toBeInTheDocument()

      // Click Discover Alone button
      const aloneBtn = screen.getByText(/DISCOVER BY YOURSELF/i).closest("button")
      expect(aloneBtn).toBeInTheDocument()
      fireEvent.click(aloneBtn!)
      expect(onAlone).toHaveBeenCalledTimes(1)

      // Click Start Guided Tour button
      const tourBtn = screen.getByText(/START INTERACTIVE TUTORIAL/i).closest("button")
      expect(tourBtn).toBeInTheDocument()
      fireEvent.click(tourBtn!)
      expect(onStart).toHaveBeenCalledWith("Club")
    })

    it("InteractiveTutorialTour navigates steps and invokes step actions", () => {
      const onNext = vi.fn()
      const onPrev = vi.fn()
      const onSkip = vi.fn()
      const onFinish = vi.fn()
      const onSelectStep = vi.fn()
      const onChangeRole = vi.fn()
      const onNavigateView = vi.fn()

      render(
        <InteractiveTutorialTour
          isOpen={true}
          role="Player"
          stepIndex={0}
          onNext={onNext}
          onPrev={onPrev}
          onSkip={onSkip}
          onFinish={onFinish}
          onSelectStep={onSelectStep}
          onChangeRole={onChangeRole}
          onNavigateView={onNavigateView}
        />
      )

      const currentStep = TUTORIAL_DATA.Player.steps[0]
      expect(screen.getByText(currentStep.title)).toBeInTheDocument()
      expect(screen.getByText(currentStep.eyebrow)).toBeInTheDocument()

      // Next button test
      const nextBtn = screen.getByRole("button", { name: /Next Step/i })
      fireEvent.click(nextBtn)
      expect(onNext).toHaveBeenCalled()

      // Skip tour test
      const skipBtn = screen.getByRole("button", { name: /Skip Guide/i })
      fireEvent.click(skipBtn)
      expect(onSkip).toHaveBeenCalled()
    })
  })

  describe("PitchHeatmap2D Spatial Component", () => {
    it("renders spatial breakdown for basketball", () => {
      render(
        <PitchHeatmap2D
          sport="Basketball"
          athleteName="Yussef Essam"
          position="Point Guard"
          attackingThird={45}
          middleThird={35}
          defensiveThird={20}
          theme="nano-banana"
        />
      )

      expect(screen.getByText(/Yussef Essam/i)).toBeInTheDocument()
      expect(screen.getByText(/Point Guard/i)).toBeInTheDocument()
      expect(screen.getByText(/45%/)).toBeInTheDocument()
      expect(screen.getByText(/35%/)).toBeInTheDocument()
      expect(screen.getByText(/20%/)).toBeInTheDocument()
    })

    it("supports soccer and adapts zone nomenclature", () => {
      render(
        <PitchHeatmap2D
          sport="Soccer"
          athleteName="Mohamed Salah"
          position="Right Winger"
          attackingThird={58}
          middleThird={28}
          defensiveThird={14}
        />
      )

      expect(screen.getByText(/Mohamed Salah/i)).toBeInTheDocument()
      expect(screen.getByText(/Right Winger/i)).toBeInTheDocument()
      expect(screen.getByText(/58%/)).toBeInTheDocument()
      expect(screen.getByText("ATTACKING 3RD")).toBeInTheDocument()
    })
  })
})
