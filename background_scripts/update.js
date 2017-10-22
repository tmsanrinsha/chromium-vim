var Updates = {
  displayMessage: false,
  installMessage: 'Welcome to cVim! Here\'s everything you need to know.',
  tabId: null
};

browser.runtime.onInstalled.addListener(function(details) {
  var currentVersion   = browser.runtime.getManifest().version;
  var previousVersion  = details.previousVersion;
  if (details.reason === 'install') {
    browser.tabs.create({
      url: browser.runtime.getURL('pages/mappings.html'),
      active: true
    }, function(tabInfo) {
      Updates.tabId = tabInfo.id;
      Updates.displayMessage = true;
    });
  } else if (details.reason === 'update') {
    if (previousVersion !== currentVersion) {
      Options.refreshSettings(function() {
        if (settings.changelog) {
          browser.tabs.create({
            url: browser.runtime.getURL('pages/changelog.html'),
            active: true
          });
        }
      });
    }
    var manifest = browser.runtime.getManifest();
    var contentScripts = manifest.content_scripts[0];
    var checkError = function() { if (browser.runtime.lastError) return false; };
    return browser.tabs.query({status: 'complete'}, function(tabs) {
      tabs.forEach(function(tab) {
        contentScripts.js.forEach(function(file) {
          browser.tabs.executeScript(tab.id, {
            file: file,
            allFrames: contentScripts.all_fames
          }, checkError);
        });
        contentScripts.css.forEach(function(file) {
          browser.tabs.insertCSS(tab.id, {
            file: file,
            allFrames: contentScripts.all_fames
          }, checkError);
        });
      });
    });
  }
});
