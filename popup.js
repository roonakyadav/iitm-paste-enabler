const toggle = document.getElementById("toggle");
const status = document.getElementById("status");

async function getEnabled() {
  const { enabled = true } = await chrome.storage.local.get("enabled");
  return enabled;
}

async function render() {
  const enabled = await getEnabled();
  toggle.textContent = enabled ? "Disable" : "Enable";
  status.textContent = enabled
    ? "Paste is enabled on IITM."
    : "Paste is disabled.";
}

toggle.addEventListener("click", async () => {
  const enabled = await getEnabled();
  await chrome.storage.local.set({ enabled: !enabled });

  // Keep the page-side flag in sync for already-open IITM tabs.
  const tabs = await chrome.tabs.query({ url: "https://seek.study.iitm.ac.in/*" });
  for (const tab of tabs) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (value) => localStorage.setItem("__iitm_paste_enabled", String(value)),
        args: [!enabled]
      });
    } catch {}
  }

  await render();
});

render();