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

// var listqueue = 0;
var arrayVKB = [];
var timers = {};
const VKBcolor = '255,50,50';
const expireTime = 3600 * 1000; // one hour
const apiUrl = 'https://api.gosvon.net/marking2';

getList(function(items) {
  arrayVKB = items;
  findAndMark();  
});

// listqueue++;
// waitforlists();

// chrome.runtime.onMessage.addListener(
//   function(request, sender, sendResponse) {
//     if(request.type == 'bot_list') {
//       if(request.error) {
//         console.log("[GosVon Marking for VK] List load error " + request.error);
//       } else {
//         arrayVKB = parseResponse(request.message)
//         storeData(arrayVKB)
//       }
//       // filllist(request.message, request.error);
//     }
//   }
// );

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
    if(data && data.bots && data.updated && data.updated > now.getTime() + expireTime) { // botlist is stored and fresh
      callback(data.bots)
    } else {
      console.log('Requesting list')
      fetchList(callback)
      // chrome.runtime.sendMessage({"type": "get_bot_list"})
    }
  })
}

// Send request to api and pass parsed botlist to the callback
function fetchList(callback) {
  fetch(apiUrl).then(function(response) {
    if(response.ok) {
      return response.text()
    } else {
      return Promise.reject(response.status)
    }
  })
  .then(function(text) {
    var items = parseResponse(text)
    storeData(items)
    callback(items)
  })
  .catch(function(err) {
    console.log("[GosVon Marking for VK] List load error ", err)
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

// function filllist(response, error) {
//   if (error) {
//     console.log("[GosVon Marking for VK] List load error " + error);
//   } else {
//     arrayVKB = response.match(/[^\r\n|]+/g);
//     for (var i = 1; i < arrayVKB.length; i++) {
//       if (arrayVKB[i] === '-') {
//         arrayVKB[i] = 'id' + arrayVKB[i-1];
//       }
//     }
//     var dbname = "VKB-db";
//   }

//   listqueue--;
// }

function findAndMark() {
  waitForKeyElements('a.author', foundAuthor);
  waitForKeyElements('a.ReplyItem__name', foundAuthorCM);
  waitForKeyElements('a.pi_author', foundAuthorPM);
  waitForKeyElements('div.fans_fan_row', foundFan);
  waitForKeyElements('div.page_avatar', foundProfile);
  waitForKeyElements('div.pp_cont', foundProfileM);
}

// function waitforlists() {
//   if (listqueue === 0) {
//     waitForKeyElements('a.author', foundAuthor);
//     waitForKeyElements('a.ReplyItem__name', foundAuthorCM);
//     waitForKeyElements('a.pi_author', foundAuthorPM);
//     waitForKeyElements('div.fans_fan_row', foundFan);
//     waitForKeyElements('div.page_avatar', foundProfile);
//     waitForKeyElements('div.pp_cont', foundProfileM);
//   } else {
//     setTimeout(waitforlists, 500);
//   }
// }

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
      
      // $(pNode).parent().css({
      //     "background": "rgba(" + VKBcolor + ",.3)",
      //     "border-left": "3px solid rgba(" + VKBcolor + ",.3)",
      //     "padding-left": "3px"
      // });

      // $(pNode).append("<i><a target='_blank' href='https://gosvon.net/?usr=" + userID + "'>Комментарии</a> <a target='_blank' href='https://gosvon.net/photo.php?id=" + userID + "'>Карточка</a></i>");

    } else if (pNode.classList.contains('post_author')) {
      console.log("[GosVon Marking for VK] This is a post.");
      markNode(pNode.parentElement.parentElement)
      appendLinks(pNode, userID)

      // $(pNode).parent().parent().css({
      //     "background": "rgba(" + VKBcolor + ",.3)",
      //     "border-left": "3px solid rgba(" + VKBcolor + ",.3)",
      //     "padding-left": "3px"
      // });

      // $(pNode).append(" <i><a target='_blank' href='https://gosvon.net/?usr=" + userID + "'>Комментарии</a> <a target='_blank' href='https://gosvon.net/photo.php?id=" + userID + "'>Карточка</a></i>");
    }
  }
}

function foundAuthorCM(jNode) {
  var userID = jNode.attr('href').substr(1);
  var foundID = arrayVKB.indexOf(userID);
  if (foundID > -1) {
    console.log("[GosVon Marking for VK] User found in VKB-db: " + userID);
    var pNode = $(jNode).parent();
    if (pNode[0].classList.contains('ReplyItem__header')) {
      console.log("[GosVon Marking for VK] This is a comment.");
      markNode(pNode.parentElement)
      appendLinks(pNode, userID)
      
      // $(pNode).parent().css({
      //     "background": "rgba(" + VKBcolor + ",.3)",
      //     "border-left": "3px solid rgba(" + VKBcolor + ",.3)",
      //     "padding-left": "3px"
      // });
      //   $(pNode).append(" <i><a target='_blank' href='https://gosvon.net/?usr=" + userID + "'>Комментарии</a> <a target='_blank' href='https://gosvon.net/photo.php?id=" + userID + "'>Карточка</a></i>");
    }
  }
}

function foundAuthorPM(jNode) {
  var userID = jNode.attr('href').substr(1);
  if (userID.indexOf('?') >= 0) {
    userID = userID.split('?')[0];
  }
  var foundID = arrayVKB.indexOf(userID);
  if (foundID > -1) {
    console.log("[GosVon Marking for VK] User found in VKB-db: " + userID);
    var pNode = $(jNode).parent();
        //console.log('123');
    if (pNode[0].classList.contains('wi_author')) {
        //console.log('1234');
      console.log("[GosVon Marking for VK] This is a post.");
      $(pNode).parent().parent().css({
          "background": "rgba(" + VKBcolor + ",.3)",
          "border-left": "3px solid rgba(" + VKBcolor + ",.3)",
          "padding-left": "3px"
      });
        $(pNode).append(" <i><a target='_blank' href='https://gosvon.net/?usr=" + userID + "'>Комментарии</a> <a target='_blank' href='https://gosvon.net/photo.php?id=" + userID + "'>Карточка</a></i>");
    }
  }
}

function foundFan(jNode) {
  var userID = jNode.attr('data-id');
  var foundID = arrayVKB.indexOf(userID);
  if (foundID > -1) {
    console.log("[GosVon Marking for VK] User found in VKB-db: " + userID);
    console.log("[GosVon Marking for VK] This is a like.");
    $(jNode).css({
        "background": "rgba(" + VKBcolor + ",.3)",
        "border-left": "3px solid rgba(" + VKBcolor + ",.3)",
        "padding-left": "3px"
    });
      $(jNode).append(" <center><i><a target='_blank' href='https://gosvon.net/?usr=" + userID + "'>Комментарии</a> <a target='_blank' href='https://gosvon.net/photo.php?id=" + userID + "'>Карточка</a></i>");
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

    // console.log("[GosVon Marking for] User found in VKB-db: " + userID);
    // var pNode = $(jNode).parent().parent();
    // if (pNode[0].classList.contains('page_avatar_wrap')) {
    //   console.log("[GosVon Marking for] This is a profile.");
    //   $(pNode).parent().css({
    //       "background": "rgba(" + VKBcolor + ",.3)"
    //   });
    //   var infoelem = document.getElementsByClassName("page_name")[0];
    //   console.log(infoelem);
    //   var newelem = document.createElement('span');
    //    newelem.innerHTML = "Найдено в базе: #" + (foundID-1)/2 + " (" + arrayVKB[foundID] + ")<br/><i><a target='_blank' href='https://gosvon.net/?usr=" + userID + "'>Комментарии</a> <a target='_blank' href='https://gosvon.net/photo.php?id=" + userID + "'>Карточка</a></i>";
    //   infoelem.after(newelem);
    // }
  }
}

function foundProfileM(jNode) {
  var userID = window.location.pathname.substr(1);
  if (userID.indexOf('?') >= 0) {
    userID = userID.split('?')[0];
  }
  var foundID = arrayVKB.indexOf(userID);
  if (foundID == -1 && userID.substring(0,2) === 'id') {
    userID = userID.substr(2);
    foundID = arrayVKB.indexOf(userID);
  }
  if (foundID > -1) {
    console.log("[GosVon Marking for VK] User found in VKB-db: " + userID);
    var pNode = $(jNode).parent();
    if (pNode[0].classList.contains('owner_panel')) {
      console.log("[GosVon Marking for VK] This is a profile.");
      $(jNode).css({
          "background": "rgba(" + VKBcolor + ",.3)",
      });
        $(jNode).append("Найдено в базе: #" + ((foundID-1)/2+1) + " (" + arrayVKB[foundID] + ")<br>");
        $(jNode).append("<i><a target='_blank' href='https://gosvon.net/?usr=" + userID + "'>Комментарии</a> <a target='_blank' href='https://gosvon.net/photo.php?id=" + userID + "'>Карточка</a></i>");
    }
  }
}

function waitForKeyElements(selectorTxt, actionFunction, bWaitOnce, iframeSelector) {
  var targetNodes, btargetsFound;
  if (typeof iframeSelector == "undefined") {
    targetNodes = document.querySelectorAll(selectorTxt);
  }
  //  else {
  //   var frame = document.querySelector(iframeSelector);
  //   if(frame) {
  //     targetNodes = frame.contentWindow.document.querySelectorAll(selectorTxt);  
  //   }
  // }  
  if (targetNodes && targetNodes.length > 0) {
    btargetsFound = true;
    targetNodes.forEach(function(node) {
      var examined = node.dataset.vkbExamined;
      if(!examined) {
        node.dataset.vkbExamined = true;
        actionFunction(node)
      }
    })
    // targetNodes.each(function() {
    //   var jThis = $(this);
    //   var alreadyFound = jThis.data('alreadyFound') || false;
    //   if (!alreadyFound) {
    //     var cancelFound = actionFunction(jThis);
    //     if (cancelFound) btargetsFound = false;
    //     else jThis.data('alreadyFound', true);
    //   }
    // });
  } else {
    btargetsFound = false;
  }

  var key = selectorTxt.replace(/[^\w]/g, "_");
  var timer = timers[key]
  if(bWaitOnce && timeControl) {
    clearInterval(timer);
    delete timers[key];    
  } else if(btargetsFound && !timer) {
    timer = setInterval(function() {
      waitForKeyElements(selectorTxt, actionFunction, bWaitOnce, iframeSelector);
    }, 300);
    timers[key] = timer;
  }

  // var controlObj = waitForKeyElements.controlObj || {};
  // var controlKey = selectorTxt.replace(/[^\w]/g, "_");
  // var timeControl = controlObj[controlKey];
  // if (btargetsFound && bWaitOnce && timeControl) {
  //   clearInterval(timeControl);
  //   delete controlObj[controlKey];
  // } else {
  //   if (!timeControl) {
  //     timeControl = setInterval(function() {
  //       waitForKeyElements(selectorTxt, actionFunction, bWaitOnce, iframeSelector);
  //     }, 300);
  //     controlObj[controlKey] = timeControl;
  //   }
  // }
  // waitForKeyElements.controlObj = controlObj;
}