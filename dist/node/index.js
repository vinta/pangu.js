"use strict";

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var fs = require('fs');

var _require = require('../shared/core'),
    Pangu = _require.Pangu;

var NodePangu = function (_Pangu) {
  _inherits(NodePangu, _Pangu);

  function NodePangu() {
    _classCallCheck(this, NodePangu);

    return _possibleConstructorReturn(this, _getPrototypeOf(NodePangu).apply(this, arguments));
  }

  _createClass(NodePangu, [{
    key: "spacingFile",
    value: function spacingFile(path) {
      var _this = this;

      var callback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : function () {};
      return new Promise(function (resolve, reject) {
        fs.readFile(path, 'utf8', function (err, data) {
          if (err) {
            reject(err);
            return callback(err);
          }

          var spacingData = _this.spacing(data);

          resolve(spacingData);
          return callback(null, spacingData);
        });
      });
    }
  }, {
    key: "spacingFileSync",
    value: function spacingFileSync(path) {
      return this.spacing(fs.readFileSync(path, 'utf8'));
    }
  }]);

  return NodePangu;
}(Pangu);

var pangu = new NodePangu();
module.exports = pangu;
module.exports.default = pangu;
module.exports.Pangu = NodePangu;