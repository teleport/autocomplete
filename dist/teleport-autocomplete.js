/*! teleport-autocomplete - v0.2.1 | https://github.com/teleport/autocomplete#readme | MIT */
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.TeleportAutocomplete = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

require('classlist-polyfill');

var _halfred = require('halfred');

var _halfred2 = _interopRequireDefault(_halfred);

var _minivents = require('minivents');

var _minivents2 = _interopRequireDefault(_minivents);

var _coreJsLibraryFnObjectAssign = require('core-js/library/fn/object/assign');

var _coreJsLibraryFnObjectAssign2 = _interopRequireDefault(_coreJsLibraryFnObjectAssign);

var _coreJsLibraryFnArrayFind = require('core-js/library/fn/array/find');

var _coreJsLibraryFnArrayFind2 = _interopRequireDefault(_coreJsLibraryFnArrayFind);

var _coreJsLibraryFnRegexpEscape = require('core-js/library/fn/regexp/escape');

var _coreJsLibraryFnRegexpEscape2 = _interopRequireDefault(_coreJsLibraryFnRegexpEscape);

var _debounce = require('debounce');

var _debounce2 = _interopRequireDefault(_debounce);

var Key = { BACK: 8, TAB: 9, ENTER: 13, UP: 38, DOWN: 40 };
var CONTAINER_TEMPLATE = '<div class="tp-autocomplete"><ul class="tp-ac__list"></ul></div>';
var INPUT_CLASS = 'tp-ac__input';
var itemWrapperTemplate = function itemWrapperTemplate(item) {
  return '<li class="tp-ac__item">' + item + '</li>';
};
var NO_RESULTS_TEMPLATE = '<li class="tp-ac__item no-results">No matches</li>';
var GEOLOCATE_TEMPLATE = '<li class="tp-ac__item geolocate">Detect my current location</li>';

// Default item template, wraps title matches
var ITEM_TEMPLATE = function renderItem(item) {
  return this.wrapMatches(item.title);
};

// Shorthands
HTMLElement.prototype.on = HTMLElement.prototype.addEventListener;
HTMLElement.prototype.off = HTMLElement.prototype.removeEventListener;

/**
 * Teleport Cities Autocomplete
 */

var TeleportAutocomplete = (function () {
  _createClass(TeleportAutocomplete, [{
    key: 'query',
    get: function get() {
      return this._query;
    },
    set: function set(query) {
      if (query === this._query) return query;

      this._query = query;
      this.el.value = query;
      this.emit('querychange', query);
    }
  }, {
    key: 'activeIndex',
    get: function get() {
      return this._activeIndex;
    },
    set: function set(index) {
      // Remove old highlight
      var oldNode = this.list.childNodes[this._activeIndex];
      if (oldNode) oldNode.classList.remove('is-active');

      this._activeIndex = index;

      // Set highlight
      var activeNode = this.list.childNodes[index];
      if (activeNode) activeNode.classList.add('is-active');
    }

    // Show or hide loading
  }, {
    key: 'loading',
    set: function set(toggle) {
      this.container.classList.toggle('spinner', toggle);
    }

    /**
     * Parse arguments and wrap input
     */
  }]);

  function TeleportAutocomplete() {
    var _this = this;

    var _ref = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    var _ref$el = _ref.el;
    var el = _ref$el === undefined ? null : _ref$el;
    var _ref$maxItems = _ref.maxItems;
    var maxItems = _ref$maxItems === undefined ? 10 : _ref$maxItems;
    var _ref$itemTemplate = _ref.itemTemplate;
    var itemTemplate = _ref$itemTemplate === undefined ? ITEM_TEMPLATE : _ref$itemTemplate;
    var _ref$geoLocate = _ref.geoLocate;
    var geoLocate = _ref$geoLocate === undefined ? true : _ref$geoLocate;
    var _ref$apiRoot = _ref.apiRoot;
    var apiRoot = _ref$apiRoot === undefined ? 'https://api.teleport.org/api' : _ref$apiRoot;
    var _ref$embeds = _ref.embeds;
    var embeds = _ref$embeds === undefined ? 'city:country,city:admin1_division,city:timezone/tz:offsets-now,city:urban_area' : _ref$embeds;

    _classCallCheck(this, TeleportAutocomplete);

    (0, _minivents2['default'])(this);

    var elem = typeof el === 'string' ? document.querySelector(el) : el;
    this.setupInput(elem);

    (0, _coreJsLibraryFnObjectAssign2['default'])(this, {
      maxItems: maxItems, geoLocate: geoLocate, apiRoot: apiRoot, itemTemplate: itemTemplate, embeds: embeds, results: [],
      _activeIndex: 0, _cache: {}, _query: this.el.value, value: null
    });

    // Prefetch results
    if (this.query) {
      this.fetchResults(function () {
        _this.value = _this.getResultByTitle(_this.query);
        _this.emit('change', _this.value);
      });
    }

    this.getCities = (0, _debounce2['default'])(this.getCities, 200);
    return this;
  }

  /**
   * Init shorthand
   */

  _createClass(TeleportAutocomplete, [{
    key: 'destroy',

    /**
     * Clean up the container
     */
    value: function destroy() {
      this.el.off('input', this.oninput);
      this.el.off('keydown', this.onkeydown);
      this.el.off('focus', this.onfocus);
      this.el.off('blur', this.onblur);
      this.el.off('click', this.onclick);

      this.el.classList.remove(INPUT_CLASS);

      var containerParent = this.container.parentNode;
      containerParent.replaceChild(this.el.parentNode.removeChild(this.el), this.container);
    }

    /**
     * Wrap input node in container
     */
  }, {
    key: 'setupInput',
    value: function setupInput(el) {
      if (!el || !(el instanceof HTMLInputElement)) throw new Error('Invalid element given');

      el.insertAdjacentHTML('beforebegin', CONTAINER_TEMPLATE);
      Object.defineProperty(this, 'container', { value: el.previousSibling });
      Object.defineProperty(this, 'list', { value: this.container.firstChild });

      var input = this.container.insertBefore(el.parentNode.removeChild(el), this.list);
      input.classList.add(INPUT_CLASS);

      Object.defineProperty(this, 'el', { enumerable: true, value: input });

      this.el.on('input', this.oninput.bind(this));
      this.el.on('keydown', this.onkeydown.bind(this));
      this.el.on('focus', this.onfocus.bind(this));
      this.el.on('blur', this.onblur.bind(this));
      this.el.on('click', this.onclick.bind(this));

      this.list.on('click', this.onlistclick.bind(this));
    }

    /**
     * Event handlers
     */

    // Clicked on list item, select item
  }, {
    key: 'onlistclick',
    value: function onlistclick(event) {
      var index = [].indexOf.call(this.list.children, event.target);
      this.selectByIndex(index);
    }

    // Select text on click
  }, {
    key: 'onclick',
    value: function onclick() {
      this.el.select();
    }

    // Input has focus, open list
  }, {
    key: 'onfocus',
    value: function onfocus() {
      this.renderList();
    }

    // Input lost focus, close list
  }, {
    key: 'onblur',
    value: function onblur() {
      var _this2 = this;

      setTimeout(function () {
        return _this2.list.innerHTML = '';
      }, 100);
    }

    // Input was typed into
  }, {
    key: 'oninput',
    value: function oninput() {
      var _this3 = this;

      this._query = this.el.value;
      this.fetchResults(function () {
        return _this3.renderList();
      });
    }

    // Called on keypresses
  }, {
    key: 'onkeydown',
    value: function onkeydown(event) {
      var code = event.keyCode;

      // Prevent cursor move
      if ([Key.UP, Key.DOWN].indexOf(code) !== -1) event.preventDefault();

      switch (code) {
        case Key.BACK:
          // Clear filled value or last char
          if (this.value || this.query.length === 1) {
            this.results = [];
            this.selectByIndex(0);
          }
          break;
        case Key.ENTER:
          // Prevent submit if query is to be selected
          if (!this.value && this.query) event.preventDefault();
          this.selectByIndex(this.activeIndex);
          break;
        case Key.TAB:
          this.selectByIndex(this.activeIndex);
          break;
        case Key.UP:
          this.activeIndex = Math.max(0, this.activeIndex - 1);
          break;
        case Key.DOWN:
          this.activeIndex = Math.min(this.results.length - 1, this.activeIndex + 1);
          break;
      }
    }

    // ---------------------------------------------------------------------------

    /**
     * Select option from list by index
     */
  }, {
    key: 'selectByIndex',
    value: function selectByIndex(index) {
      var firstItem = this.list.firstChild;
      if (firstItem && firstItem.classList.contains('geolocate') && index === 0) this.currentLocation();
      this.activeIndex = index;

      var oldValue = this.value;
      this.value = this.results[index] || null;
      if (oldValue !== this.value) this.emit('change', this.value);

      this.list.innerHTML = '';
      this.query = this.value ? this.value.title : '';
    }

    /**
     * Wrap matching result names in <span>s
     */
  }, {
    key: 'wrapMatches',
    value: function wrapMatches() {
      var str = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];

      var res = str;

      this.query.split(/[\,\s]+/).filter(function (qr) {
        return !!qr;
      }).forEach(function (query) {
        return res = res.replace(new RegExp((0, _coreJsLibraryFnRegexpEscape2['default'])(query), 'gi'), '<span>$&</span>');
      });

      return res;
    }

    /**
     * Render result list
     */
  }, {
    key: 'renderList',
    value: function renderList() {
      var _this4 = this;

      var results = this.results.map(function (res) {
        return itemWrapperTemplate(_this4.itemTemplate(res));
      }).slice(0, this.maxItems).join('');

      if (!results && this.query !== '') results = NO_RESULTS_TEMPLATE;
      if (this.query === '' && this.geoLocate) results = GEOLOCATE_TEMPLATE;
      this.list.innerHTML = results;

      this.activeIndex = 0;
    }

    /**
     * Fetch value from results by title
     */
  }, {
    key: 'getResultByTitle',
    value: function getResultByTitle(title) {
      if (!this.results || !title) return null;
      return (0, _coreJsLibraryFnArrayFind2['default'])(this.results, function (res) {
        return res.title.indexOf(title) !== -1;
      });
    }

    /**
     * Fetch picker data from cache or API
     */
  }, {
    key: 'fetchResults',
    value: function fetchResults() {
      var _this5 = this;

      var cb = arguments.length <= 0 || arguments[0] === undefined ? function noop() {} : arguments[0];

      // Cancel old request
      if (this.req) this.req.abort();

      var cached = this._cache[this.query];
      if (cached) {
        this.results = cached;
        return cb();
      }

      this.req = this.getCities(function (results) {
        _this5.results = _this5._cache[_this5.query] = results;
        cb();
        _this5.loading = false;
      });

      this.loading = true;
    }

    /**
     * Geolocate current city
     */
  }, {
    key: 'currentLocation',
    value: function currentLocation() {
      var _this6 = this;

      var req = new XMLHttpRequest();
      var embed = 'location:nearest-cities/location:nearest-city/{' + this.embeds + '}';

      this.loading = true;
      this.oldPlaceholder = this.el.placeholder;
      this.el.placeholder = 'Detecting location...';

      navigator.geolocation.getCurrentPosition(function (_ref2) {
        var coords = _ref2.coords;

        req.open('GET', _this6.apiRoot + '/locations/' + coords.latitude + ',' + coords.longitude + '/?embed=' + embed);
        req.addEventListener('load', function () {
          return _this6.parseLocation(JSON.parse(req.response));
        });
        req.send();
      }, function (_ref3) {
        var message = _ref3.message;

        _this6.loading = false;
        _this6.el.placeholder = message;
        setTimeout(function () {
          return _this6.el.placeholder = _this6.oldPlaceholder;
        }, 3000);
      }, { timeout: 5000 });
    }

    /**
     * Parse current location API response
     */
  }, {
    key: 'parseLocation',
    value: function parseLocation(json) {
      var res = _halfred2['default'].parse(json);
      var nearest = res.embeddedArray('location:nearest-cities')[0];
      if (nearest) {
        this.results = [this.parseCity(nearest)];
        this.selectByIndex(0);
      }
      this.loading = false;
      this.el.placeholder = this.oldPlaceholder;
    }

    /**
     * Make the API call
     */
  }, {
    key: 'getCities',
    value: function getCities(cb) {
      var _this7 = this;

      if (!this.query) return cb([]);
      var embed = 'city:search-results/city:item/{' + this.embeds + '}';

      var req = new XMLHttpRequest();
      req.open('GET', this.apiRoot + '/cities/?search=' + this.query + '&embed=' + embed + '&limit=' + this.maxItems);
      req.addEventListener('load', function () {
        var results = _halfred2['default'].parse(JSON.parse(req.response)).embeddedArray('city:search-results').map(function (res) {
          return _this7.parseCity(res);
        });

        cb(results);
      });
      req.send();

      return req;
    }

    /**
     * Parse city
     */
  }, {
    key: 'parseCity',
    value: function parseCity(res) {
      var city = res.embedded('location:nearest-city') || res.embedded('city:item');
      city.country = city.embedded('city:country');
      city.admin1_division = city.embedded('city:admin1_division');
      city.timezone = city.embedded('city:timezone');
      city.urban_area = city.embedded('city:urban_area');

      var fullName = city.full_name;
      var name = city.name;
      var geonameId = city.geoname_id;
      var population = city.population;
      var _city$location$latlon = city.location.latlon;
      var latitude = _city$location$latlon.latitude;
      var longitude = _city$location$latlon.longitude;
      var _res$matching_full_name = res.matching_full_name;
      var title = _res$matching_full_name === undefined ? fullName : _res$matching_full_name;

      var result = { title: title, name: name, geonameId: geonameId, latitude: latitude, longitude: longitude, population: population };

      if (city.country) (0, _coreJsLibraryFnObjectAssign2['default'])(result, { country: city.country.name });
      if (city.admin1_division) (0, _coreJsLibraryFnObjectAssign2['default'])(result, { admin1Division: city.admin1_division.name });

      if (city.timezone) {
        var tzNow = city.timezone.embedded('tz:offsets-now');
        (0, _coreJsLibraryFnObjectAssign2['default'])(result, { tzOffsetMinutes: tzNow.total_offset_min });
      }

      if (city.urban_area) {
        var _city$urban_area = city.urban_area;
        var uaName = _city$urban_area.name;
        var uaId = _city$urban_area.ua_id;
        var uaCityUrl = _city$urban_area.teleport_city_url;

        (0, _coreJsLibraryFnObjectAssign2['default'])(result, { uaName: uaName, uaId: uaId, uaCityUrl: uaCityUrl });
      }

      return result;
    }
  }], [{
    key: 'init',
    value: function init(el) {
      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var opt = typeof el === 'string' || el instanceof HTMLInputElement ? (0, _coreJsLibraryFnObjectAssign2['default'])(options, { el: el }) : el;
      return new TeleportAutocomplete(opt);
    }
  }]);

  return TeleportAutocomplete;
})();

exports['default'] = TeleportAutocomplete;
module.exports = exports['default'];

},{"classlist-polyfill":2,"core-js/library/fn/array/find":3,"core-js/library/fn/object/assign":4,"core-js/library/fn/regexp/escape":5,"debounce":33,"halfred":35,"minivents":39}],2:[function(require,module,exports){
/*
 * classList.js: Cross-browser full element.classList implementation.
 * 2014-07-23
 *
 * By Eli Grey, http://eligrey.com
 * Public Domain.
 * NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
 */

/*global self, document, DOMException */

/*! @source http://purl.eligrey.com/github/classList.js/blob/master/classList.js*/

/* Copied from MDN:
 * https://developer.mozilla.org/en-US/docs/Web/API/Element/classList
 */

if ("document" in window.self) {

  // Full polyfill for browsers with no classList support
  if (!("classList" in document.createElement("_"))) {

  (function (view) {

    "use strict";

    if (!('Element' in view)) return;

    var
        classListProp = "classList"
      , protoProp = "prototype"
      , elemCtrProto = view.Element[protoProp]
      , objCtr = Object
      , strTrim = String[protoProp].trim || function () {
        return this.replace(/^\s+|\s+$/g, "");
      }
      , arrIndexOf = Array[protoProp].indexOf || function (item) {
        var
            i = 0
          , len = this.length
        ;
        for (; i < len; i++) {
          if (i in this && this[i] === item) {
            return i;
          }
        }
        return -1;
      }
      // Vendors: please allow content code to instantiate DOMExceptions
      , DOMEx = function (type, message) {
        this.name = type;
        this.code = DOMException[type];
        this.message = message;
      }
      , checkTokenAndGetIndex = function (classList, token) {
        if (token === "") {
          throw new DOMEx(
              "SYNTAX_ERR"
            , "An invalid or illegal string was specified"
          );
        }
        if (/\s/.test(token)) {
          throw new DOMEx(
              "INVALID_CHARACTER_ERR"
            , "String contains an invalid character"
          );
        }
        return arrIndexOf.call(classList, token);
      }
      , ClassList = function (elem) {
        var
            trimmedClasses = strTrim.call(elem.getAttribute("class") || "")
          , classes = trimmedClasses ? trimmedClasses.split(/\s+/) : []
          , i = 0
          , len = classes.length
        ;
        for (; i < len; i++) {
          this.push(classes[i]);
        }
        this._updateClassName = function () {
          elem.setAttribute("class", this.toString());
        };
      }
      , classListProto = ClassList[protoProp] = []
      , classListGetter = function () {
        return new ClassList(this);
      }
    ;
    // Most DOMException implementations don't allow calling DOMException's toString()
    // on non-DOMExceptions. Error's toString() is sufficient here.
    DOMEx[protoProp] = Error[protoProp];
    classListProto.item = function (i) {
      return this[i] || null;
    };
    classListProto.contains = function (token) {
      token += "";
      return checkTokenAndGetIndex(this, token) !== -1;
    };
    classListProto.add = function () {
      var
          tokens = arguments
        , i = 0
        , l = tokens.length
        , token
        , updated = false
      ;
      do {
        token = tokens[i] + "";
        if (checkTokenAndGetIndex(this, token) === -1) {
          this.push(token);
          updated = true;
        }
      }
      while (++i < l);

      if (updated) {
        this._updateClassName();
      }
    };
    classListProto.remove = function () {
      var
          tokens = arguments
        , i = 0
        , l = tokens.length
        , token
        , updated = false
        , index
      ;
      do {
        token = tokens[i] + "";
        index = checkTokenAndGetIndex(this, token);
        while (index !== -1) {
          this.splice(index, 1);
          updated = true;
          index = checkTokenAndGetIndex(this, token);
        }
      }
      while (++i < l);

      if (updated) {
        this._updateClassName();
      }
    };
    classListProto.toggle = function (token, force) {
      token += "";

      var
          result = this.contains(token)
        , method = result ?
          force !== true && "remove"
        :
          force !== false && "add"
      ;

      if (method) {
        this[method](token);
      }

      if (force === true || force === false) {
        return force;
      } else {
        return !result;
      }
    };
    classListProto.toString = function () {
      return this.join(" ");
    };

    if (objCtr.defineProperty) {
      var classListPropDesc = {
          get: classListGetter
        , enumerable: true
        , configurable: true
      };
      try {
        objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
      } catch (ex) { // IE 8 doesn't support enumerable:true
        if (ex.number === -0x7FF5EC54) {
          classListPropDesc.enumerable = false;
          objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
        }
      }
    } else if (objCtr[protoProp].__defineGetter__) {
      elemCtrProto.__defineGetter__(classListProp, classListGetter);
    }

    }(window.self));

    } else {
    // There is full or partial native classList support, so just check if we need
    // to normalize the add/remove and toggle APIs.

    (function () {
      "use strict";

      var testElement = document.createElement("_");

      testElement.classList.add("c1", "c2");

      // Polyfill for IE 10/11 and Firefox <26, where classList.add and
      // classList.remove exist but support only one argument at a time.
      if (!testElement.classList.contains("c2")) {
        var createMethod = function(method) {
          var original = DOMTokenList.prototype[method];

          DOMTokenList.prototype[method] = function(token) {
            var i, len = arguments.length;

            for (i = 0; i < len; i++) {
              token = arguments[i];
              original.call(this, token);
            }
          };
        };
        createMethod('add');
        createMethod('remove');
      }

      testElement.classList.toggle("c3", false);

      // Polyfill for IE 10 and Firefox <24, where classList.toggle does not
      // support the second argument.
      if (testElement.classList.contains("c3")) {
        var _toggle = DOMTokenList.prototype.toggle;

        DOMTokenList.prototype.toggle = function(token, force) {
          if (1 in arguments && !this.contains(token) === !force) {
            return force;
          } else {
            return _toggle.call(this, token);
          }
        };

      }

      testElement = null;
    }());
  }
}

},{}],3:[function(require,module,exports){
require('../../modules/es6.array.find');
module.exports = require('../../modules/$.core').Array.find;
},{"../../modules/$.core":10,"../../modules/es6.array.find":30}],4:[function(require,module,exports){
require('../../modules/es6.object.assign');
module.exports = require('../../modules/$.core').Object.assign;
},{"../../modules/$.core":10,"../../modules/es6.object.assign":31}],5:[function(require,module,exports){
require('../../modules/es7.regexp.escape');
module.exports = require('../../modules/$.core').RegExp.escape;
},{"../../modules/$.core":10,"../../modules/es7.regexp.escape":32}],6:[function(require,module,exports){
module.exports = function(it){
  if(typeof it != 'function')throw TypeError(it + ' is not a function!');
  return it;
};
},{}],7:[function(require,module,exports){
// 0 -> Array#forEach
// 1 -> Array#map
// 2 -> Array#filter
// 3 -> Array#some
// 4 -> Array#every
// 5 -> Array#find
// 6 -> Array#findIndex
var ctx      = require('./$.ctx')
  , isObject = require('./$.is-object')
  , IObject  = require('./$.iobject')
  , toObject = require('./$.to-object')
  , toLength = require('./$.to-length')
  , isArray  = require('./$.is-array')
  , SPECIES  = require('./$.wks')('species');
// 9.4.2.3 ArraySpeciesCreate(originalArray, length)
var ASC = function(original, length){
  var C;
  if(isArray(original) && isObject(C = original.constructor)){
    C = C[SPECIES];
    if(C === null)C = undefined;
  } return new(C === undefined ? Array : C)(length);
};
module.exports = function(TYPE){
  var IS_MAP        = TYPE == 1
    , IS_FILTER     = TYPE == 2
    , IS_SOME       = TYPE == 3
    , IS_EVERY      = TYPE == 4
    , IS_FIND_INDEX = TYPE == 6
    , NO_HOLES      = TYPE == 5 || IS_FIND_INDEX;
  return function($this, callbackfn, that){
    var O      = toObject($this)
      , self   = IObject(O)
      , f      = ctx(callbackfn, that, 3)
      , length = toLength(self.length)
      , index  = 0
      , result = IS_MAP ? ASC($this, length) : IS_FILTER ? ASC($this, 0) : undefined
      , val, res;
    for(;length > index; index++)if(NO_HOLES || index in self){
      val = self[index];
      res = f(val, index, O);
      if(TYPE){
        if(IS_MAP)result[index] = res;            // map
        else if(res)switch(TYPE){
          case 3: return true;                    // some
          case 5: return val;                     // find
          case 6: return index;                   // findIndex
          case 2: result.push(val);               // filter
        } else if(IS_EVERY)return false;          // every
      }
    }
    return IS_FIND_INDEX ? -1 : IS_SOME || IS_EVERY ? IS_EVERY : result;
  };
};
},{"./$.ctx":11,"./$.iobject":18,"./$.is-array":19,"./$.is-object":20,"./$.to-length":25,"./$.to-object":26,"./$.wks":29}],8:[function(require,module,exports){
// 19.1.2.1 Object.assign(target, source, ...)
var toObject = require('./$.to-object')
  , IObject  = require('./$.iobject')
  , enumKeys = require('./$.enum-keys')
  , has      = require('./$.has');

// should work with symbols and should have deterministic property order (V8 bug)
module.exports = require('./$.fails')(function(){
  var a = Object.assign
    , A = {}
    , B = {}
    , S = Symbol()
    , K = 'abcdefghijklmnopqrst';
  A[S] = 7;
  K.split('').forEach(function(k){ B[k] = k; });
  return a({}, A)[S] != 7 || Object.keys(a({}, B)).join('') != K;
}) ? function assign(target, source){   // eslint-disable-line no-unused-vars
  var T = toObject(target)
    , l = arguments.length
    , i = 1;
  while(l > i){
    var S      = IObject(arguments[i++])
      , keys   = enumKeys(S)
      , length = keys.length
      , j      = 0
      , key;
    while(length > j)if(has(S, key = keys[j++]))T[key] = S[key];
  }
  return T;
} : Object.assign;
},{"./$.enum-keys":14,"./$.fails":15,"./$.has":17,"./$.iobject":18,"./$.to-object":26}],9:[function(require,module,exports){
var toString = {}.toString;

module.exports = function(it){
  return toString.call(it).slice(8, -1);
};
},{}],10:[function(require,module,exports){
var core = module.exports = {version: '1.2.0'};
if(typeof __e == 'number')__e = core; // eslint-disable-line no-undef
},{}],11:[function(require,module,exports){
// optional / simple context binding
var aFunction = require('./$.a-function');
module.exports = function(fn, that, length){
  aFunction(fn);
  if(that === undefined)return fn;
  switch(length){
    case 1: return function(a){
      return fn.call(that, a);
    };
    case 2: return function(a, b){
      return fn.call(that, a, b);
    };
    case 3: return function(a, b, c){
      return fn.call(that, a, b, c);
    };
  }
  return function(/* ...args */){
    return fn.apply(that, arguments);
  };
};
},{"./$.a-function":6}],12:[function(require,module,exports){
var global    = require('./$.global')
  , core      = require('./$.core')
  , PROTOTYPE = 'prototype';
var ctx = function(fn, that){
  return function(){
    return fn.apply(that, arguments);
  };
};
var $def = function(type, name, source){
  var key, own, out, exp
    , isGlobal = type & $def.G
    , isProto  = type & $def.P
    , target   = isGlobal ? global : type & $def.S
        ? global[name] : (global[name] || {})[PROTOTYPE]
    , exports  = isGlobal ? core : core[name] || (core[name] = {});
  if(isGlobal)source = name;
  for(key in source){
    // contains in native
    own = !(type & $def.F) && target && key in target;
    if(own && key in exports)continue;
    // export native or passed
    out = own ? target[key] : source[key];
    // prevent global pollution for namespaces
    if(isGlobal && typeof target[key] != 'function')exp = source[key];
    // bind timers to global for call from export context
    else if(type & $def.B && own)exp = ctx(out, global);
    // wrap global constructors for prevent change them in library
    else if(type & $def.W && target[key] == out)!function(C){
      exp = function(param){
        return this instanceof C ? new C(param) : C(param);
      };
      exp[PROTOTYPE] = C[PROTOTYPE];
    }(out);
    else exp = isProto && typeof out == 'function' ? ctx(Function.call, out) : out;
    // export
    exports[key] = exp;
    if(isProto)(exports[PROTOTYPE] || (exports[PROTOTYPE] = {}))[key] = out;
  }
};
// type bitmap
$def.F = 1;  // forced
$def.G = 2;  // global
$def.S = 4;  // static
$def.P = 8;  // proto
$def.B = 16; // bind
$def.W = 32; // wrap
module.exports = $def;
},{"./$.core":10,"./$.global":16}],13:[function(require,module,exports){
// 7.2.1 RequireObjectCoercible(argument)
module.exports = function(it){
  if(it == undefined)throw TypeError("Can't call method on  " + it);
  return it;
};
},{}],14:[function(require,module,exports){
// all enumerable object keys, includes symbols
var $ = require('./$');
module.exports = function(it){
  var keys       = $.getKeys(it)
    , getSymbols = $.getSymbols;
  if(getSymbols){
    var symbols = getSymbols(it)
      , isEnum  = $.isEnum
      , i       = 0
      , key;
    while(symbols.length > i)if(isEnum.call(it, key = symbols[i++]))keys.push(key);
  }
  return keys;
};
},{"./$":21}],15:[function(require,module,exports){
module.exports = function(exec){
  try {
    return !!exec();
  } catch(e){
    return true;
  }
};
},{}],16:[function(require,module,exports){
// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
var UNDEFINED = 'undefined';
var global = module.exports = typeof window != UNDEFINED && window.Math == Math
  ? window : typeof self != UNDEFINED && self.Math == Math ? self : Function('return this')();
if(typeof __g == 'number')__g = global; // eslint-disable-line no-undef
},{}],17:[function(require,module,exports){
var hasOwnProperty = {}.hasOwnProperty;
module.exports = function(it, key){
  return hasOwnProperty.call(it, key);
};
},{}],18:[function(require,module,exports){
// indexed object, fallback for non-array-like ES3 strings
var cof = require('./$.cof');
module.exports = 0 in Object('z') ? Object : function(it){
  return cof(it) == 'String' ? it.split('') : Object(it);
};
},{"./$.cof":9}],19:[function(require,module,exports){
// 7.2.2 IsArray(argument)
var cof = require('./$.cof');
module.exports = Array.isArray || function(arg){
  return cof(arg) == 'Array';
};
},{"./$.cof":9}],20:[function(require,module,exports){
module.exports = function(it){
  return typeof it === 'object' ? it !== null : typeof it === 'function';
};
},{}],21:[function(require,module,exports){
var $Object = Object;
module.exports = {
  create:     $Object.create,
  getProto:   $Object.getPrototypeOf,
  isEnum:     {}.propertyIsEnumerable,
  getDesc:    $Object.getOwnPropertyDescriptor,
  setDesc:    $Object.defineProperty,
  setDescs:   $Object.defineProperties,
  getKeys:    $Object.keys,
  getNames:   $Object.getOwnPropertyNames,
  getSymbols: $Object.getOwnPropertySymbols,
  each:       [].forEach
};
},{}],22:[function(require,module,exports){
module.exports = function(regExp, replace){
  var replacer = replace === Object(replace) ? function(part){
    return replace[part];
  } : replace;
  return function(it){
    return String(it).replace(regExp, replacer);
  };
};
},{}],23:[function(require,module,exports){
var global = require('./$.global')
  , SHARED = '__core-js_shared__'
  , store  = global[SHARED] || (global[SHARED] = {});
module.exports = function(key){
  return store[key] || (store[key] = {});
};
},{"./$.global":16}],24:[function(require,module,exports){
// 7.1.4 ToInteger
var ceil  = Math.ceil
  , floor = Math.floor;
module.exports = function(it){
  return isNaN(it = +it) ? 0 : (it > 0 ? floor : ceil)(it);
};
},{}],25:[function(require,module,exports){
// 7.1.15 ToLength
var toInteger = require('./$.to-integer')
  , min       = Math.min;
module.exports = function(it){
  return it > 0 ? min(toInteger(it), 0x1fffffffffffff) : 0; // pow(2, 53) - 1 == 9007199254740991
};
},{"./$.to-integer":24}],26:[function(require,module,exports){
// 7.1.13 ToObject(argument)
var defined = require('./$.defined');
module.exports = function(it){
  return Object(defined(it));
};
},{"./$.defined":13}],27:[function(require,module,exports){
var id = 0
  , px = Math.random();
module.exports = function(key){
  return 'Symbol('.concat(key === undefined ? '' : key, ')_', (++id + px).toString(36));
};
},{}],28:[function(require,module,exports){
module.exports = function(){ /* empty */ };
},{}],29:[function(require,module,exports){
var store  = require('./$.shared')('wks')
  , Symbol = require('./$.global').Symbol;
module.exports = function(name){
  return store[name] || (store[name] =
    Symbol && Symbol[name] || (Symbol || require('./$.uid'))('Symbol.' + name));
};
},{"./$.global":16,"./$.shared":23,"./$.uid":27}],30:[function(require,module,exports){
'use strict';
// 22.1.3.8 Array.prototype.find(predicate, thisArg = undefined)
var KEY    = 'find'
  , $def   = require('./$.def')
  , forced = true
  , $find  = require('./$.array-methods')(5);
// Shouldn't skip holes
if(KEY in [])Array(1)[KEY](function(){ forced = false; });
$def($def.P + $def.F * forced, 'Array', {
  find: function find(callbackfn/*, that = undefined */){
    return $find(this, callbackfn, arguments[1]);
  }
});
require('./$.unscope')(KEY);
},{"./$.array-methods":7,"./$.def":12,"./$.unscope":28}],31:[function(require,module,exports){
// 19.1.3.1 Object.assign(target, source)
var $def = require('./$.def');

$def($def.S + $def.F, 'Object', {assign: require('./$.assign')});
},{"./$.assign":8,"./$.def":12}],32:[function(require,module,exports){
// https://github.com/benjamingr/RexExp.escape
var $def = require('./$.def')
  , $re  = require('./$.replacer')(/[\\^$*+?.()|[\]{}]/g, '\\$&');
$def($def.S, 'RegExp', {escape: function escape(it){ return $re(it); }});

},{"./$.def":12,"./$.replacer":22}],33:[function(require,module,exports){

/**
 * Module dependencies.
 */

var now = require('date-now');

/**
 * Returns a function, that, as long as it continues to be invoked, will not
 * be triggered. The function will be called after it stops being called for
 * N milliseconds. If `immediate` is passed, trigger the function on the
 * leading edge, instead of the trailing.
 *
 * @source underscore.js
 * @see http://unscriptable.com/2009/03/20/debouncing-javascript-methods/
 * @param {Function} function to wrap
 * @param {Number} timeout in ms (`100`)
 * @param {Boolean} whether to execute at the beginning (`false`)
 * @api public
 */

module.exports = function debounce(func, wait, immediate){
  var timeout, args, context, timestamp, result;
  if (null == wait) wait = 100;

  function later() {
    var last = now() - timestamp;

    if (last < wait && last > 0) {
      timeout = setTimeout(later, wait - last);
    } else {
      timeout = null;
      if (!immediate) {
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      }
    }
  };

  return function debounced() {
    context = this;
    args = arguments;
    timestamp = now();
    var callNow = immediate && !timeout;
    if (!timeout) timeout = setTimeout(later, wait);
    if (callNow) {
      result = func.apply(context, args);
      context = args = null;
    }

    return result;
  };
};

},{"date-now":34}],34:[function(require,module,exports){
module.exports = Date.now || now

function now() {
    return new Date().getTime()
}

},{}],35:[function(require,module,exports){
var Parser = require('./lib/parser')
  , Resource = require('./lib/resource')
  , validationFlag = false;

module.exports = {

  parse: function(unparsed) {
    return new Parser().parse(unparsed, validationFlag);
  },

  enableValidation: function(flag) {
    validationFlag = (flag != null) ? flag : true;
  },

  disableValidation: function() {
    validationFlag = false;
  },

  Resource: Resource

};

},{"./lib/parser":37,"./lib/resource":38}],36:[function(require,module,exports){
'use strict';

/*
 * A very naive copy-on-write immutable stack. Since the size of the stack
 * is equal to the depth of the embedded resources for one HAL resource, the bad
 * performance for the copy-on-write approach is probably not a problem at all.
 * Might be replaced by a smarter solution later. Or not. Whatever.
 */
function ImmutableStack() {
  if (arguments.length >= 1) {
    this._array = arguments[0];
  } else {
    this._array = [];
  }
}

ImmutableStack.prototype.array = function() {
  return this._array;
};

ImmutableStack.prototype.isEmpty = function(array) {
  return this._array.length === 0;
};

ImmutableStack.prototype.push = function(element) {
  var array = this._array.slice(0);
  array.push(element);
  return new ImmutableStack(array);
};

ImmutableStack.prototype.pop = function() {
  var array = this._array.slice(0, this._array.length - 1);
  return new ImmutableStack(array);
};

ImmutableStack.prototype.peek = function() {
  if (this.isEmpty()) {
    throw new Error('can\'t peek on empty stack');
  }
  return this._array[this._array.length - 1];
};

module.exports = ImmutableStack;

},{}],37:[function(require,module,exports){
'use strict';

var Resource = require('./resource')
  , Stack = require('./immutable_stack');

var linkSpec = {
  href: { required: true, defaultValue: null },
  templated: { required: false, defaultValue: false },
  type: { required: false, defaultValue: null },
  deprecation: { required: false, defaultValue: null },
  name: { required: false, defaultValue: null },
  profile: { required: false, defaultValue: null },
  title: { required: false, defaultValue: null },
  hreflang: { required: false, defaultValue: null }
};

function Parser() {
}

Parser.prototype.parse = function parse(unparsed, validationFlag) {
  var validation = validationFlag ? [] : null;
  return _parse(unparsed, validation, new Stack());
};

function _parse(unparsed, validation, path) {
  if (unparsed == null) {
    return unparsed;
  }
  var allLinkArrays = parseLinks(unparsed._links, validation,
      path.push('_links'));
  var curies = parseCuries(allLinkArrays);
  var allEmbeddedArrays = parseEmbeddedResourcess(unparsed._embedded,
      validation, path.push('_embedded'));
  var resource = new Resource(allLinkArrays, curies, allEmbeddedArrays,
      validation);
  copyNonHalProperties(unparsed, resource);
  resource._original = unparsed;
  return resource;
}

function parseLinks(links, validation, path) {
  links = parseHalProperty(links, parseLink, validation, path);
  if (links == null || links.self == null) {
    // No links at all? Then it implictly misses the self link which it SHOULD
    // have according to spec
    reportValidationIssue('Resource does not have a self link', validation,
        path);
  }
  return links;
}

function parseCuries(linkArrays) {
  if (linkArrays) {
    return linkArrays.curies;
  } else {
    return [];
  }
}

function parseEmbeddedResourcess(original, parentValidation, path) {
  var embedded = parseHalProperty(original, identity, parentValidation, path);
  if (embedded == null) {
    return embedded;
  }
  Object.keys(embedded).forEach(function(key) {
    embedded[key] = embedded[key].map(function(embeddedElement) {
      var childValidation = parentValidation != null ? [] : null;
      var embeddedResource = _parse(embeddedElement, childValidation,
          path.push(key));
      embeddedResource._original = embeddedElement;
      return embeddedResource;
    });
  });
  return embedded;
}

/*
 * Copy over non-hal properties (everything that is not _links or _embedded)
 * to the parsed resource.
 */
function copyNonHalProperties(unparsed, resource) {
  Object.keys(unparsed).forEach(function(key) {
    if (key !== '_links' && key !== '_embedded') {
      resource[key] = unparsed[key];
    }
  });
}

/*
 * Processes one of the two main hal properties, that is _links or _embedded.
 * Each sub-property is turned into a single element array if it isn't already
 * an array. processingFunction is applied to each array element.
 */
function parseHalProperty(property, processingFunction, validation, path) {
  if (property == null) {
    return property;
  }

  // create a shallow copy of the _links/_embedded object
  var copy = {};

  // normalize each link/each embedded object and put it into our copy
  Object.keys(property).forEach(function(key) {
    copy[key] = arrayfy(key, property[key], processingFunction,
        validation, path);
  });
  return copy;
}

function arrayfy(key, object, fn, validation, path) {
  if (isArray(object)) {
    return object.map(function(element) {
      return fn(key, element, validation, path);
    });
  } else {
    return [fn(key, object, validation, path)];
  }
}


function parseLink(linkKey, link, validation, path) {
  if (!isObject(link)) {
    throw new Error('Link object is not an actual object: ' + link +
      ' [' + typeof link + ']');
  }

  // create a shallow copy of the link object
  var copy = shallowCopy(link);

  // add missing properties mandated by spec and do generic validation
  Object.keys(linkSpec).forEach(function(key) {
    if (copy[key] == null) {
      if (linkSpec[key].required) {
        reportValidationIssue('Link misses required property ' + key + '.',
            validation, path.push(linkKey));
      }
      if (linkSpec[key].defaultValue != null) {
        copy[key] = linkSpec[key].defaultValue;
      }
    }
  });

  // check more inter-property relations mandated by spec
  if (copy.deprecation) {
    log('Warning: Link ' + pathToString(path.push(linkKey)) +
        ' is deprecated, see ' + copy.deprecation);
  }
  if (copy.templated !== true && copy.templated !== false) {
    copy.templated = false;
  }

  if (!validation) {
    return copy;
  }
  if (copy.href && copy.href.indexOf('{') >= 0 && !copy.templated) {
    reportValidationIssue('Link seems to be an URI template ' +
        'but its "templated" property is not set to true.', validation,
        path.push(linkKey));
  }
  return copy;
}

function isArray(o) {
  return Object.prototype.toString.call(o) === '[object Array]';
}

function isObject(o) {
  return typeof o === 'object';
}

function identity(key, object) {
  return object;
}

function reportValidationIssue(message, validation, path) {
  if (validation) {
    validation.push({
      path: pathToString(path),
      message: message
    });
  }
}

// TODO fix this ad hoc mess - does ie support console.log as of ie9?
function log(message) {
  if (typeof console !== 'undefined' && typeof console.log === 'function') {
    console.log(message);
  }
}

function shallowCopy(source) {
  var copy = {};
  Object.keys(source).forEach(function(key) {
    copy[key] = source[key];
  });
  return copy;
}

function pathToString(path) {
  var s = '$.';
  for (var i = 0; i < path.array().length; i++) {
    s += path.array()[i] + '.';
  }
  s = s.substring(0, s.length - 1);
  return s;
}

module.exports = Parser;

},{"./immutable_stack":36,"./resource":38}],38:[function(require,module,exports){
'use strict';

function Resource(links, curies, embedded, validationIssues) {
  var self = this;
  this._links = links || {};
  this._initCuries(curies);
  this._embedded = embedded || {};
  this._validation = validationIssues || [];
}

Resource.prototype._initCuries = function(curies) {
  this._curiesMap = {};
  if (!curies) {
    this._curies = [];
  } else {
    this._curies = curies;
    for (var i = 0; i < this._curies.length; i++) {
      var curie = this._curies[i];
      this._curiesMap[curie.name] = curie;
    }
  }
  this._preResolveCuries();
};

Resource.prototype._preResolveCuries = function() {
  this._resolvedCuriesMap = {};
  for (var i = 0; i < this._curies.length; i++) {
    var curie = this._curies[i];
    if (!curie.name) {
      continue;
    }
    for (var rel in this._links) {
      if (rel !== 'curies') {
        this._preResolveCurie(curie, rel);
      }
    }
  }
};

Resource.prototype._preResolveCurie = function(curie, rel) {
  var link = this._links[rel];
  var prefixAndReference = rel.split(/:(.+)/);
  var candidate = prefixAndReference[0];
  if (curie.name === candidate) {
    if (curie.templated && prefixAndReference.length >= 1) {
      // TODO resolving templated CURIES should use a small uri template
      // lib, not coded here ad hoc
      var href = curie.href.replace(/(.*){(.*)}(.*)/, '$1' +
          prefixAndReference[1] + '$3');
      this._resolvedCuriesMap[href] = rel;
    } else {
      this._resolvedCuriesMap[curie.href] = rel;
    }
  }
};

Resource.prototype.allLinkArrays = function() {
  return this._links;
};

Resource.prototype.linkArray = function(key) {
  return propertyArray(this._links, key);
};

Resource.prototype.link = function(key, index) {
  return elementOfPropertyArray(this._links, key, index);
};

Resource.prototype.hasCuries = function(key) {
  return this._curies.length > 0;
};

Resource.prototype.curieArray = function(key) {
  return this._curies;
};

Resource.prototype.curie = function(name) {
  return this._curiesMap[name];
};

Resource.prototype.reverseResolveCurie = function(fullUrl) {
  return this._resolvedCuriesMap[fullUrl];
};

Resource.prototype.allEmbeddedResourceArrays = function () {
  return this._embedded;
};

Resource.prototype.embeddedResourceArray = function(key) {
  return propertyArray(this._embedded, key);
};

Resource.prototype.embeddedResource = function(key, index) {
  return elementOfPropertyArray(this._embedded, key, index);
};

Resource.prototype.original = function() {
  return this._original;
};

function propertyArray(object, key) {
  return object != null ? object[key] : null;
}

function elementOfPropertyArray(object, key, index) {
  index = index || 0;
  var array = propertyArray(object, key);
  if (array != null && array.length >= 1) {
    return array[index];
  }
  return null;
}

Resource.prototype.validationIssues = function() {
  return this._validation;
};

// alias definitions
Resource.prototype.allLinks = Resource.prototype.allLinkArrays;
Resource.prototype.allEmbeddedArrays =
    Resource.prototype.allEmbeddedResources =
    Resource.prototype.allEmbeddedResourceArrays;
Resource.prototype.embeddedArray = Resource.prototype.embeddedResourceArray;
Resource.prototype.embedded = Resource.prototype.embeddedResource;
Resource.prototype.validation = Resource.prototype.validationIssues;

module.exports = Resource;

},{}],39:[function(require,module,exports){
module.exports=function(n){var o,t,e,f={},i=[];n=n||this,n.on=function(n,o,t){(f[n]=f[n]||[]).push([o,t])},n.off=function(n,t){for(n||(f={}),o=f[n]||i,e=o.length=t?o.length:0;e--;)t==o[e][0]&&o.splice(e,1)},n.emit=function(n){for(o=f[n]||i,e=0;t=o[e++];)t[0].apply(t[1],i.slice.call(arguments,1))}};
},{}]},{},[1])(1)
});


//# sourceMappingURL=teleport-autocomplete.js.map
