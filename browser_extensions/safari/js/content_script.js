var is_spacing = false; // 是不是正在插入空格？
var already_bind = false; // 是不是已經對 document 綁定過 event？
// var last_spacing_time = 0; // 避免短時間內一直在執行 go_spacing()
var node_hash = {}; // 避免同一個 DOM node 一直觸發 DOMSubtreeModified

function go_page_spacing() {
    // console.log('go_page_spacing()');

    is_spacing = true;
    var had_spacing = pangu.page_spacing();
    is_spacing = false;

    // last_spacing_time = new Date().getTime();
    return had_spacing;
}

function go_node_spacing(node) {
    // console.log('go_node_spacing()');
    // console.log('node: %O', node);
    // console.log('node.textContent: %O', node.textContent);
    // console.log('node.data: %O', node.data);
    // console.log('node.innerHTML: %O', node.innerHTML);

    if (!node.textContent) {
        return false;
    }

    is_spacing = true;
    var had_spacing = pangu.node_spacing(node);
    is_spacing = false;

    // last_spacing_time = new Date().getTime();
    return had_spacing;
}

function ask_can_spacing() {
    var had_spacing = go_page_spacing();
    /*
     這一段是為了對付那些透過 JS 動態修改或 AJAX 加載的內容
     當頁面 DOM 有變動時
     就再執行一次 spacing
     */
    if (!already_bind) {
        document.body.addEventListener('DOMSubtreeModified', function(e) {
            if (!is_spacing) {
                pangu.page_title_spacing();

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
                    console.log("log");
                }, 100);
            }
        }, false);

        already_bind = true;
    }
}

ask_can_spacing();
