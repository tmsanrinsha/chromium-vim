var Links = {};

Links.multiOpen = function(links) {
  links.forEach(function(item) {
    Utils.chrome.tabs.create({url: item, active: false});
  });
};
