/*
 jquery.noty.js
 http://needim.github.com/noty/
 */

// 如果頁面上已經有 noty 的 class 就不要再 insert 了
if ($('body').has('.noty_message').length == 0) {
	noty({
	    text: '空格之神顯靈了！',
	    layout: 'topRight',
	    easing: 'swing',
	    animateOpen: {'opacity': 'toggle'},
	    animateClose: {'opacity': 'toggle'},
	    speed: 1,
	    timeout: 600,
	    closable: false,
	    closeOnSelfClick: false
	});
}
