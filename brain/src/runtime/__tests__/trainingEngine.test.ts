import { describe, it, expect } from "vitest"
import {
  determinePersona,
  generateDailyChallengeForDay,
  getAdaptiveRecommendations,
  PERSONAS,
  CHALLENGE_POOL,
} from "../trainingEngine"
import type { CognitiveAverages } from "../skillRadar"

describe("determinePersona", () => {
  it("returns Rapid Reactor when reaction is strongest", () => {
    const avg: CognitiveAverages = {
      reaction: 90,
      memory: 50,
      processing: 50,
      precision: 50,
      focus: 50,
      stamina: 50,
    }
    const persona = determinePersona(avg)
    expect(persona.title).toBe("Rapid Reactor")
  })

  it("returns Pattern Hunter when memory is strongest", () => {
    const avg: CognitiveAverages = {
      reaction: 50,
      memory: 90,
      processing: 50,
      precision: 50,
      focus: 50,
      stamina: 50,
    }
    const persona = determinePersona(avg)
    expect(persona.title).toBe("Pattern Hunter")
  })

  it("returns Choice Strategist when processing is strongest", () => {
    const avg: CognitiveAverages = {
      reaction: 50,
      memory: 50,
      processing: 90,
      precision: 50,
      focus: 50,
      stamina: 50,
    }
    const persona = determinePersona(avg)
    expect(persona.title).toBe("Choice Strategist")
  })

  it("returns Precision Targeter when precision is strongest", () => {
    const avg: CognitiveAverages = {
      reaction: 50,
      memory: 50,
      processing: 50,
      precision: 90,
      focus: 50,
      stamina: 50,
    }
    const persona = determinePersona(avg)
    expect(persona.title).toBe("Precision Targeter")
  })

  it("returns Focus Guardian when focus is strongest", () => {
    const avg: CognitiveAverages = {
      reaction: 50,
      memory: 50,
      processing: 50,
      precision: 50,
      focus: 90,
      stamina: 50,
    }
    const persona = determinePersona(avg)
    expect(persona.title).toBe("Focus Guardian")
  })

  it("returns Stamina Specialist when stamina is strongest", () => {
    const avg: CognitiveAverages = {
      reaction: 50,
      memory: 50,
      processing: 50,
      precision: 50,
      focus: 50,
      stamina: 90,
    }
    const persona = determinePersona(avg)
    expect(persona.title).toBe("Stamina Specialist")
  })

  it("returns first persona (Rapid Reactor) on all zeros", () => {
    const avg: CognitiveAverages = {
      reaction: 0,
      memory: 0,
      processing: 0,
      precision: 0,
      focus: 0,
      stamina: 0,
    }
    const persona = determinePersona(avg)
    expect(persona.title).toBe("Rapid Reactor")
  })

  it("returns first persona on tie (reaction)", () => {
    const avg: CognitiveAverages = {
      reaction: 80,
      memory: 80,
      processing: 50,
      precision: 50,
      focus: 50,
      stamina: 50,
    }
    const persona = determinePersona(avg)
    expect(persona.title).toBe("Rapid Reactor")
  })

  it("all PERSONAS have required fields", () => {
    Object.entries(PERSONAS).forEach(([key, persona]) => {
      expect(persona.title).toBeTruthy()
      expect(persona.desc).toBeTruthy()
      expect(persona.explanation).toBeTruthy()
    })
  })

  it("PERSONAS covers all 6 categories", () => {
    const keys = Object.keys(PERSONAS).sort()
    expect(keys).toEqual([
      "focus",
      "memory",
      "precision",
      "processing",
      "reaction",
      "stamina",
    ])
  })
})

describe("generateDailyChallengeForDay", () => {
  it("returns first challenge for day 0", () => {
    const challenge = generateDailyChallengeForDay(0)
    expect(challenge).toEqual(CHALLENGE_POOL[0])
  })

  it("returns correct challenge for specific day", () => {
    const challenge = generateDailyChallengeForDay(5)
    expect(challenge).toEqual(CHALLENGE_POOL[5])
  })

  it("wraps around for days beyond pool length", () => {
    const wrapIndex = CHALLENGE_POOL.length
    const challenge = generateDailyChallengeForDay(wrapIndex)
    expect(challenge).toEqual(CHALLENGE_POOL[0])
  })

  it("handles exact multiple of pool length", () => {
    const challenge = generateDailyChallengeForDay(CHALLENGE_POOL.length * 2)
    expect(challenge).toEqual(CHALLENGE_POOL[0])
  })

  it("all challenges have required fields", () => {
    CHALLENGE_POOL.forEach((c, i) => {
      expect(c.testId, `Challenge ${i} missing testId`).toBeTruthy()
      expect(c.name, `Challenge ${i} missing name`).toBeTruthy()
      expect(c.metric, `Challenge ${i} missing metric`).toBeTruthy()
      expect(typeof c.target, `Challenge ${i} missing target`).toBe("number")
      expect(["higher", "lower"]).toContain(c.condition)
      expect(c.desc, `Challenge ${i} missing desc`).toBeTruthy()
    })
  })
})

describe("getAdaptiveRecommendations", () => {
  it("returns 2 recommendations", () => {
    const avg: CognitiveAverages = {
      reaction: 50,
      memory: 50,
      processing: 50,
      precision: 50,
      focus: 50,
      stamina: 50,
    }
    const recs = getAdaptiveRecommendations(avg)
    expect(recs).toHaveLength(2)
  })

  it("recommends lowest categories first", () => {
    const avg: CognitiveAverages = {
      reaction: 90,
      memory: 80,
      processing: 70,
      precision: 60,
      focus: 50,
      stamina: 40,
    }
    const recs = getAdaptiveRecommendations(avg)
    expect(recs[0].testId).toBe("click-speed")
    expect(recs[1].testId).toBe("trail-making")
  })

  it("each recommendation has required fields", () => {
    const avg: CognitiveAverages = {
      reaction: 50,
      memory: 50,
      processing: 50,
      precision: 50,
      focus: 50,
      stamina: 50,
    }
    const recs = getAdaptiveRecommendations(avg)
    recs.forEach((r, i) => {
      expect(r.text, `Rec ${i} missing text`).toBeTruthy()
      expect(r.link, `Rec ${i} missing link`).toBeTruthy()
      expect(r.testId, `Rec ${i} missing testId`).toBeTruthy()
    })
  })

  it("recommendations have valid links", () => {
    const avg: CognitiveAverages = {
      reaction: 50,
      memory: 50,
      processing: 50,
      precision: 50,
      focus: 50,
      stamina: 50,
    }
    const recs = getAdaptiveRecommendations(avg)
    recs.forEach((r) => {
      expect(r.link).toMatch(/^\/tests\//)
    })
  })

  it("text contains category name", () => {
    const avg: CognitiveAverages = {
      reaction: 1,
      memory: 50,
      processing: 50,
      precision: 50,
      focus: 50,
      stamina: 50,
    }
    const recs = getAdaptiveRecommendations(avg)
    expect(recs[0].text).toContain("Visual Reaction")
  })
})
