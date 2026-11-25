"use strict";

// Local-first incident state. This module only accepts structured fields; raw
// suspicious messages never enter its persistence boundary.
(function attachAmanStepCase(globalScope) {
  const POLICY_URL = globalScope.AmanStepPaths?.asset("data/incident_policy.json")
    || new URL("data/incident_policy.json", globalScope.location?.href || "https://amanstep.invalid/").href;
  const STORAGE_KEY = "amanstep.active-case.v1";
  const RISK_RANK = Object.freeze({ insufficient_evidence: 0, caution: 1, high_concern: 2 });
  const STAGE_RANK = Object.freeze({
    suspected: 0, active: 1, compromised: 2, paid: 3, reported: 4, monitoring: 5, closed: 6,
  });
  const MODEL_REASON_CODES = new Set([
    "MODEL_PRESSURE", "MODEL_SECRET_REQUEST", "MODEL_APP_APPROVAL",
    "MODEL_INSTALL_REQUEST", "MODEL_PAYMENT_REQUEST",
  ]);
  const INTAKE_CHOICES = Object.freeze({
    payment_method: new Set(["bank_transfer", "card_payment", "crypto_transfer", "gift_card"]),
    timing_bucket: new Set(["last_15_minutes", "last_hour", "today", "earlier", "not_sure"]),
    amount_range: new Set(["under_aed_500", "aed_500_to_5000", "over_aed_5000", "not_provided"]),
    exposure_type: new Set([
      "none_known", "otp_or_code", "app_approval", "card_or_password",
      "remote_access", "unknown_app", "not_sure",
    ]),
  });
  const ALLOWED_FACTS = new Set([
    "occurred_at", "channel", "claimed_organisation", "amount", "currency",
    "transaction_reference", "contact_identifier", "summary",
  ]);
  const TASK_OUTCOMES = new Set(["reached", "pending", "unable"]);
  const CONFIRMED_FACT_VALUES = Object.freeze({
    live_call: new Set(["yes"]),
    money: new Set(["requested", "sent"]),
    payment_method: new Set(["bank_transfer", "card", "crypto", "other"]),
    code: new Set(["requested", "shared"]),
    card_exposure: new Set(["requested", "details_shared", "unauthorised_charge"]),
    approval: new Set(["requested", "approved"]),
    remote_access: new Set(["requested", "granted"]),
    link: new Set(["present", "opened"]),
    account_takeover: new Set(["yes"]),
  });
  const REPORT_NOTICE = "Prepared by the user with AmanStep; not submitted automatically.";
  const REPORT_LABELS = Object.freeze({
    en: Object.freeze({
      missing: "Not provided",
      methods: Object.freeze({ bank_transfer: "bank transfer", card_payment: "card payment", crypto_transfer: "crypto transfer", gift_card: "gift card or voucher" }),
      timing: Object.freeze({ last_15_minutes: "within the last 15 minutes", last_hour: "within the last hour", today: "earlier today", earlier: "before today", not_sure: "time not confirmed" }),
      amounts: Object.freeze({ under_aed_500: "under AED 500", aed_500_to_5000: "AED 500–5,000", over_aed_5000: "over AED 5,000", not_provided: "not provided" }),
      exposure: Object.freeze({ none_known: "no additional exposure known", otp_or_code: "OTP or verification code", app_approval: "bank-app or UAE Pass approval", card_or_password: "card details or password", remote_access: "screen sharing or remote access", unknown_app: "unknown app or APK", not_sure: "not confirmed" }),
      outcomes: Object.freeze({ reached: "Bank reached", pending: "Bank response pending", unable: "Could not reach the bank" }),
      fields: Object.freeze({ payment_method: "payment method", timing_bucket: "incident time", institution_name: "institution", amount_range: "amount range", exposure_type: "additional exposure" }),
      factSummary: Object.freeze({
        live_call_yes: "The contact was still happening when the case was described.",
        money_requested: "A payment was requested.", money_sent: "The user confirmed that money was sent.",
        payment_method_bank_transfer: "The payment method was a bank transfer.", payment_method_card: "The payment method was a card.", payment_method_crypto: "The payment method was cryptocurrency.", payment_method_other: "The payment method was another or unconfirmed type.",
        code_requested: "A code was requested.", code_shared: "The user confirmed that a code was shared.",
        card_exposure_requested: "Card details were requested.", card_exposure_details_shared: "The user confirmed that card details were shared.", card_exposure_unauthorised_charge: "The user reported an unauthorised card charge.",
        approval_requested: "An in-app approval was requested.", approval_approved: "The user confirmed an in-app approval.",
        remote_access_requested: "Remote access or an app installation was requested.", remote_access_granted: "The user confirmed granting remote access or installing an app.",
        link_present: "A link was included.", link_opened: "The user confirmed opening a link.",
        account_takeover_yes: "The user reported losing control of an account.",
      }),
      events: Object.freeze({
        case_created: "Recovery case opened",
        money_sent: "User confirmed that money was sent",
        credentials_shared: "User confirmed that access details were shared",
        app_installed: "User confirmed that an app or remote access was allowed",
        report_submitted: "User confirmed that an official report was submitted",
        case_closed: "User closed the case",
        model_safety_raise: "Private on-device checks raised the safety level",
      }),
    }),
    ar: Object.freeze({
      missing: "غير مقدم",
      methods: Object.freeze({ bank_transfer: "تحويل مصرفي", card_payment: "دفعة بطاقة", crypto_transfer: "تحويل عملات مشفرة", gift_card: "بطاقة هدايا أو قسيمة" }),
      timing: Object.freeze({ last_15_minutes: "خلال آخر 15 دقيقة", last_hour: "خلال الساعة الأخيرة", today: "في وقت سابق اليوم", earlier: "قبل اليوم", not_sure: "الوقت غير مؤكد" }),
      amounts: Object.freeze({ under_aed_500: "أقل من 500 درهم", aed_500_to_5000: "من 500 إلى 5,000 درهم", over_aed_5000: "أكثر من 5,000 درهم", not_provided: "غير مقدم" }),
      exposure: Object.freeze({ none_known: "لا انكشاف إضافي معروف", otp_or_code: "OTP أو رمز تحقق", app_approval: "موافقة في تطبيق البنك أو UAE Pass", card_or_password: "بيانات بطاقة أو كلمة مرور", remote_access: "مشاركة شاشة أو وصول عن بعد", unknown_app: "تطبيق مجهول أو APK", not_sure: "غير مؤكد" }),
      outcomes: Object.freeze({ reached: "تم التواصل مع البنك", pending: "رد البنك قيد الانتظار", unable: "تعذر التواصل مع البنك" }),
      fields: Object.freeze({ payment_method: "طريقة الدفع", timing_bucket: "وقت الواقعة", institution_name: "الجهة", amount_range: "نطاق المبلغ", exposure_type: "الانكشاف الإضافي" }),
      factSummary: Object.freeze({
        live_call_yes: "كان التواصل لا يزال مستمراً عند وصف الحالة.",
        money_requested: "طُلبت دفعة مالية.", money_sent: "أكد المستخدم إرسال المال.",
        payment_method_bank_transfer: "كانت طريقة الدفع تحويلاً مصرفياً.", payment_method_card: "كانت طريقة الدفع بطاقة.", payment_method_crypto: "كانت طريقة الدفع عملة مشفرة.", payment_method_other: "كانت طريقة الدفع من نوع آخر أو غير مؤكد.",
        code_requested: "طُلب رمز.", code_shared: "أكد المستخدم مشاركة رمز.",
        card_exposure_requested: "طُلبت بيانات البطاقة.", card_exposure_details_shared: "أكد المستخدم مشاركة بيانات البطاقة.", card_exposure_unauthorised_charge: "أبلغ المستخدم عن خصم غير مصرح به من البطاقة.",
        approval_requested: "طُلبت موافقة داخل تطبيق.", approval_approved: "أكد المستخدم إعطاء موافقة داخل تطبيق.",
        remote_access_requested: "طُلب وصول عن بعد أو تثبيت تطبيق.", remote_access_granted: "أكد المستخدم منح وصول عن بعد أو تثبيت تطبيق.",
        link_present: "تضمنت الواقعة رابطاً.", link_opened: "أكد المستخدم فتح رابط.",
        account_takeover_yes: "أبلغ المستخدم عن فقدان السيطرة على حساب.",
      }),
      events: Object.freeze({
        case_created: "تم فتح حالة التعافي",
        money_sent: "أكد المستخدم إرسال المال",
        credentials_shared: "أكد المستخدم مشاركة بيانات وصول",
        app_installed: "أكد المستخدم السماح بتطبيق أو وصول عن بعد",
        report_submitted: "أكد المستخدم تقديم بلاغ رسمي",
        case_closed: "أغلق المستخدم الحالة",
        model_safety_raise: "رفعت الفحوص الخاصة على الجهاز مستوى الأمان",
      }),
    }),
  });
  const SECRET_VALUE_RE = /(^|[^\p{L}\p{N}_])(otp|pin|cvv|password|passcode|verification code|رمز|کد تأیید|رمز التحقق)(?=$|[^\p{L}\p{N}_])\s*[:=-]?\s*([A-Za-z0-9@#$%*!_-]{3,32})/giu;
  const INTAKE_SECRET_LABEL_RE = /\b(otp|pin|cvv|password|passcode|verification\s*code|private\s*key|seed\s*phrase)\b|رمز|کد\s*تأیید|رمز\s*التحقق/iu;
  const INTAKE_ACCOUNT_LIKE_RE = /[0-9٠-٩۰-۹]{4}|@|https?:|www\./iu;
  const SOURCE_ID_RE = /^[A-Z0-9][A-Z0-9._-]{1,79}$/u;
  const SOURCE_DATE_RE = /^\d{4}-\d{2}-\d{2}$/u;
  let policyPromise = null;

  function stageRisk(stage) {
    if (["active", "compromised", "paid", "reported", "monitoring"].includes(stage)) {
      return "high_concern";
    }
    return "insufficient_evidence";
  }

  function maximumRisk(first, second) {
    const left = Object.hasOwn(RISK_RANK, first) ? first : "insufficient_evidence";
    const right = Object.hasOwn(RISK_RANK, second) ? second : "insufficient_evidence";
    return RISK_RANK[left] >= RISK_RANK[right] ? left : right;
  }

  function now() {
    return new Date().toISOString().replace(/\.\d{3}Z$/u, "+00:00");
  }

  function newCaseId() {
    const cryptoApi = globalScope.crypto;
    if (cryptoApi?.randomUUID) return `local-${cryptoApi.randomUUID().replaceAll("-", "")}`;
    const bytes = new Uint8Array(16);
    cryptoApi.getRandomValues(bytes);
    return `local-${[...bytes].map((item) => item.toString(16).padStart(2, "0")).join("")}`;
  }

  async function loadPolicy(url = POLICY_URL) {
    if (!policyPromise) {
      const embedded = globalScope.AmanStepStaticPolicies?.incident;
      const source = embedded && typeof embedded === "object"
        ? Promise.resolve(embedded)
        : fetch(url, { credentials: "same-origin" })
          .then((response) => {
          if (!response.ok) throw new Error(`incident_policy_load_failed_${response.status}`);
          return response.json();
          });
      policyPromise = source
        .then((policy) => {
          const required = [
            "version", "selection_policy", "case_ttl_seconds", "situation_to_stage",
            "event_stage", "allowed_transitions", "stage_tasks", "type_tasks",
            "common_tasks", "translations",
          ];
          if (required.some((field) => !Object.hasOwn(policy, field))) {
            throw new Error("incident_policy_missing_fields");
          }
          return policy;
        })
        .catch((error) => {
          policyPromise = null;
          throw error;
        });
    }
    return policyPromise;
  }

  function sanitiseSourceRefs(sourceRefs) {
    if (!Array.isArray(sourceRefs)) return [];
    const seen = new Set();
    return sourceRefs.flatMap((source) => {
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

  function cloneTask(record, language, policy, policyRule) {
    const task = {
      task_id: String(record.id || "task"),
      priority: String(record.priority || "normal"),
      title: String(record.title || "Next step"),
      description: String(record.description || ""),
      action_type: String(record.action_type || "user_safety_step"),
      status: "pending",
      requires_user_action: true,
      source_url: record.source_url ? String(record.source_url) : null,
      policy_rule: String(policyRule || "incident_policy.unknown"),
      completed_at: null,
    };
    const translation = policy.translations?.[language]?.[task.task_id];
    if (Array.isArray(translation) && translation.length === 2) {
      [task.title, task.description] = translation.map(String);
    }
    return task;
  }

  function normaliseLanguage(policy, language) {
    return language === "en" || Object.hasOwn(policy.translations, language) ? language : "en";
  }

  function exposureIncidentType(intakeFacts = {}) {
    if (["otp_or_code", "app_approval", "card_or_password"].includes(intakeFacts.exposure_type)) {
      return "credentials_or_otp";
    }
    if (["remote_access", "unknown_app"].includes(intakeFacts.exposure_type)) {
      return "apk_installed";
    }
    return "";
  }

  // A message that asks for a code gets "do not share the code" first
  // (incident_policy.reason_first_tasks); other stages keep their order.
  function reasonFirstRecords(stage, reasonCodes, policy) {
    const rule = policy.reason_first_tasks;
    if (!rule || !Array.isArray(rule.stages) || !rule.stages.includes(stage)) return [];
    const wanted = new Set((Array.isArray(reasonCodes) ? reasonCodes : [])
      .map((code) => rule.codes?.[String(code)])
      .filter(Boolean));
    return (rule.tasks || [])
      .filter((record) => wanted.has(record.id))
      .map((record) => ({ record, policyRule: "reason_first_tasks" }));
  }

  function buildTasks(stage, incidentType, language, policy, previous = [], intakeFacts = {}, reasonCodes = []) {
    let records;
    if (Object.hasOwn(policy.stage_tasks, stage)) {
      records = [
        ...reasonFirstRecords(stage, reasonCodes, policy),
        ...policy.stage_tasks[stage].map((record) => ({
          record, policyRule: `stage_tasks.${stage}`,
        })),
      ];
    } else if (stage === "closed") {
      records = [];
    } else {
      const extraIncidentType = exposureIncidentType(intakeFacts);
      records = [
        ...(policy.type_tasks[incidentType] || []).map((record) => ({
          record, policyRule: `type_tasks.${incidentType}`,
        })),
        ...(extraIncidentType && extraIncidentType !== incidentType
          ? (policy.type_tasks[extraIncidentType] || []).map((record) => ({
              record, policyRule: `type_tasks.${extraIncidentType}`,
            }))
          : []),
        ...policy.common_tasks.map((record) => ({ record, policyRule: "common_tasks" })),
      ];
    }
    const previousById = new Map(previous.map((task) => [task.task_id, task]));
    const seen = new Set();
    return records.flatMap(({ record, policyRule }) => {
      const task = cloneTask(record, language, policy, policyRule);
      if (seen.has(task.task_id)) return [];
      seen.add(task.task_id);
      const old = previousById.get(task.task_id);
      if (old?.status === "completed") {
        task.status = "completed";
        task.completed_at = old.completed_at;
      }
      return [task];
    });
  }

  function refreshDerived(caseData, policy) {
    const nextAction = caseData.tasks.find((task) => task.status === "pending") || null;
    caseData.updated_at = caseData.updated_at || now();
    caseData.privacy = {
      raw_message_stored: false,
      storage: "device_structured_case_until_expiry",
      automatic_submission: false,
    };
    caseData.rule_stage = Object.hasOwn(STAGE_RANK, caseData.rule_stage)
      ? caseData.rule_stage
      : caseData.stage;
    caseData.rule_risk = maximumRisk(caseData.rule_risk, stageRisk(caseData.rule_stage));
    caseData.final_risk = maximumRisk(caseData.final_risk, caseData.rule_risk);
    caseData.rule_reason_codes = [...new Set(
      (caseData.rule_reason_codes || caseData.reason_codes || [])
        .map(String)
        .filter((code) => /^[A-Z0-9_]{1,80}$/u.test(code) && !MODEL_REASON_CODES.has(code)),
    )];
    caseData.model_reason_codes = [...new Set(
      (caseData.model_reason_codes || []).filter((code) => MODEL_REASON_CODES.has(code)),
    )];
    caseData.source_refs = sanitiseSourceRefs(caseData.source_refs);
    caseData.reason_codes = [...new Set([...caseData.rule_reason_codes, ...caseData.model_reason_codes])];
    const intakeFacts = caseData.intake_facts && typeof caseData.intake_facts === "object"
      ? caseData.intake_facts
      : {};
    caseData.intake_facts = Object.fromEntries(
      Object.entries(intakeFacts).filter(([field, value]) => (
        INTAKE_CHOICES[field]?.has(value)
        || (field === "institution_name" && typeof value === "string" && value.length <= 80)
      )),
    );
    caseData.agent_trace = {
      loop: "observe_classify_plan_confirm_reassess",
      policy_version: policy.version,
      observed_stage: caseData.stage,
      observed_reason_codes: [...caseData.reason_codes],
      rule_reason_codes: [...caseData.rule_reason_codes],
      model_reason_codes: [...caseData.model_reason_codes],
      classified_incident_type: caseData.incident_type,
      selected_task_id: nextAction?.task_id || null,
      selected_policy_rule: nextAction?.policy_rule || null,
      selection_policy: policy.selection_policy,
      requires_user_confirmation: Boolean(nextAction?.requires_user_action),
      external_action_performed: false,
    };
    caseData.next_safe_action = nextAction;
    return caseData;
  }

  function saveCase(caseData) {
    try {
      globalScope.localStorage?.setItem(STORAGE_KEY, JSON.stringify(caseData));
    } catch (_error) {
      // The in-memory case remains usable if private mode blocks storage.
    }
    return caseData;
  }

  function clearCase() {
    try { globalScope.localStorage?.removeItem(STORAGE_KEY); } catch (_error) { /* no-op */ }
  }

  function restoreCase() {
    try {
      const raw = globalScope.localStorage?.getItem(STORAGE_KEY);
      if (!raw) return null;
      const caseData = JSON.parse(raw);
      if (!caseData?.case_id?.startsWith("local-") || Date.parse(caseData.expires_at) <= Date.now()) {
        clearCase();
        return null;
      }
      return caseData;
    } catch (_error) {
      clearCase();
      return null;
    }
  }

  async function resumeEncryptedCase(snapshot) {
    const policy = await loadPolicy();
    if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)
      || typeof snapshot.case_id !== "string" || !snapshot.case_id.startsWith("local-")
      || snapshot.privacy?.raw_message_stored !== false
      || !Object.hasOwn(STAGE_RANK, snapshot.stage)
      || !Array.isArray(snapshot.events) || !Array.isArray(snapshot.tasks)) {
      throw new Error("invalid_encrypted_case");
    }
    const restored = JSON.parse(JSON.stringify(snapshot));
    const restoredAt = now();
    restored.storage_mode = "encrypted_device_vault";
    restored.updated_at = restoredAt;
    restored.expires_at = new Date(Date.now() + Number(policy.case_ttl_seconds) * 1000).toISOString();
    return saveCase(refreshDerived(restored, policy));
  }

  async function createCase(situation, incidentType, language = "en", reasonCodes = []) {
    const policy = await loadPolicy();
    const stage = policy.situation_to_stage[situation];
    if (!stage) throw new Error("invalid_situation");
    const selectedType = Object.hasOwn(policy.type_tasks, incidentType) ? incidentType : "unknown";
    const createdAt = now();
    const caseData = {
      case_id: newCaseId(),
      server_case_id: null,
      storage_mode: "device_local_only",
      stage,
      rule_stage: stage,
      situation,
      incident_type: selectedType,
      language: normaliseLanguage(policy, language),
      created_at: createdAt,
      updated_at: createdAt,
      expires_at: new Date(Date.now() + Number(policy.case_ttl_seconds) * 1000).toISOString(),
      reason_codes: [...new Set(reasonCodes.map(String))],
      rule_reason_codes: [...new Set(reasonCodes.map(String))],
      model_reason_codes: [],
      rule_risk: stageRisk(stage),
      final_risk: stageRisk(stage),
      intake_facts: {},
      task_outcomes: {},
      source_refs: [],
      tasks: [],
      events: [{ event_type: "case_created", created_at: createdAt, note: "" }],
      confirmed_agent_facts: {},
    };
    caseData.tasks = buildTasks(
      stage, selectedType, caseData.language, policy, [], caseData.intake_facts, caseData.reason_codes,
    );
    return saveCase(refreshDerived(caseData, policy));
  }

  async function attachServerMirror(caseData, serverCase) {
    const policy = await loadPolicy();
    if (serverCase?.case_id) {
      caseData.server_case_id = serverCase.case_id;
      caseData.storage_mode = "device_local_with_server_mirror";
    }
    return saveCase(refreshDerived(caseData, policy));
  }

  async function completeTask(caseData, taskId) {
    const policy = await loadPolicy();
    const task = caseData.tasks.find((item) => item.task_id === taskId);
    if (!task) throw new Error("task_not_found");
    if (task.status !== "completed") {
      const completedAt = now();
      task.status = "completed";
      task.completed_at = completedAt;
      caseData.updated_at = completedAt;
      caseData.events.push({ event_type: "task_completed", created_at: completedAt, note: taskId });
    }
    return saveCase(refreshDerived(caseData, policy));
  }

  function sanitiseOutcomeReference(value) {
    const reference = String(value || "").trim().slice(0, 80);
    if (!reference) return "";
    if (/[<>\r\n]/u.test(reference) || INTAKE_SECRET_LABEL_RE.test(reference)) {
      throw new Error("invalid_task_outcome_reference");
    }
    return reference;
  }

  async function recordTaskOutcome(caseData, taskId, outcome, reference = "") {
    const policy = await loadPolicy();
    const task = caseData.tasks.find((item) => item.task_id === taskId);
    if (!task) throw new Error("task_not_found");
    if (taskId !== "call-bank-transfer" || !TASK_OUTCOMES.has(outcome)) {
      throw new Error("invalid_task_outcome");
    }
    const recordedAt = now();
    const cleanReference = sanitiseOutcomeReference(reference);
    caseData.task_outcomes = {
      ...(caseData.task_outcomes || {}),
      [taskId]: {
        outcome,
        reference: cleanReference,
        recorded_at: recordedAt,
      },
    };
    if (outcome === "reached") {
      task.status = "completed";
      task.completed_at = recordedAt;
    }
    caseData.updated_at = recordedAt;
    caseData.events.push({
      event_type: "task_outcome_recorded",
      created_at: recordedAt,
      note: taskId,
      outcome,
      reference: cleanReference,
    });
    return saveCase(refreshDerived(caseData, policy));
  }

  async function recordConfirmedFacts(caseData, facts) {
    const policy = await loadPolicy();
    if (!facts || typeof facts !== "object" || Array.isArray(facts)) {
      throw new Error("invalid_confirmed_facts");
    }
    const clean = {};
    for (const [field, value] of Object.entries(facts)) {
      if (!CONFIRMED_FACT_VALUES[field]?.has(value)) throw new Error("invalid_confirmed_facts");
      clean[field] = value;
    }
    const recordedAt = now();
    caseData.confirmed_agent_facts = {
      ...(caseData.confirmed_agent_facts || {}),
      ...clean,
    };
    caseData.updated_at = recordedAt;
    caseData.events.push({
      event_type: "agent_facts_confirmed",
      created_at: recordedAt,
      note: String(Object.keys(clean).length),
    });
    return saveCase(refreshDerived(caseData, policy));
  }

  async function recordEvent(caseData, eventType, incidentType = "") {
    const policy = await loadPolicy();
    const target = policy.event_stage[eventType];
    if (!target) throw new Error("invalid_event_type");
    const allowed = policy.allowed_transitions[caseData.stage] || [];
    if (target !== caseData.stage && !allowed.includes(target)) throw new Error("invalid_stage_transition");
    if (eventType === "credentials_shared") caseData.incident_type = "credentials_or_otp";
    if (eventType === "app_installed") caseData.incident_type = "apk_installed";
    if (eventType === "money_sent" && Object.hasOwn(policy.type_tasks, incidentType)) {
      caseData.incident_type = incidentType;
    }
    const eventAt = now();
    caseData.stage = target;
    caseData.rule_stage = target;
    caseData.rule_risk = maximumRisk(caseData.rule_risk, stageRisk(target));
    caseData.final_risk = maximumRisk(caseData.final_risk, caseData.rule_risk);
    caseData.updated_at = eventAt;
    caseData.events.push({ event_type: eventType, created_at: eventAt, note: "" });
    caseData.tasks = buildTasks(
      target, caseData.incident_type, caseData.language, policy, caseData.tasks, caseData.intake_facts,
      caseData.reason_codes,
    );
    const updated = refreshDerived(caseData, policy);
    if (target === "closed") {
      clearCase();
      return updated;
    }
    return saveCase(updated);
  }

  async function setLanguage(caseData, language) {
    const policy = await loadPolicy();
    const selectedLanguage = normaliseLanguage(policy, language);
    caseData.tasks = buildTasks(
      caseData.stage, caseData.incident_type, selectedLanguage, policy, caseData.tasks, caseData.intake_facts,
      caseData.reason_codes,
    );
    caseData.language = selectedLanguage;
    caseData.updated_at = now();
    return saveCase(refreshDerived(caseData, policy));
  }

  async function recordObservation(
    caseData, reasonCodes = [], ruleRisk = "insufficient_evidence", sourceRefs = [],
  ) {
    const policy = await loadPolicy();
    const observedCodes = [...new Set(
      reasonCodes.map(String).filter((code) => /^[A-Z0-9_]{1,80}$/u.test(code)),
    )];
    caseData.rule_reason_codes = [...new Set([
      ...(caseData.rule_reason_codes || []),
      ...observedCodes.filter((code) => !MODEL_REASON_CODES.has(code)),
    ])];
    caseData.rule_risk = maximumRisk(caseData.rule_risk, ruleRisk);
    caseData.final_risk = maximumRisk(caseData.final_risk, caseData.rule_risk);
    caseData.source_refs = sanitiseSourceRefs([...(caseData.source_refs || []), ...sourceRefs]);
    caseData.updated_at = now();
    caseData.tasks = buildTasks(
      caseData.stage, caseData.incident_type, caseData.language, policy, caseData.tasks,
      caseData.intake_facts, [...caseData.rule_reason_codes, ...(caseData.model_reason_codes || [])],
    );
    return saveCase(refreshDerived(caseData, policy));
  }

  async function applySafetyMerge(caseData, merge) {
    const policy = await loadPolicy();
    if (
      !merge || merge.asymmetric !== true
      || !Object.hasOwn(RISK_RANK, merge.final_risk)
      || !Object.hasOwn(STAGE_RANK, merge.final_stage)
      || !Object.hasOwn(RISK_RANK, merge.rule_risk)
      || !Object.hasOwn(STAGE_RANK, merge.rule_stage)
      || !Array.isArray(merge.rule_reason_codes)
      || !Array.isArray(merge.model_reason_codes)
      || merge.model_reason_codes.some((code) => !MODEL_REASON_CODES.has(code))
    ) throw new Error("invalid_safety_merge");
    const modelAccepted = merge.model_status === "accepted";
    const modelRisk = modelAccepted && Object.hasOwn(RISK_RANK, merge.model_risk)
      ? merge.model_risk
      : merge.rule_risk;
    const modelStage = modelAccepted && ["suspected", "active"].includes(merge.model_stage)
      ? merge.model_stage
      : merge.rule_stage;
    const expectedRisk = maximumRisk(merge.rule_risk, modelRisk);
    const expectedStage = STAGE_RANK[merge.rule_stage] >= STAGE_RANK[modelStage]
      ? merge.rule_stage
      : modelStage;
    if (
      merge.rule_risk !== caseData.rule_risk
      || merge.rule_stage !== caseData.rule_stage
      || merge.final_risk !== expectedRisk
      || merge.final_stage !== expectedStage
      || (!modelAccepted && merge.model_reason_codes.length)
    ) throw new Error("invalid_safety_merge_provenance");
    const existingRuleCodes = caseData.rule_reason_codes || [];
    if (existingRuleCodes.some((code) => !merge.rule_reason_codes.includes(code))) {
      throw new Error("safety_merge_removed_rule_hit");
    }
    if (RISK_RANK[merge.final_risk] < RISK_RANK[caseData.rule_risk]) {
      throw new Error("safety_merge_lowered_risk");
    }
    if (STAGE_RANK[merge.final_stage] < STAGE_RANK[caseData.stage]) {
      throw new Error("safety_merge_lowered_stage");
    }

    const previousStage = caseData.stage;
    caseData.final_risk = maximumRisk(caseData.final_risk, merge.final_risk);
    caseData.model_reason_codes = [...new Set([
      ...(caseData.model_reason_codes || []), ...merge.model_reason_codes,
    ])];
    caseData.stage = merge.final_stage;
    caseData.updated_at = now();
    if (caseData.stage !== previousStage) {
      caseData.tasks = buildTasks(
        caseData.stage, caseData.incident_type, caseData.language, policy, caseData.tasks,
        caseData.intake_facts, caseData.reason_codes,
      );
      caseData.events.push({ event_type: "model_safety_raise", created_at: caseData.updated_at, note: "" });
    }
    return saveCase(refreshDerived(caseData, policy));
  }

  async function recordIntakeFact(caseData, fact) {
    const policy = await loadPolicy();
    if (!fact || Object.keys(fact).sort().join(",") !== "field,value") {
      throw new Error("invalid_intake_fact_schema");
    }
    const field = String(fact.field || "");
    const value = String(fact.value || "");
    if (field === "institution_name") {
      if (
        !value || value.length > 80 || /[<>\r\n]/u.test(value)
        || INTAKE_SECRET_LABEL_RE.test(value) || INTAKE_ACCOUNT_LIKE_RE.test(value)
      ) {
        throw new Error("invalid_intake_fact");
      }
    } else if (!INTAKE_CHOICES[field]?.has(value)) {
      throw new Error("invalid_intake_fact");
    }
    caseData.intake_facts = { ...(caseData.intake_facts || {}), [field]: value };
    if (field === "payment_method" && Object.hasOwn(policy.type_tasks, value)) {
      caseData.incident_type = value;
    }
    caseData.tasks = buildTasks(
      caseData.stage, caseData.incident_type, caseData.language, policy, caseData.tasks,
      caseData.intake_facts, caseData.reason_codes,
    );
    caseData.updated_at = now();
    caseData.events.push({ event_type: "intake_fact_recorded", created_at: caseData.updated_at, note: field });
    return saveCase(refreshDerived(caseData, policy));
  }

  function redactSecrets(value) {
    return String(value).trim().slice(0, 1000)
      .replace(SECRET_VALUE_RE, (_match, prefix, label) => `${prefix}${label} [REDACTED]`);
  }

  function displayTimestamp(value) {
    return String(value || "").replace(
      /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::\d{2})?(?:\.\d+)?(?:Z|\+00:00)$/u,
      "$1 $2 UTC",
    );
  }

  function humaniseEvent(caseData, event, language, labels) {
    const task = (caseData.tasks || []).find((item) => item.task_id === event.note);
    let description = labels.events[event.event_type] || String(event.event_type || "Event");
    if (event.event_type === "task_completed") {
      description = language === "ar"
        ? `اكتملت الخطوة: ${task?.title || event.note}`
        : `Step completed: ${task?.title || event.note}`;
    } else if (event.event_type === "task_outcome_recorded") {
      const outcome = labels.outcomes[event.outcome] || event.outcome;
      const reference = redactSecrets(event.reference || "");
      description = reference
        ? (language === "ar" ? `${outcome} — المرجع: ${reference}` : `${outcome} — reference: ${reference}`)
        : outcome;
    } else if (event.event_type === "intake_fact_recorded") {
      const field = labels.fields[event.note] || event.note;
      description = language === "ar"
        ? `تم تأكيد تفصيل التعافي: ${field}`
        : `Recovery detail confirmed: ${field}`;
    } else if (event.event_type === "agent_facts_confirmed") {
      description = language === "ar"
        ? `راجع المستخدم وأكد ${event.note || "0"} من حقائق الواقعة`
        : `User reviewed and confirmed ${event.note || "0"} incident facts`;
    }
    return Object.freeze({
      event_type: String(event.event_type || "event"),
      created_at: String(event.created_at || ""),
      description,
    });
  }

  function buildReportDrafts(caseData, cleanFacts) {
    const language = caseData.language === "ar" ? "ar" : "en";
    const labels = REPORT_LABELS[language];
    const intake = caseData.intake_facts || {};
    const methodKey = intake.payment_method || caseData.incident_type;
    const method = labels.methods[methodKey] || String(methodKey || labels.missing);
    const timing = cleanFacts.occurred_at || labels.timing[intake.timing_bucket] || labels.missing;
    const institution = cleanFacts.claimed_organisation || intake.institution_name || labels.missing;
    const amount = cleanFacts.amount || labels.amounts[intake.amount_range] || labels.missing;
    const reference = cleanFacts.transaction_reference || labels.missing;
    const exposure = labels.exposure[intake.exposure_type] || labels.missing;
    const confirmedSummary = Object.entries(caseData.confirmed_agent_facts || {})
      .map(([field, value]) => labels.factSummary[`${field}_${value}`])
      .filter(Boolean)
      .join(" ");
    const summary = cleanFacts.summary || confirmedSummary || labels.missing;
    const timeline = (caseData.events || []).map((event) => humaniseEvent(caseData, event, language, labels));
    const timelineText = timeline.length
      ? timeline.map((event) => `- ${displayTimestamp(event.created_at)}: ${event.description}`).join("\n")
      : `- ${displayTimestamp(caseData.created_at)}: ${labels.events.case_created}`;
    const bankOutcome = caseData.task_outcomes?.["call-bank-transfer"];
    const bankOutcomeLine = bankOutcome
      ? `${labels.outcomes[bankOutcome.outcome] || bankOutcome.outcome}${bankOutcome.reference ? ` — ${bankOutcome.reference}` : ""}`
      : labels.missing;
    const bankText = language === "ar"
      ? [
          "الموضوع: طلب عاجل لمراجعة واقعة احتيال",
          `طريقة الدفع: ${method}`,
          `التوقيت: ${timing}`,
          `الجهة: ${institution}`,
          `المبلغ: ${amount}`,
          `مرجع المعاملة: ${reference}`,
          `نتيجة التواصل مع البنك: ${bankOutcomeLine}`,
          `انكشاف إضافي محتمل: ${exposure}`,
          `ملخص واقعي من المستخدم: ${summary}`,
          "أرجو مراجعة المعاملة واتخاذ أي إجراء متاح للإيقاف أو التتبع أو حماية الحساب، وتزويدي برقم مرجعي للبلاغ.",
          REPORT_NOTICE,
        ].join("\n")
      : [
          "Subject: Urgent suspected-fraud dispute",
          `Payment method: ${method}`,
          `Timing: ${timing}`,
          `Institution: ${institution}`,
          `Amount: ${amount}`,
          `Transaction reference: ${reference}`,
          `Bank contact outcome: ${bankOutcomeLine}`,
          `Possible additional exposure: ${exposure}`,
          `User-provided factual summary: ${summary}`,
          "Please review the transaction, apply any available hold, trace, or account-protection measure, and provide a dispute reference number.",
          REPORT_NOTICE,
        ].join("\n");
    const ecrimeText = language === "ar"
      ? [
          "ملخص واقعة لمراجعة المستخدم قبل تقديم بلاغ رسمي",
          `نوع الواقعة: ${method}`,
          `التوقيت: ${timing}`,
          `الجهة المذكورة: ${institution}`,
          `المبلغ: ${amount}`,
          `مرجع المعاملة: ${reference}`,
          `الانكشاف المحتمل: ${exposure}`,
          `الملخص: ${summary}`,
          "التسلسل الزمني:",
          timelineText,
          REPORT_NOTICE,
        ].join("\n")
      : [
          "Incident summary for user review before an official report",
          `Incident method: ${method}`,
          `Timing: ${timing}`,
          `Institution named: ${institution}`,
          `Amount: ${amount}`,
          `Transaction reference: ${reference}`,
          `Possible exposure: ${exposure}`,
          `Summary: ${summary}`,
          "Timeline:",
          timelineText,
          REPORT_NOTICE,
        ].join("\n");
    return Object.freeze({
      preparation_notice: REPORT_NOTICE,
      automatic_submission: false,
      bank_dispute: Object.freeze({ language, text: bankText, timeline }),
      ecrime_summary: Object.freeze({ language, text: ecrimeText, timeline }),
    });
  }

  function buildEvidencePack(caseData, facts) {
    const cleanFacts = Object.fromEntries(
      Object.entries(facts || {})
        .filter(([key, value]) => ALLOWED_FACTS.has(key) && String(value).trim())
        .map(([key, value]) => [key, redactSecrets(value)]),
    );
    return {
      document_type: "user_review_draft",
      generated_at: now(),
      case_id: caseData.case_id,
      incident_stage: caseData.stage,
      incident_type: caseData.incident_type,
      facts_provided_by_user: cleanFacts,
      report_drafts: buildReportDrafts(caseData, cleanFacts),
      action_log: caseData.events.map((event) => ({ ...event })),
      task_outcomes: { ...(caseData.task_outcomes || {}) },
      confirmed_agent_facts: { ...(caseData.confirmed_agent_facts || {}) },
      completed_tasks: caseData.tasks
        .filter((task) => task.status === "completed")
        .map((task) => ({ task_id: task.task_id, completed_at: task.completed_at })),
      warnings: [
        "Review every fact before submission.",
        "This draft has not been sent to police, a bank, or any third party.",
        "Do not include passwords, OTPs, PINs, CVVs, or private keys.",
      ],
    };
  }

  globalScope.AmanStepCase = Object.freeze({
    attachServerMirror,
    applySafetyMerge,
    buildEvidencePack,
    clearCase,
    completeTask,
    createCase,
    loadPolicy,
    recordEvent,
    recordIntakeFact,
    recordObservation,
    recordConfirmedFacts,
    recordTaskOutcome,
    resumeEncryptedCase,
    restoreCase,
    setLanguage,
  });
}(globalThis));
