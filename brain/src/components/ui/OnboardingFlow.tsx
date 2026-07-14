import React, { useState, useEffect } from "react"

export default function OnboardingFlow() {
  const [isVisible, setIsVisible] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(true)

  useEffect(() => {
    const seen = localStorage.getItem("hasSeenOnboarding")
    if (!seen) {
      setHasSeenOnboarding(false)
      setIsVisible(true)
    }
  }, [])

  const handleNext = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1)
    } else {
      handleClose()
    }
  }

  const handleClose = () => {
    setIsVisible(false)
    setHasSeenOnboarding(true)
    localStorage.setItem("hasSeenOnboarding", "true")
  }

  if (!isVisible || hasSeenOnboarding) return null

  const steps = [
    {
      icon: "🎯",
      title: "Welcome to CogniArena",
      description:
        "Discover your cognitive potential with 24+ scientifically-designed tests",
      highlight:
        "Track your progress, challenge friends, and improve your brain performance",
    },
    {
      icon: "⚡",
      title: "Take Your First Test",
      description: "Start with Reaction Time, CPS, or Sequence Memory",
      highlight:
        "Each test takes 1-3 minutes and provides instant feedback with percentiles",
    },
    {
      icon: "📊",
      title: "Track Your Progress",
      description:
        "View your performance history, personal records, and cognitive profile",
      highlight:
        "All data stays private in your browser. Optional cloud sync available.",
    },
  ]

  const currentStepData = steps[currentStep]

  return (
    <div className="animate-fade-in fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-lg border border-card-border bg-card p-8 shadow-2xl">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 rounded-md p-2 text-muted transition-colors hover:bg-subtle hover:text-foreground"
          aria-label="Close onboarding"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" x2="6" y1="6" y2="18" />
            <line x1="6" x2="18" y1="6" y2="18" />
          </svg>
        </button>

        {/* Progress indicator */}
        <div className="mb-6 flex gap-2">
          {[0, 1, 2].map((step) => (
            <div
              key={step}
              className={`h-1 flex-1 rounded-full transition-colors ${
                step <= currentStep ? "bg-accent" : "bg-card-border"
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="mb-8 text-center">
          <div className="mb-4 text-5xl">{currentStepData.icon}</div>
          <h2 className="mb-3 text-2xl font-bold text-foreground">
            {currentStepData.title}
          </h2>
          <p className="mb-4 text-sm text-muted">
            {currentStepData.description}
          </p>
          <p className="text-xs font-medium text-accent">
            {currentStepData.highlight}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {currentStep > 0 && (
            <button
              onClick={() => setCurrentStep(currentStep - 1)}
              className="flex-1 rounded-md border border-card-border px-4 py-3 text-sm font-medium text-muted transition-colors hover:bg-subtle hover:text-foreground"
            >
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            className="flex-1 rounded-md bg-accent px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            {currentStep === 2 ? "Get Started" : "Next"}
          </button>
        </div>

        {/* Skip link */}
        <button
          onClick={handleClose}
          className="mt-4 w-full text-xs text-muted transition-colors hover:text-foreground"
        >
          Skip this tour
        </button>
      </div>
    </div>
  )
}
