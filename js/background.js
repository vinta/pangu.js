function setBadge(text) {
    // 注意檔案路徑！browserAction 的 icon 不能顯示動態的 gif
    // chrome.browserAction.setIcon({path: "/images/ajax_loader.gif"});
    
    chrome.browserAction.setBadgeText({text: text});
}

chrome.browserAction.onClicked.addListener(function(tab) {
    // 在 background.html 引入 jquery 是沒有作用的
    chrome.tabs.executeScript(tab.id, {file: 'js/libs/jquery-1.7.1.min.js'});
    chrome.tabs.executeScript(tab.id, {file: 'js/auto_spacing.js'});
    
});