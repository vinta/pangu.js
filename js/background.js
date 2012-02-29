console.log('background.js');

/*
 background.js 由 background.html 引入
 在整個 extension 的生命週期中都存在
 主要是作為跟 extension 中的其他 js 相互通訊的中繼站
 */

function default_setuip() {
    if (!localStorage.spacing_mode) {
        localStorage.spacing_mode = 'when_load';
    }
    
    var blacklist = [
        'https://picasaweb.google.com/'
    ];
    
    var whitelist = [
    ];
    
    localStorage.blacklist = JSON.stringify(blacklist);
    localStorage.whitelist = JSON.stringify(whitelist);
}

function set_badge(text) {
    // 注意檔案路徑！
    // browserAction 的 icon 不能顯示動態的 gif
    // chrome.browserAction.setIcon({path: '/images/ajax_loader.gif'});
    
    chrome.browserAction.setBadgeText({text: text});
}

default_setuip();

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.status == 'complete' && tab.url.search(/^chrome/i) == -1) {
        if (true) {
            chrome.tabs.executeScript(tab.id, {file: 'thirdparty/jquery-1.7.1.min.js', allFrames: true});
            chrome.tabs.executeScript(tab.id, {file: 'js/spacing.js'});
            
            // 實際執行 spacing 是在這一行
            // 直接寫在這裡會發生 Uncaught ReferenceError: traversal_and_spacing is not defined
            // chrome.tabs.executeScript(tab.id, {code: 'traversal_and_spacing();'});
        }
    }
});

chrome.browserAction.onClicked.addListener(function(tab) {
/*     alert('onClicked'); */
    
    /*
     在 background.html 引入 jquery 是沒有作用的
     因為 background page 的執行環境跟 tabs 不一樣
     */
    // chrome.tabs.executeScript(tab.id, {file: 'thirdparty/jquery-1.7.1.min.js'});
    // chrome.tabs.executeScript(tab.id, {file: 'js/spacing.js'});
    
    chrome.tabs.executeScript(tab.id, {code: 'traversal_and_spacing();'});
});
