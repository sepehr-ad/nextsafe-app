"use strict";

// The deterministic browser engine intentionally has no framework or network
// dependency. It analyses only the text passed by the user and never opens a URL.
(function attachAmanStepRisk(globalScope) {
  const CONTROL_CHARS_RE = /[\u200b-\u200f\u202a-\u202e\u2060\ufeff]/gu;
  const ARABIC_MARKS_RE = /[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed]/gu;
  const ARABIC_TRANSLATION = Object.freeze({
    "أ": "ا", "إ": "ا", "آ": "ا", "ٱ": "ا", "ة": "ه",
    "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
    "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
    "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4",
    "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9",
  });

  function normaliseUnicodeText(text) {
    return String(text)
      .normalize("NFKC")
      .replace(CONTROL_CHARS_RE, "")
      .replace(/ـ/gu, "")
      .replace(ARABIC_MARKS_RE, "")
      .replace(/[أإآٱة٠-٩۰-۹]/gu, (character) => ARABIC_TRANSLATION[character] || character);
  }

  function regex(pattern, global = false) {
    return new RegExp(normaliseUnicodeText(pattern), global ? "giu" : "iu");
  }

  function normaliseForPolicy(text, policy) {
    let canonical = normaliseUnicodeText(text);
    for (const replacement of policy.policy_replacements) {
      canonical = canonical.replace(regex(replacement.pattern, true), replacement.replacement);
    }
    canonical = canonical.replace(
      regex(policy.split_letter_pattern, true),
      (match) => match.replace(/[^A-Za-z]/gu, ""),
    );
    return canonical;
  }

  function normaliseForMatching(text) {
    return normaliseUnicodeText(text).toLocaleLowerCase("en-US").trim().split(/\s+/u).join(" ");
  }

  function extractUrls(text, policy) {
    const urls = [];
    const seen = new Set();
    for (const match of String(text).matchAll(regex(policy.url_pattern, true))) {
      let cleaned = match[0].replace(/[.,;:!?\)\]\}]+$/u, "");
      if (cleaned.startsWith("www.")) cleaned = `https://${cleaned}`;
      if (!seen.has(cleaned)) {
        seen.add(cleaned);
        urls.push(cleaned);
      }
    }
    return urls;
  }

  function findNonNegatedMatch(text, pattern, negationPattern, policy) {
    for (const rawClause of text.split(regex(policy.clause_split_pattern))) {
      const clause = rawClause.trim();
      if (!clause) continue;
      const match = regex(pattern).exec(clause);
      if (match && !(negationPattern && regex(negationPattern).test(clause))) return match;
    }
    return null;
  }

  function clauses(text, policy) {
    return text
      .split(regex(policy.clause_split_pattern))
      .map((clause) => clause.trim())
      .filter(Boolean);
  }

  function clauseWindows(text, policy) {
    const parts = clauses(text, policy);
    const settings = policy.cooccurrence_window;
    const windows = [];
    for (let start = 0; start < parts.length; start += 1) {
      for (let size = 1; size <= settings.max_clauses; size += 1) {
        const window = parts.slice(start, start + size);
        if (window.length !== size) break;
        if (window.join(" ").length > settings.max_chars) break;
        windows.push(window);
      }
    }
    return windows;
  }

  function matchInWindow(window, pattern, negationPattern, requestPattern) {
    const match = regex(pattern).exec(window.join(" "));
    if (!match) return null;
    if (!negationPattern) return match;
    const requestClauses = window.filter((clause) =>
      requestPattern && regex(requestPattern).test(clause));
    if (requestClauses.length && requestClauses.some((clause) =>
      !regex(negationPattern).test(clause))) return match;
    return null;
  }

  function findWindowedMatch(text, pattern, negationPattern, requestPattern, policy) {
    for (const window of clauseWindows(text, policy)) {
      const match = matchInWindow(window, pattern, negationPattern, requestPattern);
      if (match) return match;
    }
    return null;
  }

  function isOfficial(hostname, officialDomains) {
    return officialDomains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
  }

  function tokenMatches(hostname, rawToken) {
    const token = String(rawToken).toLocaleLowerCase("en-US");
    if (token.length <= 3) return hostname.split(/[.-]+/u).includes(token);
    const canonicalHost = hostname.replace(/[^a-z0-9]/gu, "");
    const canonicalToken = token.replace(/[^a-z0-9]/gu, "");
    return Boolean(canonicalToken && canonicalHost.includes(canonicalToken));
  }

  function matchBrandLookalike(hostname, brands) {
    for (const record of brands) {
      if (record.review_status !== "human_reviewed") continue;
      const officialDomains = (record.official_domains || []).map((domain) =>
        String(domain).toLocaleLowerCase("en-US"));
      if (isOfficial(hostname, officialDomains)) continue;
      if ((record.tokens || []).some((token) => tokenMatches(hostname, token))) return record;
    }
    return null;
  }

  function matchAdvisories(text, advisories, excludedScamTypes) {
    const normalized = normaliseForMatching(text);
    return advisories.filter((advisory) => {
      if (advisory.review_status !== "human_reviewed") return false;
      if (excludedScamTypes.has(advisory.scam_type)) return false;
      const indicatorHits = (advisory.indicators || []).reduce((count, indicator) =>
        count + Number(normalized.includes(normaliseForMatching(indicator))), 0);
      return indicatorHits >= 2;
    });
  }

  function publicAdvisory(advisory) {
    return {
      advisory_id: advisory.advisory_id,
      agency: advisory.agency,
      title: advisory.title,
      publication_date: advisory.publication_date,
      source_url: advisory.source_url,
      scam_type: advisory.scam_type,
      recommended_actions: [...advisory.recommended_actions],
      jurisdiction: advisory.jurisdiction || "UAE",
      last_reviewed_at: advisory.last_reviewed_at || "",
    };
  }

  function urlSignal(policy, code) {
    const signal = policy.url_signals.find((candidate) => candidate.code === code);
    if (!signal) throw new Error(`Unknown URL signal: ${code}`);
    return signal;
  }

  function addUrlHit(hits, policy, code, hostname, description = null) {
    const signal = urlSignal(policy, code);
    hits.push({
      code,
      weight: signal.weight,
      evidence: hostname,
      description: description || signal.description_en,
    });
  }

  function hostnameFromUrl(url) {
    try {
      return new URL(url).hostname.toLocaleLowerCase("en-US");
    } catch (_error) {
      // Some runtimes reject malformed or non-canonical Punycode before we can
      // warn about it. Parse only the hostname text; never resolve or open it.
      const withoutScheme = String(url).replace(/^[a-z][a-z0-9+.-]*:\/\//iu, "");
      return withoutScheme
        .split(/[/?#]/u, 1)[0]
        .split("@")
        .at(-1)
        .split(":", 1)[0]
        .toLocaleLowerCase("en-US");
    }
  }

  function collectRuleHits(text, urls, policy, brands) {
    const hits = [];
    const windowRequests = new Map(policy.cooccurrence_window.rules
      .map((item) => [item.code, item.request_pattern]));
    for (const rule of policy.rules) {
      const negationPattern = rule.negation ? policy.negations[rule.negation] : null;
      const requestPattern = windowRequests.get(rule.code);
      let match;
      if (requestPattern) {
        match = findWindowedMatch(
          text, rule.pattern, negationPattern, requestPattern, policy,
        );
      } else if (negationPattern) {
        match = findNonNegatedMatch(text, rule.pattern, negationPattern, policy);
      } else {
        match = regex(rule.pattern).exec(text);
      }
      if (match) {
        hits.push({
          code: rule.code,
          weight: rule.weight,
          evidence: match[0].slice(0, 80),
          description: rule.description_en,
        });
      }
    }

    const presentCodes = new Set(hits.map((hit) => hit.code));
    const rulesByCode = new Map(policy.rules.map((rule) => [rule.code, rule]));
    for (const combination of policy.cooccurrence_window.combinations) {
      if (!combination.required_codes.every((code) => presentCodes.has(code))) continue;
      for (const window of clauseWindows(text, policy)) {
        const matchesAll = combination.required_codes.every((code) => {
          const rule = rulesByCode.get(code);
          const negationPattern = rule.negation ? policy.negations[rule.negation] : null;
          return Boolean(matchInWindow(
            window,
            rule.pattern,
            negationPattern,
            windowRequests.get(code),
          ));
        });
        if (!matchesAll) continue;
        hits.push({
          code: combination.code,
          weight: combination.weight,
          evidence: window.join(" ").slice(0, 80),
          description: combination.description_en,
        });
        break;
      }
    }

    const shortenerHosts = new Set(policy.shortener_hosts);
    const seenUrlCodes = new Set();
    for (const url of urls) {
      const hostname = hostnameFromUrl(url);
      if (!hostname) continue;
      if (!seenUrlCodes.has("PUNYCODE_DOMAIN") &&
          hostname.split(".").some((label) => label.startsWith("xn--"))) {
        addUrlHit(hits, policy, "PUNYCODE_DOMAIN", hostname);
        seenUrlCodes.add("PUNYCODE_DOMAIN");
      }
      const brand = matchBrandLookalike(hostname, brands);
      if (brand && !seenUrlCodes.has("BRAND_LOOKALIKE")) {
        addUrlHit(
          hits,
          policy,
          "BRAND_LOOKALIKE",
          hostname,
          `The hostname contains the reviewed brand name ${brand.display_name} ` +
            "but is not one of its official domains.",
        );
        seenUrlCodes.add("BRAND_LOOKALIKE");
      }
      if (shortenerHosts.has(hostname) && !seenUrlCodes.has("SHORTENED_LINK")) {
        addUrlHit(hits, policy, "SHORTENED_LINK", hostname);
        seenUrlCodes.add("SHORTENED_LINK");
      }
    }
    return hits;
  }

  function analyzeMessage(text, language = "en", resources) {
    if (!resources || !resources.policy || !resources.brands || !resources.advisories) {
      throw new TypeError("policy, brands and advisories are required");
    }
    const { policy, brands, advisories } = resources;
    const selectedLanguage = Object.hasOwn(policy.text, language) ? language : "en";
    const strings = policy.text[selectedLanguage];
    const rawText = String(text).trim();
    const policyText = normaliseForPolicy(rawText, policy);
    const urls = extractUrls(rawText, policy);
    const hits = collectRuleHits(policyText, urls, policy, brands);
    const reasonCodes = new Set(hits.map((hit) => hit.code));

    const excludedScamTypes = new Set();
    if (regex(policy.negations.remote_access).test(policyText) &&
        !reasonCodes.has("REMOTE_ACCESS_REQUEST")) {
      excludedScamTypes.add("remote_access");
    }
    if (regex(policy.negations.sensitive_request).test(policyText) &&
        !reasonCodes.has("SENSITIVE_DATA_REQUEST")) {
      excludedScamTypes.add("seasonal_impersonation");
      excludedScamTypes.add("fake_ads");
    }
    const matchedAdvisories = matchAdvisories(policyText, advisories, excludedScamTypes);

    let score = hits.reduce((total, hit) => total + hit.weight, 0);
    if (matchedAdvisories.length) score += policy.advisory_match_score;
    score = Math.min(score, policy.thresholds.maximum_score);

    let riskLevel;
    let summary;
    if (score >= policy.thresholds.high_concern) {
      riskLevel = "high_concern";
      summary = strings.high;
    } else if (score >= policy.thresholds.caution) {
      riskLevel = "caution";
      summary = strings.medium;
    } else {
      riskLevel = "insufficient_evidence";
      summary = strings.unknown;
    }

    const policyItems = new Map([
      ...policy.rules,
      ...policy.url_signals,
      ...policy.cooccurrence_window.combinations,
    ]
      .map((item) => [item.code, item]));
    return {
      risk_level: riskLevel,
      score,
      summary,
      reason_codes: hits.map((hit) => hit.code),
      reasons: hits.map((hit) => ({
        code: hit.code,
        evidence: hit.evidence,
        description: selectedLanguage === "ar"
          ? policyItems.get(hit.code).description_ar
          : hit.description,
      })),
      extracted_urls: urls,
      matched_advisories: matchedAdvisories.map(publicAdvisory),
      next_steps: [...strings.steps],
      disclaimer: strings.disclaimer,
    };
  }

  async function loadPolicy(url = globalScope.AmanStepPaths?.asset("data/policy_rules.json")
    || new URL("data/policy_rules.json", globalScope.location?.href || "https://amanstep.invalid/").href) {
    const embedded = globalScope.AmanStepStaticPolicies?.risk;
    if (embedded && typeof embedded === "object") return embedded;
    const response = await fetch(url, { cache: "no-cache", credentials: "same-origin" });
    if (!response.ok) throw new Error(`Policy load failed: ${response.status}`);
    return response.json();
  }

  globalScope.AmanStepRisk = Object.freeze({
    analyzeMessage,
    loadPolicy,
    normaliseUnicodeText,
  });
}(globalThis));
