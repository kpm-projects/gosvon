chrome.browserAction.onClicked.addListener(function(tab) {
  // Отправить сообщение на активную вкладку
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    var activeTab = tabs[0];

    fetch('https://api.gosvon.net/marking2')
      .then(response => response.text())
      .then(text => chrome.tabs.sendMessage(activeTab.id, {"type": "bot_list", "message": text}));
  });
});

/*
chrome.runtime.onMessage.addListener(function(message, sender, callback) {
    if (message && message.type == 'get_bot_list') {
        fetch('https://api.gosvon.net/marking2')
            .then(response => response.text())
            .then(text => chrome.tabs.sendMessage(activeTab.id, {"type": "bot_list_received", "message": text}));
    }
});
*/