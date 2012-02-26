console.log('auto_spacing.js run');

function insert_space(text) {
    // 英文、數字、符號 ([a-z0-9~!@#&;=_\$\%\^\*\-\+\,\.\/(\\)\?\:\'\"\[\]\(\)])
    
    text = text.replace(/([\u4E00-\u9FA5])([a-z0-9])/ig, '$1 $2');
    
    text = text.replace(/([a-z0-9])([\u4E00-\u9FA5])/ig, '$1 $2');
    
    return text;
}

function replaceEntry() {
    var target_tags = ['div', 'p', 'li', 'td', 'span', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
    var body_tag = $('body');
    var raw_text;
	var format_text;
    
    for (var i = 0; i < target_tags.length; i++) {
        var target_tag = target_tags[i];
        
        $(target_tag, body_tag).each(function() {
            var has_children = false;
            
            console.log('\n');
            console.log(target_tag + ' begin');

            raw_text = $(this).html();
            
            console.log(raw_text);
            
            
            
            format_text = insert_space(raw_text);

            $(this).html(format_text);

            console.log(target_tag + ' end');
            console.log('\n');
        });
    }
}

function convert_simp(){
	var curDoc = window.document;
	
	if (curDoc.evaluate){
		//var xpr = '//text()[string-length(normalize-space(.))>0][name(..)!="SCRIPT"][name(..)!="STYLE"]';
		var xpr = '//text()[normalize-space(.)][name(..)!="SCRIPT"][name(..)!="STYLE"]';
		
		var textnodes = curDoc.evaluate(xpr, curDoc,  null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,  null);
		var textnodes_length = textnodes.snapshotLength;
		//var curNode = null;

		for (var i=0, n=textnodes_length, textNodes = textnodes; i<n; ++i) {
			var curNode = textNodes.snapshotItem(i);
			
			//if (/[^\x20-\xFF]+/.test(curNode.data)){
			//if (/%u/.test(escape(curNode.data))){
				curNode.data = insert_space(curNode.data);
			//}
		}		
	}else {
/* 		window.document.body.innerHTML = toTrad(window.document.body.innerHTML); */
	}
}

function auto_spacing() {
    var current_documant = window.document;
    
    /*
     // >> 選擇任意位置的某個節點
     . >> 自己這個節點
     .. >> 父節點
     text() >> 尋找某點的文字型別，例如 hello 之於 <tag>hello</tag>
     normalize-space() >> 字串頭和尾的空白字元都會被移除，大於兩個以上的空白字元會被置換成單一空白
     */
    var xpath_query = '//text()[normalize-space(.)][name(..)!="SCRIPT"][name(..)!="STYLE"]';
    
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

auto_spacing();

console.log('auto_spacing.js end');
