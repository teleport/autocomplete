/*! teleport-autocomplete - v0.3.1 | https://github.com/teleport/autocomplete#readme | MIT */
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.TeleportAutocomplete = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
/* global Ractive */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _coreJsLibraryFnObjectAssign = _dereq_('core-js/library/fn/object/assign');

var _coreJsLibraryFnObjectAssign2 = _interopRequireDefault(_coreJsLibraryFnObjectAssign);

var _autocomplete = _dereq_('./autocomplete');

var _autocomplete2 = _interopRequireDefault(_autocomplete);

var _templatesAutocompleteRac = _dereq_('../templates/autocomplete.rac');

var _templatesAutocompleteRac2 = _interopRequireDefault(_templatesAutocompleteRac);

exports['default'] = Ractive.extend({
  template: _templatesAutocompleteRac2['default'],

  data: {
    query: ''
  },

  onrender: function onrender() {
    var _this = this;

    var _get = this.get();

    var maxItems = _get.maxItems;
    var apiRoot = _get.apiRoot;
    var geoLocate = _get.geoLocate;
    var itemTemplate = _get.itemTemplate;
    var embeds = _get.embeds;
    var value = _get.value;

    this.ac = new _autocomplete2['default']((0, _coreJsLibraryFnObjectAssign2['default'])({ el: this.find('input') }, {
      maxItems: maxItems, apiRoot: apiRoot, geoLocate: geoLocate, itemTemplate: itemTemplate, embeds: embeds, value: value
    }));

    this.ac.on('change', function (val) {
      return _this.set('value', val);
    });
    this.ac.on('querychange', function (query) {
      return _this.set('query', query);
    });
  },

  onteardown: function onteardown() {
    this.ac.destroy();
  }
});
module.exports = exports['default'];

},{"../templates/autocomplete.rac":41,"./autocomplete":2,"core-js/library/fn/object/assign":5}],2:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

_dereq_('classlist-polyfill');

_dereq_('element-closest');

var _halfred = _dereq_('halfred');

var _halfred2 = _interopRequireDefault(_halfred);

var _minivents = _dereq_('minivents');

var _minivents2 = _interopRequireDefault(_minivents);

var _coreJsLibraryFnObjectAssign = _dereq_('core-js/library/fn/object/assign');

var _coreJsLibraryFnObjectAssign2 = _interopRequireDefault(_coreJsLibraryFnObjectAssign);

var _coreJsLibraryFnArrayFind = _dereq_('core-js/library/fn/array/find');

var _coreJsLibraryFnArrayFind2 = _interopRequireDefault(_coreJsLibraryFnArrayFind);

var _coreJsLibraryFnRegexpEscape = _dereq_('core-js/library/fn/regexp/escape');

var _coreJsLibraryFnRegexpEscape2 = _interopRequireDefault(_coreJsLibraryFnRegexpEscape);

var _debounce = _dereq_('debounce');

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
    var value = _ref.value;
    var _ref$maxItems = _ref.maxItems;
    var maxItems = _ref$maxItems === undefined ? 10 : _ref$maxItems;
    var _ref$itemTemplate = _ref.itemTemplate;
    var itemTemplate = _ref$itemTemplate === undefined ? ITEM_TEMPLATE : _ref$itemTemplate;
    var _ref$geoLocate = _ref.geoLocate;
    var geoLocate = _ref$geoLocate === undefined ? true : _ref$geoLocate;
    var _ref$apiRoot = _ref.apiRoot;
    var apiRoot = _ref$apiRoot === undefined ? 'https://api.teleport.org/api' : _ref$apiRoot;
    var _ref$apiVersion = _ref.apiVersion;
    var apiVersion = _ref$apiVersion === undefined ? 1 : _ref$apiVersion;
    var _ref$embeds = _ref.embeds;
    var embeds = _ref$embeds === undefined ? 'city:country,city:admin1_division,city:timezone/tz:offsets-now,city:urban_area' : _ref$embeds;

    _classCallCheck(this, TeleportAutocomplete);

    (0, _minivents2['default'])(this);

    var elem = typeof el === 'string' ? document.querySelector(el) : el;
    this.setupInput(elem);

    (0, _coreJsLibraryFnObjectAssign2['default'])(this, {
      maxItems: maxItems, geoLocate: geoLocate, apiRoot: apiRoot, apiVersion: apiVersion, itemTemplate: itemTemplate, embeds: embeds, results: [],
      _activeIndex: 0, _cache: {}, _query: this.el.value, value: value
    });

    // Prefetch results
    if (this.value && this.value.title) {
      this.query = this.value.title;
    } else if (this.query) {
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
     * Clear the selected value
     */
  }, {
    key: 'clear',
    value: function clear() {
      this.results = [];
      this.selectByIndex(0);
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

      this.list.on('mousedown', this.onlistclick.bind(this));
    }

    /**
     * Event handlers
     */

    // Clicked on list item, select item
  }, {
    key: 'onlistclick',
    value: function onlistclick(event) {
      var index = [].indexOf.call(this.list.children, event.target.closest('.tp-ac__item'));
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
      this.list.innerHTML = '';
    }

    // Input was typed into
  }, {
    key: 'oninput',
    value: function oninput() {
      var _this2 = this;

      this._query = this.el.value;
      this.fetchResults(function () {
        return _this2.renderList();
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
          if (this.value || this.query.length === 1) this.clear();
          break;
        case Key.ENTER:
          // Prevent submit if query is to be selected
          if (!this.value && this.query) event.preventDefault();
          this.selectByIndex(this.activeIndex);
          break;
        case Key.TAB:
          if (!this.value) this.selectByIndex(this.activeIndex);
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
      this.activeIndex = index;
      var oldValue = this.value;
      this.value = this.results[index] || null;

      var isGeolocate = this.list.firstChild && this.list.firstChild.classList.contains('geolocate');
      if (isGeolocate) this.currentLocation();

      if (oldValue !== this.value && !isGeolocate) this.emit('change', this.value);

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
        var matcher = new RegExp((0, _coreJsLibraryFnRegexpEscape2['default'])(query) + '(?![^<]*>|[^<>]*<\/)', 'gi');
        res = res.replace(matcher, '<span>$&</span>');
      });

      return res;
    }

    /**
     * Render result list
     */
  }, {
    key: 'renderList',
    value: function renderList() {
      var _this3 = this;

      var _ref2 = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      var _ref2$geoLocate = _ref2.geoLocate;
      var geoLocate = _ref2$geoLocate === undefined ? this.geoLocate : _ref2$geoLocate;

      var results = this.results.map(function (res) {
        return itemWrapperTemplate(_this3.itemTemplate(res));
      }).slice(0, this.maxItems).join('');

      if (!results && this.query !== '' && !this.value) results = NO_RESULTS_TEMPLATE;
      if (this.query === '' && geoLocate) results = GEOLOCATE_TEMPLATE;
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
      var _this4 = this;

      var cb = arguments.length <= 0 || arguments[0] === undefined ? function noop() {} : arguments[0];

      // Cancel old request
      if (this.req) this.req.abort();

      var cached = this._cache[this.query];
      if (cached) {
        this.results = cached;
        return cb();
      }

      this.req = this.getCities(function (results) {
        _this4.results = _this4._cache[_this4.query] = results;
        cb();
        _this4.loading = false;
      });

      this.loading = true;
    }

    /**
     * Geolocate current city
     */
  }, {
    key: 'currentLocation',
    value: function currentLocation() {
      var _this5 = this;

      var req = new XMLHttpRequest();
      var embed = 'location:nearest-cities/location:nearest-city/' + (this.embeds ? '{' + this.embeds + '}' : '');

      this.loading = true;
      this.oldPlaceholder = this.el.placeholder;
      this.el.placeholder = 'Detecting location...';

      navigator.geolocation.getCurrentPosition(function (_ref3) {
        var coords = _ref3.coords;

        req.open('GET', _this5.apiRoot + '/locations/' + coords.latitude + ',' + coords.longitude + '/?embed=' + embed);
        req.setRequestHeader('Accept', 'application/vnd.teleport.v' + _this5.apiVersion + '+json');
        req.addEventListener('load', function () {
          return _this5.parseLocation(JSON.parse(req.response));
        });
        req.send();
      }, function (_ref4) {
        var message = _ref4.message;

        _this5.loading = false;
        _this5.el.placeholder = message;
        setTimeout(function () {
          return _this5.el.placeholder = _this5.oldPlaceholder;
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
        if (this.geoLocate === 'nopick') {
          this.el.focus();
          this.renderList({ geoLocate: false });
        } else {
          this.selectByIndex(0);
        }
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
      var _this6 = this;

      if (!this.query) return cb([]);
      var embed = 'city:search-results/city:item/' + (this.embeds ? '{' + this.embeds + '}' : '');

      var req = new XMLHttpRequest();
      req.open('GET', this.apiRoot + '/cities/?search=' + this.query + '&embed=' + embed + '&limit=' + this.maxItems);
      req.setRequestHeader('Accept', 'application/vnd.teleport.v' + this.apiVersion + '+json');
      req.addEventListener('load', function () {
        var results = _halfred2['default'].parse(JSON.parse(req.response)).embeddedArray('city:search-results').map(function (res) {
          return _this6.parseCity(res);
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
      if (city.admin1_division) {
        var _city$admin1_division = city.admin1_division;
        var admin1Division = _city$admin1_division.name;
        var admin1DivisionCode = _city$admin1_division.geonames_admin1_code;

        (0, _coreJsLibraryFnObjectAssign2['default'])(result, { admin1Division: admin1Division, admin1DivisionCode: admin1DivisionCode });
      }

      if (city.timezone) {
        var tzNow = city.timezone.embedded('tz:offsets-now');
        (0, _coreJsLibraryFnObjectAssign2['default'])(result, { tzOffsetMinutes: tzNow.total_offset_min });
      }

      if (city.urban_area) {
        var _city$urban_area = city.urban_area;
        var uaSlug = _city$urban_area.slug;
        var uaName = _city$urban_area.name;
        var uaId = _city$urban_area.ua_id;
        var uaCityUrl = _city$urban_area.teleport_city_url;

        (0, _coreJsLibraryFnObjectAssign2['default'])(result, { uaName: uaName, uaId: uaId, uaCityUrl: uaCityUrl, uaSlug: uaSlug });
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

},{"classlist-polyfill":3,"core-js/library/fn/array/find":4,"core-js/library/fn/object/assign":5,"core-js/library/fn/regexp/escape":6,"debounce":34,"element-closest":35,"halfred":36,"minivents":40}],3:[function(_dereq_,module,exports){
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

},{}],4:[function(_dereq_,module,exports){
_dereq_('../../modules/es6.array.find');
module.exports = _dereq_('../../modules/$.core').Array.find;
},{"../../modules/$.core":12,"../../modules/es6.array.find":30}],5:[function(_dereq_,module,exports){
_dereq_('../../modules/es6.object.assign');
module.exports = _dereq_('../../modules/$.core').Object.assign;
},{"../../modules/$.core":12,"../../modules/es6.object.assign":31}],6:[function(_dereq_,module,exports){
_dereq_('../../modules/es7.regexp.escape');
module.exports = _dereq_('../../modules/$.core').RegExp.escape;
},{"../../modules/$.core":12,"../../modules/es7.regexp.escape":32}],7:[function(_dereq_,module,exports){
module.exports = function(it){
  if(typeof it != 'function')throw TypeError(it + ' is not a function!');
  return it;
};
},{}],8:[function(_dereq_,module,exports){
module.exports = function(){ /* empty */ };
},{}],9:[function(_dereq_,module,exports){
// 0 -> Array#forEach
// 1 -> Array#map
// 2 -> Array#filter
// 3 -> Array#some
// 4 -> Array#every
// 5 -> Array#find
// 6 -> Array#findIndex
var ctx      = _dereq_('./$.ctx')
  , IObject  = _dereq_('./$.iobject')
  , toObject = _dereq_('./$.to-object')
  , toLength = _dereq_('./$.to-length')
  , asc      = _dereq_('./$.array-species-create');
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
      , result = IS_MAP ? asc($this, length) : IS_FILTER ? asc($this, 0) : undefined
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
},{"./$.array-species-create":10,"./$.ctx":13,"./$.iobject":18,"./$.to-length":26,"./$.to-object":27}],10:[function(_dereq_,module,exports){
// 9.4.2.3 ArraySpeciesCreate(originalArray, length)
var isObject = _dereq_('./$.is-object')
  , isArray  = _dereq_('./$.is-array')
  , SPECIES  = _dereq_('./$.wks')('species');
module.exports = function(original, length){
  var C;
  if(isArray(original)){
    C = original.constructor;
    // cross-realm fallback
    if(typeof C == 'function' && (C === Array || isArray(C.prototype)))C = undefined;
    if(isObject(C)){
      C = C[SPECIES];
      if(C === null)C = undefined;
    }
  } return new (C === undefined ? Array : C)(length);
};
},{"./$.is-array":19,"./$.is-object":20,"./$.wks":29}],11:[function(_dereq_,module,exports){
var toString = {}.toString;

module.exports = function(it){
  return toString.call(it).slice(8, -1);
};
},{}],12:[function(_dereq_,module,exports){
var core = module.exports = {version: '1.2.6'};
if(typeof __e == 'number')__e = core; // eslint-disable-line no-undef
},{}],13:[function(_dereq_,module,exports){
// optional / simple context binding
var aFunction = _dereq_('./$.a-function');
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
},{"./$.a-function":7}],14:[function(_dereq_,module,exports){
// 7.2.1 RequireObjectCoercible(argument)
module.exports = function(it){
  if(it == undefined)throw TypeError("Can't call method on  " + it);
  return it;
};
},{}],15:[function(_dereq_,module,exports){
var global    = _dereq_('./$.global')
  , core      = _dereq_('./$.core')
  , ctx       = _dereq_('./$.ctx')
  , PROTOTYPE = 'prototype';

var $export = function(type, name, source){
  var IS_FORCED = type & $export.F
    , IS_GLOBAL = type & $export.G
    , IS_STATIC = type & $export.S
    , IS_PROTO  = type & $export.P
    , IS_BIND   = type & $export.B
    , IS_WRAP   = type & $export.W
    , exports   = IS_GLOBAL ? core : core[name] || (core[name] = {})
    , target    = IS_GLOBAL ? global : IS_STATIC ? global[name] : (global[name] || {})[PROTOTYPE]
    , key, own, out;
  if(IS_GLOBAL)source = name;
  for(key in source){
    // contains in native
    own = !IS_FORCED && target && key in target;
    if(own && key in exports)continue;
    // export native or passed
    out = own ? target[key] : source[key];
    // prevent global pollution for namespaces
    exports[key] = IS_GLOBAL && typeof target[key] != 'function' ? source[key]
    // bind timers to global for call from export context
    : IS_BIND && own ? ctx(out, global)
    // wrap global constructors for prevent change them in library
    : IS_WRAP && target[key] == out ? (function(C){
      var F = function(param){
        return this instanceof C ? new C(param) : C(param);
      };
      F[PROTOTYPE] = C[PROTOTYPE];
      return F;
    // make static versions for prototype methods
    })(out) : IS_PROTO && typeof out == 'function' ? ctx(Function.call, out) : out;
    if(IS_PROTO)(exports[PROTOTYPE] || (exports[PROTOTYPE] = {}))[key] = out;
  }
};
// type bitmap
$export.F = 1;  // forced
$export.G = 2;  // global
$export.S = 4;  // static
$export.P = 8;  // proto
$export.B = 16; // bind
$export.W = 32; // wrap
module.exports = $export;
},{"./$.core":12,"./$.ctx":13,"./$.global":17}],16:[function(_dereq_,module,exports){
module.exports = function(exec){
  try {
    return !!exec();
  } catch(e){
    return true;
  }
};
},{}],17:[function(_dereq_,module,exports){
// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
var global = module.exports = typeof window != 'undefined' && window.Math == Math
  ? window : typeof self != 'undefined' && self.Math == Math ? self : Function('return this')();
if(typeof __g == 'number')__g = global; // eslint-disable-line no-undef
},{}],18:[function(_dereq_,module,exports){
// fallback for non-array-like ES3 and non-enumerable old V8 strings
var cof = _dereq_('./$.cof');
module.exports = Object('z').propertyIsEnumerable(0) ? Object : function(it){
  return cof(it) == 'String' ? it.split('') : Object(it);
};
},{"./$.cof":11}],19:[function(_dereq_,module,exports){
// 7.2.2 IsArray(argument)
var cof = _dereq_('./$.cof');
module.exports = Array.isArray || function(arg){
  return cof(arg) == 'Array';
};
},{"./$.cof":11}],20:[function(_dereq_,module,exports){
module.exports = function(it){
  return typeof it === 'object' ? it !== null : typeof it === 'function';
};
},{}],21:[function(_dereq_,module,exports){
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
},{}],22:[function(_dereq_,module,exports){
// 19.1.2.1 Object.assign(target, source, ...)
var $        = _dereq_('./$')
  , toObject = _dereq_('./$.to-object')
  , IObject  = _dereq_('./$.iobject');

// should work with symbols and should have deterministic property order (V8 bug)
module.exports = _dereq_('./$.fails')(function(){
  var a = Object.assign
    , A = {}
    , B = {}
    , S = Symbol()
    , K = 'abcdefghijklmnopqrst';
  A[S] = 7;
  K.split('').forEach(function(k){ B[k] = k; });
  return a({}, A)[S] != 7 || Object.keys(a({}, B)).join('') != K;
}) ? function assign(target, source){ // eslint-disable-line no-unused-vars
  var T     = toObject(target)
    , $$    = arguments
    , $$len = $$.length
    , index = 1
    , getKeys    = $.getKeys
    , getSymbols = $.getSymbols
    , isEnum     = $.isEnum;
  while($$len > index){
    var S      = IObject($$[index++])
      , keys   = getSymbols ? getKeys(S).concat(getSymbols(S)) : getKeys(S)
      , length = keys.length
      , j      = 0
      , key;
    while(length > j)if(isEnum.call(S, key = keys[j++]))T[key] = S[key];
  }
  return T;
} : Object.assign;
},{"./$":21,"./$.fails":16,"./$.iobject":18,"./$.to-object":27}],23:[function(_dereq_,module,exports){
module.exports = function(regExp, replace){
  var replacer = replace === Object(replace) ? function(part){
    return replace[part];
  } : replace;
  return function(it){
    return String(it).replace(regExp, replacer);
  };
};
},{}],24:[function(_dereq_,module,exports){
var global = _dereq_('./$.global')
  , SHARED = '__core-js_shared__'
  , store  = global[SHARED] || (global[SHARED] = {});
module.exports = function(key){
  return store[key] || (store[key] = {});
};
},{"./$.global":17}],25:[function(_dereq_,module,exports){
// 7.1.4 ToInteger
var ceil  = Math.ceil
  , floor = Math.floor;
module.exports = function(it){
  return isNaN(it = +it) ? 0 : (it > 0 ? floor : ceil)(it);
};
},{}],26:[function(_dereq_,module,exports){
// 7.1.15 ToLength
var toInteger = _dereq_('./$.to-integer')
  , min       = Math.min;
module.exports = function(it){
  return it > 0 ? min(toInteger(it), 0x1fffffffffffff) : 0; // pow(2, 53) - 1 == 9007199254740991
};
},{"./$.to-integer":25}],27:[function(_dereq_,module,exports){
// 7.1.13 ToObject(argument)
var defined = _dereq_('./$.defined');
module.exports = function(it){
  return Object(defined(it));
};
},{"./$.defined":14}],28:[function(_dereq_,module,exports){
var id = 0
  , px = Math.random();
module.exports = function(key){
  return 'Symbol('.concat(key === undefined ? '' : key, ')_', (++id + px).toString(36));
};
},{}],29:[function(_dereq_,module,exports){
var store  = _dereq_('./$.shared')('wks')
  , uid    = _dereq_('./$.uid')
  , Symbol = _dereq_('./$.global').Symbol;
module.exports = function(name){
  return store[name] || (store[name] =
    Symbol && Symbol[name] || (Symbol || uid)('Symbol.' + name));
};
},{"./$.global":17,"./$.shared":24,"./$.uid":28}],30:[function(_dereq_,module,exports){
'use strict';
// 22.1.3.8 Array.prototype.find(predicate, thisArg = undefined)
var $export = _dereq_('./$.export')
  , $find   = _dereq_('./$.array-methods')(5)
  , KEY     = 'find'
  , forced  = true;
// Shouldn't skip holes
if(KEY in [])Array(1)[KEY](function(){ forced = false; });
$export($export.P + $export.F * forced, 'Array', {
  find: function find(callbackfn/*, that = undefined */){
    return $find(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
  }
});
_dereq_('./$.add-to-unscopables')(KEY);
},{"./$.add-to-unscopables":8,"./$.array-methods":9,"./$.export":15}],31:[function(_dereq_,module,exports){
// 19.1.3.1 Object.assign(target, source)
var $export = _dereq_('./$.export');

$export($export.S + $export.F, 'Object', {assign: _dereq_('./$.object-assign')});
},{"./$.export":15,"./$.object-assign":22}],32:[function(_dereq_,module,exports){
// https://github.com/benjamingr/RexExp.escape
var $export = _dereq_('./$.export')
  , $re     = _dereq_('./$.replacer')(/[\\^$*+?.()|[\]{}]/g, '\\$&');

$export($export.S, 'RegExp', {escape: function escape(it){ return $re(it); }});

},{"./$.export":15,"./$.replacer":23}],33:[function(_dereq_,module,exports){
module.exports = Date.now || now

function now() {
    return new Date().getTime()
}

},{}],34:[function(_dereq_,module,exports){

/**
 * Module dependencies.
 */

var now = _dereq_('date-now');

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

},{"date-now":33}],35:[function(_dereq_,module,exports){
(function (ELEMENT) {
	ELEMENT.matches = ELEMENT.matches || ELEMENT.mozMatchesSelector || ELEMENT.msMatchesSelector || ELEMENT.oMatchesSelector || ELEMENT.webkitMatchesSelector;

	ELEMENT.closest = ELEMENT.closest || function closest(selector) {
		var element = this;

		while (element) {
			if (element.matches(selector)) {
				break;
			}

			element = element.parentElement;
		}

		return element;
	};
}(Element.prototype));

},{}],36:[function(_dereq_,module,exports){
var Parser = _dereq_('./lib/parser')
  , Resource = _dereq_('./lib/resource')
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

},{"./lib/parser":38,"./lib/resource":39}],37:[function(_dereq_,module,exports){
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

},{}],38:[function(_dereq_,module,exports){
'use strict';

var Resource = _dereq_('./resource')
  , Stack = _dereq_('./immutable_stack');

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

},{"./immutable_stack":37,"./resource":39}],39:[function(_dereq_,module,exports){
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

},{}],40:[function(_dereq_,module,exports){
module.exports=function(n){var o={},t=[];n=n||this,n.on=function(n,t,e){(o[n]=o[n]||[]).push([t,e])},n.off=function(n,e){n||(o={});for(var f=o[n]||t,i=f.length=e?f.length:0;i--;)e==f[i][0]&&f.splice(i,1)},n.emit=function(n){for(var e,f=o[n]||t,i=0;e=f[i++];)e[0].apply(e[1],t.slice.call(arguments,1))}};
},{}],41:[function(_dereq_,module,exports){
module.exports={"v":3,"t":[{"t":7,"e":"input","a":{"type":"text","autocomplete":"off","value":[{"t":2,"r":"query"}],"class":["tp-ac__input ",{"t":2,"r":"class"}],"placeholder":[{"t":2,"r":"placeholder"}],"tabindex":[{"t":2,"r":"tabindex"}]}}]}
},{}]},{},[1])(1)
});


//# sourceMappingURL=teleport-autocomplete-ractive.js.map
