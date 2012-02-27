console.log('auto_spacing.js run');

function insert_space(text) {
    // 英文、數字、符號 ([a-z0-9~!@#&;=_\$\%\^\*\-\+\,\.\/(\\)\?\:\'\"\[\]\(\)])
    
    console.log('\n');
    console.log('raw text:');
    console.log(text);
    
    text = text.replace(/([\u4E00-\u9FA5])([a-z0-9@#&;=_\$\%\^\*\-\+\(\/])/ig, '$1 $2');
    
    text = text.replace(/([a-z0-9@#!~&;=_\,\.\:\?\$\%\^\*\-\+\(\)\/])([\u4E00-\u9FA5])/ig, '$1 $2');
    
    console.log('format text:');
    console.log(text);
    console.log('\n');
    
    return text;
}

function traversal_and_spacing() {
    var current_documant = window.document;
    
    /*
     // >> 選擇任意位置的某個節點
     . >> 自己這個節點
     .. >> 父節點
     text() >> 尋找某點的文字型別，例如 hello 之於 <tag>hello</tag>
     normalize-space() >> 字串頭和尾的空白字元都會被移除，大於兩個以上的空白字元會被置換成單一空白
     
     另外 XML 是 case-sensitive 的
     試試 [translate(name(), "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz")="html"]
     而 lower-case(name(..)) 不起作用
     */
    var xpath_query = '//text()[normalize-space(.)][translate(name(..),"ABCDEFGHIJKLMNOPQRSTUVWXYZ","abcdefghijklmnopqrstuvwxyz")!="script"][translate(name(..),"ABCDEFGHIJKLMNOPQRSTUVWXYZ","abcdefghijklmnopqrstuvwxyz")!="style"]';
    
    var nodes = current_documant.evaluate(xpath_query, current_documant, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
    
    // snapshotLength 要配合 XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE 使用
    var nodes_length = nodes.snapshotLength;
    
    for (var i = 0; i < nodes_length; ++i) {
        var current_node = nodes.snapshotItem(i);
        
        // .data 是 XML DOM 的屬性
        // http://www.w3school.com.cn/xmldom/dom_text.asp
        current_node.data = insert_space(current_node.data);
    }		
}

traversal_and_spacing();

/*
$('body').bind('DOMSubtreeModified', function() {
    console.log('DOM change');
});
*/

console.log('auto_spacing.js end');
