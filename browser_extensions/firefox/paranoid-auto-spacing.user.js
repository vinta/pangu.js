// ==UserScript==
// @name         為什麼你們就是不能加個空格呢？
// @namespace    https://vinta.ws/code/
// @description  自動在網頁中所有的中文字和半形的英文、數字、符號之間插入空白。（攤手）沒辦法，處女座都有強迫症。
// @icon         https://s3-ap-northeast-1.amazonaws.com/vinta/images/paranoid-auto-spacing.png
// @version      4.0.7
// @require      https://cdn.jsdelivr.net/npm/pangu@4.0.7/dist/browser/pangu.min.js
// @updateURL    https://github.com/vinta/pangu.js/raw/master/browser_extensions/firefox/paranoid-auto-spacing.user.js
// @downloadURL  https://github.com/vinta/pangu.js/raw/master/browser_extensions/firefox/paranoid-auto-spacing.user.js
// @run-at       document-idle
// @include      *
// @noframes
//
// @author       Vinta
// @homepageURL  https://github.com/vinta/pangu.js
// ==/UserScript==

// see:
// https://wiki.greasespot.net/Metadata_Block
// https://tampermonkey.net/documentation.php

pangu.autoSpacingPage();
