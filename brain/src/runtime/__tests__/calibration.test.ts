// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { measureRefreshRate } from "../calibration"

describe("measureRefreshRate", () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.restoreAllMocks()
  })

  it("calls callback with accurate 60Hz result", () =>
    new Promise<void>((done) => {
      const frameDuration = 16.67
      let frameCount = 0

      vi.spyOn(window, "requestAnimationFrame").mockImplementation(
        (cb: FrameRequestCallback) => {
          const now = frameCount * frameDuration
          frameCount++
          cb(now)
          return frameCount
        }
      )

      measureRefreshRate(
        (result) => {
          expect(result.hz).toBe(60)
          expect(result.expectedLagMs).toBeCloseTo(8.3, 0)
          done()
        },
        { frameCount: 30, forceFresh: true }
      )
    }))

  it("snaps 59Hz to 60Hz standard", () =>
    new Promise<void>((done) => {
      const frameDuration = 16.95 // ~59Hz
      let frameCount = 0

      vi.spyOn(window, "requestAnimationFrame").mockImplementation(
        (cb: FrameRequestCallback) => {
          const now = frameCount * frameDuration
          frameCount++
          cb(now)
          return frameCount
        }
      )

      measureRefreshRate(
        (result) => {
          expect(result.hz).toBe(60)
          done()
        },
        { frameCount: 30, forceFresh: true }
      )
    }))

  it("snaps 141Hz raw timing to 144Hz standard", () =>
    new Promise<void>((done) => {
      const frameDuration = 7.09 // ~141Hz raw
      let frameCount = 0

      vi.spyOn(window, "requestAnimationFrame").mockImplementation(
        (cb: FrameRequestCallback) => {
          const now = frameCount * frameDuration
          frameCount++
          cb(now)
          return frameCount
        }
      )

      measureRefreshRate(
        (result) => {
          expect(result.hz).toBe(144)
          expect(result.expectedLagMs).toBeCloseTo(3.5, 0)
          done()
        },
        { frameCount: 30, forceFresh: true }
      )
    }))

  it("correctly identifies 120Hz ProMotion displays", () =>
    new Promise<void>((done) => {
      const frameDuration = 8.33 // 120Hz
      let frameCount = 0

      vi.spyOn(window, "requestAnimationFrame").mockImplementation(
        (cb: FrameRequestCallback) => {
          const now = frameCount * frameDuration
          frameCount++
          cb(now)
          return frameCount
        }
      )

      measureRefreshRate(
        (result) => {
          expect(result.hz).toBe(120)
          expect(result.expectedLagMs).toBeCloseTo(4.2, 0)
          done()
        },
        { frameCount: 30, forceFresh: true }
      )
    }))

  it("filters out transient dropped-frame lag spikes", () =>
    new Promise<void>((done) => {
      let frameCount = 0
      let currentTime = 0

      vi.spyOn(window, "requestAnimationFrame").mockImplementation(
        (cb: FrameRequestCallback) => {
          // Normal 60Hz frames (16.67ms) with 2 severe 50ms dropped frame spikes
          const delta = (frameCount === 10 || frameCount === 20) ? 50.0 : 16.67
          currentTime += delta
          frameCount++
          cb(currentTime)
          return frameCount
        }
      )

      measureRefreshRate(
        (result) => {
          expect(result.hz).toBe(60)
          done()
        },
        { frameCount: 35, forceFresh: true }
      )
    }))

  it("returns 60Hz fallback when requestAnimationFrame is unavailable", () => {
    vi.stubGlobal("requestAnimationFrame", undefined)

    return new Promise<void>((resolve) => {
      measureRefreshRate(
        (result) => {
          expect(result.hz).toBe(60)
          expect(result.expectedLagMs).toBe(8.3)
          resolve()
        },
        { forceFresh: true }
      )
    })
  })
})
