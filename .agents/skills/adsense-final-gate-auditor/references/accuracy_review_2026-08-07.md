# Accuracy review evidence — 2026-08-07

## Official sources checked

1. AdSense readiness: https://support.google.com/adsense/answer/7299563?hl=en
   - Google says sites should have unique, relevant content, great user experience, clear/easy navigation, unique and interesting content, original contribution when using external resources, and moderated user-generated content.
   - It explicitly says scraped or copyrighted content can violate Publisher Policies and lead to disabled ads/account closure.

2. Google Publisher Policies: https://support.google.com/adsense/answer/10502938?hl=en
   - Current categories include content policies, behavioral policies, privacy-related policies, and requirements/other standards.
   - Prohibitions include illegal content, IP abuse, dangerous/derogatory content, misleading representation, harmful/unreliable claims, deceptive practices, manipulated media, dishonest behavior, sexually explicit content, and child exploitation. Page was partially extracted, so use runtime retrieval for complete current text.

3. AdSense Program policies: https://support.google.com/adsense/answer/48182?hl=en
   - Publishers may not inflate clicks/impressions or encourage clicks/views through deceptive methods.
   - Ads may not be placed in inappropriate locations such as pop-ups, emails, or software.
   - Sites showing ads should be easy to navigate and must not change user preferences, redirect users to unwanted websites, initiate downloads, contain malware, or use interfering pop-ups/pop-unders.
   - Deceptive ad/navigation placement includes ads mistaken for menu, navigation, or download links.
   - Page displays last updated August 16, 2024; the skill correctly requires runtime verification because Google says policies may change.

4. Search spam policies: https://developers.google.com/search/docs/essentials/spam-policies
   - Current policy covers cloaking, doorway abuse, expired domain abuse, hacked content, hidden text/link abuse, keyword stuffing, link spam, machine-generated traffic, and malicious practices; extracted page was partial, so runtime retrieval is required.

5. Helpful content: https://developers.google.com/search/docs/fundamentals/creating-helpful-content
   - Google asks whether content provides original information/analysis, substantial completeness, added value beyond obvious, avoids copying/rewriting, satisfies intent, and demonstrates trust/experience.
   - It says there is no preferred word count.
   - It distinguishes people-first from search-engine-first content and says E-E-A-T is not itself a specific ranking factor; trust is most important among the E-E-A-T concepts.
   - It encourages accurate bylines where expected and explains Who/How/Why.

6. Generative AI guidance: https://developers.google.com/search/docs/fundamentals/using-gen-ai-content
   - AI is not categorically prohibited. Generating many pages without adding user value may violate scaled-content abuse. The skill’s wording correctly focuses on low-value AI-assisted output, not AI use itself.
   - Last updated December 10, 2025.

7. Core Web Vitals: https://developers.google.com/search/docs/appearance/core-web-vitals
   - Recommended good thresholds: LCP within 2.5 seconds, INP less than 200 ms, CLS less than 0.1.
   - The skill correctly states these are recommended UX/Search thresholds, not fabricated AdSense approval rules.
   - Last updated December 10, 2025.

8. Structured-data guidelines: https://developers.google.com/search/docs/appearance/structured-data/sd-policies
   - Structured data must represent visible page content, be relevant, complete, current, non-misleading, and not violate spam/content policies.
   - Correct markup does not guarantee rich-result display; structured-data manual actions affect rich-result eligibility, not web ranking.
   - Last updated July 10, 2026.

## Preliminary accuracy findings

The core skill is substantially accurate and appropriately conservative. It correctly separates official policy from prudent quality controls, avoids unsupported “required number of articles/domain age/traffic” claims, treats AI as conditional rather than prohibited, distinguishes Search guidance from AdSense approval, uses current Core Web Vitals thresholds accurately, and requires runtime source verification.

Potential wording risks to review before finalizing:

- The claim that any unresolved material `NEEDS HUMAN REVIEW` must produce `FAIL` is a deliberate internal release policy, not a Google rule. It should remain explicitly labeled as the skill’s conservative gate.
- “A materially broken or mobile-hostile page blocks approval” is a conservative release standard. Google’s official pages support good UX and easy navigation, but do not state this exact AdSense approval formula. Keep the wording framed as the auditor’s release gate.
- The exact weighted scoring formula in audit_matrix.md is internal, not Google-authored. It must never be presented as a Google score or approval probability.
- “About page,” “Contact page,” “Terms,” and author pages should remain evidence/trust checks rather than universal official AdSense prerequisites.
- “Excessive ads” is a useful UX risk label, but the auditor should cite the applicable current ad-placement/content policy and avoid claiming a universal numeric ad limit unless an official page provides one.
- Legal sufficiency and YMYL expert review cannot be fully automated; fail-closed human review is accurate and necessary.
