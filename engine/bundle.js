"use strict";

(function attachAmanStepBundle(globalScope) {
  const PINNED_PUBLIC_KEY_BASE64URL = "AObg487kzOkSmM8OhaycQS6-YYtp1OaQEU1Dhj3n9Ec";
  const assetUrl = globalScope.AmanStepPaths?.asset
    || ((path) => new URL(path, globalScope.location?.href || "https://amanstep.invalid/").href);
  const LAST_GOOD_URL = assetUrl("data/advisory_bundle.last-good.json");

  function canonicalize(value) {
    if (Array.isArray(value)) return value.map(canonicalize);
    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]),
      );
    }
    return value;
  }

  function canonicalJson(value) {
    return JSON.stringify(canonicalize(value));
  }

  function base64UrlToBytes(value) {
    const base64 = value.replaceAll("-", "+").replaceAll("_", "/")
      .padEnd(Math.ceil(value.length / 4) * 4, "=");
    const binary = globalScope.atob(base64);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  }

  function signedFields(bundle) {
    const { signature: _signature, ...signed } = bundle;
    return signed;
  }

  function validateShape(bundle) {
    if (!bundle || bundle.schema_version !== 1 || bundle.algorithm !== "Ed25519") {
      throw new Error("unsupported_bundle_schema");
    }
    if (!bundle.bundle_version || !bundle.issued_at || !bundle.key_id || !bundle.signature) {
      throw new Error("incomplete_bundle_metadata");
    }
    for (const field of ["advisories", "directory", "brands"]) {
      if (!Array.isArray(bundle.payload?.[field])) throw new Error(`invalid_bundle_${field}`);
      if (bundle.payload[field].some((record) => record.review_status !== "human_reviewed")) {
        throw new Error(`unreviewed_bundle_${field}`);
      }
    }
    // The Trust Map is optional (older bundles lack it) but, when present, every
    // record must name its source, retrieval date and reviewer (S12).
    const trustMap = bundle.payload.trust_map;
    if (trustMap !== undefined) {
      if (!trustMap || trustMap.schema_version !== 1
        || !Array.isArray(trustMap.sources) || !Array.isArray(trustMap.records)) {
        throw new Error("invalid_bundle_trust_map");
      }
      const sourceIds = new Set(trustMap.sources.map((source) => source.source_id));
      if (trustMap.records.some((record) => !sourceIds.has(record.source_id)
        || !record.retrieved_at || !record.reviewer || record.review_status !== "source_verified")) {
        throw new Error("unreviewed_bundle_trust_map");
      }
    }
  }

  async function verifyBundle(bundle) {
    validateShape(bundle);
    const key = await globalScope.crypto.subtle.importKey(
      "raw",
      base64UrlToBytes(PINNED_PUBLIC_KEY_BASE64URL),
      { name: "Ed25519" },
      false,
      ["verify"],
    );
    const verified = await globalScope.crypto.subtle.verify(
      { name: "Ed25519" },
      key,
      base64UrlToBytes(bundle.signature),
      new TextEncoder().encode(canonicalJson(signedFields(bundle))),
    );
    if (!verified) throw new Error("invalid_bundle_signature");
    return bundle;
  }

  async function fetchVerifiedBundle(url) {
    const response = await fetch(url, { cache: "no-store", credentials: "same-origin" });
    if (!response.ok) throw new Error(`bundle_load_failed_${response.status}`);
    return verifyBundle(await response.json());
  }

  async function requestLastGoodCache(bundle) {
    const serviceWorker = globalScope.navigator?.serviceWorker;
    if (!serviceWorker) return;
    const worker = serviceWorker.controller || (await serviceWorker.ready).active;
    if (worker) worker.postMessage({ type: "CACHE_VERIFIED_BUNDLE", bundle });
  }

  async function loadVerifiedBundle(url = assetUrl("data/advisory_bundle.json")) {
    try {
      const bundle = await fetchVerifiedBundle(url);
      await requestLastGoodCache(bundle);
      return { bundle, source: "live" };
    } catch (liveError) {
      try {
        const bundle = await fetchVerifiedBundle(LAST_GOOD_URL);
        return { bundle, source: "last_good", live_error: liveError.message };
      } catch (_fallbackError) {
        throw liveError;
      }
    }
  }

  globalScope.AmanStepBundle = Object.freeze({
    canonicalJson,
    loadVerifiedBundle,
    verifyBundle,
  });
}(globalThis));
