import React, { useState } from "react"
import { encodeChallenge } from "../../runtime/share"
import QRChallengeCard from "./QRChallengeCard"

interface SocialShareProps {
  testId: string
  score: number
  scoreLabel: string
  testName: string
  percentile?: number
}

const TEST_SLUGS: Record<string, string> = {
  "tmt-partA": "trail-making",
  "tmt-partB": "trail-making",
}

export default function SocialShare({
  testId,
  score,
  scoreLabel,
  testName,
  percentile,
}: SocialShareProps) {
  const [copied, setCopied] = useState(false)
  const [showQR, setShowQR] = useState(false)

  const getChallengeUrl = () => {
    if (typeof window === "undefined") return ""
    const token = encodeChallenge({ testId, score })
    if (testId === "gauntlet") {
      return `${window.location.origin}/gauntlet/?challenge=${token}`
    }
    return `${window.location.origin}/tests/${TEST_SLUGS[testId] || testId}/?challenge=${token}`
  }

  const handleCopy = () => {
    const url = getChallengeUrl()
    if (!url) return
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareText = `I scored ${scoreLabel} on the CogniArena ${testName}. Can you beat me?`
  const url = getChallengeUrl()

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`
  const redditUrl = `https://www.reddit.com/submit?title=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + " " + url)}`

  return (
    <>
      <div className="mt-4 flex w-full flex-col gap-3 border-t border-card-border/40 pt-4">
        <span className="text-center font-mono text-[10px] tracking-wider text-muted uppercase sm:text-left">
          Share & Challenge Friends
        </span>
        <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
          <button
            onClick={() => setShowQR(true)}
            className="transition-standard flex h-11 cursor-pointer items-center gap-1.5 rounded border border-accent/30 bg-accent/5 px-3 font-mono text-xs text-accent hover:bg-accent/15 hover:text-accent active:scale-95"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            <span>QR Card</span>
          </button>

          <button
            onClick={handleCopy}
            className="transition-standard flex h-11 cursor-pointer items-center gap-1.5 rounded border border-card-border bg-subtle/50 px-3 font-mono text-xs text-muted hover:bg-panel hover:text-foreground active:scale-95"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
            </svg>
            <span>{copied ? "Copied!" : "Copy Link"}</span>
          </button>

          <a
            href={twitterUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-standard flex h-11 items-center gap-1.5 rounded border border-card-border bg-subtle/50 px-3 font-mono text-xs text-muted hover:bg-panel hover:text-foreground active:scale-95"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
            </svg>
            <span>Twitter / X</span>
          </a>

          <a
            href={redditUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-standard flex h-11 items-center gap-1.5 rounded border border-card-border bg-subtle/50 px-3 font-mono text-xs text-muted hover:bg-panel hover:text-foreground active:scale-95"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M17 11.5a1.5 1.5 0 0 1-2.5 1.1c-.8.8-2 1.4-3.5 1.4s-2.7-.6-3.5-1.4A1.5 1.5 0 0 1 5 11.5c0-.8.7-1.5 1.5-1.5h.5c.8-.8 2-1.4 3.5-1.4s2.7.6 3.5 1.4h.5c.8 0 1.5.7 1.5 1.5z" />
            </svg>
            <span>Reddit</span>
          </a>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-standard flex h-11 items-center gap-1.5 rounded border border-card-border bg-subtle/50 px-3 font-mono text-xs text-muted hover:bg-panel hover:text-foreground active:scale-95"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
            <span>WhatsApp</span>
          </a>
        </div>
      </div>

      <QRChallengeCard
        isOpen={showQR}
        onClose={() => setShowQR(false)}
        testId={testId}
        score={score}
        scoreLabel={scoreLabel}
        testName={testName}
        percentile={percentile}
      />
    </>
  )
}
