
const apiUrl = 'https://api.gosvon.net/marking2';

chrome.runtime.onMessage.addListener(function(message, sender, callback) {
  if (message.type != 'get_bot_list') {
    return;
  }
  fetch(apiUrl).then(function(response) {
    if(response.ok) {
      return response.text()
    } else {
      return Promise.reject(response.status)
    }
  }).then(function(text) {
    callback(text)
  }).catch(function(err) {
    callback(null, err)
  })
  return true; // need for async callback
})