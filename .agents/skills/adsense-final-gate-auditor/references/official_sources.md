# Official source registry

Use these sources as the primary authority. Fetch them at audit time; this registry is a locator, not a substitute for current text. Record HTTP status, page title, retrieval timestamp, visible last-updated date, and a content hash or excerpt.

| ID | Official source | Use |
|---|---|---|
| G-ADS-READY | https://support.google.com/adsense/answer/7299563?hl=en | Unique, relevant content; navigation; original contribution; readiness questions. |
| G-ADS-POLICY | https://support.google.com/adsense/answer/10502938?hl=en | Google Publisher Policies: prohibited content, deceptive practices, IP, safety, privacy, and other requirements. |
| G-ADS-PROGRAM | https://support.google.com/adsense/answer/48182?hl=en | AdSense program rules: invalid traffic, ad placement, site behavior, navigation, and policy-change responsibility. |
| G-SEARCH-ESSENTIALS | https://developers.google.com/search/docs/essentials | Technical requirements, spam policies, and people-first best practices. |
| G-SEARCH-SPAM | https://developers.google.com/search/docs/essentials/spam-policies | Cloaking, doorway abuse, hacked content, hidden text, keyword stuffing, link spam, scaled content, and malicious practices. |
| G-SEARCH-HELPFUL | https://developers.google.com/search/docs/fundamentals/creating-helpful-content | Originality, completeness, information gain, experience, authorship, “Who/How/Why,” and search-engine-first warnings. |
| G-SEARCH-CWV | https://developers.google.com/search/docs/appearance/core-web-vitals | Current Core Web Vitals definitions and recommended good thresholds. |
| G-SEARCH-PAGE | https://developers.google.com/search/docs/appearance/page-experience | Overall page experience and mobile/UX context. |
| G-SEARCH-STRUCTURED | https://developers.google.com/search/docs/appearance/structured-data/sd-policies | Structured-data quality and eligibility rules. |
| G-ADS-RESTRICTIONS | https://support.google.com/adsense/answer/10437795?hl=en | Publisher Restrictions: content that may receive limited or no advertising. |
| G-ADS-IMPLEMENTATION | https://support.google.com/adsense/topic/1271508?hl=en | Current ad implementation and placement guidance. |
| G-ADS-CHANGELOG | https://support.google.com/adsense/answer/9336650?hl=en | Official AdSense policy change log for material-change review. |
| G-ADS-CONSENT | https://support.google.com/adsense/answer/10961068?hl=en | EEA, UK, Switzerland disclosures, consent, consent choices, and revocation context. |
| G-SEARCH-GENAI | https://developers.google.com/search/docs/fundamentals/using-gen-ai-content | Current guidance on generative-AI content, accuracy, value, disclosures, and scaled-content abuse. |
| G-SEARCH-ROBOTS | https://developers.google.com/search/docs/crawling-indexing/robots/intro | robots.txt behavior and crawler management. |

## Runtime re-verification procedure

1. Fetch every source relevant to the site’s risks, and fetch the core policy sources at minimum. Do not rely on cached snippets.
2. Confirm the response is from the expected Google host over HTTPS, the HTTP status is successful, and the page contains the expected title or policy heading. A redirect to an unrelated page is a verification failure.
3. Capture the retrieval time in UTC, visible update date, page title, and a normalized text hash. If the page is dynamic or partially inaccessible, record that limitation.
4. Compare the current normalized text or key policy headings with the prior audit snapshot. A changed policy heading, prohibition, threshold, or requirement triggers a rule review. Do not auto-approve while the impact is unresolved.
5. Update this registry or the audit matrix only when the official text supports the change. Preserve the old snapshot in the audit evidence.
6. If official sources conflict, quote the conflict, prefer the newest directly applicable Google policy, and mark the affected decision `NEEDS HUMAN REVIEW` until the conflict is resolved.

## Evidence hierarchy

`OFFICIAL GOOGLE GUIDANCE` is direct current Google text. `STRONG EVIDENCE` is a reproducible test or authoritative technical output that supports a conclusion but is not itself an AdSense policy. `COMMUNITY CONSENSUS` includes forum or publisher patterns and may guide investigation only. `HYPOTHESIS` is an unverified explanation and cannot support PASS.
