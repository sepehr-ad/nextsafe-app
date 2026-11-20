"use strict";

// Phone-side redaction before an opt-in "Ask AmanStep" request (safety rule S6).
// Must stay identical to redact_for_agent() in amanstep_app/agent_brain.py:
// eval/redaction_fixture.jsonl is checked against both. This is a bounded
// filter, not a promise that nothing personal can remain, so the app always
// shows the redacted preview and sends nothing without a tap.
(function attachAmanStepRedact(globalScope) {
  const MAX_AGENT_TEXT = 4000;
  const DIGITS = Object.freeze({
    "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
    "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
    "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4",
    "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9",
  });
  // No "u" flag and an explicit ASCII whitespace class: Python's re.ASCII \s is
  // exactly [ \t\n\r\f\v], while JavaScript's \s also matches Unicode spaces.
  const RULES = Object.freeze([
    [/\b(?:https?:\/\/|www\.)[^ \t\n\r\f\v]+/gi, "[LINK]"],
    [/\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/gi, "[EMAIL]"],
    [/(?<![\w@.-])(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+(?:com|net|org|ae|co|io|info|biz|xyz|top|online|site|app|me|ly|cc|link|shop)\b(?:\/[^ \t\n\r\f\v]*)?/gi, "[LINK]"],
    [/\bAE[ \t\n\r\f\v-]*\d(?:[ \t\n\r\f\v-]*\d){20}\b/gi, "[IBAN]"],
    [/(?<!\d)784[ \t\n\r\f\v-]?\d{4}[ \t\n\r\f\v-]?\d{7}[ \t\n\r\f\v-]?\d(?!\d)/g, "[EMIRATES_ID]"],
    [/(?<!\w)(?:\+?971|00971|0)[ \t\n\r\f\v()-]*\d(?:[ \t\n\r\f\v()-]*\d){7,9}(?!\d)/g, "[PHONE]"],
    [/(?<!\d)\d(?:[ -]?\d){12,18}(?!\d)/g, "[CARD_NUMBER]"],
    [/(?<!\d)\d{4,12}(?!\d)/g, "[NUMBER_OR_CODE]"],
  ]);
  const LABELS = Object.freeze([
    "[LINK]", "[EMAIL]", "[IBAN]", "[EMIRATES_ID]", "[CARD_NUMBER]", "[PHONE]", "[NUMBER_OR_CODE]",
  ]);

  function redactForAgent(text) {
    if (typeof text !== "string") throw new TypeError("agent_text_must_be_string");
    // Slice by code points, as Python does.
    let value = Array.from(text).slice(0, MAX_AGENT_TEXT).join("")
      .replace(/[٠-٩۰-۹]/gu, (digit) => DIGITS[digit]);
    for (const [pattern, replacement] of RULES) value = value.replace(pattern, replacement);
    return Object.freeze({ text: value, changed: value !== text });
  }

  // Which kinds of detail were removed, for the preview ("2 codes, 1 link").
  function removedKinds(redacted) {
    const counts = {};
    for (const label of LABELS) {
      const found = String(redacted).split(label).length - 1;
      if (found) counts[label.slice(1, -1).toLowerCase()] = found;
    }
    return Object.freeze(counts);
  }

  globalScope.AmanStepRedact = Object.freeze({ redactForAgent, removedKinds, MAX_AGENT_TEXT });
}(globalThis));
