"use strict";

// One-question-at-a-time recovery intake. It emits only closed question IDs
// and structured facts; no conversation transcript or suspicious message is
// accepted by this boundary.
(function attachAmanStepIntake(globalScope) {
  const RECOVERY_STAGES = new Set(["compromised", "paid", "reported", "monitoring"]);
  const PAYMENT_METHODS = new Set(["bank_transfer", "card_payment", "crypto_transfer", "gift_card"]);
  const TIMING_BUCKETS = new Set(["last_15_minutes", "last_hour", "today", "earlier", "not_sure"]);
  const AMOUNT_RANGES = new Set(["under_aed_500", "aed_500_to_5000", "over_aed_5000", "not_provided"]);
  const EXPOSURE_TYPES = new Set([
    "none_known", "otp_or_code", "app_approval", "card_or_password",
    "remote_access", "unknown_app", "not_sure",
  ]);
  const QUESTION_ORDER = Object.freeze([
    "payment_method", "incident_timing", "bank_route", "amount_range", "exposure_type",
  ]);
  const SECRET_LABEL_RE = /\b(otp|pin|cvv|password|passcode|verification\s*code|private\s*key|seed\s*phrase)\b|رمز|کد\s*تأیید|رمز\s*التحقق/iu;
  const ACCOUNT_LIKE_RE = /[0-9٠-٩۰-۹]{4}|@|https?:|www\./iu;

  function freezeRecord(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.values(value).forEach(freezeRecord);
    return Object.freeze(value);
  }

  function choice(id, factField, promptKey, options) {
    return freezeRecord({
      question_id: id,
      fact_field: factField,
      kind: "choice",
      prompt_key: promptKey,
      optional: false,
      options: options.map(([value, labelKey]) => ({ value, label_key: labelKey })),
    });
  }

  function textQuestion(id, factField, promptKey) {
    return freezeRecord({
      question_id: id,
      fact_field: factField,
      kind: "short_text",
      prompt_key: promptKey,
      optional: true,
      options: [],
    });
  }

  function inferredPaymentMethod(caseData) {
    return PAYMENT_METHODS.has(caseData?.incident_type) ? caseData.incident_type : "";
  }

  function nextQuestion(caseData) {
    if (!caseData || !RECOVERY_STAGES.has(caseData.stage)) return null;
    const facts = caseData.intake_facts || {};
    const paymentMethod = facts.payment_method || inferredPaymentMethod(caseData);
    if (caseData.stage === "paid" && !paymentMethod) {
      return choice("payment_method", "payment_method", "intakePaymentMethod", [
        ["bank_transfer", "bankTransferChoice"],
        ["card_payment", "cardChoice"],
        ["crypto_transfer", "cryptoChoice"],
        ["gift_card", "giftCardChoice"],
      ]);
    }
    if (!facts.timing_bucket) {
      return choice("incident_timing", "timing_bucket", "intakeTiming", [
        ["last_15_minutes", "timing15m"],
        ["last_hour", "timingHour"],
        ["today", "timingToday"],
        ["earlier", "timingEarlier"],
        ["not_sure", "notSureChoice"],
      ]);
    }
    if (paymentMethod && !facts.institution_name) {
      return textQuestion("bank_route", "institution_name", "intakeInstitution");
    }
    if (caseData.stage === "paid" && !facts.amount_range) {
      return choice("amount_range", "amount_range", "intakeAmount", [
        ["under_aed_500", "amountUnder500"],
        ["aed_500_to_5000", "amount500to5000"],
        ["over_aed_5000", "amountOver5000"],
        ["not_provided", "skipChoice"],
      ]);
    }
    if (!facts.exposure_type) {
      return choice("exposure_type", "exposure_type", "intakeExposure", [
        ["none_known", "exposureNone"],
        ["otp_or_code", "exposureOtp"],
        ["app_approval", "exposureApproval"],
        ["card_or_password", "exposureCredentials"],
        ["remote_access", "exposureRemote"],
        ["unknown_app", "exposureApp"],
        ["not_sure", "notSureChoice"],
      ]);
    }
    return null;
  }

  function validateAnswer(questionId, value) {
    const answer = String(value ?? "").trim();
    if (questionId === "payment_method" && PAYMENT_METHODS.has(answer)) {
      return freezeRecord({ field: "payment_method", value: answer });
    }
    if (questionId === "incident_timing" && TIMING_BUCKETS.has(answer)) {
      return freezeRecord({ field: "timing_bucket", value: answer });
    }
    if (questionId === "amount_range" && AMOUNT_RANGES.has(answer)) {
      return freezeRecord({ field: "amount_range", value: answer });
    }
    if (questionId === "exposure_type" && EXPOSURE_TYPES.has(answer)) {
      return freezeRecord({ field: "exposure_type", value: answer });
    }
    if (questionId === "bank_route") {
      if (answer === "not_provided") {
        return freezeRecord({ field: "institution_name", value: answer });
      }
      const clean = answer.replace(/\s+/gu, " ").slice(0, 80);
      if (!clean || /[<>\r\n]/u.test(clean) || SECRET_LABEL_RE.test(clean) || ACCOUNT_LIKE_RE.test(clean)) {
        throw new Error("invalid_institution_name");
      }
      return freezeRecord({ field: "institution_name", value: clean });
    }
    throw new Error("invalid_intake_answer");
  }

  function progress(caseData) {
    const facts = caseData?.intake_facts || {};
    const paymentMethod = facts.payment_method || inferredPaymentMethod(caseData);
    const total = caseData?.stage === "paid" ? 5 : (paymentMethod ? 3 : 2);
    let answered = 0;
    if (caseData?.stage === "paid" && paymentMethod) answered += 1;
    if (facts.timing_bucket) answered += 1;
    if (paymentMethod && facts.institution_name) answered += 1;
    if (caseData?.stage === "paid" && facts.amount_range) answered += 1;
    if (facts.exposure_type) answered += 1;
    return freezeRecord({ answered: Math.min(answered, total), total, complete: nextQuestion(caseData) === null });
  }

  globalScope.AmanStepIntake = Object.freeze({
    QUESTION_ORDER,
    nextQuestion,
    progress,
    validateAnswer,
  });
}(globalThis));
