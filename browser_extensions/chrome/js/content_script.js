function debounce(fn, delay, mustRunDelay) {
  var timer = null;
  var startTime = null;
  return function() {
    var self = this;
    var args = arguments;
    var currentTime = + new Date();

    clearTimeout(timer);

    if (!startTime) {
      startTime = currentTime;
    }

    if (currentTime - startTime >= mustRunDelay) {
      fn.apply(self, args);
      startTime = currentTime;
    } else {
      timer = setTimeout(function() {
        fn.apply(self, args);
      }, delay);
    }
  };
}

chrome.runtime.sendMessage({purpose: 'can_spacing'}, function(response) {
  if (!response.result) {
    return;
  }

  if (!(document.body instanceof Node)) {
    return
  }

  var queue = [];

  setTimeout(() => {
    pangu.spacingPage();
  }, 1000);

  // it's possible that multiple workers process the queue at the same time
  debouncedSpacingNodes = debounce(() => {
    // a single node could be very big which contains a lot of child nodes
    while (queue.length) {
      var node = queue.shift();
      if (node) {
        if (node.nodeType == Node.TEXT_NODE) {
          // console.dir(node);
          // node.data = pangu.spacingTextSync(node.data);
          // pangu.spacingNode(node);
        } else {
          pangu.spacingNode(node);
        }
        // TODO: there could be node.textContent or node.data
        // pangu.spacingNode(node);
      }

    }
  }, 500, {'maxWait': 2000});

  var observer = new MutationObserver(function(mutations, observer) {
    // Element: https://developer.mozilla.org/en-US/docs/Web/API/Element
    // Text: https://developer.mozilla.org/en-US/docs/Web/API/Text
    mutations.forEach(function(mutation) {
      // console.dir(mutation);

      switch (mutation.type) {
        case 'childList':
          mutation.addedNodes.forEach(function(node) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              queue.push(node);
            } else if (node.nodeType === Node.TEXT_NODE) {
              queue.push(node.parentNode);
            }
          });
          break;
        case 'characterData':
          const node = mutation.target;
          if (node.nodeType === Node.TEXT_NODE) {
            // queue.push(node.parentNode);
            queue.push(node);
          }
          break;
      }
    });

    debouncedSpacingNodes();
  });
  observer.observe(document.body, {
    characterData: true,
    childList: true,
    subtree: true
  });
});
