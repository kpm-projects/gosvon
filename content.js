// ==UserScript==
// @name         GosVon Marking for VK
// @namespace    vk-metabot-user-js
// @description  Подсветка служебных страниц вконтакте.
// @version      1.21
// @homepageURL  https://vk.com/club187686148
// @include      https://*vk.com/*
// @updateURL    https://api.gosvon.net/update/vk-metabot.meta.js
// @downloadURL  https://api.gosvon.net/update/vk-metabot.user.js
// @grant        GM_xmlhttpRequest
// @grant        GM.xmlHttpRequest
// @run-at       document-start
// ==/UserScript==

var arrayVKB = []; 
var timers = {};
const VKBcolor = '255,50,50';
const expireTime = 3600 * 1000; // one hour to expire botlist cache

// Start!
getList(function(items) {
  arrayVKB = items;
  findAndMark();  
});

// Save botlist to local storage
function storeData(items) {
  var now = new Date;
  chrome.storage.local.set({bots: items, updated: now.getTime()})
}

// Parse response data from api.gosvon.net
function parseResponse(response) {
  var items = response.match(/[^\r\n|]+/g);
  for (var i = 1; i < items.length; i++) {
    if (items[i] === '-') {
      items[i] = 'id' + items[i-1];
    }
  }
  return items;
}

// Read botlist from local storage and request it if not stored 
function getList(callback) {
  var now = new Date;
  chrome.storage.local.get(['updated', 'bots'], function(data) {
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
  chrome.runtime.sendMessage({type: 'get_bot_list'}, function(text, err) {
    if(err) {
      console.log("[GosVon Marking for VK] List load error ", err)
    } else {
      var items = parseResponse(text)
      storeData(items)
      callback(items)
    }
  })
}

// Check the bot id is in list and returns the index
function checkID(id) {
  var foundID = arrayVKB.indexOf(id);
  if (foundID == -1 && userID.substring(0,2) === 'id') {
    userID = userID.substr(2);
    foundID = arrayVKB.indexOf(userID);
  }
  return foundID;
}

function findAndMark() {
  waitForKeyElements('a.author', foundAuthor); // Comments and post on regular VK
  waitForKeyElements('a.ReplyItem__name', foundAuthorCM); // Comments on mobile VK
  waitForKeyElements('a.pi_author', foundAuthorPM);       // Posts on mobile VK
  waitForKeyElements('div.fans_fan_row', foundFan);       // Likes page
  waitForKeyElements('div.page_avatar', foundProfile); // Regular profile page
  waitForKeyElements('div.pp_cont', foundProfileM);    // Mobile profile page
}

function markNode(node) {
  node.style.backgroundColor = "rgba(" + VKBcolor + ",.3)";
  node.style.borderLeft = "3px solid rgba(" + VKBcolor + ",.3)";
  node.style.paddingLeft = "3px"
}

function appendLinks(node, userID) {
  var container = document.createElement('i')
  container.innerHTML = "<a target='_blank' href='https://gosvon.net/?usr=" + userID + "'>Комментарии</a> <a target='_blank' href='https://gosvon.net/photo.php?id=" + userID + "'>Карточка</a>";
  node.append(container)
}

// Comments and posts on a wall
function foundAuthor(jNode) {
  var userID = jNode.getAttribute('data-from-id');
  var foundID = arrayVKB.indexOf(userID);
  if (foundID > -1) {
    console.log("[GosVon Marking for VK] User found in VKB-db: " + userID);
    var pNode = jNode.parentElement;
    if (pNode.classList.contains('reply_author')) {
      console.log("[GosVon Marking for VK] This is a comment.");
      markNode(pNode.parentElement)
      appendLinks(pNode, userID)
    } else if (pNode.classList.contains('post_author')) {
      console.log("[GosVon Marking for VK] This is a post.");
      markNode(pNode.parentElement.parentElement)
      appendLinks(pNode, userID)
    }
  }
}

function foundAuthorCM(jNode) {
  var userID = jNode.getAttribute('href').substr(1);
  var foundID = arrayVKB.indexOf(userID);
  if (foundID > -1) {
    console.log("[GosVon Marking for VK] User found in VKB-db: " + userID);
    var pNode = jNode.parentElement;
    if (pNode.classList.contains('ReplyItem__header')) {
      console.log("[GosVon Marking for VK] This is a comment.");
      markNode(pNode.parentElement)
      appendLinks(pNode, userID)
    }
  }
}

function foundAuthorPM(jNode) {
  var userID = jNode.getAttribute('href').substr(1);
  if (userID.indexOf('?') >= 0) {
    userID = userID.split('?')[0];
  }
  var foundID = arrayVKB.indexOf(userID);
  if (foundID > -1) {
    console.log("[GosVon Marking for VK] User found in VKB-db: " + userID);
    var pNode = jNode.parentElement;
    if (pNode.classList.contains('wi_author')) {
      console.log("[GosVon Marking for VK] This is a post.");
      markNode(pNode.parentElement.parentElement)
      appendLinks(pNode, userID)
    }
  }
}

function foundFan(jNode) {
  var userID = jNode.getAttribute('data-id');
  var foundID = arrayVKB.indexOf(userID);
  if(foundID > -1) {
    console.log("[GosVon Marking for VK] User found in VKB-db: " + userID);
    console.log("[GosVon Marking for VK] This is a like.");
    markNode(jNode)
    appendLinks(jNode, userID)
  }
}

function appendInfo(node, userID, foundID) {
  var newelem = document.createElement('span');
  newelem.innerHTML = "Найдено в базе: #" + (foundID-1)/2 + " (" + arrayVKB[foundID] + ")<br/>";
  appendLinks(newelem, userID)
  node.after(newelem);
}

// Bot's personal page
function foundProfile(jNode) {
  var userID = window.location.pathname.substr(1);
  if (userID.indexOf('?') >= 0) {
    userID = userID.split('?')[0];
  }
  var foundID = checkID(userID)
  if (foundID > -1) {
    console.log("[GosVon Marking for] User found in VKB-db: " + userID);
    var pNode = jNode.parentElement.parentElement;
    if (pNode.classList.contains('page_avatar_wrap')) {
      console.log("[GosVon Marking for] This is a profile.");
      pNode.parentElement.style.background = "rgba(" + VKBcolor + ",.3)";
      var infoelem = document.getElementsByClassName("page_name")[0];
      appendInfo(infoelem, userID, foundID)
    }
  }
}

function foundProfileM(jNode) {
  var userID = window.location.pathname.substr(1);
  if (userID.indexOf('?') >= 0) {
    userID = userID.split('?')[0];
  }
  var foundID = checkID(userID)
  if (foundID > -1) {
    console.log("[GosVon Marking for VK] User found in VKB-db: " + userID);
    var pNode = jNode.parentElement;
    if (pNode.classList.contains('owner_panel')) {
      console.log("[GosVon Marking for VK] This is a profile.");
      jNode.parentElement.style.background = "rgba(" + VKBcolor + ",.3)";
      appendInfo(jNode, userID, foundID)
    }
  }
}

function waitForKeyElements(selectorTxt, actionFunction, bWaitOnce, iframeSelector) {
  var targetNodes, btargetsFound;
  if (typeof iframeSelector == "undefined") {
    targetNodes = document.querySelectorAll(selectorTxt);
  } else { // WTF? This code never used.
    var frame = document.querySelector(iframeSelector);
    if(frame) {
      targetNodes = frame.contentWindow.document.querySelectorAll(selectorTxt);  
    }
  }  
  if (targetNodes && targetNodes.length > 0) {
    btargetsFound = true;
    targetNodes.forEach(function(node) {
      var examined = node.dataset.vkbExamined; // Set flag to the node for single check 
      if(!examined) {
        node.dataset.vkbExamined = true;
        actionFunction(node)
      }
    })
  } else {
    btargetsFound = false;
  }

  // Repeat the checking
  var key = selectorTxt.replace(/[^\w]/g, "_");
  var timer = timers[key]
  if(btargetsFound && bWaitOnce && timer) {
    clearInterval(timer);
    delete timers[key];    
  } else if(!timer) {
    timer = setInterval(function() {
      waitForKeyElements(selectorTxt, actionFunction, bWaitOnce, iframeSelector);
    }, 300);
    timers[key] = timer;
  }
}