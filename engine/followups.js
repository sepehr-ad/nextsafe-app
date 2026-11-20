"use strict";

// Device-local follow-ups. This module stores only closed reminder kinds,
// task ids and timestamps. It never receives incident text or evidence.
(function attachAmanStepFollowUps(globalScope) {
  const STORAGE_KEY = "amanstep.follow-ups.v1";
  const MAX_DELAY = 90 * 24 * 60 * 60 * 1000;
  const MAX_TIMER_DELAY = 2_147_000_000;
  const DEFINITIONS = Object.freeze({
    bank_reference: Object.freeze({
      task_id: "call-bank-transfer",
      delay_ms: 60 * 60 * 1000,
      en: "Did the bank give you a reference number?",
      ar: "هل أعطاك البنك رقماً مرجعياً؟",
    }),
    ecrime_report: Object.freeze({
      task_id: "prepare-official-report",
      delay_ms: 6 * 60 * 60 * 1000,
      en: "Have you filed the eCrime report?",
      ar: "هل قدّمت بلاغ eCrime؟",
    }),
    statement_check: Object.freeze({
      task_id: "track-follow-up",
      delay_ms: 24 * 60 * 60 * 1000,
      en: "Check your statement for new transactions.",
      ar: "تحقق من كشف حسابك بحثاً عن معاملات جديدة.",
    }),
  });

  function cleanLanguage(value) {
    return value === "ar" ? "ar" : "en";
  }

  function normaliseReminder(value) {
    const definition = DEFINITIONS[value?.kind];
    const dueAt = Date.parse(value?.due_at);
    const valid = definition
      && value.task_id === definition.task_id
      && typeof value.reminder_id === "string"
      && /^followup-[a-z_]+$/u.test(value.reminder_id)
      && Number.isFinite(dueAt)
      && ["pending", "delivered"].includes(value.status);
    if (!valid) return null;
    const reminder = {
      reminder_id: `followup-${value.kind}`,
      kind: value.kind,
      task_id: definition.task_id,
      due_at: new Date(dueAt).toISOString(),
      language: cleanLanguage(value.language),
      status: value.status,
    };
    if (value.status === "delivered" && Number.isFinite(Date.parse(value.delivered_at))) {
      reminder.delivered_at = new Date(Date.parse(value.delivered_at)).toISOString();
      reminder.channel = value.channel === "system" ? "system" : "in_app";
    }
    return reminder;
  }

  function createStore(options = {}) {
    const storage = options.storage || globalScope.localStorage;
    const clock = options.clock || {
      now: () => Date.now(),
      setTimeout: (...args) => globalScope.setTimeout(...args),
      clearTimeout: (id) => globalScope.clearTimeout(id),
    };
    const deliver = options.deliver || (async () => ({ channel: "in_app" }));
    const timers = new Map();
    let dueListener = () => {};

    function defaultState() {
      return { enabled: false, reminders: [] };
    }

    function read() {
      try {
        const parsed = JSON.parse(storage?.getItem(STORAGE_KEY) || "null");
        if (!parsed || typeof parsed !== "object") return defaultState();
        const reminders = Array.isArray(parsed.reminders)
          ? parsed.reminders.map(normaliseReminder).filter(Boolean).slice(0, Object.keys(DEFINITIONS).length)
          : [];
        return { enabled: parsed.enabled === true, reminders };
      } catch (_error) {
        return defaultState();
      }
    }

    function write(state) {
      const record = {
        enabled: state.enabled === true,
        reminders: state.reminders.map(normaliseReminder).filter(Boolean).slice(0, Object.keys(DEFINITIONS).length),
      };
      storage?.setItem(STORAGE_KEY, JSON.stringify(record));
      return record;
    }

    function clearTimers() {
      for (const timer of timers.values()) clock.clearTimeout(timer);
      timers.clear();
    }

    function message(reminder) {
      return DEFINITIONS[reminder.kind][cleanLanguage(reminder.language)];
    }

    async function deliverDue() {
      const state = read();
      if (!state.enabled) return [];
      const now = clock.now();
      const delivered = [];
      for (const reminder of state.reminders) {
        if (reminder.status !== "pending" || Date.parse(reminder.due_at) > now) continue;
        let outcome = { channel: "in_app" };
        try { outcome = await deliver({ ...reminder, message: message(reminder) }) || outcome; }
        catch (_error) { /* A visible in-app due state remains the fallback. */ }
        reminder.status = "delivered";
        reminder.delivered_at = new Date(now).toISOString();
        reminder.channel = outcome.channel === "system" ? "system" : "in_app";
        delivered.push({ ...reminder, message: message(reminder) });
      }
      if (delivered.length) {
        write(state);
        dueListener(delivered);
      }
      arm();
      return delivered;
    }

    function arm() {
      clearTimers();
      const state = read();
      if (!state.enabled) return;
      for (const reminder of state.reminders) {
        if (reminder.status !== "pending") continue;
        const delay = Math.max(0, Date.parse(reminder.due_at) - clock.now());
        const timer = clock.setTimeout(() => { void deliverDue(); }, Math.min(delay, MAX_TIMER_DELAY));
        timers.set(reminder.reminder_id, timer);
      }
    }

    function setEnabled(enabled) {
      const state = read();
      state.enabled = enabled === true;
      if (!state.enabled) state.reminders = [];
      const saved = write(state);
      arm();
      return saved;
    }

    function schedule({ kind, task_id: taskId, due_at: dueAt, language = "en" }) {
      const definition = DEFINITIONS[kind];
      const timestamp = Date.parse(dueAt);
      const now = clock.now();
      if (
        !definition || definition.task_id !== taskId || !Number.isFinite(timestamp)
        || timestamp <= now || timestamp > now + MAX_DELAY
      ) throw new Error("invalid_local_follow_up");
      const state = read();
      if (!state.enabled) throw new Error("local_follow_ups_disabled");
      const reminder = {
        reminder_id: `followup-${kind}`,
        kind,
        task_id: taskId,
        due_at: new Date(timestamp).toISOString(),
        language: cleanLanguage(language),
        status: "pending",
      };
      state.reminders = [...state.reminders.filter((item) => item.kind !== kind), reminder];
      write(state);
      arm();
      return { ...reminder, message: message(reminder) };
    }

    function cancel(kind) {
      if (!Object.hasOwn(DEFINITIONS, kind)) throw new Error("invalid_local_follow_up");
      const state = read();
      state.reminders = state.reminders.filter((item) => item.kind !== kind);
      const saved = write(state);
      arm();
      return saved;
    }

    function list() {
      return read().reminders.map((reminder) => ({ ...reminder, message: message(reminder) }));
    }

    function onDue(listener) {
      dueListener = typeof listener === "function" ? listener : () => {};
    }

    function start() {
      arm();
      return deliverDue();
    }

    return Object.freeze({ cancel, deliverDue, list, onDue, schedule, setEnabled, start, state: read });
  }

  globalScope.AmanStepFollowUps = Object.freeze({ DEFINITIONS, STORAGE_KEY, createStore });
}(globalThis));
