var is_spacing = false; // 是不是正在插入空格？
var already_bind = false; // 是不是已經對 document 綁定過 event？
// var last_spacing_time = 0; // 避免短時間內一直在執行 go_spacing()
var node_hash = {}; // 避免同一個 DOM node 一直觸發 DOMSubtreeModified

function go_page_spacing() {
  is_spacing = true;
  var had_spacing = pangu.spacingPage();
  is_spacing = false;

  // last_spacing_time = new Date().getTime();

  return had_spacing;
}

function go_node_spacing(node) {
  if (!node.textContent) {
    return false;
  }

  is_spacing = true;
  var had_spacing = pangu.spacingNode(node);
  is_spacing = false;

  // last_spacing_time = new Date().getTime();

  return had_spacing;
}

var SAY_HELLOS = [
  '空格之神顯靈了！',
  '空格之神準備好了！',
  '空格之神這不是來了嗎！',
  '空格之神給您拜個晚年',
  '空格之神 到此一遊',
  '空格之神 在此！',
  '空格之神 參見！',
  '空格之神 參上！',
  '空格之神 參戰！',
  '空格之神 登場！',
  '空格之神 來也！',
  '空格之神 來囉！',
  '空格之神 駕到！',
  '空格之神 報到！',
  '空格之神 合流！',
  '空格之神 久違了',
  '空格之神 作用中',
  '空格之神 接近中',
  '空格之神 小別勝新婚',
  '空格之神 姍姍來遲',
  '空格之神 完美落地',
  '空格之神 粉墨登場！',
  '空格之神 颯爽登場！',
  '空格之神 強勢登場！',
  '空格之神 強勢回歸！',
  '空格之神 在此聽候差遣',
  '空格之神 射出！',
  '空格之神：寶傑好，大家好，各位觀眾朋友晚安',
  '空格之神：歐啦歐啦歐啦歐啦歐啦',
  '空格之神：你知不知道什麼是噹噹噹噹噹噹噹？',
  '空格之神：悄悄的我走了，正如我悄悄的來',
  '有請...... 空格之神！',
  '遭遇！野生的空格之神！',
  '就決定是你了！空格之神！',
  '正直、善良和空格都回來了'
];

function ask_can_notify(just_notify) {
  if (typeof alertify !== 'undefined') {
    alertify.custom = alertify.extend('custom');

    var msg = SAY_HELLOS[Math.floor(Math.random() * SAY_HELLOS.length)];

    // just_notify 是給 browser action 用的，強制顯示「空格之神顯靈了」
    if (just_notify) {
      alertify.custom(msg, 1500, true);
    }
    else {
      chrome.runtime.sendMessage({purpose: 'can_notify'},
        function(response) {
          if (response.result) {
            alertify.custom(msg, 1500, true);
          }
        }
      );
    }
  }
}

function ask_can_spacing() {
  chrome.runtime.sendMessage({purpose: 'can_spacing'},
    function(response) {
      if (response.result) {
        var had_spacing = go_page_spacing();

        // 真的有插入空格才提示「空格之神顯靈了」
        if (had_spacing) {
          ask_can_notify(false);
        }

        /*
         這一段是為了對付那些透過 JS 動態修改或 AJAX 加載的內容
         當頁面 DOM 有變動時
         就再執行一次 spacing
         */
        if (!already_bind) {
          // var spacing_timer;
          // document.body.addEventListener('DOMNodeInserted', function() {
          //   if (!is_spacing) {
          //     var interval = new Date().getTime() - last_spacing_time;
          //     if (interval >= 100) {
          //       clearTimeout(spacing_timer);
          //       spacing_timer = setTimeout(function() {
          //         go_page_spacing();
          //       }, 500);
          //     }
          //   }
          // }, false);

          // document.body.addEventListener('DOMSubtreeModified', function(e) {
          //   if (!is_spacing) {
          //     var node = e.target;
          //     pangu.spacingPageTitle();
          //     go_node_spacing(node);
          //   }
          // }, false);

          document.body.addEventListener('DOMSubtreeModified', function(e) {
            if (!is_spacing) {
              pangu.spacingPageTitle();

              // 一開始拿到的 e.target 似乎不會是最終的 node，所以設個 timer
              setTimeout(function() {
                var node = e.target;
                var id = node.id;

                if (id) {
                  var spacing_timer = node_hash[id];
                  clearTimeout(spacing_timer);
                  node_hash[id] = setTimeout(function() {
                    go_node_spacing(node);
                  }, 10);
                }
                else {
                  go_node_spacing(node);
                }
              }, 100);
            }
          }, false);

          already_bind = true;
        }
      }
    }
  );
}

ask_can_spacing();
