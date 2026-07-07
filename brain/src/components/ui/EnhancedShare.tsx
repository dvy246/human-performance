import React, { useState, useEffect } from 'react';

interface EnhancedShareProps {
  title: string;
  text?: string;
  url?: string;
  score?: string;
  testType?: string;
}

export default function EnhancedShare({ title, text, url, score, testType }: EnhancedShareProps) {
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setCanShare(typeof navigator !== 'undefined' && !!navigator.share);
  }, []);

  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const shareText = text || `I scored ${score || 'great'} on ${testType || 'this'} at CogniArena! Can you beat me?`;

  const handleNativeShare = async () => {
    if (!canShare) return;
    try {
      await navigator.share({
        title: title || 'CogniArena',
        text: shareText,
        url: shareUrl,
      });
    } catch (err) {
      console.error('Share failed:', err);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const handleTwitterShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank', 'noopener,noreferrer');
  };

  const handleRedditShare = () => {
    const redditUrl = `https://reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(title || 'Check out CogniArena')}`;
    window.open(redditUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium text-foreground">Share your results</p>
      
      <div className="flex flex-wrap gap-2">
        {canShare && (
          <button
            onClick={handleNativeShare}
            className="flex items-center gap-2 px-3 py-2 rounded-md bg-accent text-white text-xs font-medium hover:opacity-90 transition-opacity"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" x2="15.42" y1="13.51" y2="17.49" />
              <line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
            </svg>
            Share
          </button>
        )}

        <button
          onClick={handleCopyLink}
          className={`flex items-center gap-2 px-3 py-2 rounded-md border text-xs font-medium transition-colors ${
            copied
              ? 'bg-success-bg border-success-border text-success'
              : 'border-card-border text-muted hover:text-foreground hover:bg-subtle'
          }`}
        >
          {copied ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
              </svg>
              Copy Link
            </>
          )}
        </button>

        <button
          onClick={handleTwitterShare}
          className="flex items-center gap-2 px-3 py-2 rounded-md border border-card-border text-muted hover:text-foreground hover:bg-subtle text-xs font-medium transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          Twitter
        </button>

        <button
          onClick={handleRedditShare}
          className="flex items-center gap-2 px-3 py-2 rounded-md border border-card-border text-muted hover:text-foreground hover:bg-subtle text-xs font-medium transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.16-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.131 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.046-.534C4.78 13.477 4 12.822 4 12c0-.968.786-1.754 1.754-1.754.43 0 .852.182 1.16.491 1.194-.856 2.85-1.418 4.674-1.488l-.8-3.747-2.597.547a1.25 1.25 0 0 1-2.498-.056c0-.688.561-1.249 1.25-1.249.427 0 .81.216 1.04.544l2.85-.6c.09-.018.18-.018.27 0l2.85.6c.23-.328.613-.544 1.04-.544zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.248 0-.688-.561-1.25-1.248-1.25zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.248 1.248.688 0 1.25-.561 1.25-1.248 0-.688-.562-1.25-1.25-1.25zm-5.466 3.621a.625.625 0 0 1 .886.025c.287.296.77.491 1.28.491.51 0 .993-.195 1.28-.491a.625.625 0 0 1 .911.86c-.532.553-1.32.856-2.191.856-.871 0-1.659-.303-2.191-.856a.625.625 0 0 1 .025-.885z" />
          </svg>
          Reddit
        </button>
      </div>
    </div>
  );
}
