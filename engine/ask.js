"use strict";

// "Ask AmanStep" (G2, docs/AGENT_PLAN.md). Pure logic, no network and no DOM:
// - build the opt-in request: redacted turns + the results of the phone's own
//   tools (rule risk, signal codes, official-warning yes/no);
// - check the server's answer against a closed shape;
// - turn the answer into a decision the phone controls: its own reviewed words,
//   at most one question, a stage change only after the user confirms, and
//   tool calls that still go through engine/agent.js;
// - list "what I did" so every step is visible.
// The model can never lower a warning, type a number or link, or act alone.
(function attachAmanStepAsk(globalScope) {
  const RISK_RANK = Object.freeze({ insufficient_evidence: 0, caution: 1, high_concern: 2 });
  const STAGE_RANK = Object.freeze({
    suspected: 0, active: 1, compromised: 2, paid: 3, reported: 4, monitoring: 5, closed: 6,
  });
  const LANGUAGES = new Set(["en", "ar", "mixed"]);
  const BRAIN_STAGES = new Set(["suspected", "active", "compromised", "paid"]);
  const INCIDENTS = new Set([
    "impersonation", "account_takeover", "remote_access", "bank_transfer", "card_payment",
    "crypto_payment", "malicious_link", "unknown",
  ]);
  const MAX_TURNS = 2;
  const CODE = /^[A-Z0-9_]{1,80}$/u;
  const FACT_VALUES = Object.freeze({
    language: ["en", "ar", "mixed"],
    live_call: ["yes", "no", "unknown"],
    money: ["none", "requested", "sent", "unknown"],
    payment_method: ["none", "bank_transfer", "card", "crypto", "other", "unknown"],
    code: ["none", "requested", "shared", "unknown"],
    code_target: ["none", "bank_card", "messaging_account", "other_account", "unknown"],
    card_exposure: ["none", "requested", "details_shared", "unauthorised_charge", "unknown"],
    approval: ["none", "requested", "approved", "unknown"],
    remote_access: ["none", "requested", "granted", "unknown"],
    link: ["none", "present", "opened", "unknown"],
    account_takeover: ["yes", "no", "unknown"],
    awareness_only: ["yes", "no", "unknown"],
  });
  const FACT_SOURCES = new Set(["explicit_text", "model_candidate", "unknown"]);
  const REVIEWED_FACT_FIELDS = Object.freeze([
    "live_call", "money", "payment_method", "code", "card_exposure",
    "approval", "remote_access", "link", "account_takeover",
  ]);

  // Reviewed words for each closed action (same meaning as SAFE_REPLIES in
  // amanstep_app/agent_brain.py). The server never sends text for the user.
  const REPLIES = Object.freeze({
    end_call_now: {
      en: "End the call now. Then contact the organisation yourself through its official app, website or the number on your card.",
      ar: "أنهِ المكالمة الآن. ثم تواصل مع الجهة بنفسك عبر تطبيقها أو موقعها الرسمي أو الرقم المطبوع على بطاقتك.",
    },
    do_not_share_code: {
      en: "Do not share any code. No bank or government office asks for it. If you are worried, call the number on the back of your card.",
      ar: "لا تشارك أي رمز. لا يطلبه أي بنك أو جهة حكومية. إذا كنت قلقاً، اتصل بالرقم المطبوع على ظهر بطاقتك.",
    },
    do_not_approve_request: {
      en: "Do not approve the request. Open the official app yourself to check what it is.",
      ar: "لا توافق على الطلب. افتح التطبيق الرسمي بنفسك لتتحقق منه.",
    },
    do_not_install_app: {
      en: "Do not install the app and do not give screen access. End the remote support session.",
      ar: "لا تثبّت التطبيق ولا تمنح صلاحية الوصول إلى الشاشة. أنهِ جلسة الدعم عن بُعد.",
    },
    do_not_open_link: {
      en: "Do not open the link. Check through the organisation's official app or website that you open yourself.",
      ar: "لا تفتح الرابط. تحقّق عبر التطبيق أو الموقع الرسمي للجهة الذي تفتحه بنفسك.",
    },
    stop_payment: {
      en: "Do not send money. Check the request yourself through an official channel first.",
      ar: "لا ترسل المال. تحقّق من الطلب بنفسك عبر قناة رسمية أولاً.",
    },
    call_sending_bank: {
      en: "Call the bank you sent the money from now, using its official number, and ask it to recall the transfer.",
      ar: "اتصل الآن بالبنك الذي أرسلت منه المال عبر رقمه الرسمي واطلب استرجاع التحويل.",
    },
    call_card_bank: {
      en: "Call your bank now using the number on your card and ask it to block the card.",
      ar: "اتصل ببنكك الآن عبر الرقم المطبوع على بطاقتك واطلب إيقاف البطاقة.",
    },
    secure_account_officially: {
      en: "Secure the account now through the official app or provider: change the password and sign out other devices.",
      ar: "أمّن الحساب الآن عبر التطبيق أو المزوّد الرسمي: غيّر كلمة المرور وسجّل الخروج من الأجهزة الأخرى.",
    },
    verify_via_official_channel: {
      en: "No known danger is confirmed. Still verify through an official channel you find yourself.",
      ar: "لم يتأكد خطر معروف. ومع ذلك تحقّق عبر قناة رسمية تجدها بنفسك.",
    },
  });
  const ACTIONS = new Set(Object.keys(REPLIES));

  // Closed questions with closed answers. The answer becomes the second turn.
  const QUESTIONS = Object.freeze({
    payment_method: {
      en: "How did the money leave?", ar: "كيف خرج المال؟",
      choices: [
        { id: "bank_transfer", en: "Bank transfer", ar: "تحويل بنكي" },
        { id: "card_payment", en: "Card payment", ar: "دفع بالبطاقة" },
        { id: "crypto_transfer", en: "Crypto", ar: "عملة رقمية" },
        { id: "other", en: "Other or not sure", ar: "غير ذلك أو لست متأكداً" },
      ],
    },
    money_sent: {
      en: "Has any money already been sent?", ar: "هل أُرسل أي مال بالفعل؟",
      choices: [
        { id: "yes", en: "Yes, money was sent", ar: "نعم، أُرسل المال" },
        { id: "no", en: "No, nothing was sent", ar: "لا، لم يُرسل شيء" },
      ],
    },
    access_shared: {
      en: "Did you already give them anything?", ar: "هل أعطيتهم شيئاً بالفعل؟",
      choices: [
        { id: "code", en: "A code or OTP", ar: "رمزاً أو OTP" },
        { id: "card", en: "Card details", ar: "بيانات البطاقة" },
        { id: "screen", en: "Screen access or an app", ar: "الوصول إلى الشاشة أو تطبيقاً" },
        { id: "nothing", en: "Nothing yet", ar: "لا شيء حتى الآن" },
      ],
    },
  });

  function freeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.values(value).forEach(freeze);
    return Object.freeze(value);
  }

  function redactor() {
    const redact = globalScope.AmanStepRedact;
    if (!redact?.redactForAgent) throw new Error("redaction_unavailable");
    return redact;
  }

  // Step 1 (on the phone, before any tap): what would be sent.
  function buildRequest({ language, turns, analysis, trust } = {}) {
    const lang = language === "ar" ? "ar" : "en";
    const raw = (Array.isArray(turns) ? turns : []).map((turn) => String(turn || "").trim()).filter(Boolean);
    if (!raw.length || raw.length > MAX_TURNS) throw new Error("invalid_turns");
    const redact = redactor();
    const redacted = raw.map((turn) => redact.redactForAgent(turn).text);
    const removed = {};
    redacted.forEach((text) => {
      Object.entries(redact.removedKinds(text)).forEach(([kind, count]) => {
        removed[kind] = (removed[kind] || 0) + count;
      });
    });
    const risk = Object.hasOwn(RISK_RANK, analysis?.risk_level) ? analysis.risk_level : "insufficient_evidence";
    const codes = [...new Set((Array.isArray(analysis?.reason_codes) ? analysis.reason_codes : [])
      .map(String).filter((code) => CODE.test(code)))].slice(0, 20);
    const officialWarning = Boolean(trust?.findings?.some((finding) => (
      ["cma_site", "cma_handle", "cma_name"].includes(finding?.type))));
    return freeze({
      payload: {
        language: lang,
        turns: redacted,
        phone_checks: { rule_risk: risk, reason_codes: codes, official_warning: officialWarning },
      },
      preview: redacted,
      removed,
    });
  }

  // Step 2: the server's answer must have exactly this closed shape.
  function validateResponse(data) {
    const keys = [
      "candidate_facts", "fact_sources", "first_action", "incident_type", "language",
      "latency_seconds", "model", "question_id", "server_redacted_more", "stage", "stored",
    ];
    if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("agent_response_invalid");
    const actual = Object.keys(data).sort();
    if (actual.length !== keys.length || actual.some((key, index) => key !== keys[index])) {
      throw new Error("agent_response_invalid");
    }
    const factKeys = Object.keys(FACT_VALUES);
    const candidateKeys = data.candidate_facts && typeof data.candidate_facts === "object"
      ? Object.keys(data.candidate_facts) : [];
    const sourceKeys = data.fact_sources && typeof data.fact_sources === "object"
      ? Object.keys(data.fact_sources) : [];
    const factsValid = candidateKeys.length === factKeys.length
      && sourceKeys.length === factKeys.length
      && factKeys.every((field) => (
        candidateKeys.includes(field)
        && sourceKeys.includes(field)
        && FACT_VALUES[field].includes(data.candidate_facts[field])
        && FACT_SOURCES.has(data.fact_sources[field])
        && (data.candidate_facts[field] !== "unknown" || data.fact_sources[field] === "unknown")
      ));
    if (!factsValid || !ACTIONS.has(data.first_action) || !BRAIN_STAGES.has(data.stage)
      || !INCIDENTS.has(data.incident_type) || !LANGUAGES.has(data.language)
      || !(data.question_id === "none" || data.question_id === "bank_name" || Object.hasOwn(QUESTIONS, data.question_id))
      || typeof data.server_redacted_more !== "boolean" || data.stored !== false
      || !Number.isFinite(data.latency_seconds) || data.latency_seconds < 0
      || typeof data.model !== "string" || !/^[A-Za-z0-9._:/-]{1,80}$/u.test(data.model)) {
      throw new Error("agent_response_invalid");
    }
    return freeze({ ...data });
  }

  function candidateFacts(response) {
    return freeze(REVIEWED_FACT_FIELDS.flatMap((field) => {
      const value = response?.candidate_facts?.[field];
      if (!value || ["unknown", "none", "no"].includes(value)) return [];
      return [{ field, value, source: response.fact_sources[field] }];
    }));
  }

  function confirmedCaseUpdates(facts, caseData = {}) {
    if (!facts || typeof facts !== "object" || Array.isArray(facts)) throw new Error("invalid_confirmed_facts");
    const clean = {};
    for (const [field, value] of Object.entries(facts)) {
      if (!REVIEWED_FACT_FIELDS.includes(field) || !FACT_VALUES[field]?.includes(value)) {
        throw new Error("invalid_confirmed_facts");
      }
      if (!["unknown", "none", "no"].includes(value)) clean[field] = value;
    }
    const intake = [];
    const method = { bank_transfer: "bank_transfer", card: "card_payment", crypto: "crypto_transfer" }[clean.payment_method];
    if (method) intake.push({ field: "payment_method", value: method });
    let exposure = "";
    if (clean.remote_access === "granted") exposure = "remote_access";
    else if (clean.approval === "approved") exposure = "app_approval";
    else if (["details_shared", "unauthorised_charge"].includes(clean.card_exposure)) exposure = "card_or_password";
    else if (clean.code === "shared") exposure = "otp_or_code";
    if (exposure) intake.push({ field: "exposure_type", value: exposure });

    const stageRank = { suspected: 0, active: 1, compromised: 2, paid: 3, reported: 4, monitoring: 5, closed: 6 };
    const current = stageRank[caseData.stage] ?? 0;
    let event = null;
    if (clean.money === "sent" && current < stageRank.paid) {
      event = { event_type: "money_sent", incident_type: method || "unknown", stage: "paid" };
    } else if (clean.remote_access === "granted" && current < stageRank.compromised) {
      event = { event_type: "app_installed", incident_type: "", stage: "compromised" };
    } else if (
      (clean.code === "shared" || clean.approval === "approved"
        || ["details_shared", "unauthorised_charge"].includes(clean.card_exposure)
        || clean.account_takeover === "yes")
      && current < stageRank.compromised
    ) {
      event = { event_type: "credentials_shared", incident_type: "", stage: "compromised" };
    } else if (clean.live_call === "yes" && current < stageRank.active) {
      event = { event_type: "call_started", incident_type: "", stage: "active" };
    }
    return freeze({ facts: clean, intake, event });
  }

  function stageEvent(brainStage, incidentType, caseData) {
    const current = STAGE_RANK[caseData?.stage] ?? 0;
    if ((STAGE_RANK[brainStage] ?? 0) <= current) return null; // never lowers, never repeats
    if (brainStage === "paid") {
      const type = { bank_transfer: "bank_transfer", card_payment: "card_payment", crypto_payment: "crypto_transfer" }[incidentType]
        || "unknown";
      return { event_type: "money_sent", incident_type: type, stage: "paid" };
    }
    if (brainStage === "compromised") {
      return {
        event_type: incidentType === "remote_access" ? "app_installed" : "credentials_shared",
        incident_type: "",
        stage: "compromised",
      };
    }
    if (brainStage === "active") return { event_type: "call_started", incident_type: "", stage: "active" };
    return null;
  }

  // Step 3: what the phone does with the answer.
  function decide({ response, caseData, analysis, turnsUsed = 1, language = "en" } = {}) {
    const lang = language === "ar" ? "ar" : "en";
    const caseRisk = Math.max(
      RISK_RANK[analysis?.risk_level] ?? 0,
      RISK_RANK[caseData?.final_risk] ?? 0,
      STAGE_RANK[caseData?.stage] >= 1 ? 2 : 0,
    );
    // The model may not lower a warning (S3/S14): a calm answer to a message
    // the rules flagged is replaced by the plan's own next step.
    const overridden = response.first_action === "verify_via_official_channel" && caseRisk > 0;
    const questionId = turnsUsed < MAX_TURNS && Object.hasOwn(QUESTIONS, response.question_id)
      ? response.question_id : null;
    const event = stageEvent(response.stage, response.incident_type, caseData);
    return freeze({
      action: overridden ? null : response.first_action,
      reply: overridden ? null : REPLIES[response.first_action][lang],
      overridden,
      question: questionId ? {
        id: questionId,
        text: QUESTIONS[questionId][lang],
        choices: QUESTIONS[questionId].choices.map((choice) => ({ id: choice.id, label: choice[lang] })),
      } : null,
      stage_event: event,
    });
  }

  // The answer to a question, written as the user's next turn.
  function answerTurn(questionId, choiceId, language = "en") {
    const question = QUESTIONS[questionId];
    const choice = question?.choices.find((item) => item.id === choiceId);
    if (!choice) throw new Error("invalid_answer");
    const lang = language === "ar" ? "ar" : "en";
    return `${question[lang]} ${choice[lang]}`;
  }

  // Tool calls the agent proposes. Each one is still prepared and gated by
  // AmanStepAgent (closed tools, reviewed routes, confirmation for outside actions).
  function proposeCalls({ caseData, route, trustedActive, riskLevel } = {}) {
    const risk = Object.hasOwn(RISK_RANK, riskLevel) ? riskLevel : "insufficient_evidence";
    const calls = [];
    const next = (caseData?.tasks || []).find((task) => task.status === "pending");
    if (next) calls.push({ tool: "show_next_action", risk_level: risk, arguments: { task_id: next.task_id } });
    if (route?.entry_id) {
      calls.push({ tool: "open_official_route", risk_level: risk, arguments: { entry_id: route.entry_id } });
    }
    const stage = caseData?.stage;
    if (trustedActive && ["compromised", "paid"].includes(stage)) {
      calls.push({
        tool: "notify_trusted_contact",
        risk_level: risk,
        arguments: { alert_type: stage === "paid" ? "money_sent" : "access_exposed" },
      });
    }
    return freeze(calls);
  }

  globalScope.AmanStepAsk = Object.freeze({
    ACTIONS: [...ACTIONS],
    QUESTIONS,
    REPLIES,
    MAX_TURNS,
    buildRequest,
    validateResponse,
    decide,
    answerTurn,
    candidateFacts,
    confirmedCaseUpdates,
    proposeCalls,
  });
}(globalThis));
