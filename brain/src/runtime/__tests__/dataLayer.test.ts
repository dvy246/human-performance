// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from "vitest"
import { dataLayer } from "../dataLayer"

const mockStorage: Record<string, string> = {}

beforeEach(() => {
  Object.keys(mockStorage).forEach((k) => delete mockStorage[k])
  // Mock window so dataLayer functions don't short-circuit on typeof window === 'undefined'
  globalThis.window = {} as Window & typeof globalThis
  globalThis.localStorage = {
    getItem: vi.fn((key: string) => mockStorage[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      mockStorage[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete mockStorage[key]
    }),
    clear: vi.fn(() => {
      Object.keys(mockStorage).forEach((k) => delete mockStorage[k])
    }),
    key: vi.fn((index: number) => Object.keys(mockStorage)[index] ?? null),
    get length() {
      return Object.keys(mockStorage).length
    },
  } as Storage
})

describe("dataLayer streak logic", () => {
  it("getStreak returns 0 when no streak stored", () => {
    const streak = dataLayer.getStreak()
    expect(streak.streakCount).toBe(0)
    expect(streak.lastActiveDate).toBe("")
  })

  it("updateStreak returns streak 1 on first activity", () => {
    const result = dataLayer.updateStreak()
    expect(result.streakCount).toBe(1)
    expect(result.lastActiveDate).toBe(getToday())
  })

  it("updateStreak increments streak on consecutive day", () => {
    const yesterday = getYesterday()
    localStorage.setItem("bb_streak_count", "5")
    localStorage.setItem("bb_last_active_date", yesterday)

    const result = dataLayer.updateStreak()
    expect(result.streakCount).toBe(6)
    expect(result.lastActiveDate).toBe(getToday())
  })

  it("updateStreak resets to 1 when day is skipped", () => {
    const twoDaysAgo = getDaysAgo(2)
    localStorage.setItem("bb_streak_count", "10")
    localStorage.setItem("bb_last_active_date", twoDaysAgo)

    const result = dataLayer.updateStreak()
    expect(result.streakCount).toBe(1)
    expect(result.lastActiveDate).toBe(getToday())
  })

  it("updateStreak does not change streak if already active today", () => {
    localStorage.setItem("bb_streak_count", "3")
    localStorage.setItem("bb_last_active_date", getToday())

    const result = dataLayer.updateStreak()
    expect(result.streakCount).toBe(3)
    expect(result.lastActiveDate).toBe(getToday())
  })
})

describe("dataLayer recovery code", () => {
  it("getRecoveryCode returns null initially", () => {
    expect(dataLayer.getRecoveryCode()).toBeNull()
  })

  it("set and get recovery code roundtrips", () => {
    dataLayer.setRecoveryCode("abc-123")
    expect(dataLayer.getRecoveryCode()).toBe("abc-123")
  })

  it("setRecoveryCode trims and lowercases", () => {
    dataLayer.setRecoveryCode("  ABC-123  ")
    expect(dataLayer.getRecoveryCode()).toBe("abc-123")
  })
})

function getToday(): string {
  return new Date().toISOString().split("T")[0]
}

function getYesterday(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().split("T")[0]
}

function getDaysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split("T")[0]
}
