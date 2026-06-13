async function saveData(data) {
  chrome.storage.local.set({ accounts: data });
}

async function loadData() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["accounts"], (res) => {
      resolve(res.accounts || []);
    });
  });
}
