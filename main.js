const BRANCHES = {
  master: {
    key: "master",
    label: "Master",
    defaultUrl: "https://distributed-tracing-system.vercel.app",
  },
  development: {
    key: "development",
    label: "Development",
    defaultUrl: "https://distributed-tracing-system.onrender.com",
  },
};

const POLICY_MAP = {
  dev: {
    projectName: "dts",
    branchName: "dev",
    captureSlow: 0,
    captureCodes: [1, 2, 3, 4, 5],
  },
  master: {
    projectName: "dts",
    branchName: "main",
    captureSlow: 200,
    captureCodes: [4, 5],
  },
};

const ENDPOINTS = [
  {
    id: "wake-up",
    name: "Wake Up",
    description: "Warm up server and check redirect behavior.",
    method: "GET",
    pathTemplate: "/",
    pathParams: [],
    queryParams: [],
    body: "",
    validBranches: ["master", "development"],
  },
  {
    id: "test-url",
    name: "Test URL",
    description: "Runs test route and returns request trace summary.",
    method: "GET",
    pathTemplate: "/test",
    pathParams: [],
    queryParams: [{ key: "url", label: "Target URL", value: "https://www.google.com" }],
    body: "",
    validBranches: ["master", "development"],
  },
  {
    id: "get-user",
    name: "Get User",
    description: "Fetches user details by id.",
    method: "GET",
    pathTemplate: "/user/:id",
    pathParams: [{ key: "id", label: "User ID", value: "0" }],
    queryParams: [],
    body: "",
    validBranches: ["development"],
  },
  {
    id: "edit-user",
    name: "Edit User",
    description: "Edits user when self-authorized.",
    method: "POST",
    pathTemplate: "/user/:id/edit",
    pathParams: [{ key: "id", label: "User ID", value: "1" }],
    queryParams: [],
    body: "{}",
    validBranches: ["development"],
  },
  {
    id: "delete-user",
    name: "Delete User",
    description: "Deletes user (admin-only action).",
    method: "DELETE",
    pathTemplate: "/user/:id",
    pathParams: [{ key: "id", label: "User ID", value: "2" }],
    queryParams: [],
    body: "",
    validBranches: ["development"],
  },
  {
    id: "delay-response",
    name: "Delay Response",
    description: "Simulates latency in seconds.",
    method: "PUT",
    pathTemplate: "/delay/:time",
    pathParams: [{ key: "time", label: "Delay (s)", value: "1" }],
    queryParams: [],
    body: "",
    validBranches: ["master", "development"],
  },
  {
    id: "set-status",
    name: "Set Status",
    description: "Forces response status code.",
    method: "PATCH",
    pathTemplate: "/status/:code",
    pathParams: [{ key: "code", label: "Status Code", value: "412" }],
    queryParams: [],
    body: "",
    validBranches: ["master", "development"],
  },
  {
    id: "logs",
    name: "Logs",
    description: "Gets all logs.",
    method: "GET",
    pathTemplate: "/logs",
    pathParams: [],
    queryParams: [],
    body: "",
    validBranches: ["master", "development"],
  },
  {
    id: "filtered-logs",
    name: "Filtered Logs",
    description: "Gets logs filtered by status code.",
    method: "GET",
    pathTemplate: "/logs/:code",
    pathParams: [{ key: "code", label: "Status Code", value: "200" }],
    queryParams: [],
    body: "",
    validBranches: ["master", "development"],
  },
];

const getById = (id) => document.getElementById(id);

const state = {
  activeBranch: null,
  baseUrl: "",
  selectedEndpointId: null,
};

const formatDuration = (durationMs) => `${Number(durationMs || 0)}ms`;

const toTraceArray = (payload) => {
  if (payload && Array.isArray(payload.traces)) {
    return payload.traces;
  }
  return [];
};

const setText = (id, value) => {
  const el = getById(id);
  if (el) {
    el.textContent = value;
  }
};

const getPolicyProfile = () => {
  const environment = getResolvedEnvironment();
  if (environment === "development") {
    return { key: "dev", policy: POLICY_MAP.dev };
  }

  return { key: "master", policy: POLICY_MAP.master };
};

const renderPolicyMap = () => {
  const mapView = getById("policy-map-view");
  const selected = getPolicyProfile();
  mapView.textContent = formatPretty({
    selectedBranch: selected.key,
    policy: selected.policy,
  });
};

const renderMetrics = (traces) => {
  const metrics = getById("metrics");
  if (!metrics) return;

  const total = traces.length;
  const errors = traces.filter((trace) => Number(trace.statusCode) >= 400).length;
  const slow = traces.filter((trace) => Number(trace.durationMs) >= 1000).length;
  const avgDuration = total
    ? Math.round(traces.reduce((sum, trace) => sum + Number(trace.durationMs || 0), 0) / total)
    : 0;

  const cards = [
    { label: "Total Traces", value: total },
    { label: "Errors (4xx/5xx)", value: errors },
    { label: "Slow (>=1000ms)", value: slow },
    { label: "Avg Duration", value: `${avgDuration}ms` },
  ];

  metrics.innerHTML = cards
    .map(
      (card) => `
      <div class="metric-card">
        <div class="metric-label">${card.label}</div>
        <div class="metric-value">${card.value}</div>
      </div>
    `,
    )
    .join("");
};

const renderBreakdown = (id, entries) => {
  const host = getById(id);
  if (!host) return;

  if (entries.length === 0) {
    host.innerHTML = '<p class="sub">No data</p>';
    return;
  }

  const max = Math.max(...entries.map((entry) => entry.count), 1);
  host.innerHTML = entries
    .map((entry) => {
      const width = Math.max(6, Math.round((entry.count / max) * 100));
      return `
        <div class="breakdown-row">
          <span>${entry.label}</span>
          <div class="bar"><div class="bar-fill" style="width:${width}%"></div></div>
          <span>${entry.count}</span>
        </div>
      `;
    })
    .join("");
};

const renderTraceTable = (traces) => {
  const table = getById("recent-traces");
  if (!table) return;

  if (traces.length === 0) {
    table.innerHTML = '<tr><td colspan="5">No traces found.</td></tr>';
    return;
  }

  table.innerHTML = traces
    .slice(0, 12)
    .map(
      (trace) => `
      <tr>
        <td>${trace.method || "-"}</td>
        <td class="trace-path" title="${trace.path || "-"}">${trace.path || "-"}</td>
        <td>${trace.statusCode ?? "-"}</td>
        <td>${formatDuration(trace.durationMs)}</td>
        <td>${trace.ip || "-"}</td>
      </tr>
    `,
    )
    .join("");
};

const renderDashboard = (traces) => {
  renderMetrics(traces);

  const statusMap = traces.reduce((acc, trace) => {
    const key = String(trace.statusCode ?? "unknown");
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const statusEntries = Object.entries(statusMap)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
  renderBreakdown("status-breakdown", statusEntries);

  const methodMap = traces.reduce((acc, trace) => {
    const key = String(trace.method ?? "UNKNOWN");
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const methodEntries = Object.entries(methodMap)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
  renderBreakdown("method-breakdown", methodEntries);

  renderTraceTable(traces);
};

const loadDashboard = async () => {
  try {
    const response = await fetch(`${state.baseUrl}/logs`);
    const payload = await parseBody(response);

    if (!response.ok) {
      throw new Error(payload?.error || "Dashboard request failed");
    }

    const traces = toTraceArray(payload);
    renderDashboard(traces);
  } catch (error) {
    setText("metrics", "Unable to load dashboard");
    const statusHost = getById("status-breakdown");
    if (statusHost) statusHost.innerHTML = `<p class="sub">${String(error)}</p>`;
    const methodHost = getById("method-breakdown");
    if (methodHost) methodHost.innerHTML = '<p class="sub">No data</p>';
    const table = getById("recent-traces");
    if (table) table.innerHTML = '<tr><td colspan="5">No traces found.</td></tr>';
  }
};

const showWorkspace = () => {
  getById("branch-select").classList.add("hidden");
  getById("workspace").classList.remove("hidden");
};

const classifyLayer = (status, body) => {
  if (status >= 500) {
    return "Error Layer: Server Issue";
  }

  if (status >= 400) {
    return "Error Layer: Client/Authorization Issue";
  }

  if (body && typeof body === "object" && Array.isArray(body.traces)) {
    return "Tracing Layer: Logs/Observability";
  }

  return "Execution Layer: Successful Request";
};

const parseBody = async (response) => {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return await response.json();
  }
  return await response.text();
};

const formatPretty = (value) => {
  if (typeof value === "string") {
    return value;
  }
  return JSON.stringify(value, null, 2);
};

const cloneEndpoint = (endpoint) => ({
  ...endpoint,
  pathParams: endpoint.pathParams.map((item) => ({ ...item })),
  queryParams: endpoint.queryParams.map((item) => ({ ...item })),
});

const getResolvedEnvironment = () => {
  const normalizedUrl = state.baseUrl.toLowerCase();
  if (normalizedUrl.includes("vercel.app")) {
    return "master";
  }

  if (normalizedUrl.includes("onrender.com")) {
    return "development";
  }

  return state.activeBranch;
};

const getValidEndpoints = () => {
  const environment = getResolvedEnvironment();
  return ENDPOINTS.filter((endpoint) => endpoint.validBranches.includes(environment)).map(cloneEndpoint);
};

const buildPath = (endpoint) => {
  let path = endpoint.pathTemplate;

  endpoint.pathParams.forEach((param) => {
    path = path.replace(`:${param.key}`, encodeURIComponent(param.value || ""));
  });

  if (endpoint.queryParams.length === 0) {
    return path;
  }

  const query = endpoint.queryParams
    .filter((param) => param.value)
    .map((param) => `${encodeURIComponent(param.key)}=${encodeURIComponent(param.value)}`)
    .join("&");

  return query ? `${path}?${query}` : path;
};

const sendRequest = async ({ method, path, body, output }) => {
  let requestBody;
  if (["POST", "PUT", "PATCH"].includes(method) && body.trim()) {
    try {
      JSON.parse(body);
      requestBody = body;
    } catch {
      output.status.textContent = "Invalid JSON body";
      output.trace.textContent = "-";
      output.layer.textContent = "Request Validation Layer";
      output.body.textContent = "Body must be valid JSON.";
      return;
    }
  }

  output.status.textContent = "Sending...";
  output.trace.textContent = "-";
  output.layer.textContent = "-";
  output.body.textContent = "Waiting for response...";
  output.card.classList.remove("state-success", "state-error");
  output.card.classList.add("state-pending");

  try {
    const response = await fetch(`${state.baseUrl}${path}`, {
      method,
      headers: {
        "content-type": "application/json",
      },
      body: requestBody,
    });

    const payload = await parseBody(response);

    const proxiedStatus = response.status;
    const proxiedStatusText = response.statusText || "";
    const traceId = response.headers.get("x-trace-id") || payload?.traceId || "Not available";
    const proxiedBody = payload;

    output.status.textContent = `${proxiedStatus} ${proxiedStatusText}`;
    output.trace.textContent = traceId;
    output.layer.textContent = classifyLayer(proxiedStatus, proxiedBody);
    output.body.textContent = formatPretty(proxiedBody);
    output.card.classList.remove("state-pending");
    if (proxiedStatus >= 200 && proxiedStatus < 300) {
      output.card.classList.add("state-success");
      output.card.classList.remove("state-error");
    } else {
      output.card.classList.add("state-error");
      output.card.classList.remove("state-success");
    }
  } catch (error) {
    output.status.textContent = "Network Error";
    output.trace.textContent = "-";
    output.layer.textContent = "Transport Layer Failure";
    output.body.textContent = String(error);
    output.card.classList.remove("state-pending", "state-success");
    output.card.classList.add("state-error");
  }
};

const renderCatalog = () => {
  const validEndpoints = getValidEndpoints();
  const catalog = getById("catalog");
  catalog.innerHTML = "";

  validEndpoints.forEach((endpoint) => {
    const item = document.createElement("div");
    const isActive = state.selectedEndpointId === endpoint.id;
    item.className = `catalog-item${isActive ? " selected" : ""}`;
    item.innerHTML = `
      <p><strong>${endpoint.name}</strong></p>
      <p>${endpoint.description}</p>
      <p>${endpoint.method} ${endpoint.pathTemplate}</p>
    `;

    item.addEventListener("click", () => {
      state.selectedEndpointId = endpoint.id;
      renderCatalog();
      renderEndpoints();
    });

    catalog.appendChild(item);
  });
};

const loadPolicy = async () => {
  const view = getById("policy-view");
  view.textContent = "Loading tracing policy...";

  try {
    const response = await fetch(`${state.baseUrl}/policy`);
    const payload = await parseBody(response);

    if (!response.ok) {
      throw new Error(payload?.error || "Policy request failed");
    }

    view.textContent = formatPretty(payload);
  } catch (error) {
    view.textContent = `Unable to load policy: ${String(error)}`;
  }
};

const renderEndpoints = () => {
  const validEndpoints = getValidEndpoints();
  const list = getById("endpoint-list");
  list.innerHTML = "";

  const selectedEndpoint = validEndpoints.find((endpoint) => endpoint.id === state.selectedEndpointId);

  if (!selectedEndpoint) {
    const empty = document.createElement("p");
    empty.className = "sub";
    empty.textContent = "Select one endpoint from Endpoint Catalog to show its request card.";
    list.appendChild(empty);
    return;
  }

  const endpoint = selectedEndpoint;
  const tpl = getById("endpoint-template");
  const fragment = tpl.content.cloneNode(true);

  const card = fragment.querySelector(".endpoint-card");
  const name = card.querySelector(".ep-name");
  const desc = card.querySelector(".ep-desc");
  const methodTag = card.querySelector(".ep-method");
  const pathView = card.querySelector(".ep-path-view");
  const methodSelect = card.querySelector(".ep-method-select");
  const paramsContainer = card.querySelector(".ep-params");
  const bodyLabel = card.querySelector("label:nth-of-type(2)");
  const bodyInput = card.querySelector(".ep-body");

  name.textContent = endpoint.name;
  desc.textContent = endpoint.description;
  methodTag.textContent = endpoint.method;
  methodSelect.value = endpoint.method;
  bodyInput.value = endpoint.body;

  let currentMethod = endpoint.method;

  const updateBodyVisibility = () => {
    if (["GET", "DELETE"].includes(currentMethod)) {
      bodyLabel.classList.add("hidden");
      bodyInput.classList.add("hidden");
      return;
    }

    bodyLabel.classList.remove("hidden");
    bodyInput.classList.remove("hidden");
  };

  methodSelect.addEventListener("change", (event) => {
    currentMethod = event.target.value;
    methodTag.textContent = currentMethod;
    updateBodyVisibility();
  });

  const updatePathView = () => {
    pathView.value = buildPath(endpoint);
  };

  const addEditableField = (field, type) => {
    const wrapper = document.createElement("div");
    wrapper.className = "param-field";

    const label = document.createElement("label");
    label.textContent = `${type}: ${field.label}`;
    wrapper.appendChild(label);

    const input = document.createElement("input");
    input.value = field.value;
    input.addEventListener("input", (event) => {
      field.value = event.target.value;
      updatePathView();
    });
    wrapper.appendChild(input);

    paramsContainer.appendChild(wrapper);
  };

  endpoint.pathParams.forEach((field) => addEditableField(field, "Path param"));
  endpoint.queryParams.forEach((field) => addEditableField(field, "Query param"));

  updateBodyVisibility();

  updatePathView();

  const output = {
    card,
    status: card.querySelector(".res-status"),
    trace: card.querySelector(".res-trace"),
    layer: card.querySelector(".res-layer"),
    body: card.querySelector(".res-body"),
  };

  const sendBtn = card.querySelector(".send-btn");
  sendBtn.addEventListener("click", async () => {
    await sendRequest({
      method: currentMethod,
      path: buildPath(endpoint),
      body: bodyInput.value,
      output,
    });
  });

  const resetBtn = card.querySelector(".reset-btn");
  resetBtn.addEventListener("click", () => {
    const fresh = cloneEndpoint(ENDPOINTS.find((item) => item.id === endpoint.id));
    endpoint.pathParams = fresh.pathParams;
    endpoint.queryParams = fresh.queryParams;
    currentMethod = fresh.method;
    methodSelect.value = fresh.method;
    methodTag.textContent = fresh.method;
    bodyInput.value = fresh.body;
    paramsContainer.innerHTML = "";
    endpoint.pathParams.forEach((field) => addEditableField(field, "Path param"));
    endpoint.queryParams.forEach((field) => addEditableField(field, "Query param"));
    updatePathView();
    updateBodyVisibility();
    output.status.textContent = "-";
    output.trace.textContent = "-";
    output.layer.textContent = "-";
    output.body.textContent = "No response yet.";
    output.card.classList.remove("state-pending", "state-success", "state-error");
  });

  list.appendChild(fragment);
};

const loadBranch = async (branchKey) => {
  const branch = BRANCHES[branchKey];
  if (!branch) {
    return;
  }

  state.activeBranch = branch.key;
  state.baseUrl = branch.defaultUrl;
  state.selectedEndpointId = null;

  getById("workspace-title").textContent = `${branch.label} Branch`;
  getById("base-url").value = state.baseUrl;

  showWorkspace();
  renderPolicyMap();
  renderCatalog();
  renderEndpoints();
  await loadPolicy();
  await loadDashboard();
};

renderPolicyMap();

document.querySelectorAll(".branch-btn").forEach((button) => {
  button.addEventListener("click", async () => {
    const branch = button.getAttribute("data-branch");
    await loadBranch(branch);
  });
});

getById("switch-branch").addEventListener("click", () => {
  getById("workspace").classList.add("hidden");
  getById("branch-select").classList.remove("hidden");
});

getById("base-url").addEventListener("change", async (event) => {
  state.baseUrl = event.target.value.trim().replace(/\/$/, "");

  const validIds = new Set(getValidEndpoints().map((item) => item.id));
  if (!validIds.has(state.selectedEndpointId)) {
    state.selectedEndpointId = null;
  }

  renderPolicyMap();
  renderCatalog();
  renderEndpoints();
  await loadPolicy();
  await loadDashboard();
});

getById("refresh-dashboard").addEventListener("click", async () => {
  await loadDashboard();
});
