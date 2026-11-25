"use strict";

// Builds the visible, bounded explanation for one selected action. This is a
// decision record, not hidden chain-of-thought: it contains only closed case
// facts, policy identifiers, reviewed source references and model reason codes.
(function attachAmanStepTrace(globalScope) {
  const STAGES = new Set([
    "suspected", "active", "compromised", "paid", "reported", "monitoring", "closed",
  ]);
  const CODE_RE = /^[A-Z0-9_]{1,80}$/u;
  const TYPE_RE = /^[a-z0-9_]{1,80}$/u;
  const POLICY_RULE_RE = /^(?:stage_tasks|type_tasks|common_tasks)\.?[a-z0-9_]*$/u;
  const SOURCE_ID_RE = /^[A-Z0-9][A-Z0-9._-]{1,79}$/u;
  const SOURCE_DATE_RE = /^\d{4}-\d{2}-\d{2}$/u;
  const FACT_FIELDS = Object.freeze(["payment_method", "timing_bucket", "amount_range", "exposure_type"]);

  function freezeRecord(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.values(value).forEach(freezeRecord);
    return Object.freeze(value);
  }

  function closedCodes(values) {
    return [...new Set(
      (Array.isArray(values) ? values : []).map(String).filter((code) => CODE_RE.test(code)),
    )];
  }

  function safeSources(values) {
    if (!Array.isArray(values)) return [];
    const seen = new Set();
    return values.flatMap((source) => {
      const advisoryId = String(source?.advisory_id || "");
      const agency = String(source?.agency || "").trim().slice(0, 120);
      const publicationDate = String(source?.publication_date || "");
      const sourceUrl = String(source?.source_url || "");
      let parsedUrl;
      try { parsedUrl = new URL(sourceUrl); } catch (_error) { return []; }
      if (
        !SOURCE_ID_RE.test(advisoryId) || !agency || !SOURCE_DATE_RE.test(publicationDate)
        || parsedUrl.protocol !== "https:" || seen.has(advisoryId)
      ) return [];
      seen.add(advisoryId);
      return [{
        advisory_id: advisoryId,
        agency,
        publication_date: publicationDate,
        source_url: parsedUrl.href,
      }];
    }).slice(0, 3);
  }

  function build(caseData, action) {
    if (!caseData || !action?.task_id) return null;
    const stage = STAGES.has(caseData.stage) ? caseData.stage : "suspected";
    const incidentType = TYPE_RE.test(String(caseData.incident_type || ""))
      ? String(caseData.incident_type)
      : "unknown";
    const ruleReasons = closedCodes(caseData.rule_reason_codes);
    const modelReasons = closedCodes(caseData.model_reason_codes)
      .filter((code) => code.startsWith("MODEL_"));
    const structuredFacts = FACT_FIELDS.flatMap((field) => {
      const value = String(caseData.intake_facts?.[field] || "");
      return TYPE_RE.test(value) ? [{ field, value }] : [];
    });
    const policyRule = POLICY_RULE_RE.test(String(action.policy_rule || ""))
      ? String(action.policy_rule)
      : "common_tasks";
    const policyVersion = String(caseData.agent_trace?.policy_version || "unknown").slice(0, 100);
    const selectionPolicy = String(caseData.agent_trace?.selection_policy || "unknown").slice(0, 100);
    const ruleStage = STAGES.has(caseData.rule_stage) ? caseData.rule_stage : stage;

    return freezeRecord({
      action: { task_id: String(action.task_id).slice(0, 100) },
      signals: {
        stage,
        incident_type: incidentType,
        rule_reason_codes: ruleReasons,
        structured_facts: structuredFacts,
      },
      policy: {
        rule: policyRule,
        version: policyVersion,
        selection: selectionPolicy,
      },
      sources: safeSources(caseData.source_refs),
      model: {
        status: modelReasons.length ? "contributed" : "not_used",
        reason_codes: modelReasons,
        raised_risk: Boolean(modelReasons.length && caseData.final_risk !== caseData.rule_risk),
        raised_stage: Boolean(modelReasons.length && stage !== ruleStage),
      },
      boundaries: {
        chain_of_thought_included: false,
        raw_message_included: false,
        external_action_performed: false,
      },
    });
  }

  globalScope.AmanStepTrace = Object.freeze({ build });
}(globalThis));
