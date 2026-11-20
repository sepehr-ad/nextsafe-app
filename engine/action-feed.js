"use strict";

// Produces a closed, display-only record of the agent loop. It never receives
// the raw message and never claims that an external action was performed.
(function attachAmanStepActionFeed(globalScope) {
  const HTTPS = /^https:\/\//u;
  const DATE = /^\d{4}-\d{2}-\d{2}$/u;
  const CODE = /^[A-Za-z0-9._-]{1,120}$/u;
  const ALERT_SCOPE = Object.freeze({
    high_risk: "high_risk",
    access_exposed: "post_loss",
    money_sent: "post_loss",
    recovery_update: "recovery_update",
  });

  function freeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.values(value).forEach(freeze);
    return Object.freeze(value);
  }

  function safeSource(value) {
    if (!value || typeof value !== "object") return null;
    const agency = String(value.agency || "").trim().slice(0, 120);
    const publicationDate = String(value.publication_date || "");
    const sourceUrl = String(value.source_url || "");
    if (!agency || !DATE.test(publicationDate) || !HTTPS.test(sourceUrl)) return null;
    try {
      const parsed = new URL(sourceUrl);
      if (parsed.protocol !== "https:") return null;
      return freeze({ agency, publication_date: publicationDate, source_url: parsed.href });
    } catch (_error) { return null; }
  }

  function alertType(stage) {
    if (["suspected", "active"].includes(stage)) return "high_risk";
    if (stage === "compromised") return "access_exposed";
    if (stage === "paid") return "money_sent";
    if (["reported", "monitoring"].includes(stage)) return "recovery_update";
    return "";
  }

  function modelScenario(facts) {
    if (!facts || typeof facts !== "object") return "";
    if (facts.asks_for_app_approval === true) return "app_approval";
    if (facts.asks_for_install === true) return "remote_access";
    if (facts.asks_for_secret === true) return "secret_request";
    if (facts.asks_for_payment === true) return "payment_request";
    if (facts.pressure_present === true) return "pressure";
    return "";
  }

  // Route-out (PROJECT_PATH 2k, part B). The agent picks which official
  // authority applies and offers its public page. It copies nothing from that
  // authority: only reviewed directory entries with an https official_url can
  // become a route, and opening one still goes through the agent policy gate.
  const POST_LOSS_STAGES = new Set(["compromised", "paid", "reported", "monitoring"]);
  const ROUTE_TOPICS = Object.freeze([
    {
      topic: "job",
      when: (signals) => signals.codes.has("FAKE_JOB_PATTERN"),
      primary: "MOHRE-JOB-CHECK",
      alternates: [],
    },
    {
      topic: "crypto",
      when: (signals) => signals.crypto,
      primary: "VARA-CRYPTO-CHECK",
      alternates: ["CMA-INVESTMENT-CHECK", "DFSA-DIFC-CHECK"],
    },
    {
      // The CMA itself warned about this website, account or firm.
      topic: "official_warning",
      when: (signals) => signals.codes.has("OFFICIAL_WARNING_MATCH"),
      primary: "CMA-INVESTMENT-CHECK",
      alternates: ["DFSA-DIFC-CHECK", "VARA-CRYPTO-CHECK"],
    },
    {
      topic: "investment",
      when: (signals) => signals.codes.has("INVESTMENT_PRESSURE"),
      primary: "CMA-INVESTMENT-CHECK",
      alternates: ["DFSA-DIFC-CHECK", "VARA-CRYPTO-CHECK"],
    },
    {
      topic: "police_claim",
      when: (signals) => signals.codes.has("ARREST_OR_LEGAL_THREAT")
        || signals.codes.has("ARREST_IMPERSONATION_COMBINATION"),
      primary: "DUBAI-POLICE-ECRIME",
      alternates: [],
    },
  ]);

  function usableRoute(directory, entryId) {
    const entry = directory.find((item) => item && item.entry_id === entryId);
    if (!entry || !HTTPS.test(String(entry.official_url || ""))) return null;
    try {
      if (new URL(entry.official_url).protocol !== "https:") return null;
    } catch (_error) { return null; }
    return entryId;
  }

  function selectRoute({ analysis, caseData, directory } = {}) {
    const entries = Array.isArray(directory) ? directory : [];
    if (!entries.length) return null;
    const codes = new Set(Array.isArray(analysis?.reason_codes)
      ? analysis.reason_codes.map(String) : []);
    const crypto = caseData?.incident_type === "crypto_transfer"
      || caseData?.intake_facts?.payment_method === "crypto_transfer";
    const signals = { codes, crypto };
    const topical = ROUTE_TOPICS.find((rule) => rule.when(signals)) || null;
    const stage = String(caseData?.stage || "suspected");
    let topic = topical?.topic || "";
    let ids = topical ? [topical.primary, ...topical.alternates] : [];
    if (POST_LOSS_STAGES.has(stage)) {
      // After loss the report route comes first; the topical regulator stays
      // as an alternate so the user can still check the firm.
      topic = "report";
      ids = ["DUBAI-POLICE-ECRIME", ...ids.filter((id) => id !== "DUBAI-POLICE-ECRIME")];
    }
    const usable = [...new Set(ids)].map((id) => usableRoute(entries, id)).filter(Boolean);
    if (!usable.length) return null;
    return freeze({ topic, entry_id: usable[0], alternates: usable.slice(1, 3) });
  }

  // Trust Map item: what the official registers say, copied from the on-device
  // check. Only the matched fragment (a website, account or firm name) is kept.
  const TRUST_TYPES = new Set(["cma_site", "cma_handle", "cma_name", "cbuae_licensed"]);
  function trustItem(trust) {
    if (!trust || trust.available !== true) return [];
    const findings = Array.isArray(trust.findings) ? trust.findings : [];
    const top = findings.find((finding) => TRUST_TYPES.has(finding?.type)) || null;
    const warning = Boolean(top && top.type !== "cbuae_licensed");
    const sources = (Array.isArray(trust.sources) ? trust.sources : [])
      .map((source) => {
        const safe = safeSource({
          agency: source.agency,
          publication_date: source.retrieved_at,
          source_url: source.source_url,
        });
        return safe ? {
          source_id: String(source.source_id),
          agency: safe.agency,
          source_url: safe.source_url,
          retrieved_at: safe.publication_date,
          register_as_of: source.register_as_of ? String(source.register_as_of).slice(0, 20) : null,
          attribution_en: String(source.attribution_en || "").slice(0, 300),
          attribution_ar: String(source.attribution_ar || "").slice(0, 300),
          record_count: Number(source.record_count) || 0,
        } : null;
      })
      .filter(Boolean);
    return [{
      id: "trust",
      state: warning ? "alert" : "done",
      finding: top ? {
        type: top.type,
        source_id: String(top.source_id),
        matched: String(top.matched || "").slice(0, 80),
        display_name: String(top.display_name || "").slice(0, 140),
        published_date: DATE.test(String(top.published_date || "")) ? top.published_date : null,
        licence_ref: top.licence_ref ? String(top.licence_ref).slice(0, 40) : null,
      } : null,
      finding_count: findings.length,
      sources,
    }];
  }

  // trustedAvailable=false: this build has no relay, so offering setup would be a dead end.
  function build({
    analysis, caseData, trustedContact, modelFacts, directory, trust, trustedAvailable = true,
  } = {}) {
    if (!analysis || !caseData?.next_safe_action) return null;
    const source = (Array.isArray(analysis.matched_advisories)
      ? analysis.matched_advisories.map(safeSource).find(Boolean)
      : null) || null;
    const action = caseData.next_safe_action;
    const taskId = CODE.test(String(action.task_id || "")) ? String(action.task_id) : "next-action";
    const title = String(action.title || "").trim().slice(0, 240);
    const stage = String(caseData.stage || "suspected");
    const neededAlert = alertType(stage);
    const requiredScope = ALERT_SCOPE[neededAlert] || "";
    const scopes = Array.isArray(trustedContact?.scopes) ? trustedContact.scopes : [];
    const trustedReady = trustedContact?.status === "active"
      && Boolean(requiredScope) && scopes.includes(requiredScope);
    const policyRule = CODE.test(String(action.policy_rule || ""))
      ? String(action.policy_rule) : "common_tasks";
    const policyVersion = String(caseData.agent_trace?.policy_version || "unknown").slice(0, 100);
    const scenario = modelScenario(modelFacts);
    const modelItems = scenario ? [{ id: "model", state: "done", scenario }] : [];
    const route = selectRoute({ analysis, caseData, directory });
    const routeItems = route ? [{ id: "route", state: "check", ...route }] : [];

    return freeze({
      items: [
        { id: "read", state: "done" },
        { id: "match", state: "done", source },
        ...trustItem(trust),
        ...modelItems,
        { id: "plan", state: "done", policy_rule: policyRule, policy_version: policyVersion },
        { id: "next", state: "next", action: { task_id: taskId, title } },
        ...routeItems,
        ...(trustedAvailable === false ? [] : [
          { id: "trusted", state: trustedReady ? "ready" : "setup", alert_type: neededAlert },
        ]),
      ],
      boundaries: freeze({
        raw_message_included: false,
        external_action_performed: false,
        source_invented: false,
      }),
    });
  }

  globalScope.AmanStepActionFeed = Object.freeze({ build, selectRoute });
}(globalThis));
