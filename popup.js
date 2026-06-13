let accounts = [];
let deleteMode = false;
let searchQuery = "";

function getTimeRemaining() {
  return 30 - (Math.floor(Date.now() / 1000) % 30);
}

function getColorClass(remaining) {
  if (remaining <= 5) return "danger";
  if (remaining <= 15) return "warning";
  return "";
}

function updateTimer() {
  const remaining = getTimeRemaining();
  const colorClass = getColorClass(remaining);
  const fill = document.getElementById("timerFill");
  const label = document.getElementById("timerSeconds");
  fill.style.width = ((remaining / 30) * 100) + "%";
  fill.className = "timer-fill" + (colorClass ? " " + colorClass : "");
  label.textContent = remaining + "s";
  label.className = "timer-seconds" + (colorClass ? " " + colorClass : "");
}

function getFilteredAccounts() {
  if (!searchQuery) return accounts.map((acc, i) => ({ acc, i }));
  const q = searchQuery.toLowerCase();
  return accounts
    .map((acc, i) => ({ acc, i }))
    .filter(({ acc }) =>
      acc.issuer.toLowerCase().includes(q) ||
      acc.account.toLowerCase().includes(q)
    )
    .sort((a, b) => {
      const aIssuer = a.acc.issuer.toLowerCase().startsWith(q) ? 0 : 1;
      const bIssuer = b.acc.issuer.toLowerCase().startsWith(q) ? 0 : 1;
      return aIssuer - bIssuer;
    });
}

async function render() {
  const list = document.getElementById("list");
  const remaining = getTimeRemaining();
  const filtered = getFilteredAccounts();

  document.getElementById("accountCount").textContent =
    accounts.length + " account" + (accounts.length !== 1 ? "s" : "");

  if (accounts.length === 0) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">🔑</div>No accounts yet. Add one below.</div>`;
    return;
  }

  if (filtered.length === 0) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">🔍</div>No results for "${searchQuery}"</div>`;
    return;
  }

  const existingIds = new Set([...list.querySelectorAll(".card")].map(c => c.id));
  const newIds = new Set(filtered.map(({ i }) => "card-" + i));

  existingIds.forEach(id => {
    if (!newIds.has(id)) document.getElementById(id)?.remove();
  });

  for (const { acc, i } of filtered) {
    const code = await generateTOTP(acc.secret);
    const formatted = code.slice(0, 3) + " " + code.slice(3);
    const expiring = remaining <= 5;
    const warning = remaining > 5 && remaining <= 15;
    const codeClass = expiring ? " expiring" : warning ? " warning" : "";

    let card = document.getElementById("card-" + i);

    if (!card) {
      card = document.createElement("div");
      card.className = "card";
      card.id = "card-" + i;
      list.appendChild(card);
    }

    const codeEl = card.querySelector(".card-code");
    if (codeEl && codeEl.dataset.raw === code && (card.querySelector(".remove-btn") !== null) === deleteMode) {
      codeEl.className = "card-code" + codeClass;
      continue;
    }

    card.innerHTML = `
      ${deleteMode ? `<button class="remove-btn" data-index="${i}">−</button>` : ""}
      <div class="card-inner">
        <div class="card-left">
          <div class="card-issuer">${acc.issuer}</div>
          <div class="card-account">${acc.account}</div>
        </div>
        <div class="card-right">
          <div class="card-code${codeClass}" data-raw="${code}">${formatted}</div>
          <button class="copy-btn" data-code="${code}">Copy</button>
        </div>
      </div>
    `;
  }
}

function clearForm() {
  ["issuer", "account", "secret"].forEach(id => document.getElementById(id).value = "");
  document.getElementById("tabType").classList.add("active");
  document.getElementById("tabScan").classList.remove("active");
  document.querySelector(".secret-tabs").classList.remove("hidden");
  document.getElementById("secretTypePane").classList.remove("hidden");
  document.getElementById("secretScanPane").classList.add("hidden");
  const status = document.getElementById("qrStatus");
  status.className = "qr-status hidden";
  status.textContent = "";
  document.getElementById("qrUploadText").textContent = "📂 Upload QR image";
  const formError = document.getElementById("formError");
  formError.classList.add("hidden");
  formError.textContent = "";
}

function setDeleteMode(enabled) {
  deleteMode = enabled;
  const btn = document.getElementById("deleteModeBtn");
  btn.textContent = enabled ? "Done" : "Delete";
  btn.classList.toggle("btn-danger-active", enabled);
  document.getElementById("list").innerHTML = "";
  render();
}

function bindSearchEvents() {
  const input = document.getElementById("searchInput");
  const clear = document.getElementById("searchClear");

  input.addEventListener("input", () => {
    searchQuery = input.value.trim();
    clear.hidden = !searchQuery;
    document.getElementById("list").innerHTML = "";
    render();
  });

  clear.addEventListener("click", () => {
    input.value = "";
    searchQuery = "";
    clear.hidden = true;
    input.focus();
    document.getElementById("list").innerHTML = "";
    render();
  });
}

function bindListEvents() {
  document.getElementById("list").addEventListener("click", async (e) => {
    const copyBtn = e.target.closest(".copy-btn");
    const removeBtn = e.target.closest(".remove-btn");

    if (copyBtn) {
      await navigator.clipboard.writeText(copyBtn.dataset.code);
      copyBtn.textContent = "Copied!";
      copyBtn.classList.add("copied");
      setTimeout(() => {
        copyBtn.textContent = "Copy";
        copyBtn.classList.remove("copied");
      }, 1500);
    }

    if (removeBtn) {
      accounts.splice(parseInt(removeBtn.dataset.index), 1);
      await saveData(accounts);
      document.getElementById("list").innerHTML = "";
      render();
    }
  });
}

function showToast(msg, type = "success") {
  const existing = document.getElementById("importToast");
  if (existing) existing.remove();
  const toast = document.createElement("div");
  toast.id = "importToast";
  toast.className = "import-toast " + type;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add("visible"), 10);
  setTimeout(() => {
    toast.classList.remove("visible");
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function bindFormEvents() {
  const addForm = document.getElementById("addForm");

  document.getElementById("addToggle").addEventListener("click", () => {
    addForm.classList.toggle("open");
  });

  document.getElementById("cancelBtn").addEventListener("click", () => {
    addForm.classList.remove("open");
    clearForm();
  });

  document.getElementById("tabType").addEventListener("click", () => {
    document.getElementById("tabType").classList.add("active");
    document.getElementById("tabScan").classList.remove("active");
    document.getElementById("secretTypePane").classList.remove("hidden");
    document.getElementById("secretScanPane").classList.add("hidden");
  });

  document.getElementById("tabScan").addEventListener("click", () => {
    document.getElementById("tabScan").classList.add("active");
    document.getElementById("tabType").classList.remove("active");
    document.getElementById("secretScanPane").classList.remove("hidden");
    document.getElementById("secretTypePane").classList.add("hidden");
  });

  document.getElementById("qrFileInput").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    const status = document.getElementById("qrStatus");
    const uploadText = document.getElementById("qrUploadText");

    if (!file) return;

    status.className = "qr-status hidden";
    status.textContent = "";
    uploadText.textContent = "⏳ Reading...";

    const bitmap = await createImageBitmap(file).catch(() => null);
    if (!bitmap) {
      status.className = "qr-status error";
      status.textContent = "❌ Couldn't read image file.";
      uploadText.textContent = "📂 Upload QR image";
      e.target.value = "";
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bitmap, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const result = jsQR(imageData.data, imageData.width, imageData.height);
    e.target.value = "";

    if (!result) {
      status.className = "qr-status error";
      status.textContent = "❌ No QR code found in image.";
      uploadText.textContent = "📂 Upload QR image";
      return;
    }

    const raw = result.data;

    if (!raw.startsWith("otpauth://totp/")) {
      status.className = "qr-status error";
      status.textContent = "❌ Not a valid 2FA QR code.";
      uploadText.textContent = "📂 Upload QR image";
      return;
    }

    const withoutScheme = raw.slice("otpauth://totp/".length);
    const qmarkIdx = withoutScheme.indexOf("?");
    const label = decodeURIComponent(qmarkIdx >= 0 ? withoutScheme.slice(0, qmarkIdx) : withoutScheme);
    const paramStr = qmarkIdx >= 0 ? withoutScheme.slice(qmarkIdx + 1) : "";
    const params = Object.fromEntries(new URLSearchParams(paramStr));

    const secret = params.secret || "";
    let issuer = params.issuer || "";
    let account = "";

    if (label.includes(":")) {
      const parts = label.split(":");
      if (!issuer) issuer = parts[0].trim();
      account = parts.slice(1).join(":").trim();
    } else {
      account = label.trim();
    }

    issuer = issuer.slice(0, 15);
    account = account.slice(0, 20);

    if (!secret) {
      status.className = "qr-status error";
      status.textContent = "❌ QR found but no secret key inside.";
      uploadText.textContent = "📂 Upload QR image";
      return;
    }

    document.getElementById("issuer").value = issuer;
    document.getElementById("account").value = account;
    document.getElementById("secret").value = secret;

    document.getElementById("secretScanPane").classList.add("hidden");
    document.querySelector(".secret-tabs").classList.add("hidden");
    document.getElementById("secretTypePane").classList.remove("hidden");

    uploadText.textContent = "📂 Upload QR image";
  });

  document.getElementById("addBtn").addEventListener("click", async () => {
    const issuer = document.getElementById("issuer").value.trim();
    const account = document.getElementById("account").value.trim();
    const secret = document.getElementById("secret").value.replace(/\s/g, "");
    const formError = document.getElementById("formError");

    if (!secret && !issuer && !account) {
      formError.textContent = "Please fill in all fields.";
      formError.classList.remove("hidden");
      return;
    }
    if (!secret) {
      formError.textContent = "A secret key is required — type it or upload a QR code.";
      formError.classList.remove("hidden");
      return;
    }
    if (!issuer && !account) {
      formError.textContent = "Add at least an issuer or account name.";
      formError.classList.remove("hidden");
      return;
    }

    formError.classList.add("hidden");
    accounts.push({ issuer, account, secret });
    await saveData(accounts);
    clearForm();
    addForm.classList.remove("open");
    document.getElementById("list").innerHTML = "";
    render();
  });

  document.getElementById("exportBtn").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(accounts)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "2fa-backup.json";
    a.click();
  });

  document.getElementById("importFileInput").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;

    const text = await file.text().catch(() => null);
    if (!text) { showToast("Could not read file.", "error"); return; }

    const existingSecrets = new Set(accounts.map(a => a.secret));
    const valid = [];
    let skipped = 0;
    let duplicates = 0;

    // Validates that a string is a non-empty base32 secret
    function isValidSecret(s) {
      return typeof s === "string" && /^[A-Z2-7]+=*$/i.test(s) && s.length >= 8;
    }

    if (file.name.endsWith(".json")) {
      let parsed;
      try { parsed = JSON.parse(text); } catch (_) {
        showToast("Invalid JSON file.", "error"); return;
      }
      if (!Array.isArray(parsed)) { showToast("JSON must be an array.", "error"); return; }

      for (const entry of parsed) {
        if (!entry || typeof entry !== "object" || Array.isArray(entry)) { skipped++; continue; }
        const secret = (String(entry.secret || "")).trim().replace(/\s/g, "").toUpperCase();
        const issuer = (String(entry.issuer || "")).trim().slice(0, 15);
        const account = (String(entry.account || "")).trim().slice(0, 20);
        if (!isValidSecret(secret)) { skipped++; continue; }
        if (!issuer && !account) { skipped++; continue; }
        if (existingSecrets.has(secret)) { duplicates++; continue; }
        existingSecrets.add(secret);
        valid.push({ issuer, account, secret });
      }
    } else {
      // Extract all otpauth URIs — split on the scheme so wrapped lines aren't a problem
      const uris = text.split(/(?=otpauth:\/\/)/).map(s => s.trim()).filter(s => s.startsWith("otpauth://"));

      for (const line of uris) {
        if (!line.startsWith("otpauth://totp")) { skipped++; continue; }

        let params, labelRaw;
        try {
          const body = line.startsWith("otpauth://totp/")
            ? line.slice("otpauth://totp/".length)
            : line.slice("otpauth://totp".length).replace(/^\?/, "");

          const q = body.indexOf("?");
          labelRaw = q >= 0 ? body.slice(0, q) : "";
          const paramStr = q >= 0 ? body.slice(q + 1) : body;
          params = Object.fromEntries(new URLSearchParams(paramStr));
        } catch (_) { skipped++; continue; }

        const secret = (params.secret || "").trim().replace(/\s/g, "").toUpperCase();
        if (!isValidSecret(secret)) { skipped++; continue; }

        let issuer = (params.issuer || "").trim();
        let account = "";

        if (labelRaw) {
          try {
            const label = decodeURIComponent(labelRaw);
            if (label.includes(":")) {
              const parts = label.split(":");
              if (!issuer) issuer = parts[0].trim();
              account = parts.slice(1).join(":").trim();
            } else {
              account = label.trim();
            }
          } catch (_) {}
        }

        issuer = issuer.slice(0, 15);
        account = account.slice(0, 20);

        if (!issuer && !account) { skipped++; continue; }
        if (existingSecrets.has(secret)) { duplicates++; continue; }
        existingSecrets.add(secret);
        valid.push({ issuer, account, secret });
      }
    }

    if (!valid.length && !skipped && !duplicates) {
      showToast("No valid accounts found in file.", "error"); return;
    }

    if (valid.length) {
      accounts.push(...valid);
      await saveData(accounts);
      document.getElementById("list").innerHTML = "";
      render();
    }

    const parts = [];
    if (valid.length) parts.push(`${valid.length} imported`);
    if (duplicates) parts.push(`${duplicates} already exist`);
    if (skipped) parts.push(`${skipped} skipped`);
    showToast(parts.join(" · "), valid.length ? "success" : "error");
  });

  document.getElementById("deleteModeBtn").addEventListener("click", () => {
    setDeleteMode(!deleteMode);
  });
}

const addresses = {
  BTC:  "bc1qn75xha9nn0jn3f4gfkxvndakcyudtm49xu90pa",
  ETH:  "0x9115Ed404D6B6675050e5Febc283072659884D78",
  BNB:  "0x9115Ed404D6B6675050e5Febc283072659884D78",
  POL:  "0x9115Ed404D6B6675050e5Febc283072659884D78",
  SOL:  "4s8ttbyezAtW4HeKRWd3We1xtqDoNKTxcXrxfa7za2AZ",
  LTC:  "ltc1q53c962p9ywjtjhya8g2lqujyvwc3u6pz6j06hp",
  TRX:  "TS6qmEkJBcNF3VssbvUquekNo1an6VTTVy",
  USDT: { ERC20: "0x9115Ed404D6B6675050e5Febc283072659884D78", BEP20: "0x9115Ed404D6B6675050e5Febc283072659884D78", TRC20: "TS6qmEkJBcNF3VssbvUquekNo1an6VTTVy", SOL: "4s8ttbyezAtW4HeKRWd3We1xtqDoNKTxcXrxfa7za2AZ", POL: "0x9115Ed404D6B6675050e5Febc283072659884D78" },
  USDC: { ERC20: "0x9115Ed404D6B6675050e5Febc283072659884D78", BEP20: "0x9115Ed404D6B6675050e5Febc283072659884D78", TRC20: "TS6qmEkJBcNF3VssbvUquekNo1an6VTTVy", SOL: "4s8ttbyezAtW4HeKRWd3We1xtqDoNKTxcXrxfa7za2AZ", POL: "0x9115Ed404D6B6675050e5Febc283072659884D78" }
};

const qrMap = {
  BTC: "qr/btc.png", ETH: "qr/evm.png", BNB: "qr/evm.png", POL: "qr/evm.png",
  SOL: "qr/sol.png", LTC: "qr/ltc.png", TRX: "qr/trx.png",
  ERC20: "qr/evm.png", BEP20: "qr/evm.png", TRC20: "qr/trx.png",
  SOL_CHAIN: "qr/sol.png", POL_CHAIN: "qr/evm.png"
};

function showView(id) {
  ["mainView", "donateView", "privacyView"].forEach(v => {
    document.getElementById(v).classList.toggle("hidden", v !== id);
  });
}

function showAddress(coin, chain) {
  const addr = chain ? addresses[coin][chain] : addresses[coin];
  const label = chain ? `${coin} — ${chain}` : coin;
  const qrKey = chain ? (chain === "SOL" ? "SOL_CHAIN" : chain === "POL" ? "POL_CHAIN" : chain) : coin;
  document.getElementById("addressLabel").textContent = label;
  document.getElementById("addressBox").textContent = addr;
  document.getElementById("addressQR").src = qrMap[qrKey];
  document.getElementById("addressQR").classList.remove("hidden");
  document.getElementById("addressWrap").classList.remove("hidden");
}

function bindOverlayEvents() {
  document.getElementById("donateLink").addEventListener("click", (e) => {
    e.preventDefault();
    document.getElementById("chainWrap").classList.add("hidden");
    document.getElementById("addressWrap").classList.add("hidden");
    document.querySelectorAll(".coin-btn").forEach(b => b.classList.remove("active"));
    showView("donateView");
  });

  document.getElementById("privacyLink").addEventListener("click", (e) => {
    e.preventDefault();
    showView("privacyView");
  });

  document.getElementById("donateBack").addEventListener("click", () => showView("mainView"));
  document.getElementById("privacyBack").addEventListener("click", () => showView("mainView"));

  document.getElementById("coinGrid").addEventListener("click", (e) => {
    const btn = e.target.closest(".coin-btn");
    if (!btn) return;
    const coin = btn.dataset.coin;
    document.querySelectorAll(".coin-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("addressWrap").classList.add("hidden");
    document.querySelectorAll(".chain-btn").forEach(b => b.classList.remove("active"));
    if (coin === "USDT" || coin === "USDC") {
      document.getElementById("chainWrap").classList.remove("hidden");
    } else {
      document.getElementById("chainWrap").classList.add("hidden");
      showAddress(coin, null);
    }
  });

  document.getElementById("chainGrid").addEventListener("click", (e) => {
    const btn = e.target.closest(".chain-btn");
    if (!btn) return;
    document.querySelectorAll(".chain-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const coin = document.querySelector(".coin-btn.active").dataset.coin;
    showAddress(coin, btn.dataset.chain);
  });

  document.getElementById("copyAddressBtn").addEventListener("click", async () => {
    const addr = document.getElementById("addressBox").textContent;
    await navigator.clipboard.writeText(addr);
    const btn = document.getElementById("copyAddressBtn");
    btn.textContent = "✓";
    btn.classList.add("copied");
    setTimeout(() => {
      btn.textContent = "⎘";
      btn.classList.remove("copied");
    }, 1500);
  });
}

(async () => {
  accounts = await loadData();
  updateTimer();
  render();
  bindSearchEvents();
  bindListEvents();
  bindFormEvents();
  bindOverlayEvents();
  setInterval(() => { updateTimer(); render(); }, 1000);
})();
