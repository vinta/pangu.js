/*
 Utils
 */

function is_valid_url_for_spacing(url) {
    if (url.search(/^(http(s?)|file)/i) >= 0) {
        return true;
    }
    else {
        return false;
    }
}

/*
 Angular
 */

var app = angular.module('app', []);

app.controller('PopupController', [
  '$scope', '$element',
  function PopupController($scope, $element) {
    angular.element('#god_of_spacing').html(get_i18n('god_of_spacing'));

    // 切換 spacing_mode
    $scope.spacing_mode = CACHED_SETTINGS['spacing_mode'];
    $scope.spacing_mode_display = get_i18n($scope.spacing_mode);
    $scope.change_spacing_mode = function() {
        if ($scope.spacing_mode == 'spacing_when_load') {
            $scope.spacing_mode = 'spacing_when_click';
        }
        else if ($scope.spacing_mode == 'spacing_when_click') {
            $scope.spacing_mode = 'spacing_when_load';
        }

        $scope.spacing_mode_display = get_i18n($scope.spacing_mode);

        SYNC_Storage.set({'spacing_mode': $scope.spacing_mode}, function() {
            // print_sync_storage();
        });
    };

    // 招喚空格之神
    $scope.call_god_of_spacing_display = get_i18n('call_god_of_spacing');
    $scope.call_god_of_spacing = function() {
        /*
         取得當前的 tabs（如果有多個螢幕的話，就可能會有很多個）
         也可能包含 Developer Tools 的 tab
         */
        chrome.tabs.query({active: true}, function(tab_array) {
            BG_PAGE.console.log(tab_array);

            for (var i = 0; i < tab_array.length; i++) {
                var tab = tab_array[i];

                // 略過 chrome:// 之類的 URL
                if (is_valid_url_for_spacing(tab.url)) {
                    chrome.tabs.executeScript(tab.id, {code: 'is_spacing = true;', allFrames: true});
                    chrome.tabs.executeScript(tab.id, {code: 'ask_can_notify(true);', allFrames: true});
                    chrome.tabs.executeScript(tab.id, {code: 'go_spacing();', allFrames: true});
                }
                else {
                    if (i == 0) {
                        BG_PAGE.alert(get_i18n('can_not_call_god_of_spacing'));
                    }
                }
            };
        });
    };

    $scope.open_options_page = function() {
        chrome.tabs.create({url: 'pages/options.html'});
    };
  }
]);
