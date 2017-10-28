var Popup = {
  active: true
};

Popup.getBlacklisted = function(callback) {
  if (typeof callback === 'object')
    callback = callback.callback;
  var blacklists = Utils.compressArray(settings.blacklists);
  this.getActiveTab(function(tab) {
    var url = tab.url;
    for (var i = 0, l = blacklists.length; i < l; ++i) {
      if (matchLocation(url, blacklists[i])) {
        callback(true);
      }
    }
  });
};

Popup.getActiveTab = function(callback) {
  Utils.chrome.tabs.query({active: true, currentWindow: true}, function(tab) {
    callback(tab[0]);
  });
};

Popup.setIconDisabled = function() {
  this.getActiveTab(function(tab) {
    chrome.browserAction.setIcon({
      path: 'icons/disabled.png',
      tabId: tab.id
    }, function() {
      return Utils.chrome.runtime.lastError;
    });
  });
};

Popup.setIconEnabled = function(obj) {
  if (obj.sender) {
    return chrome.browserAction.setIcon({
      path: 'icons/38.png',
      tabId: obj.sender.tab.id
    }, function() {
      return Utils.chrome.runtime.lastError;
    });
  }
  this.getActiveTab(function(tab) {
    chrome.browserAction.setIcon({
      path: 'icons/38.png',
      tabId: tab.id
    }, function() {
      return Utils.chrome.runtime.lastError;
    });
  });
};

Popup.getActiveState = function(obj) {
  obj.callback(this.active);
};

Popup.toggleEnabled = function(obj) {
  var request = obj.request;
  if (request && request.singleTab) {
    this.getActiveTab(function(tab) {
      Utils.chrome.tabs.sendMessage(tab.id, {action: 'toggleEnabled'});
    });
    if (request.blacklisted) {
      return this.setIconDisabled({});
    }
    return this.setIconEnabled({});
  }
  Utils.chrome.tabs.query({}, function(tabs) {
    this.active = !this.active;
    if (!request || (request && !request.blacklisted)) {
      tabs.map(function(tab) { return tab.id; }).forEach(function(id) {
        Utils.chrome.tabs.sendMessage(id, {action: 'toggleEnabled'});
        if (this.active) {
          chrome.browserAction.setIcon({path: 'icons/38.png', tabId: id});
        } else {
          chrome.browserAction.setIcon({path: 'icons/disabled.png', tabId: id});
        }
      }.bind(this));
    }
  }.bind(this));
};

Popup.toggleBlacklisted = function() {
  var blacklists = Utils.compressArray(settings.blacklists);
  this.getActiveTab(function(tab) {
    var url = tab.url;
    var foundMatch = false;
    for (var i = 0, l = blacklists.length; i < l; ++i) {
      if (matchLocation(url, blacklists[i])) {
        blacklists.splice(i, 1);
        foundMatch = true;
      }
    }
    if (!foundMatch) {
      url = new URL(url);
      blacklists.push(url.protocol + '//' + url.hostname + '/*');
    }
    settings.blacklists = blacklists;
    Options.saveSettings({settings: settings});
    Options.updateBlacklistsMappings();
  });
};

Utils.chrome.runtime.onConnect.addListener(function(port) {
  if (port.name === 'popup') {
    port.onMessage.addListener(function(request) {
      if (Popup.hasOwnProperty(request.action)) {
        Popup[request.action]({
          callback: function(response) {
            port.postMessage(response);
          },
          request: request,
          sender: request.sender
        });
      }
    });
  }
});

Utils.chrome.runtime.onMessage.addListener(function(request, sender, callback) {
  if (Popup.hasOwnProperty(request.action)) {
    if (!sender.tab)
      return;
    Popup[request.action]({
      callback: function(response) {
        callback(response);
      },
      request: request,
      sender: sender
    });
  }
});
