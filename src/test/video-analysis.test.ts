import { describe, it, expect } from "vitest"
import {
  normalizeGeminiModel,
  getModelPriorityList,
  DEFAULT_GEMINI_MODELS,
  GEMINI_MODELS,
} from "../video-analysis"

describe("Video Analysis & Model Strategy Suite", () => {
  describe("Gemini Model Normalization", () => {
    it("strips 'models/' prefix and normalizes casing/whitespace", () => {
      expect(normalizeGeminiModel("models/gemini-2.5-flash")).toBe(
        "gemini-2.5-flash"
      )
      expect(normalizeGeminiModel("  MODELS/GEMINI-2.0-FLASH  ")).toBe(
        "gemini-2.0-flash"
      )
    })

    it("maps audio/TTS model aliases to vision-capable variants", () => {
      expect(normalizeGeminiModel("gemini-3.8-flash-tts")).toBe(
        "gemini-3.8-flash"
      )
      expect(normalizeGeminiModel("gemini-3.8-flsah-tts")).toBe(
        "gemini-3.8-flash"
      )
      expect(normalizeGeminiModel("gemini-3.8-flash-lite-tts")).toBe(
        "gemini-3.8-flash-lite"
      )
      expect(normalizeGeminiModel("gemma-4-31b")).toBe("gemini-2.5-flash")
    })

    it("falls back safely to default model when input is empty or invalid", () => {
      const defaultModel = GEMINI_MODELS[0]
      expect(normalizeGeminiModel("")).toBe(defaultModel)
      expect(normalizeGeminiModel("   ")).toBe(defaultModel)
    })
  })

  describe("Model Priority & Fallback Lists", () => {
    it("places preferred normalized model first in priority queue", () => {
      const queue = getModelPriorityList("gemini-2.5-pro")
      expect(queue[0]).toBe("gemini-2.5-pro")
    })

    it("guarantees unique models with zero duplicates", () => {
      const queue = getModelPriorityList("gemini-2.0-flash")
      const uniqueQueue = Array.from(new Set(queue))
      expect(queue.length).toBe(uniqueQueue.length)
    })

    it("DEFAULT_GEMINI_MODELS includes required production models", () => {
      const ids = DEFAULT_GEMINI_MODELS.map((m) => m.id)
      expect(ids).toContain("gemini-2.5-pro")
      expect(ids).toContain("gemini-2.0-flash")
      expect(ids).toContain("gemini-1.5-flash")

      DEFAULT_GEMINI_MODELS.forEach((model) => {
        expect(model.id).toBeTruthy()
        expect(model.label).toBeTruthy()
      })
    })
  })
})

