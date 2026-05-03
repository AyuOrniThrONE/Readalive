chrome.runtime.onInstalled.addListener(() => {
  console.log("ReadAlive Extension Installed");
});
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "GET_TAB_ID") {
    sendResponse(sender.tab.id);
  } else if (msg.type === "GET_STATE") {
    const key = `readalive_${sender.tab.id}`;
    chrome.storage.session.get(key).then(result => {
      sendResponse(result[key] === true);
    });
    return true; // Indicate async response
  }
});
