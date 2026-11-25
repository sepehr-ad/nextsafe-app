"use strict";

// Closed tool dispatcher for the on-device agent. Untrusted model output may
// propose a call, but only this policy layer can authorize and execute it.
(function attachAmanStepAgent(globalScope) {
  const AUDIT_KEY = "amanstep.agent-policy-log.v1";
  const BLOCKED_MESSAGE = "blocked by policy";
  const RISK_RANK = Object.freeze({
    insufficient_evidence: 0,
    caution: 1,
    high_concern: 2,
  });
  const ALLOWED_TOOLS = Object.freeze([
    "show_next_action",
    "ask_clarifying_question",
    "open_official_route",
    "start_dialer",
    "notify_trusted_contact",
    "add_evidence_item",
    "draft_report",
    "schedule_follow_up",
    "mark_task_done",
  ]);
  const ALLOWED_TOOL_SET = new Set(ALLOWED_TOOLS);
  const VALID_STAGES = new Set([
    "suspected", "active", "compromised", "paid", "reported", "monitoring", "closed",
  ]);
  const QUESTION_IDS = new Set([
    "payment_method", "exposure_type", "reporting_emirate", "bank_route", "incident_timing",
    "amount_range",
  ]);
  const EVIDENCE_FIELDS = new Set([
    "occurred_at", "channel", "claimed_organisation", "amount", "currency",
    "transaction_reference", "contact_identifier", "summary",
  ]);
  const ALERT_TYPES = new Set(["high_risk", "access_exposed", "money_sent", "recovery_update"]);
  const CONSENT_SCOPES = new Set(["high_risk", "post_loss", "recovery_update"]);
  const ALERT_SCOPE = Object.freeze({
    high_risk: "high_risk",
    access_exposed: "post_loss",
    money_sent: "post_loss",
    recovery_update: "recovery_update",
  });
  const CONFIRMATION_TOOLS = new Set([
    "open_official_route", "start_dialer", "notify_trusted_contact", "add_evidence_item",
    "schedule_follow_up", "mark_task_done",
  ]);
  const EXTERNAL_TOOLS = new Set([
    "open_official_route", "start_dialer", "notify_trusted_contact",
  ]);
  const TOOL_ARGUMENTS = Object.freeze({
    show_next_action: ["task_id"],
    ask_clarifying_question: ["question_id"],
    open_official_route: ["entry_id"],
    start_dialer: ["entry_id", "phone"],
    notify_trusted_contact: ["alert_type"],
    add_evidence_item: ["field", "value"],
    draft_report: ["format"],
    schedule_follow_up: ["task_id", "due_at"],
    mark_task_done: ["task_id"],
  });

  function now() {
    return new Date().toISOString().replace(/\.\d{3}Z$/u, "+00:00");
  }

  function exactKeys(value, expected) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    const actual = Object.keys(value).sort();
    const wanted = [...expected].sort();
    return actual.length === wanted.length && actual.every((key, index) => key === wanted[index]);
  }

  function plainString(value, maximum = 160) {
    return typeof value === "string" && value.length > 0 && value.length <= maximum;
  }

  function freezeRecord(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.values(value).forEach(freezeRecord);
    return Object.freeze(value);
  }

  function readStoredAudit() {
    try {
      const parsed = JSON.parse(globalScope.localStorage?.getItem(AUDIT_KEY) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (_error) {
      return [];
    }
  }

  function appendAudit(entry) {
    const record = freezeRecord({
      created_at: now(),
      status: entry.status,
      tool: ALLOWED_TOOL_SET.has(entry.tool) ? entry.tool : "unknown_tool",
      reason: entry.reason || "",
      message: entry.status === "blocked" ? BLOCKED_MESSAGE : "",
    });
    try {
      const records = [...readStoredAudit(), record].slice(-100);
      globalScope.localStorage?.setItem(AUDIT_KEY, JSON.stringify(records));
    } catch (_error) {
      // Policy decisions still return to the caller when storage is unavailable.
    }
    return record;
  }

  function blocked(tool, reason) {
    appendAudit({ status: "blocked", tool, reason });
    return freezeRecord({
      status: "blocked",
      tool: ALLOWED_TOOL_SET.has(tool) ? tool : "unknown_tool",
      reason,
      message: BLOCKED_MESSAGE,
    });
  }

  function normaliseTask(task) {
    if (!plainString(task?.task_id, 120)) return null;
    const status = task.status === "completed" ? "completed" : "pending";
    return {
      task_id: task.task_id,
      status,
      priority: plainString(task.priority, 40) ? task.priority : "normal",
      action_type: plainString(task.action_type, 80) ? task.action_type : "user_safety_step",
    };
  }

  function normaliseDirectoryEntry(entry) {
    if (!plainString(entry?.entry_id, 120) || entry.review_status !== "human_reviewed") return null;
    const officialUrl = entry.official_url === null ? null : String(entry.official_url || "");
    if (officialUrl && !officialUrl.startsWith("https://")) return null;
    return {
      entry_id: entry.entry_id,
      official_url: officialUrl || null,
      phone: entry.phone === null ? null : String(entry.phone || ""),
      review_status: "human_reviewed",
    };
  }

  function observe(input) {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      throw new Error("invalid_agent_observation");
    }
    if (!Object.hasOwn(RISK_RANK, input.rule_risk) || !VALID_STAGES.has(input.stage)) {
      throw new Error("invalid_agent_safety_state");
    }
    const tasks = Array.isArray(input.tasks) ? input.tasks.map(normaliseTask).filter(Boolean) : [];
    const directory = Array.isArray(input.directory)
      ? input.directory.map(normaliseDirectoryEntry).filter(Boolean)
      : [];
    const reasonCodes = Array.isArray(input.reason_codes)
      ? [...new Set(input.reason_codes.filter((code) => /^[A-Z0-9_]{1,80}$/u.test(String(code))))]
      : [];
    const trusted = input.trusted_contact?.status === "active"
      ? {
          status: "active",
          scopes: Array.isArray(input.trusted_contact.scopes)
            ? input.trusted_contact.scopes.filter((scope) => CONSENT_SCOPES.has(scope))
            : [],
        }
      : { status: "inactive", scopes: [] };
    return freezeRecord({
      rule_risk: input.rule_risk,
      stage: input.stage,
      incident_type: plainString(input.incident_type, 80) ? input.incident_type : "unknown",
      reason_codes: reasonCodes,
      tasks,
      directory,
      trusted_contact: trusted,
    });
  }

  function findTask(context, taskId) {
    return context.tasks.find((task) => task.task_id === taskId) || null;
  }

  function findDirectoryEntry(context, entryId) {
    return context.directory.find((entry) => entry.entry_id === entryId) || null;
  }

  function validateArguments(tool, args, context) {
    if (!exactKeys(args, TOOL_ARGUMENTS[tool])) return { reason: "invalid_tool_schema" };
    if (tool === "show_next_action" || tool === "mark_task_done") {
      const task = findTask(context, args.task_id);
      if (!task || task.status !== "pending") return { reason: "task_not_pending" };
      return { resolved: { task } };
    }
    if (tool === "ask_clarifying_question") {
      if (!QUESTION_IDS.has(args.question_id)) return { reason: "question_not_allowlisted" };
      return { resolved: { question_id: args.question_id } };
    }
    if (tool === "open_official_route") {
      const entry = findDirectoryEntry(context, args.entry_id);
      if (!entry?.official_url) return { reason: "route_not_in_reviewed_directory" };
      return { resolved: { entry } };
    }
    if (tool === "start_dialer") {
      const entry = findDirectoryEntry(context, args.entry_id);
      if (!entry?.phone || args.phone !== entry.phone) return { reason: "phone_not_in_reviewed_directory" };
      return { resolved: { entry } };
    }
    if (tool === "notify_trusted_contact") {
      if (!ALERT_TYPES.has(args.alert_type)) return { reason: "invalid_alert_type" };
      if (context.trusted_contact.status !== "active") return { reason: "trusted_contact_not_active" };
      if (!context.trusted_contact.scopes.includes(ALERT_SCOPE[args.alert_type])) {
        return { reason: "trusted_contact_scope_missing" };
      }
      return { resolved: { alert_type: args.alert_type } };
    }
    if (tool === "add_evidence_item") {
      if (!EVIDENCE_FIELDS.has(args.field) || !plainString(args.value, 1000)) {
        return { reason: "invalid_evidence_item" };
      }
      return { resolved: { field: args.field, value: args.value } };
    }
    if (tool === "draft_report") {
      if (args.format !== "review_json") return { reason: "invalid_report_format" };
      return { resolved: { format: args.format } };
    }
    if (tool === "schedule_follow_up") {
      const task = findTask(context, args.task_id);
      const timestamp = Date.parse(args.due_at);
      const horizon = Date.now() + (90 * 24 * 60 * 60 * 1000);
      if (!task || !Number.isFinite(timestamp) || timestamp <= Date.now() || timestamp > horizon) {
        return { reason: "invalid_follow_up" };
      }
      return { resolved: { task, due_at: new Date(timestamp).toISOString() } };
    }
    return { reason: "unknown_tool" };
  }

  function selectNext(context) {
    const task = context.tasks.find((item) => item.status === "pending");
    if (!task) return null;
    return freezeRecord({
      tool: "show_next_action",
      risk_level: context.rule_risk,
      arguments: { task_id: task.task_id },
    });
  }

  function createRuntime() {
    const prepared = new WeakSet();
    const consumed = new WeakSet();

    function prepare(call, contextInput) {
      let context;
      try {
        context = observe(contextInput);
      } catch (_error) {
        return blocked(call?.tool, "invalid_agent_observation");
      }
      if (!exactKeys(call, ["tool", "risk_level", "arguments"])) {
        return blocked(call?.tool, "invalid_call_schema");
      }
      if (!ALLOWED_TOOL_SET.has(call.tool)) return blocked(call.tool, "unknown_tool");
      if (!Object.hasOwn(RISK_RANK, call.risk_level)) return blocked(call.tool, "invalid_risk_level");
      if (RISK_RANK[call.risk_level] < RISK_RANK[context.rule_risk]) {
        return blocked(call.tool, "risk_downgrade");
      }
      const validation = validateArguments(call.tool, call.arguments, context);
      if (validation.reason) return blocked(call.tool, validation.reason);

      const decision = freezeRecord({
        status: CONFIRMATION_TOOLS.has(call.tool) ? "confirmation_required" : "ready",
        tool: call.tool,
        risk_level: call.risk_level,
        arguments: { ...call.arguments },
        resolved: validation.resolved,
        requires_user_confirmation: CONFIRMATION_TOOLS.has(call.tool),
        external_action: EXTERNAL_TOOLS.has(call.tool),
      });
      prepared.add(decision);
      return decision;
    }

    async function execute(decision, options = {}) {
      if (!prepared.has(decision)) return blocked(decision?.tool, "unprepared_tool_call");
      if (consumed.has(decision)) return blocked(decision.tool, "tool_call_already_used");
      if (decision.requires_user_confirmation && options.userConfirmed !== true) {
        return blocked(decision.tool, "confirmation_required");
      }
      const handler = options.handlers?.[decision.tool];
      if (typeof handler !== "function") return blocked(decision.tool, "tool_handler_unavailable");
      consumed.add(decision);
      try {
        const output = await handler(decision.resolved, decision);
        appendAudit({ status: "executed", tool: decision.tool, reason: "" });
        let followUp = null;
        if (typeof options.reassess === "function") {
          followUp = selectNext(observe(await options.reassess(output)));
        }
        return freezeRecord({
          status: "executed",
          tool: decision.tool,
          output: output ?? null,
          follow_up: followUp,
        });
      } catch (_error) {
        return blocked(decision.tool, "execution_failed");
      }
    }

    return Object.freeze({ prepare, execute });
  }

  globalScope.AmanStepAgent = Object.freeze({
    ALLOWED_TOOLS,
    AUDIT_KEY,
    BLOCKED_MESSAGE,
    createRuntime,
    observe,
    readAudit: () => freezeRecord(readStoredAudit().map((entry) => ({ ...entry }))),
    selectNext,
  });
}(globalThis));
