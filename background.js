chrome.runtime.onInstalled.addListener(() => {
  console.log("ReadAlive Extension Installed");
});
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "GET_TAB_ID") {
    sendResponse(sender.tab.id);
  }
});
