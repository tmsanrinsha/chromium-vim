var Updates = {
  displayMessage: false,
  installMessage: 'Welcome to cVim! Here\'s everything you need to know.',
  tabId: null
};

Utils.chrome.runtime.onInstalled.addListener(function(details) {
  var currentVersion   = Utils.chrome.runtime.getManifest().version;
  var previousVersion  = details.previousVersion;
  if (details.reason === 'install') {
    Utils.chrome.tabs.create({
      url: Utils.chrome.runtime.getURL('pages/mappings.html'),
      active: true
    }, function(tabInfo) {
      Updates.tabId = tabInfo.id;
      Updates.displayMessage = true;
    });
  } else if (details.reason === 'update') {
    if (previousVersion !== currentVersion) {
      Options.refreshSettings(function() {
        if (settings.changelog) {
          Utils.chrome.tabs.create({
            url: Utils.chrome.runtime.getURL('pages/changelog.html'),
            active: true
          });
        }
      });
    }
    var manifest = Utils.chrome.runtime.getManifest();
    var contentScripts = manifest.content_scripts[0];
    var checkError = function() { if (Utils.chrome.runtime.lastError) return false; };
    return Utils.chrome.tabs.query({status: 'complete'}, function(tabs) {
      tabs.forEach(function(tab) {
        contentScripts.js.forEach(function(file) {
          Utils.chrome.tabs.executeScript(tab.id, {
            file: file,
            allFrames: contentScripts.all_fames
          }, checkError);
        });
        contentScripts.css.forEach(function(file) {
          Utils.chrome.tabs.insertCSS(tab.id, {
            file: file,
            allFrames: contentScripts.all_fames
          }, checkError);
        });
      });
    });
  }
});
