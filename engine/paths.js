"use strict";

// Resolve application assets and routes from this script's own location. This
// keeps the same build working at / locally and at /haris-family/ on a project
// Pages site without hard-coding either deployment.
(function attachAmanStepPaths(globalScope) {
  const scriptUrl = globalScope.document?.currentScript?.src;
  const pageUrl = globalScope.location?.href || "https://amanstep.invalid/";
  const baseUrl = scriptUrl
    ? new URL("../", scriptUrl)
    : new URL("./", pageUrl);

  function asset(relativePath = "") {
    return new URL(String(relativePath).replace(/^\/+/, ""), baseUrl).href;
  }

  function routePath(routeName = "") {
    return new URL(String(routeName).replace(/^\/+/, ""), baseUrl).pathname;
  }

  function isRoute(routeName) {
    const expected = routePath(routeName).replace(/\/$/u, "");
    const actual = new URL(pageUrl).pathname.replace(/\/$/u, "");
    return actual === expected;
  }

  function hasView(viewName) {
    return new URL(pageUrl).searchParams.get("view") === viewName;
  }

  globalScope.AmanStepPaths = Object.freeze({
    asset,
    base_path: baseUrl.pathname,
    home_url: asset(""),
    hasView,
    isRoute,
    routePath,
  });
}(globalThis));
