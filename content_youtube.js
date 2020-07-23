var arrayYTB = [];
var timers = {};
const expireTime = 3600 * 1000; // one hour to expire botlist cache
const VKBcolor = '255,50,50';

// Start!
getList(function(items) {
  arrayYTB = items;
  findAndMark();
});

function markNode(node) {
  node.style.backgroundColor = "rgba(" + VKBcolor + ",.3)";
  node.style.borderLeft = "3px solid rgba(" + VKBcolor + ",.3)";
  node.style.paddingLeft = "3px"
}

function foundAuthor(node) {
  // href is like /channel/USER_ID
  userId = node.getAttribute("href").match('.+channel/(.+)')[1];
  foundId = arrayYTB.indexOf(userId);
  if (foundId > -1) {
    console.log("Bot userId found");
    markNode(node);
  }
}

function findAndMark() {
  targetNodes = document.querySelectorAll("a.ytd-comment-renderer#author-text")

  if (targetNodes && targetNodes.length > 0) {
    btargetsFound = true;
    targetNodes.forEach(function(node) {
      var examined = node.dataset.ytbExamined; // Set flag to the node for single check
      if(!examined) {
        node.dataset.ytbExamined = true;
        foundAuthor(node);
      }
    })
  } else {
    btargetsFound = false;
  }

  // Repeat the checking
  var key = "main";
  var timer = timers[key]
  if(btargetsFound && timer) {
    clearInterval(timer);
    delete timers[key];
  } else if(!timer) {
    timer = setInterval(function() {
      findAndMark();
    }, 300);
    timers[key] = timer;
  }

}

// Read botlist from local storage and request it if not stored
function getList(callback) {
  var now = new Date;
  chrome.storage.local.get(['updated', 'youtube_bots'], function(data) {
    if(data && data.bots && data.updated && data.updated > now.getTime() - expireTime) { // botlist is stored and fresh
      callback(data.bots)
    } else {
      console.log('Requesting list')
      fetchList(callback)
    }
  })
}

// Send request to api and pass parsed botlist to the callback
function fetchList(callback) {
  chrome.runtime.sendMessage({type: 'get_youtube_bot_list'}, function(text, err) {
    if(err) {
      console.log("Youtube bots list load error ", err)
    } else {
      var items = parseResponse(text)
      storeData(items)
      callback(items)
    }
  })
}

// Save botlist to local storage
function storeData(items) {
  var now = new Date;
  chrome.storage.local.set({youtube_bots: items, updated: now.getTime()})
}

// Parse response data from youtube bot list
function parseResponse(response) {
  return [...response.match(/UC[^=]+/g)]
}

// Check the bot id is in list and returns the index
function checkID(id) {
  var foundID = arrayYTB.indexOf(id);
  return foundID;
}