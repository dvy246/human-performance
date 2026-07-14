import React, { useState, useEffect } from "react"
import { dataLayer } from "../../runtime/dataLayer"
import { generateRecoveryCode } from "../../runtime/recovery"

export default function SyncPanel() {
  const [recoveryCode, setRecoveryCode] = useState<string | null>(null)
  const [showModal, setShowModal] = useState<boolean>(false)
  const [inputCode, setInputCode] = useState<string>("")
  const [syncStatus, setSyncStatus] = useState<
    "idle" | "syncing" | "success" | "error"
  >("idle")
  const [syncMessage, setSyncMessage] = useState<string>("")

  useEffect(() => {
    setRecoveryCode(dataLayer.getRecoveryCode())
  }, [])

  const handleEnableSync = async () => {
    setSyncStatus("syncing")
    setSyncMessage("Generating keys...")

    const code = generateRecoveryCode()
    dataLayer.setRecoveryCode(code)
    setRecoveryCode(code)

    try {
      setSyncMessage("Uploading local history...")
      await dataLayer.triggerSync()
      setSyncStatus("success")
      setSyncMessage("Cloud sync activated.")
      setTimeout(() => setSyncStatus("idle"), 3000)
    } catch (err: any) {
      setSyncStatus("error")
      setSyncMessage("Failed to trigger initial upload.")
    }
  }

  const handlePullSync = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputCode.trim()) return

    setSyncStatus("syncing")
    setSyncMessage("Downloading edge telemetry...")

    try {
      dataLayer.setRecoveryCode(inputCode)
      const recordsMerged = await dataLayer.pullSync()
      setRecoveryCode(inputCode)
      setSyncStatus("success")
      setSyncMessage(`Synced! Merged ${recordsMerged} assessments.`)
      setInputCode("")
      setTimeout(() => {
        setSyncStatus("idle")
        setShowModal(false)
        // Refresh page to load IndexedDB changes into state
        window.location.reload()
      }, 2000)
    } catch (err: any) {
      // Revert if failed
      dataLayer.setRecoveryCode("")
      setRecoveryCode(null)
      setSyncStatus("error")
      setSyncMessage("Invalid recovery code or server offline.")
    }
  }

  const handleDisconnect = () => {
    if (
      confirm(
        "Disconnect sync? Your score history remains safely on this browser, but changes will no longer back up to the cloud."
      )
    ) {
      dataLayer.setRecoveryCode("")
      setRecoveryCode(null)
      setShowModal(false)
    }
  }

  return (
    <div className="flex w-full flex-col gap-2 border-t border-card-border/50 pt-4">
      <div className="flex items-center justify-between font-mono text-[11px] text-muted">
        <span>Backup Sync</span>
        {recoveryCode ? (
          <div className="flex items-center gap-1.5 text-success">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success"></span>
            <span>Cloud Active</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-muted"></span>
            <span>Local Only</span>
          </div>
        )}
      </div>

      {recoveryCode ? (
        <button
          onClick={() => setShowModal(true)}
          className="mt-0.5 text-left text-[11px] text-muted transition-colors hover:text-foreground hover:underline"
        >
          Manage Sync Key &middot; View Code
        </button>
      ) : (
        <button
          onClick={() => setShowModal(true)}
          className="mt-0.5 text-left text-[11px] text-accent transition-colors hover:text-accent-hover hover:underline"
        >
          Enable Cloud Sync (Backup)
        </button>
      )}

      {/* Sync Management Overlay Dialog */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-xl border border-card-border bg-card p-6 shadow-2xl">
            <button
              onClick={() => {
                setShowModal(false)
                setSyncStatus("idle")
              }}
              className="transition-standard absolute top-2 right-2 flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg font-mono text-lg text-muted hover:text-foreground active:scale-95"
              aria-label="Close Sync Modal"
            >
              &times;
            </button>

            <h3 className="mb-2 text-base font-bold tracking-tight text-foreground">
              Cloud Telemetry Sync
            </h3>
            <p className="mb-6 text-xs leading-relaxed text-secondary">
              CogniArena is anonymous and stores data local-first. Activate
              backup sync to protect your scores and streaks against browser
              cache wipes, or load scores onto another device.
            </p>

            {recoveryCode ? (
              /* ACTIVE SYNC VIEWER */
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2 rounded-lg border border-card-border bg-subtle p-4">
                  <span className="font-mono text-[10px] text-muted uppercase">
                    Your 8-Word Recovery Code
                  </span>
                  <div className="rounded border border-card-border bg-[var(--btn-secondary-bg)] px-3 py-2 text-center font-mono text-xs break-all text-foreground select-all">
                    {recoveryCode}
                  </div>
                  <span className="text-[10px] leading-normal text-muted">
                    ⚠️ Save this code somewhere safe. Copy and enter this code
                    on another device to restore all attempts and streaks
                    instantly.
                  </span>
                </div>

                <div className="mt-2 flex justify-end gap-3">
                  <button
                    onClick={handleDisconnect}
                    className="border-error-border bg-error-bg h-11 cursor-pointer rounded border px-3 font-mono text-[11px] text-error uppercase transition-all hover:border-error active:scale-98"
                  >
                    Disconnect
                  </button>
                  <button
                    onClick={() => {
                      dataLayer.triggerSync()
                      setSyncStatus("success")
                      setSyncMessage("Forced sync upload complete.")
                      setTimeout(() => setSyncStatus("idle"), 2000)
                    }}
                    className="h-11 cursor-pointer rounded bg-accent px-3 font-mono text-[11px] font-bold text-white uppercase transition-all hover:bg-accent-hover active:scale-98"
                  >
                    Force Sync Now
                  </button>
                </div>
              </div>
            ) : (
              /* INACTIVE SYNC GENERATOR/LOADER */
              <div className="flex flex-col gap-6">
                {/* Generate New */}
                <div className="flex flex-col gap-2 rounded-lg border border-card-border bg-subtle p-4">
                  <h4 className="text-xs font-semibold text-foreground">
                    Create New Sync Key
                  </h4>
                  <p className="mb-2 text-[11px] leading-normal text-muted">
                    Generates an anonymous recovery key to lock your local
                    attempts to the Cloudflare Edge database.
                  </p>
                  <button
                    onClick={handleEnableSync}
                    disabled={syncStatus === "syncing"}
                    className="h-11 w-full cursor-pointer rounded border border-[var(--btn-secondary-border)] bg-[var(--btn-secondary-bg)] font-mono text-[11px] text-foreground uppercase transition-all hover:bg-[var(--btn-secondary-hover-bg)] active:scale-98"
                  >
                    Generate Recovery Code
                  </button>
                </div>

                {/* Import Existing */}
                <form
                  onSubmit={handlePullSync}
                  className="flex flex-col gap-2 rounded-lg border border-card-border bg-subtle p-4"
                >
                  <h4 className="text-xs font-semibold text-foreground">
                    Sync Existing Profile
                  </h4>
                  <p className="mb-3 text-[11px] leading-normal text-muted">
                    Paste your 8-word recovery code below to load history from
                    the edge.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. word-word-word-word-word-word-word-word"
                      value={inputCode}
                      onChange={(e) => setInputCode(e.target.value)}
                      className="h-11 flex-1 rounded border border-card-border bg-[var(--bg-input)] px-3 font-mono text-xs text-foreground placeholder-muted focus:border-accent focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={syncStatus === "syncing"}
                      className="h-11 cursor-pointer rounded bg-accent px-4 font-mono text-[11px] font-semibold text-white uppercase transition-all hover:bg-accent-hover active:scale-98"
                    >
                      Import
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Sync Notifications status bar */}
            {syncStatus !== "idle" && (
              <div
                className={`mt-4 rounded-lg border p-3 text-center font-mono text-xs ${
                  syncStatus === "syncing"
                    ? "border-card-border bg-subtle text-muted"
                    : syncStatus === "success"
                      ? "bg-success-bg border-success-border text-success"
                      : "bg-error-bg border-error-border text-error"
                }`}
              >
                {syncMessage}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
