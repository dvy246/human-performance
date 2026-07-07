import React, { useState, useEffect } from 'react';

export default function OnboardingFlow() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(true);

  useEffect(() => {
    const seen = localStorage.getItem('hasSeenOnboarding');
    if (!seen) {
      setHasSeenOnboarding(false);
      setIsVisible(true);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setHasSeenOnboarding(true);
    localStorage.setItem('hasSeenOnboarding', 'true');
  };

  if (!isVisible || hasSeenOnboarding) return null;

  const steps = [
    {
      icon: '🎯',
      title: 'Welcome to CogniArena',
      description: 'Discover your cognitive potential with 24+ scientifically-designed tests',
      highlight: 'Track your progress, challenge friends, and improve your brain performance'
    },
    {
      icon: '⚡',
      title: 'Take Your First Test',
      description: 'Start with Reaction Time, CPS, or Sequence Memory',
      highlight: 'Each test takes 1-3 minutes and provides instant feedback with percentiles'
    },
    {
      icon: '📊',
      title: 'Track Your Progress',
      description: 'View your performance history, personal records, and cognitive profile',
      highlight: 'All data stays private in your browser. Optional cloud sync available.'
    }
  ];

  const currentStepData = steps[currentStep];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-card border border-card-border rounded-lg shadow-2xl max-w-md w-full p-8 relative">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-muted hover:text-foreground hover:bg-subtle rounded-md transition-colors"
          aria-label="Close onboarding"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" x2="6" y1="6" y2="18" />
            <line x1="6" x2="18" y1="6" y2="18" />
          </svg>
        </button>

        {/* Progress indicator */}
        <div className="flex gap-2 mb-6">
          {[0, 1, 2].map((step) => (
            <div
              key={step}
              className={`h-1 flex-1 rounded-full transition-colors ${
                step <= currentStep ? 'bg-accent' : 'bg-card-border'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">{currentStepData.icon}</div>
          <h2 className="text-2xl font-bold text-foreground mb-3">{currentStepData.title}</h2>
          <p className="text-sm text-muted mb-4">{currentStepData.description}</p>
          <p className="text-xs text-accent font-medium">{currentStepData.highlight}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {currentStep > 0 && (
            <button
              onClick={() => setCurrentStep(currentStep - 1)}
              className="flex-1 px-4 py-3 rounded-md border border-card-border text-sm font-medium text-muted hover:text-foreground hover:bg-subtle transition-colors"
            >
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            className="flex-1 px-4 py-3 rounded-md bg-accent text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            {currentStep === 2 ? 'Get Started' : 'Next'}
          </button>
        </div>

        {/* Skip link */}
        <button
          onClick={handleClose}
          className="w-full mt-4 text-xs text-muted hover:text-foreground transition-colors"
        >
          Skip this tour
        </button>
      </div>
    </div>
  );
}
