"use strict";

const TRANSFORMERS_URL = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.2";
const AI0_FIXED_MESSAGE_COUNT = 10;

const MESSAGES = Object.freeze([
  { id: "EN1", lang: "en", text: "Emirates NBD: approve the verification request today at enbd-secure-verify.example or your account will be suspended." },
  { id: "EN2", lang: "en", text: "RTA final notice: pay AED 220 now at rta-pay.example to avoid a vehicle hold." },
  { id: "EN3", lang: "en", text: "SCA investment opportunity: guaranteed 20% weekly return. Deposit USDT today." },
  { id: "EN4", lang: "en", text: "Bank security agent: tell me the six-digit OTP 482913 while I stay on the call." },
  { id: "EN5", lang: "en", text: "Part-time job in Dubai. Pay AED 350 recruitment fee to the manager on WhatsApp." },
  { id: "AR1", lang: "ar", text: "بنك الإمارات دبي الوطني: وافق اليوم على طلب التحقق في enbd-secure-verify.example وإلا سيتم إيقاف حسابك." },
  { id: "AR2", lang: "ar", text: "إشعار أخير من هيئة الطرق: ادفع ٢٢٠ درهماً الآن عبر rta-pay.example لتجنب حجز المركبة." },
  { id: "AR3", lang: "ar", text: "فرصة استثمار مضمونة بعائد ٢٠٪ أسبوعياً. حوّل USDT اليوم." },
  { id: "AR4", lang: "ar", text: "موظف أمن البنك: أعطني رمز التحقق ٤٨٢٩١٣ وأنا معك على الهاتف." },
  { id: "AR5", lang: "ar", text: "وظيفة بدوام جزئي في دبي. ادفع ٣٥٠ درهماً رسوم توظيف للمدير عبر واتساب." },
]);

if (MESSAGES.length !== AI0_FIXED_MESSAGE_COUNT) {
  throw new Error("AI0 fixed corpus must contain exactly ten messages");
}

const CANDIDATES = Object.freeze([
  {
    id: "Xenova/multilingual-e5-small",
    revision: "761b726dd34fb83930e26aab4e9ac3899aa1fa78",
    task: "feature-extraction",
    kind: "embedding",
    license: "MIT (upstream intfloat model)",
  },
  {
    id: "Xenova/paraphrase-multilingual-MiniLM-L12-v2",
    revision: "2c4055b12046f11709e9df2c122e59ffbdc2f900",
    task: "feature-extraction",
    kind: "embedding",
    license: "Apache-2.0 (upstream sentence-transformers model)",
  },
  {
    id: "Xenova/bert-base-multilingual-cased-ner-hrl",
    revision: "263e82c06569c8c2ac46238a7ae5107598934234",
    task: "token-classification",
    kind: "ner",
    license: "AFL-3.0 (upstream Davlan model)",
  },
]);

const LABELS = Object.freeze([
  "bank account approval or account suspension",
  "road toll traffic fine or vehicle penalty",
  "investment offer promising guaranteed returns",
  "request for a password verification code or OTP",
  "job offer asking for a recruitment fee",
  "urgent pressure to act or pay today",
]);

const state = { results: [], running: false };
const consent = document.querySelector("#consent");
const runAll = document.querySelector("#run-all");
const overallStatus = document.querySelector("#overall-status");
const candidateRoot = document.querySelector("#candidates");
const report = document.querySelector("#report");
const copyReport = document.querySelector("#copy-report");

function formatBytes(value) {
  return Number.isFinite(value) ? `${(value / 1_000_000).toFixed(2)} MB` : "unavailable";
}

function percentile95(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.ceil(sorted.length * 0.95) - 1];
}

function deterministicFields(text) {
  const domains = [...text.matchAll(/\b(?:[a-z0-9-]+\.)+(?:example|ae|com|io)\b/gi)].map((match) => match[0]);
  const amounts = [...text.matchAll(/(?:AED\s*\d+(?:[.,]\d+)?|\d+(?:[.,]\d+)?\s*(?:AED|درهم(?:اً)?|٪|%))/giu)].map((match) => match[0]);
  const codes = [...text.matchAll(/\b[0-9٠-٩]{6}\b/gu)].map((match) => match[0]);
  const brands = [
    [/(?:Emirates NBD|بنك الإمارات دبي الوطني)/iu, "Emirates NBD"],
    [/(?:\bRTA\b|هيئة الطرق)/iu, "RTA"],
    [/(?:\bSCA\b|هيئة الأوراق|هيئة سوق المال)/iu, "CMA/SCA"],
    [/(?:WhatsApp|واتساب)/iu, "WhatsApp"],
  ].filter(([pattern]) => pattern.test(text)).map(([, name]) => name);
  const requestedActions = [
    [/(?:approve|وافق)/iu, "approve"],
    [/(?:pay|ادفع|حوّل|deposit)/iu, "pay/transfer"],
    [/(?:tell me|أعطني)/iu, "share code"],
  ].filter(([pattern]) => pattern.test(text)).map(([, name]) => name);
  const pressure = [
    [/(?:today|اليوم)/iu, "today"],
    [/(?:now|الآن)/iu, "now"],
    [/(?:suspended|إيقاف|حجز)/iu, "threat"],
    [/(?:guaranteed|مضمونة)/iu, "guaranteed"],
  ].filter(([pattern]) => pattern.test(text)).map(([, name]) => name);
  return { brands, domains, amounts, codes, requestedActions, pressure };
}

function tensorRows(output) {
  if (typeof output.tolist === "function") return output.tolist();
  const dims = output.dims || [];
  const data = Array.from(output.data || []);
  if (dims.length < 2) return [data];
  const width = dims[dims.length - 1];
  const rows = [];
  for (let index = 0; index < data.length; index += width) rows.push(data.slice(index, index + width));
  return rows;
}

function dot(left, right) {
  let value = 0;
  for (let index = 0; index < Math.min(left.length, right.length); index += 1) value += left[index] * right[index];
  return value;
}

function modelCard(candidate, index) {
  const article = document.createElement("article");
  article.className = "candidate";
  article.id = `candidate-${index}`;
  article.innerHTML = `
    <h3>${index + 1}. ${candidate.id}</h3>
    <dl>
      <dt>Task</dt><dd>${candidate.task}</dd>
      <dt>Revision</dt><dd><code>${candidate.revision.slice(0, 12)}</code></dd>
      <dt>License</dt><dd>${candidate.license}</dd>
      <dt>Status</dt><dd data-field="status">Not run</dd>
      <dt>Required files</dt><dd data-field="size">Not measured</dd>
      <dt>Load time</dt><dd data-field="load">Not measured</dd>
      <dt>Mean / p95</dt><dd data-field="timing">Not measured</dd>
    </dl>
    <progress value="0" max="100" aria-label="Model progress"></progress>
    <details><summary>Per-message output</summary><pre data-field="details">No output yet.</pre></details>`;
  return article;
}

function setField(index, name, value) {
  const node = document.querySelector(`#candidate-${index} [data-field="${name}"]`);
  if (node) node.textContent = value;
}

function setProgress(index, value) {
  const node = document.querySelector(`#candidate-${index} progress`);
  if (node) node.value = Math.max(0, Math.min(100, value || 0));
}

function progressHandler(index) {
  return (event) => {
    const progress = Number(event?.progress_total ?? event?.progress ?? 0);
    if (Number.isFinite(progress)) setProgress(index, progress);
    if (event?.status) setField(index, "status", `${event.status}${event.file ? `: ${event.file}` : ""}`);
  };
}

async function modelSize(ModelRegistry, candidate) {
  const options = { dtype: "q8", device: "wasm", revision: candidate.revision };
  const files = await ModelRegistry.get_pipeline_files(candidate.task, candidate.id, options);
  const metadata = await Promise.all(files.map((file) =>
    ModelRegistry.get_file_metadata(candidate.id, file, { revision: candidate.revision })
  ));
  const complete = metadata.every((item) => item.exists && Number.isFinite(item.size));
  return {
    files,
    bytes: complete ? metadata.reduce((sum, item) => sum + item.size, 0) : null,
    allCached: metadata.length > 0 && metadata.every((item) => item.fromCache === true),
  };
}

async function runEmbedding(pipe, message, labelRows) {
  const output = await pipe(`query: ${message}`, { pooling: "mean", normalize: true });
  const row = tensorRows(output)[0] || [];
  const scores = labelRows.map((label, index) => ({ label: LABELS[index], score: dot(row, label) }));
  scores.sort((left, right) => right.score - left.score);
  return { semanticMatches: scores.slice(0, 3).map((item) => ({ label: item.label, score: Number(item.score.toFixed(4)) })) };
}

async function runNer(pipe, message) {
  const output = await pipe(message, { ignore_labels: ["O"] });
  return {
    namedEntities: (Array.isArray(output) ? output : []).map((item) => ({
      word: item.word,
      type: item.entity_group || item.entity,
      score: Number(Number(item.score || 0).toFixed(4)),
    })),
  };
}

async function runCandidate(transformers, candidate, index) {
  const { pipeline, ModelRegistry, env } = transformers;
  env.allowLocalModels = false;
  setField(index, "status", "Calculating required files…");
  let size = { files: [], bytes: null, allCached: false };
  try {
    size = await modelSize(ModelRegistry, candidate);
    setField(index, "size", `${formatBytes(size.bytes)} · ${size.files.length} files · ${size.allCached ? "cached" : "not fully cached"}`);
  } catch (error) {
    setField(index, "size", `Unavailable: ${error.message}`);
  }

  const started = performance.now();
  state.lastSize = size;
  const pipe = await pipeline(candidate.task, candidate.id, {
    revision: candidate.revision,
    dtype: "q8",
    device: "wasm",
    progress_callback: progressHandler(index),
  });
  const loadSeconds = (performance.now() - started) / 1000;
  setField(index, "load", `${loadSeconds.toFixed(2)} s`);
  setProgress(index, 100);

  let labelRows = [];
  if (candidate.kind === "embedding") {
    const labelOutput = await pipe(LABELS.map((label) => `query: ${label}`), { pooling: "mean", normalize: true });
    labelRows = tensorRows(labelOutput);
  }

  const messages = [];
  for (const message of MESSAGES) {
    setField(index, "status", `Running ${message.id}…`);
    const messageStarted = performance.now();
    const modelOutput = candidate.kind === "embedding"
      ? await runEmbedding(pipe, message.text, labelRows)
      : await runNer(pipe, message.text);
    const milliseconds = performance.now() - messageStarted;
    messages.push({
      id: message.id,
      lang: message.lang,
      milliseconds: Number(milliseconds.toFixed(1)),
      deterministicFields: deterministicFields(message.text),
      modelOutput,
    });
  }

  if (typeof pipe.dispose === "function") await pipe.dispose();
  const timings = messages.map((item) => item.milliseconds);
  const mean = timings.reduce((sum, item) => sum + item, 0) / timings.length;
  const p95 = percentile95(timings);
  const result = {
    model: candidate.id,
    revision: candidate.revision,
    license: candidate.license,
    task: candidate.task,
    dtype: "q8",
    device: "wasm",
    requiredFiles: size.files,
    requiredBytes: size.bytes,
    requiredMB: Number.isFinite(size.bytes) ? Number((size.bytes / 1_000_000).toFixed(2)) : null,
    allFilesCachedBeforeLoad: size.allCached,
    loadSeconds: Number(loadSeconds.toFixed(2)),
    meanMessageMs: Number(mean.toFixed(1)),
    p95MessageMs: Number(p95.toFixed(1)),
    messages,
  };
  setField(index, "status", "Finished");
  setField(index, "timing", `${result.meanMessageMs} / ${result.p95MessageMs} ms`);
  setField(index, "details", JSON.stringify(messages, null, 2));
  return result;
}

function deviceRecord() {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  return {
    timestampUtc: new Date().toISOString(),
    userAgent: navigator.userAgent,
    language: navigator.language,
    hardwareConcurrency: navigator.hardwareConcurrency ?? null,
    deviceMemoryGB: navigator.deviceMemory ?? null,
    connectionType: connection?.effectiveType ?? null,
    webgpuPresent: Boolean(navigator.gpu),
    transformersRuntime: "4.3.2",
    fixedMessageCount: AI0_FIXED_MESSAGE_COUNT,
  };
}

function updateReport() {
  const payload = {
    gate: "AI0",
    status: state.running ? "RUNNING" : (state.results.length === CANDIDATES.length ? "OWNER_REVIEW_REQUIRED" : "INCOMPLETE"),
    device: deviceRecord(),
    thresholds: { maxRequiredMB: 150, maxPerMessageMs: 3000, maxClearlyWrongArabicOfFive: 2 },
    results: state.results,
    ownerArabicJudgement: "OWNER MUST FILL: candidate -> number clearly wrong out of 5 Arabic messages",
  };
  report.value = JSON.stringify(payload, null, 2);
  copyReport.disabled = state.results.length === 0;
}

async function start() {
  if (state.running || !consent.checked) return;
  state.running = true;
  state.results = [];
  runAll.disabled = true;
  consent.disabled = true;
  overallStatus.className = "status";
  overallStatus.textContent = "Loading the pinned Transformers.js runtime…";
  updateReport();
  try {
    const transformers = await import(TRANSFORMERS_URL);
    for (let index = 0; index < CANDIDATES.length; index += 1) {
      const candidate = CANDIDATES[index];
      overallStatus.textContent = `Candidate ${index + 1} of ${CANDIDATES.length}: ${candidate.id}`;
      try {
        state.results.push(await runCandidate(transformers, candidate, index));
      } catch (error) {
        const failure = {
          model: candidate.id,
          revision: candidate.revision,
          license: candidate.license,
          error: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
          requiredMB: Number.isFinite(state.lastSize?.bytes) ? Number((state.lastSize.bytes / 1_000_000).toFixed(2)) : null,
        };
        state.lastSize = null;
        state.results.push(failure);
        setField(index, "status", `FAILED: ${failure.error}`);
        document.querySelector(`#candidate-${index} [data-field="status"]`)?.classList.add("error");
      }
      updateReport();
    }
    overallStatus.textContent = "Run complete. Inspect Arabic output, then copy the complete report.";
  } catch (error) {
    overallStatus.className = "status error";
    overallStatus.textContent = `Runtime failed: ${error instanceof Error ? error.message : String(error)}`;
  } finally {
    state.running = false;
    consent.disabled = false;
    runAll.disabled = !consent.checked;
    updateReport();
  }
}

for (const [index, candidate] of CANDIDATES.entries()) candidateRoot.append(modelCard(candidate, index));
const device = deviceRecord();
document.querySelector("#device").innerHTML = Object.entries(device)
  .map(([key, value]) => `<dt>${key}</dt><dd>${String(value)}</dd>`)
  .join("");
consent.addEventListener("change", () => { runAll.disabled = !consent.checked || state.running; });
runAll.addEventListener("click", start);
copyReport.addEventListener("click", async () => {
  await navigator.clipboard.writeText(report.value);
  copyReport.textContent = "Copied";
  setTimeout(() => { copyReport.textContent = "Copy report"; }, 1600);
});
updateReport();
