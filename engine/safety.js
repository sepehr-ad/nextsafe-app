"use strict";

// Deterministic asymmetric merge. Model-derived facts may make the outcome
// more cautious, but can never remove a rule hit or lower risk/stage.
(function attachAmanStepSafety(globalScope) {
  const RISK_ORDER = Object.freeze([
    "insufficient_evidence", "caution", "high_concern",
  ]);
  const RISK_ALIAS = Object.freeze({
    low: "insufficient_evidence",
    medium: "caution",
    high: "high_concern",
  });
  const STAGE_ORDER = Object.freeze([
    "suspected", "active", "compromised", "paid", "reported", "monitoring", "closed",
  ]);
  // Message understanding can identify pressure, but it cannot establish that
  // the user shared access, paid, reported, monitored or closed a case.
  const MODEL_STAGES = new Set(["suspected", "active"]);
  const MODEL_REASON_CODES = Object.freeze([
    "MODEL_PRESSURE",
    "MODEL_SECRET_REQUEST",
    "MODEL_APP_APPROVAL",
    "MODEL_INSTALL_REQUEST",
    "MODEL_PAYMENT_REQUEST",
  ]);
  const MODEL_REASON_SET = new Set(MODEL_REASON_CODES);
  const FACT_KEYS = Object.freeze([
    "pressure_present",
    "asks_for_secret",
    "asks_for_app_approval",
    "asks_for_install",
    "asks_for_payment",
    "detected_language",
  ]);
  const LANGUAGES = new Set(["en", "ar", "mixed", "other", "unknown"]);

  function exactKeys(value, expected) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    const actual = Object.keys(value).sort();
    const wanted = [...expected].sort();
    return actual.length === wanted.length && actual.every((key, index) => key === wanted[index]);
  }

  function freezeRecord(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.values(value).forEach(freezeRecord);
    return Object.freeze(value);
  }

  function normaliseRisk(value, allowAlias = false) {
    const candidate = allowAlias ? (RISK_ALIAS[value] || value) : value;
    if (!RISK_ORDER.includes(candidate)) throw new Error("invalid_risk_level");
    return candidate;
  }

  function maximumByOrder(first, second, order) {
    return order.indexOf(first) >= order.indexOf(second) ? first : second;
  }

  function validateRuleResult(rule) {
    if (!exactKeys(rule, ["risk_level", "stage", "reason_codes"])) {
      throw new Error("invalid_rule_result_schema");
    }
    const risk = normaliseRisk(rule.risk_level);
    if (!STAGE_ORDER.includes(rule.stage)) throw new Error("invalid_rule_stage");
    if (!Array.isArray(rule.reason_codes) || rule.reason_codes.some(
      (code) => !/^[A-Z0-9_]{1,80}$/u.test(String(code)),
    )) throw new Error("invalid_rule_reason_codes");
    return freezeRecord({
      risk_level: risk,
      stage: rule.stage,
      reason_codes: [...new Set(rule.reason_codes.map(String))],
    });
  }

  function validateModelAssessment(model) {
    if (!exactKeys(model, ["risk_level", "stage", "reason_codes"])) {
      throw new Error("invalid_model_assessment_schema");
    }
    const risk = normaliseRisk(model.risk_level, true);
    if (!MODEL_STAGES.has(model.stage)) throw new Error("invalid_model_stage");
    if (
      !Array.isArray(model.reason_codes)
      || model.reason_codes.length > MODEL_REASON_CODES.length
      || model.reason_codes.some((code) => !MODEL_REASON_SET.has(code))
    ) throw new Error("invalid_model_reason_codes");
    return freezeRecord({
      risk_level: risk,
      stage: model.stage,
      reason_codes: [...new Set(model.reason_codes)],
    });
  }

  function assessmentFromFacts(facts) {
    if (!exactKeys(facts, FACT_KEYS)) throw new Error("invalid_model_facts_schema");
    for (const key of FACT_KEYS.slice(0, -1)) {
      if (typeof facts[key] !== "boolean") throw new Error("invalid_model_fact_type");
    }
    if (!LANGUAGES.has(facts.detected_language)) throw new Error("invalid_model_fact_language");

    const reasonCodes = [];
    if (facts.pressure_present) reasonCodes.push("MODEL_PRESSURE");
    if (facts.asks_for_secret) reasonCodes.push("MODEL_SECRET_REQUEST");
    if (facts.asks_for_app_approval) reasonCodes.push("MODEL_APP_APPROVAL");
    if (facts.asks_for_install) reasonCodes.push("MODEL_INSTALL_REQUEST");
    if (facts.asks_for_payment) reasonCodes.push("MODEL_PAYMENT_REQUEST");
    const riskyRequest = reasonCodes.some((code) => code !== "MODEL_PRESSURE");
    const riskLevel = facts.pressure_present && riskyRequest
      ? "high_concern"
      : (riskyRequest ? "caution" : "insufficient_evidence");
    const stage = facts.pressure_present && riskyRequest ? "active" : "suspected";
    return freezeRecord({ risk_level: riskLevel, stage, reason_codes: reasonCodes });
  }

  function merge(ruleInput, modelInput) {
    const rule = validateRuleResult(ruleInput);
    let model;
    try {
      model = validateModelAssessment(modelInput);
    } catch (error) {
      return freezeRecord({
        final_risk: rule.risk_level,
        final_stage: rule.stage,
        rule_risk: rule.risk_level,
        model_risk: null,
        rule_stage: rule.stage,
        model_stage: null,
        reason_codes: [...rule.reason_codes],
        rule_reason_codes: [...rule.reason_codes],
        model_reason_codes: [],
        model_status: "rejected",
        model_rejection: String(error.message || "invalid_model_assessment"),
        asymmetric: true,
      });
    }
    return freezeRecord({
      final_risk: maximumByOrder(rule.risk_level, model.risk_level, RISK_ORDER),
      final_stage: maximumByOrder(rule.stage, model.stage, STAGE_ORDER),
      rule_risk: rule.risk_level,
      model_risk: model.risk_level,
      rule_stage: rule.stage,
      model_stage: model.stage,
      reason_codes: [...new Set([...rule.reason_codes, ...model.reason_codes])],
      rule_reason_codes: [...rule.reason_codes],
      model_reason_codes: [...model.reason_codes],
      model_status: "accepted",
      model_rejection: "",
      asymmetric: true,
    });
  }

  globalScope.AmanStepSafety = Object.freeze({
    MODEL_REASON_CODES,
    RISK_ORDER,
    STAGE_ORDER,
    assessmentFromFacts,
    merge,
    validateModelAssessment,
    validateRuleResult,
  });
}(globalThis));
