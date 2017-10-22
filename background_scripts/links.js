var Links = {};

Links.multiOpen = function(links) {
  links.forEach(function(item) {
    browser.tabs.create({url: item, active: false});
  });
};
