import 'classlist-polyfill';

import halfred from 'halfred';
import events from 'minivents';

import assign from 'core-js/library/fn/object/assign';
import find from 'core-js/library/fn/array/find';
import escapeRegexp from 'core-js/library/fn/regexp/escape';
import debounce from 'debounce';

const Key = { BACK: 8, TAB: 9, ENTER: 13, UP: 38, DOWN: 40 };
const API_URL = 'https://api.teleport.org/api';
const CONTAINER_TEMPLATE = '<div class="tp-autocomplete"><ul class="tp-ac__list"></ul></div>';
const INPUT_CLASS = 'tp-ac__input';
const ACTIVE_CLASS = 'is-active';
const LOADING_CLASS = 'spinner';
const itemWrapperTemplate = item => `<li class="tp-ac__item">${item}</li>`;
const NO_RESULTS_TEMPLATE = '<li class="tp-ac__item no-results">No matches</li>';


// Default item template, wraps title matches
const ITEM_TEMPLATE = function renderItem(item) {
  return this.wrapMatches(item.title);
};

// Shorthands
EventTarget.prototype.on = EventTarget.prototype.addEventListener;
EventTarget.prototype.off = EventTarget.prototype.removeEventListener;


/**
 * Teleport Cities Autocomplete
 */
class TeleportAutocomplete {
  get query() { return this._query; }
  set query(q) {
    this._query = q;
    this.el.value = q;
  }

  get activeIndex() { return this._activeIndex; }
  set activeIndex(i) {
    // Remove old highlight
    const oldNode = this.list.childNodes[this._activeIndex];
    if (oldNode) oldNode.classList.remove(ACTIVE_CLASS);

    this._activeIndex = i;

    // Set highlight
    const activeNode = this.list.childNodes[i];
    if (activeNode) activeNode.classList.add(ACTIVE_CLASS);
  }


  /**
   * Parse arguments and wrap input
   */
  constructor({
    el = null, maxItems = 10, itemTemplate = ITEM_TEMPLATE,
    embeds = 'city:country,city:admin1_division,city:timezone/tz:offsets-now,city:urban_area',
  } = options || {}) {
    events(this);

    this.setupInput(el);

    this.maxItems = maxItems;
    this.itemTemplate = itemTemplate;
    this.embeds = embeds;

    this._activeIndex = 0;
    this._cache = {};
    this._query = this.el.value;
    this.value = null;

    // Prefetch results
    this.fetchResults(() => this.value = this.getResultByTitle(this.query));

    this.getCities = debounce(this.getCities, 250);
  }


  /**
   * Clean up the container
   */
  destroy() {
    this.el.off('input', this.oninput);
    this.el.off('keydown', this.onkeydown);
    this.el.off('focus', this.onfocus);
    this.el.off('blur', this.onblur);
    this.el.off('click', this.onclick);

    this.el.classList.remove(INPUT_CLASS);

    const containerParent = this.container.parentNode;
    containerParent.replaceChild(this.el.parentNode.removeChild(this.el), this.container);
  }


  /**
   * Wrap input node in container
   */
  setupInput(el) {
    if (!el || !(el instanceof HTMLInputElement)) throw new Error('Invalid element given');

    el.insertAdjacentHTML('beforebegin', CONTAINER_TEMPLATE);
    Object.defineProperty(this, 'container', { value: el.previousSibling });
    Object.defineProperty(this, 'list', { value: this.container.firstChild });

    const input = this.container.insertBefore(el.parentNode.removeChild(el), this.list);
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
  onlistclick(e) {
    const index = [].indexOf.call(this.list.children, e.target);
    this.selectByIndex(index);
  }

  // Select text on click
  onclick() { this.el.select(); }

  // Input has focus, open list
  onfocus() { this.renderList(); }

  // Input lost focus, close list
  onblur() { setTimeout(() => this.list.innerHTML = '', 100); }

  // Input was typed into
  oninput() {
    this.query = this.el.value;
    this.fetchResults(() => this.renderList());
  }

  // Called on keypresses
  onkeydown(e) {
    const code = e.keyCode;

    // Prevent cursor move
    if ([Key.UP, Key.DOWN].indexOf(code) !== -1) e.preventDefault();

    switch (code) {
    case Key.BACK:
      // Clear filled value or last char
      if (this.value || this.query.length === 1) this.selectByIndex(-1);
      break;
    case Key.ENTER:
      // Prevent submit if query is to be selected
      if (!this.value && this.query) e.preventDefault();
      this.selectByIndex(this.activeIndex);
      this.emit('picked', this.value);
      break;
    case Key.TAB: this.selectByIndex(this.activeIndex);
      break;
    case Key.UP: this.activeIndex = Math.max(0, this.activeIndex - 1);
      break;
    case Key.DOWN: this.activeIndex = Math.min(this.results.length - 1, this.activeIndex + 1);
      break;
    }
  }
  // ---------------------------------------------------------------------------


  /**
   * Select option from list by index
   */
  selectByIndex(index) {
    if (index === -1) this.results = [];
    this.activeIndex = index;
    this.value = this.results[index] || null;
    this.list.innerHTML = '';
    this.query = this.value ? this.value.title : '';
  }


  /**
   * Wrap matching result names in <span>s
   */
  wrapMatches(str = '') {
    let res = str;

    this.query.split(/[\,\s]+/).forEach(q => {
      if (q) res = res.replace(new RegExp(escapeRegexp(q), 'gi'), '<span>$&</span>');
    });

    return res;
  }


  /**
   * Render result list
   */
  renderList() {
    let results = this.results.map(r =>
      itemWrapperTemplate(this.itemTemplate(r))).join('');

    if (!results && this.query !== '') results = NO_RESULTS_TEMPLATE;
    this.list.innerHTML = results;

    this.activeIndex = 0;
  }


  /**
   * Fetch value from results by title
   */
  getResultByTitle(title) {
    if (!this.results || !title) return null;
    return find(this.results, r => r.title.indexOf(title) !== -1);
  }


  /**
   * Fetch picker data from cache or API
   */
  fetchResults(cb = function noop() {}) {
    // Cancel old request
    if (this.req) this.req.abort();

    const cached = this._cache[this.query];
    if (cached) {
      this.results = cached;
      return cb();
    }

    this.req = this.getCities(results => {
      this.results = this._cache[this.query] = results;
      cb();
      this.container.classList.remove(LOADING_CLASS);
    });

    this.container.classList.add(LOADING_CLASS);
  }


  /**
   * Make the API call
   */
  getCities(cb) {
    if (!this.query) return cb([]);
    const embed = `city:search-results/city:item/{${this.embeds}}`;

    const req = new XMLHttpRequest();
    req.open('GET', `${API_URL}/cities/?search=${this.query}&embed=${embed}`);
    req.on('load', () => cb(this.parseCities(JSON.parse(req.response))));
    req.send();

    return req;
  }


  /**
   * Parse API response
   */
  parseCities(json) {
    const results = halfred.parse(json).embeddedArray('city:search-results');

    return results.map(res => {
      const city = res.embedded('city:item');
      city.country = city.embedded('city:country');
      city.admin1_division = city.embedded('city:admin1_division');
      city.timezone = city.embedded('city:timezone');
      city.urban_area = city.embedded('city:urban_area');

      const { matching_full_name: title } = res;

      const { name, geoname_id: geonameId, population,
        location: { latlon: { latitude, longitude } } } = city;

      const result = { title, name, geonameId, latitude, longitude, population };

      if (city.country) assign(result, { country: city.country.name });
      if (city.admin1_division) assign(result, { admin1Division: city.admin1_division.name });

      if (city.timezone) {
        const tzNow = city.timezone.embedded('tz:offsets-now');
        assign(result, { tzOffsetMinutes: tzNow.total_offset_min });
      }

      if (city.urban_area) {
        const { name: uaName, ua_id: uaId, teleport_city_url: uaCityUrl } = city.urban_area;
        assign(result, { uaName, uaId, uaCityUrl });
      }

      return result;
    });
  }
}

export default TeleportAutocomplete;
