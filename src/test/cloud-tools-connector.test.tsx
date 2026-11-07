import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import React from "react"
import CloudToolsConnectorModal from "../components/CloudToolsConnectorModal"

describe("CloudToolsConnectorModal & Infrastructure Hub", () => {
  it("renders when isOpen is true with live tool cards and status", async () => {
    const onClose = vi.fn()

    render(
      <CloudToolsConnectorModal
        isOpen={true}
        onClose={onClose}
        lang="en"
      />
    )

    const modal = screen.getByTestId("cloud-tools-modal")
    expect(modal).toBeInTheDocument()

    // Title and Header
    expect(screen.getByText(/Production Tools & Infrastructure/i)).toBeInTheDocument()
    expect(screen.getByText("Scot AI Tools Connection Hub")).toBeInTheDocument()

    // Core Stack tool badges
    expect(screen.getByText("FastAPI AI Microservice (ai_engine)")).toBeInTheDocument()
    expect(screen.getByText("MongoDB Atlas")).toBeInTheDocument()
    expect(screen.getByText("Appwrite Cloud")).toBeInTheDocument()
    expect(screen.getByText("Sentry APM")).toBeInTheDocument()
    expect(screen.getByText("Datadog StatsD")).toBeInTheDocument()
    expect(screen.getByText("Azure Container Apps")).toBeInTheDocument()
  })

  it("does not render when isOpen is false", () => {
    const onClose = vi.fn()
    render(
      <CloudToolsConnectorModal
        isOpen={false}
        onClose={onClose}
        lang="en"
      />
    )

    expect(screen.queryByTestId("cloud-tools-modal")).not.toBeInTheDocument()
  })

  it("switches to Cloud Secrets (.env) tab and displays configuration", () => {
    const onClose = vi.fn()
    render(
      <CloudToolsConnectorModal
        isOpen={true}
        onClose={onClose}
        lang="en"
      />
    )

    const envTab = screen.getByText("Cloud Secrets (.env)")
    fireEvent.click(envTab)

    expect(screen.getByText("Copy Configuration")).toBeInTheDocument()
    expect(screen.getByText(/MONGODB_URI/)).toBeInTheDocument()
  })

  it("switches to Deploy & CLI tab and displays execution commands", () => {
    const onClose = vi.fn()
    render(
      <CloudToolsConnectorModal
        isOpen={true}
        onClose={onClose}
        lang="en"
      />
    )

    const cliTab = screen.getByText("Deploy & CLI Commands")
    fireEvent.click(cliTab)

    expect(screen.getByText("1. Run Scot AI Engine Locally")).toBeInTheDocument()
    expect(screen.getByText("2. Deploy to Azure Container Apps with Free SSL")).toBeInTheDocument()
    expect(screen.getByText("3. CI/CD Push to GitHub")).toBeInTheDocument()
  })

  it("calls onClose when the Done button or close button is clicked", () => {
    const onClose = vi.fn()
    render(
      <CloudToolsConnectorModal
        isOpen={true}
        onClose={onClose}
        lang="en"
      />
    )

    const doneBtn = screen.getByText("Done")
    fireEvent.click(doneBtn)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
