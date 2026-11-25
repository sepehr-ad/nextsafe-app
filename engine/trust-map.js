"use strict";

// UAE Trust Map check (PROJECT_PATH 2i/2k). Runs entirely on the device:
// the message is compared with the signed official snapshot and is never sent
// anywhere. A finding only reports what the official source published:
// - CMA warnings: "the CMA warned about this website / name / account";
// - CBUAE register: "an institution of this name is licensed" (licensed is not
//   the same as "this message really comes from them").
// It never says that anything is safe, and never calls a firm a scam itself.
(function attachAmanStepTrustMap(globalScope) {
  const MAX_FINDINGS = 5;
  const RISK_ORDER = ["insufficient_evidence", "caution", "high_concern"];
  const HOST_RE = /(?<![\w.-])(?:https?:\/\/)?((?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,24})(?=$|[/\s:?#)\]'",;!<>])/gu;
  const HANDLE_RE = /@([a-z0-9_.]{3,30})/gu;
  const PROFILE_RE = /\b(?:t\.me|instagram\.com|twitter\.com|x\.com)\/([a-z0-9_.]{3,30})/gu;
  const CMA_TYPES = new Set(["cma_site", "cma_handle", "cma_name"]);

  function freeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.values(value).forEach(freeze);
    return Object.freeze(value);
  }

  // Must stay equivalent to normalise() in scripts/build_trust_map.py.
  function normalise(text) {
    return String(text || "")
      .normalize("NFKC")
      .replace(/[​‏]/gu, "")
      .toLocaleLowerCase("en-US")
      .replace(/[^a-z0-9]+/gu, " ")
      .trim()
      .split(/\s+/u)
      .filter(Boolean)
      .join(" ");
  }

  function lowerText(text) {
    return String(text || "").normalize("NFKC").replace(/[​‏]/gu, "").toLocaleLowerCase("en-US");
  }

  function messageHosts(text) {
    const hosts = new Set();
    for (const match of lowerText(text).matchAll(HOST_RE)) {
      let host = match[1].replace(/\.$/u, "");
      if (host.startsWith("www.")) host = host.slice(4);
      if (host.includes(".")) hosts.add(host);
    }
    return [...hosts];
  }

  function messageHandles(text) {
    const lower = lowerText(text);
    const handles = new Set();
    for (const match of lower.matchAll(HANDLE_RE)) handles.add(match[1].replace(/\.$/u, ""));
    for (const match of lower.matchAll(PROFILE_RE)) handles.add(match[1].replace(/\.$/u, ""));
    return [...handles];
  }

  function hostMatches(messageHost, listedHost) {
    return messageHost === listedHost || messageHost.endsWith(`.${listedHost}`);
  }

  function shortName(record) {
    const raw = record.source_id === "cbuae_register" ? record.name_en : record.name_raw;
    return String(raw || "").replace(/[​‏]/gu, "").trim().slice(0, 140);
  }

  function validMap(trustMap) {
    return Boolean(trustMap && trustMap.schema_version === 1
      && Array.isArray(trustMap.records) && Array.isArray(trustMap.sources));
  }

  function check(text, trustMap) {
    if (!validMap(trustMap)) {
      return freeze({ available: false, findings: [], sources: [] });
    }
    const normalised = ` ${normalise(text)} `;
    const hosts = messageHosts(text);
    const handles = messageHandles(text);
    const findings = [];
    const seen = new Set();
    const add = (finding) => {
      if (seen.has(finding.record_id)) return;
      seen.add(finding.record_id);
      findings.push(finding);
    };

    for (const record of trustMap.records) {
      if (record.source_id !== "cma_warnings") continue;
      const base = {
        record_id: record.record_id,
        source_id: record.source_id,
        display_name: shortName(record),
        published_date: record.published_date || null,
      };
      for (const listed of record.hosts || []) {
        const host = hosts.find((candidate) => hostMatches(candidate, listed));
        if (host) add({ type: "cma_site", ...base, matched: host });
      }
      for (const listed of record.handles || []) {
        if (handles.includes(listed)) add({ type: "cma_handle", ...base, matched: `@${listed}` });
      }
      for (const key of record.names || []) {
        if (key && normalised.includes(` ${key} `)) add({ type: "cma_name", ...base, matched: key });
      }
    }
    for (const record of trustMap.records) {
      if (record.source_id !== "cbuae_register") continue;
      const key = (record.names || []).find((name) => name && normalised.includes(` ${name} `));
      if (!key) continue;
      add({
        type: "cbuae_licensed",
        record_id: record.record_id,
        source_id: record.source_id,
        display_name: shortName(record),
        section: String(record.section || ""),
        licence_ref: String(record.licence_ref || ""),
        matched: key,
      });
    }

    const order = { cma_site: 0, cma_handle: 1, cma_name: 2, cbuae_licensed: 3 };
    findings.sort((a, b) => order[a.type] - order[b.type]);
    const sources = trustMap.sources.map((source) => ({
      source_id: source.source_id,
      agency: source.agency,
      agency_ar: source.agency_ar,
      source_url: source.source_url,
      retrieved_at: source.retrieved_at,
      register_as_of: source.register_as_of || null,
      attribution_en: source.attribution_en,
      attribution_ar: source.attribution_ar,
      record_count: source.record_count,
    }));
    return freeze({
      available: true,
      findings: findings.slice(0, MAX_FINDINGS),
      sources,
      checked: { hosts: hosts.length, handles: handles.length },
    });
  }

  function hasOfficialWarning(result) {
    return Boolean(result?.findings?.some((finding) => CMA_TYPES.has(finding.type)));
  }

  // Asymmetric: an official warning can raise the risk, never lower it.
  function applyToAnalysis(analysis, result, copy = {}) {
    if (!analysis || !hasOfficialWarning(result)) return analysis;
    const finding = result.findings.find((item) => CMA_TYPES.has(item.type));
    const source = result.sources.find((item) => item.source_id === "cma_warnings");
    const current = RISK_ORDER.indexOf(analysis.risk_level);
    const raised = current < RISK_ORDER.indexOf("high_concern");
    const reason = {
      code: "OFFICIAL_WARNING_MATCH",
      weight: 0,
      description: copy.description || "An official UAE regulator warning names this website, account or firm.",
      evidence: String(finding.matched).slice(0, 80),
    };
    const sourceRef = finding.published_date && source ? [{
      advisory_id: finding.record_id,
      agency: source.agency,
      title: `${source.agency}: ${finding.display_name}`,
      publication_date: finding.published_date,
      source_url: source.source_url,
      last_reviewed_at: source.retrieved_at,
    }] : [];
    return freeze({
      ...analysis,
      risk_level: raised ? "high_concern" : analysis.risk_level,
      summary: raised && copy.summary ? copy.summary : analysis.summary,
      reason_codes: [...new Set([...(analysis.reason_codes || []), "OFFICIAL_WARNING_MATCH"])],
      reasons: [...(analysis.reasons || []), reason],
      matched_advisories: [...sourceRef, ...(analysis.matched_advisories || [])],
      trust_map_raised: raised,
    });
  }

  globalScope.AmanStepTrustMap = Object.freeze({
    check,
    applyToAnalysis,
    hasOfficialWarning,
    normalise,
    messageHosts,
    messageHandles,
  });
}(globalThis));
