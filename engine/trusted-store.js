(function trustedStoreModule(globalScope) {
  "use strict";

  const DB_NAME = "amanstep-trusted-credentials";
  const DB_VERSION = 1;
  const STORE_NAME = "credentials";
  const TOKEN_PATTERN = /^[A-Za-z0-9_-]{40,64}$/u;
  const PAIRING_PATTERN = /^[0-9a-f]{32}$/u;
  const INVITE_PATTERN = /^[A-Z2-9]{8}$/u;
  const OWNER_STATUSES = new Set(["pending_claim", "awaiting_owner_confirmation", "active"]);
  const CONTACT_STATUSES = new Set(["awaiting_owner_confirmation", "active"]);
  const SCOPES = new Set(["high_risk", "post_loss", "recovery_update"]);

  function requestResult(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("trusted_storage_failed"));
    });
  }

  function createIndexedDbDriver(factory) {
    if (!factory || typeof factory.open !== "function") {
      throw new Error("trusted_storage_unavailable");
    }
    let databasePromise = null;
    function open() {
      if (databasePromise) return databasePromise;
      databasePromise = new Promise((resolve, reject) => {
        const request = factory.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
          if (!request.result.objectStoreNames.contains(STORE_NAME)) {
            request.result.createObjectStore(STORE_NAME, { keyPath: "slot" });
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => {
          databasePromise = null;
          reject(request.error || new Error("trusted_storage_failed"));
        };
        request.onblocked = () => {
          databasePromise = null;
          reject(new Error("trusted_storage_blocked"));
        };
      });
      return databasePromise;
    }
    async function operation(mode, action) {
      const database = await open();
      const transaction = database.transaction(STORE_NAME, mode);
      const completion = new Promise((resolve, reject) => {
        transaction.oncomplete = resolve;
        transaction.onerror = () => reject(transaction.error || new Error("trusted_storage_failed"));
        transaction.onabort = () => reject(transaction.error || new Error("trusted_storage_aborted"));
      });
      const result = await action(transaction.objectStore(STORE_NAME));
      await completion;
      return result;
    }
    return Object.freeze({
      ensureAvailable: open,
      get: (slot) => operation("readonly", (store) => requestResult(store.get(slot))),
      add: (record) => operation("readwrite", (store) => requestResult(store.add(record))),
      put: (record) => operation("readwrite", (store) => requestResult(store.put(record))),
      delete: (slot) => operation("readwrite", (store) => requestResult(store.delete(slot))),
    });
  }

  function cleanScopes(value) {
    if (!Array.isArray(value)) return [];
    return [...new Set(value.filter((scope) => SCOPES.has(scope)))];
  }

  function ownerRecord(value) {
    if (!value || !PAIRING_PATTERN.test(String(value.pairing_id || ""))
      || !TOKEN_PATTERN.test(String(value.owner_token || ""))
      || !OWNER_STATUSES.has(value.status)) {
      throw new Error("invalid_owner_credential");
    }
    const inviteCode = String(value.invite_code || "");
    if (inviteCode && !INVITE_PATTERN.test(inviteCode)) throw new Error("invalid_invite_code");
    const expiresAt = String(value.expires_at || "");
    if (expiresAt && !Number.isFinite(Date.parse(expiresAt))) throw new Error("invalid_credential_expiry");
    return Object.freeze({
      slot: "owner",
      pairing_id: String(value.pairing_id),
      owner_token: String(value.owner_token),
      status: value.status,
      invite_code: inviteCode,
      scopes: cleanScopes(value.scopes),
      language: value.language === "ar" ? "ar" : "en",
      expires_at: expiresAt,
      contact_alias: String(value.contact_alias || "").slice(0, 40),
    });
  }

  function contactRecord(value) {
    if (!value || !PAIRING_PATTERN.test(String(value.pairing_id || ""))
      || !TOKEN_PATTERN.test(String(value.contact_token || ""))
      || !CONTACT_STATUSES.has(value.status)) {
      throw new Error("invalid_contact_credential");
    }
    return Object.freeze({
      slot: "contact",
      pairing_id: String(value.pairing_id),
      contact_token: String(value.contact_token),
      status: value.status,
      contact_alias: String(value.contact_alias || "").slice(0, 40),
    });
  }

  function createStore(options = {}) {
    const driver = options.driver || createIndexedDbDriver(options.indexedDB || globalScope.indexedDB);
    return Object.freeze({
      ensureAvailable: () => driver.ensureAvailable(),
      createOwner: (value) => driver.add(ownerRecord(value)),
      createContact: (value) => driver.add(contactRecord(value)),
      saveOwner: (value) => driver.put(ownerRecord(value)),
      saveContact: (value) => driver.put(contactRecord(value)),
      loadOwner: async () => {
        const value = await driver.get("owner");
        if (!value) return null;
        const record = ownerRecord(value);
        if (record.expires_at && Date.parse(record.expires_at) <= Date.now()) {
          await driver.delete("owner");
          return null;
        }
        return record;
      },
      loadContact: async () => {
        const value = await driver.get("contact");
        return value ? contactRecord(value) : null;
      },
      deleteOwner: () => driver.delete("owner"),
      deleteContact: () => driver.delete("contact"),
    });
  }

  globalScope.AmanStepTrustedStore = Object.freeze({ createStore });
})(typeof window === "undefined" ? globalThis : window);
