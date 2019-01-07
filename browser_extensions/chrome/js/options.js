/*
 Utils
 */

var IS_MUTE = false;
function play_sound(name) {
  if (!IS_MUTE) {
    var sounds = {
      'Hadouken': '../sounds/StreetFighter-Hadouken.mp3',
      'Shouryuuken': '../sounds/StreetFighter-Shouryuuken.mp3',
      'YeahBaby': '../sounds/AustinPowers-YeahBaby.mp3',
      'WahWahWaaah': '../sounds/WahWahWaaah.mp3'
    };

    var audio_url = sounds[name];
    var audio = new Audio(audio_url);
    audio.play();
  }
}

// TODO: validation
function is_valid_url(url) {
  if (!url) {
    return false;
  }
  else {
    return true;
  }
}

/*
 Angular
 */

var app = angular.module('app', ['xeditable']);

app.controller('OptionsController', [
  '$scope',
  function OptionsController($scope) {
    angular.element('#page_title').html(utils_chrome.get_i18n('extension_name'));
    angular.element('#header_title').html(utils_chrome.get_i18n('extension_name'));
    angular.element('#subtitle').html(utils_chrome.get_i18n('subtitle'));
    angular.element('#quote').html(utils_chrome.get_i18n('quote'));
    angular.element('#label_spacing_mode').html(utils_chrome.get_i18n('label_spacing_mode'));
    angular.element('#label_spacing_rule').html(utils_chrome.get_i18n('label_spacing_rule'));

    /*
     什麼時候作用？
     */
    $scope.spacing_mode = utils_chrome.CACHED_SETTINGS['spacing_mode'];
    $scope.spacing_mode_display = utils_chrome.get_i18n($scope.spacing_mode);
    $scope.spacing_when_click_msg = utils_chrome.get_i18n('spacing_when_click_msg');
    $scope.change_spacing_mode = function() {
      play_sound('Hadouken');

      if ($scope.spacing_mode === 'spacing_when_load') {
        $scope.spacing_mode = 'spacing_when_click';
      }
      else if ($scope.spacing_mode === 'spacing_when_click') {
        $scope.spacing_mode = 'spacing_when_load';
      }

      $scope.spacing_mode_display = utils_chrome.get_i18n($scope.spacing_mode);

      utils_chrome.SYNC_STORAGE.set({'spacing_mode': $scope.spacing_mode}, function() {
        // utils_chrome.print_sync_storage();
      });
    };

    /*
     然後，你是否希望：
     */
    $scope.spacing_rule = utils_chrome.CACHED_SETTINGS['spacing_rule'];
    $scope.spacing_rule_display = utils_chrome.get_i18n($scope.spacing_rule);
    $scope.blacklists = utils_chrome.CACHED_SETTINGS['blacklists'];
    $scope.whitelists = utils_chrome.CACHED_SETTINGS['whitelists'];
    $scope.change_spacing_rule = function() {
      play_sound('Shouryuuken');

      // TODO: 如果 spacing_mode 超過兩種以上的值就不能用這種 toggle 的方式了
      if ($scope.spacing_rule === 'blacklists') {
        $scope.spacing_rule = 'whitelists';
      }
      else if ($scope.spacing_rule === 'whitelists') {
        $scope.spacing_rule = 'blacklists';
      }

      $scope.spacing_rule_display = utils_chrome.get_i18n($scope.spacing_rule);

      utils_chrome.SYNC_STORAGE.set({'spacing_rule': $scope.spacing_rule}, function() {
        // print_sync_storage();
      });
    };

    $scope.update_urls = function(url) {
      if (is_valid_url(url)) {
        play_sound('YeahBaby');

        var spacing_rule = $scope.spacing_rule; // 'blacklists' or 'whitelists'
        var urls = $scope[spacing_rule];
        var obj_to_save = {};
        obj_to_save[spacing_rule] = urls;

        utils_chrome.SYNC_STORAGE.set(obj_to_save, function() {
          // utils_chrome.print_sync_storage();
        });
      }
      else {
        play_sound('WahWahWaaah');
        alert('Fail to save');

        return '';
      }

      event.preventDefault();
    };

    $scope.remove_url = function(array_index) {
      var spacing_rule = $scope.spacing_rule;
      var urls = $scope[spacing_rule];
      urls.splice(array_index, 1);

      var obj_to_save = {};
      obj_to_save[spacing_rule] = urls;
      utils_chrome.SYNC_STORAGE.set(obj_to_save, function() {
        // utils_chrome.print_sync_storage();
      });

      event.preventDefault();
    };

    $scope.url_to_add = {};
    $scope.url_to_add.for_blacklist = '';
    $scope.url_to_add.for_whitelist = '';
    $scope.add_url = function(new_url) {
      if (is_valid_url(new_url)) {
        play_sound('YeahBaby');

        var spacing_rule = $scope.spacing_rule;
        var urls = $scope[spacing_rule];
        urls.push(new_url);

        var obj_to_save = {};
        obj_to_save[spacing_rule] = urls;
        utils_chrome.SYNC_STORAGE.set(obj_to_save, function() {
          // utils_chrome.print_sync_storage();
        });
      }
      else {
        play_sound('WahWahWaaah');
        alert('Fail to save');

        return '';
      }

      event.preventDefault();
    };

    $scope.reset_click_to_add = function() {
      $scope.url_to_add = {};
      $scope.url_to_add.for_blacklist = '';
      $scope.url_to_add.for_whitelist = '';
    };

    /*
     在這個頁面靜音
     */
    $scope.label_is_mute = utils_chrome.get_i18n('label_is_mute');
    $scope.is_mute = utils_chrome.CACHED_SETTINGS['is_mute'];
    $scope.$watch('is_mute', function(new_val, old_val) {
      if (new_val !== old_val) {
        utils_chrome.SYNC_STORAGE.set({'is_mute': new_val}, function() {
          // utils_chrome.print_sync_storage();
        });
      }

      IS_MUTE = new_val;
    });

  }
]);

app.run(function(editableOptions, editableThemes) {
  // http://vitalets.github.io/angular-xeditable/
  editableOptions.theme = 'default';
  editableThemes['default'].submitTpl = '<button class="pure-button small-button">save</button>';
  editableThemes['default'].cancelTpl = '<button class="pure-button small-button" ng-click="$form.$cancel()">cancel</button>';
});
