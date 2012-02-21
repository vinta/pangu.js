function replaceEntry() {
	var temp;
    var target_tags = ['div', 'p', 'li', 'td', 'span', 'a'];
    var body_tag = $('body');
    
    for (var i = 0; i < target_tags.length; i++) {
        var target_tag = target_tags[i];
        
        $(target_tag, body_tag).each(function() {
            var has_children = false;
            
            // for (var j = 0; j < target_tags.length; j++) {
                // if ($(this).find(target_tags[i]).length > 0) {
                    // has_children = true;
                    // break;
                // }
            // }
            
            if ($(this).find('script').length == 0) {
                console.log('\n');
                console.log(target_tag + ' begin');

                temp = $(this).html();
                
                // 在 content script 中不能插入 <script>，如果 Chrome 偵測到 js code，它會把整段字串變成 null
                if (temp.search(/<\/?script>/i) == -1) {
                    console.log(temp);
                    
                    // 英文、數字、符號 ([a-z0-9~!@#&;=_\$\%\^\*\-\+\,\.\/(\\)\?\:\'\"\[\]\(\)])
                    
                    // 中文在前
                    temp = temp.replace(/([\u4E00-\u9FA5])([a-z0-9@#&;=_\$\%\^\*\-\+\(\/])/ig, '$1 $2');
                    
                    // 中文在後
                    temp = temp.replace(/([a-z0-9@#!~&;=_\,\.\:\?\$\%\^\*\-\+\(\)\/])([\u4E00-\u9FA5])/ig, '$1 $2');

                    temp = temp.replace(/ <\/a>/g, '</a>');

                    $(this).html(temp);

                    console.log(target_tag + ' end');
                    console.log('\n');
                }
            }
        });
    }
}

function insert_space(text) {
    // 英文、數字、符號 ([a-z0-9~!@#&;=_\$\%\^\*\-\+\,\.\/(\\)\?\:\'\"\[\]\(\)])
    
    console.log('raw_text: ' + text);
    
    // 中文在前
    text = text.replace(/([\u4E00-\u9FA5])([a-z0-9@#&;=_\$\%\^\*\-\+\(\/])/ig, '$1 $2');

    // 中文在後
    text = text.replace(/([a-z0-9@#!~&;=_\,\.\:\?\$\%\^\*\-\+\(\)\/])([\u4E00-\u9FA5])/ig, '$1 $2');

    text = text.replace(/ <\/a>/g, '</a>');
    
    return text;
}

replaceEntry();

function test_run() {
    var target_tags = ['div', 'p', 'li', 'span', 'a'];
    var body_tag = $('body');
    
    // for (var i = 0; i < target_tags.length; i++) {
        // var target_tag = target_tags[i];
        
        // $(target_tag, body_tag).each(function() {
            // var has_children = false;
            
            // for (var j = 0; j < target_tags.length; j++) {
                // if ($(this).find('').length > 0) {
                    // has_children = true;
                    // break;
                // }
            // }
            
            // if (!has_children) {

            // }
        // });
    // }
    
    // var output_string = $('body').find('script').length;
    // console.log(output_string);
    
    // $('body').find('script').each(function() {
        // console.log($(this));
    // });
    
    $('body').find('div').each(function() {
        console.log($(this));
    });
}

test_run();
