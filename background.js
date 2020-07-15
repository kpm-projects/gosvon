chrome.runtime.onMessage.addListener(function(message, sender, callback) {
  if (message.type != 'get_bot_list') {
    return;
  }
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    var activeTab = tabs[0];

    function process_response(response) {
      if (response.ok) {
        response.text().then(text => chrome.tabs.sendMessage(activeTab.id, {"type": "bot_list", "message": text}));
      } else {
        chrome.tabs.sendMessage(activeTab.id, {"type": "bot_list", "message": "", "error": response.status});
      }
    }

    fetch('https://api.gosvon.net/marking2').then(response => process_response(response));
  })
})
