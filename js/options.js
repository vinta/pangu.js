String.prototype.format = function() {
    var args = arguments;

    return this.replace(/{(\d+)}/g, function(match, number) {
        return typeof args[number] != 'undefined' ? args[number] : match;
    });
};

var syncStorage = chrome.storage.sync;
// 保存在 syncStorageArea 的设置项
var settings = [
	  		'spacing_mode',
	  		'exception_mode',
	  		'is_notify',
	  		'blacklist',
	  		'whitelist'
	  ];

function get_i18n(message_name) {
    return chrome.i18n.getMessage(message_name);
}

function play_sound(id) {
    var element_id = id || 'sound1';
    var audio = document.getElementById(id);
    audio.play();
}

function is_valid_url(string) {
    // var regexp_url = /((([a-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[a-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[a-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[.\!\/\\w]*))?)/i;

    // if (regexp_url.test(string)) {
    //     return true;
    // }
    // else {
    //     return false;
    // }

    // don't check, always return true
    return true;
}

function notify_alert(msg) {
    noty({
        text: msg,
        layout: 'topRight',
        modal: true,
        easing: 'swing',
        animateOpen: {'opacity': 'toggle'},
        animateClose: {'opacity': 'toggle'},
        speed: 1,
        timeout: 1000,
        closable: false,
        closeOnSelfClick: false
    });
}

function init_options_page() {
    $('#page_title').html(get_i18n('extension_name'));
    $('#header_title').html(get_i18n('extension_name'));
    $('#subtitle').html(get_i18n('subtitle'));
    $('#quote').html(get_i18n('quote'));

    syncStorage.get(settings, function(items) {
    		$('#now_spacing_when').html(get_i18n(items.spacing_mode));
    		$('#spacing_when_load').html(get_i18n('spacing_when_load'));
    		$('#spacing_when_click').html(get_i18n('spacing_when_click'));

    		$('#now_exception').html(get_i18n(items.exception_mode));
    		$('#exception_whitelist').html(get_i18n('exception_whitelist'));
    		$('#exception_blacklist').html(get_i18n('exception_blacklist'));

    		$('#exception_url_list').attr('placeholder', get_i18n('exception_urls_placeholder'));

   			var textarea = $('#exception_url_list');

    		// 把之前暫存的內容再放回 textarea
    		if (items.exception_mode == 'blacklist') {
        		if (items.blacklist.length > 0) {
		            textarea.val(items.blacklist.join("\n"));
        		}
        		else {
		            textarea.val('');
        		}
    		}
    		else {
		        if (items.whitelist.length > 0) {
            		textarea.val(items.whitelist.join("\n"));
        		}
        		else {
		            textarea.val('');
        		}
    		}

    		if (items.is_notify == 'false') {
        		$('#is_notify').click();
    		}
    });

    $('#label_options').html(get_i18n('label_options'));
    $('#is_notify_text').html(get_i18n('is_notify_text'));
    $('#go_to_work_text').html(get_i18n('go_to_work_text'));

    $('#submit').html(get_i18n('submit'));

    var now = new Date();
    $('#copyleft_year').html(now.getFullYear());
}

// DOM 載入後就觸發
$(document).ready(function() {
    init_options_page();

    var textarea = $('#exception_url_list');

    // 何時作用？
//    		$('.spacing_when').click(function() {
//		        var spacing_when = $(this).attr('id');
		
//        		BG_PAGE.localStorage['spacing_mode'] = spacing_when;

//		        $('#now_spacing_when').html(get_i18n(spacing_when));
//		    });

    $('#now_spacing_when').click(function() {
        play_sound('Hadouken');

        syncStorage.get('spacing_mode', function(items) {
            var spacing_mode;

            if (items.spacing_mode == 'spacing_when_click') {
                spacing_mode = 'spacing_when_load';
            }
            else {
                spacing_mode = 'spacing_when_click';
            }

            $('#now_spacing_when').html(get_i18n(spacing_mode));
            syncStorage.set({'spacing_mode': spacing_mode});
        });
    });
    
    // 黑名單、白名單
//    		$('.exception_target').click(function() {
//		        var spacing_when = $(this).attr('id');

//        		BG_PAGE.localStorage['exception_mode'] = spacing_when;

//		        $('#now_exception').html(get_i18n(spacing_when));
//		    });

    $('#now_exception').click(function() {
        play_sound('Shouryuuken');

        syncStorage.get('exception_mode', function(items) {
            var exception_mode;
						
            if (items.exception_mode == 'whitelist') {
                // 切換 whitelist / backlist 之前先把 textarea 的內容暫存起來
                var whitelist_temp = [];

                // 每次判斷之前，都要再抓一次 textarea.val() 的值
                var raw_textarea = textarea.val();

                if ($.trim(raw_textarea).length > 0) {
                    whitelist_temp = raw_textarea.split("\n"); // array
                }

                chrome.storage.local.set({'whitelist_temp': whitelist_temp});

                // 把之前暫存的內容再放回 textarea
                chrome.storage.local.get('blacklist_temp', function(items) {
                    if (items.blacklist_temp.length > 0) {
                        textarea.val(items.blacklist_temp.join("\n"));
                    }
                    else {
                        textarea.val('');
                    }
                });

                exception_mode = 'blacklist';
            }
            else {
                var blacklist_temp = [];
            		var raw_textarea = textarea.val();

            		if ($.trim(raw_textarea).length > 0) {
                		blacklist_temp = raw_textarea.split("\n"); // array
            		}

            		chrome.storage.local.set({'blacklist_temp': blacklist_temp});

            		chrome.storage.local.get('whitelist_temp', function(items) {
										if (items.whitelist_temp.length > 0) {
             		   		textarea.val(items.whitelist_temp.join("\n"));
            				}
            				else {
				                textarea.val('');
            				}
								});

            		exception_mode = 'whitelist';
            }

            $('#now_exception').html(get_i18n(exception_mode));
            syncStorage.set({'exception_mode': exception_mode});
        });
    });


    $('#is_notify').change(function() {
        if ($(this).attr("checked") == 'checked') {
            syncStorage.set({'is_notify': 'false'}); // 不要顯示 notify alert
            notify_alert('可惡！');
        }
        else {
            syncStorage.set({'is_notify': 'true'});
        }
    });
    
    // 提交（儲存）按鈕
    $('#submit').click(function() {
        var raw_textarea = textarea.val();
        var url_list = [];

        var submit_status = true;
        var submit_label_class = 'label-success';
        var submit_msg = get_i18n('submit_result');

        if ($.trim(raw_textarea).length > 0) {
            var lines = $('#exception_url_list').val().split('\n');

            for (var i = 0; i < lines.length; i++) {
                var line = lines[i];

                if (is_valid_url(line)) {
                    url_list.push(line);
                }
                else {
                    submit_status = false;
                    submit_label_class = 'label-important';
                    submit_msg = get_i18n('exception_urls_error').format(i + 1);

                    break;
                }
            }
        }

        if (submit_status) {
            play_sound('YeahBaby');

            $('#submit_result').css('cursor', 'pointer');

            syncStorage.get('exception_mode', function(items) {
                if (items.exception_mode == 'whitelist') {
                    syncStorage.set({'whitelist': url_list});
                }
                else {
                    syncStorage.set({'blacklist': url_list});
                }
            });
        }
        else {
		        play_sound('WahWahWaaah');
        
            $('#submit_result').css('cursor', 'default');
        }

        $('#submit_result')
        .removeClass() // 移除所有的 class
        .addClass('label')
        .addClass(submit_label_class)
        .html(submit_msg);
    });

    $('#submit_result').click(function() {
		    var this_element = $(this);

     		if (this_element.hasClass('label-success')) {
            this_element.css('cursor', 'default');

         		this_element.html(get_i18n('submit_thanks'));
     		}
 		});

// end: $(document).ready(function() {
});

// DOM 裡頭的元素（例如圖片）載入完才會觸發
$(window).load(function() {
    // do something
});
