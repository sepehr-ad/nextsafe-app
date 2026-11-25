(function attachCaseVault(globalScope) {
  "use strict";

  const STORAGE_KEY = "amanstep.encrypted-case.v1";
  const VERSION = 1;
  const SCHEMA = "amanstep-case-snapshot-v1";
  const RETENTION_DAYS = 30;
  // OWASP's current PBKDF2-HMAC-SHA-256 guidance is 600,000 iterations. Copies
  // saved before 2026-11-25 used 210,000 and can still be opened.
  const ITERATIONS = 600000;
  const READABLE_ITERATIONS = Object.freeze([210000, 600000]);
  const MAX_PLAINTEXT_BYTES = 200000;
  const ENVELOPE_KEYS = Object.freeze([
    "cipher", "ciphertext", "created_at", "expires_at", "iterations", "iv", "kdf", "salt", "version",
  ]);
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  function bytesToBase64(bytes) {
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return globalScope.btoa(binary);
  }

  function base64ToBytes(value) {
    if (typeof value !== "string" || !/^[A-Za-z0-9+/]+={0,2}$/u.test(value)) throw new Error("vault_invalid");
    const binary = globalScope.atob(value);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  }

  function validatePassphrase(passphrase) {
    if (typeof passphrase !== "string" || passphrase.length < 12 || passphrase.length > 128) {
      throw new Error("vault_passphrase_invalid");
    }
  }

  function assertStructuredCase(caseData) {
    if (!caseData || typeof caseData !== "object" || Array.isArray(caseData)
      || typeof caseData.case_id !== "string" || !caseData.case_id.startsWith("local-")
      || caseData.privacy?.raw_message_stored !== false) {
      throw new Error("vault_case_invalid");
    }
    const ancestors = new Set();
    function inspect(value) {
      if (!value || typeof value !== "object") return;
      if (ancestors.has(value)) throw new Error("vault_case_invalid");
      ancestors.add(value);
      for (const [key, child] of Object.entries(value)) {
        if (["raw_message", "raw_text", "transcript", "password", "private_key", "seed_phrase"].includes(key)) {
          throw new Error("vault_case_invalid");
        }
        inspect(child);
      }
      ancestors.delete(value);
    }
    inspect(caseData);
  }

  function validateEnvelope(value, nowMs) {
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("vault_invalid");
    const keys = Object.keys(value).sort();
    if (keys.length !== ENVELOPE_KEYS.length || keys.some((key, index) => key !== ENVELOPE_KEYS[index])) {
      throw new Error("vault_invalid");
    }
    if (value.version !== VERSION || value.kdf !== "PBKDF2-SHA-256" || value.cipher !== "AES-GCM-256"
      || !READABLE_ITERATIONS.includes(value.iterations) || !Number.isFinite(Date.parse(value.created_at))
      || !Number.isFinite(Date.parse(value.expires_at)) || Date.parse(value.expires_at) <= Date.parse(value.created_at)) {
      throw new Error("vault_invalid");
    }
    if (Date.parse(value.expires_at) <= nowMs) throw new Error("vault_expired");
    const salt = base64ToBytes(value.salt);
    const iv = base64ToBytes(value.iv);
    const ciphertext = base64ToBytes(value.ciphertext);
    if (salt.length !== 16 || iv.length !== 12 || !ciphertext.length) throw new Error("vault_invalid");
    return { ...value, salt, iv, ciphertext };
  }

  async function deriveKey(subtle, passphrase, salt, usages, iterations = ITERATIONS) {
    const material = await subtle.importKey("raw", encoder.encode(passphrase), "PBKDF2", false, ["deriveKey"]);
    return subtle.deriveKey(
      { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
      material,
      { name: "AES-GCM", length: 256 },
      false,
      usages,
    );
  }

  function createVault(options = {}) {
    const storage = options.storage || globalScope.localStorage;
    const cryptoApi = options.crypto || globalScope.crypto;
    const now = options.now || (() => Date.now());
    if (!storage || !cryptoApi?.subtle || typeof cryptoApi.getRandomValues !== "function") {
      throw new Error("vault_unavailable");
    }

    function remove() {
      storage.removeItem(STORAGE_KEY);
    }

    function readEnvelope() {
      const raw = storage.getItem(STORAGE_KEY);
      if (!raw) return null;
      try {
        return validateEnvelope(JSON.parse(raw), now());
      } catch (error) {
        if (error.message === "vault_expired") remove();
        throw error;
      }
    }

    async function save(caseData, passphrase) {
      validatePassphrase(passphrase);
      assertStructuredCase(caseData);
      const createdAt = new Date(now()).toISOString();
      const expiresAt = new Date(now() + RETENTION_DAYS * 86400000).toISOString();
      const plaintext = encoder.encode(JSON.stringify({ schema: SCHEMA, case: caseData }));
      if (plaintext.byteLength > MAX_PLAINTEXT_BYTES) throw new Error("vault_case_too_large");
      const salt = cryptoApi.getRandomValues(new Uint8Array(16));
      const iv = cryptoApi.getRandomValues(new Uint8Array(12));
      const key = await deriveKey(cryptoApi.subtle, passphrase, salt, ["encrypt"]);
      const additionalData = encoder.encode(`${VERSION}|${createdAt}|${expiresAt}`);
      const encrypted = await cryptoApi.subtle.encrypt(
        { name: "AES-GCM", iv, additionalData, tagLength: 128 }, key, plaintext,
      );
      const envelope = {
        version: VERSION,
        kdf: "PBKDF2-SHA-256",
        iterations: ITERATIONS,
        cipher: "AES-GCM-256",
        salt: bytesToBase64(salt),
        iv: bytesToBase64(iv),
        ciphertext: bytesToBase64(new Uint8Array(encrypted)),
        created_at: createdAt,
        expires_at: expiresAt,
      };
      storage.setItem(STORAGE_KEY, JSON.stringify(envelope));
      return Object.freeze({ created_at: createdAt, expires_at: expiresAt, retention_days: RETENTION_DAYS });
    }

    async function unlock(passphrase) {
      validatePassphrase(passphrase);
      const envelope = readEnvelope();
      if (!envelope) throw new Error("vault_missing");
      try {
        const key = await deriveKey(cryptoApi.subtle, passphrase, envelope.salt, ["decrypt"], envelope.iterations);
        const additionalData = encoder.encode(`${VERSION}|${envelope.created_at}|${envelope.expires_at}`);
        const decrypted = await cryptoApi.subtle.decrypt({
          name: "AES-GCM", iv: envelope.iv, additionalData, tagLength: 128,
        }, key, envelope.ciphertext);
        const payload = JSON.parse(decoder.decode(decrypted));
        if (!payload || Object.keys(payload).sort().join(",") !== "case,schema" || payload.schema !== SCHEMA) {
          throw new Error("vault_unlock_failed");
        }
        assertStructuredCase(payload.case);
        return payload.case;
      } catch (error) {
        if (["vault_case_invalid", "vault_unlock_failed"].includes(error.message)) throw error;
        throw new Error("vault_unlock_failed");
      }
    }

    function metadata() {
      try {
        const envelope = readEnvelope();
        return envelope ? Object.freeze({ created_at: envelope.created_at, expires_at: envelope.expires_at, retention_days: RETENTION_DAYS }) : null;
      } catch (_error) {
        remove();
        return null;
      }
    }

    function exportEncrypted() {
      const envelope = readEnvelope();
      if (!envelope) throw new Error("vault_missing");
      return JSON.stringify(serialisableEnvelope(envelope), null, 2);
    }

    function serialisableEnvelope(envelope) {
      const clean = Object.fromEntries(ENVELOPE_KEYS.map((key) => [key, envelope[key]]));
      clean.salt = bytesToBase64(envelope.salt);
      clean.iv = bytesToBase64(envelope.iv);
      clean.ciphertext = bytesToBase64(envelope.ciphertext);
      return clean;
    }

    function importEncrypted(text) {
      if (typeof text !== "string" || text.length > 400000) throw new Error("vault_invalid");
      const envelope = validateEnvelope(JSON.parse(text), now());
      storage.setItem(STORAGE_KEY, JSON.stringify(serialisableEnvelope(envelope)));
      return Object.freeze({ created_at: envelope.created_at, expires_at: envelope.expires_at, retention_days: RETENTION_DAYS });
    }

    return Object.freeze({
      deleteSavedCase: remove,
      exportEncrypted,
      importEncrypted,
      metadata,
      save,
      unlock,
    });
  }

  globalScope.AmanStepVault = Object.freeze({
    createVault,
    retentionDays: RETENTION_DAYS,
    storageKey: STORAGE_KEY,
  });
}(globalThis));
