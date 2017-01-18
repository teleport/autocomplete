import 'classlist-polyfill';
import 'element-closest';

import halfred from 'halfred';
import events from 'minivents';

import assign from 'core-js/library/fn/object/assign';
import find from 'core-js/library/fn/array/find';
import escapeRegexp from 'core-js/library/fn/regexp/escape';
import debounce from 'debounce';

const Key = { BACK: 8, TAB: 9, ENTER: 13, UP: 38, DOWN: 40 };
const CONTAINER_TEMPLATE = '<div class="tp-autocomplete"><ul class="tp-ac__list"></ul></div>';
const INPUT_CLASS = 'tp-ac__input';
const itemWrapperTemplate = item => `<li class="tp-ac__item">${item}</li>`;
const NO_RESULTS_TEMPLATE = '<li class="tp-ac__item no-results">No matches</li>';
const GEOLOCATE_TEMPLATE = '<li class="tp-ac__item geolocate">Detect my current location</li>';

// Default item template, wraps title matches
const ITEM_TEMPLATE = function renderItem(item) {
  return this.wrapMatches(item.title);
};

// Shorthands
HTMLElement.prototype.on = HTMLElement.prototype.addEventListener;
HTMLElement.prototype.off = HTMLElement.prototype.removeEventListener;


/**
 * Teleport Cities Autocomplete
 */
class TeleportAutocomplete {
  get query() { return this._query; }
  set query(query) {
    if (query === this._query) return query;

    this._query = query;
    this.el.value = query;
    this.emit('querychange', query);
  }

  get activeIndex() { return this._activeIndex; }
  set activeIndex(index) {
    // Remove old highlight
    const oldNode = this.list.childNodes[this._activeIndex];
    if (oldNode) oldNode.classList.remove('is-active');

    this._activeIndex = index;

    // Set highlight
    const activeNode = this.list.childNodes[index];
    if (activeNode) activeNode.classList.add('is-active');
  }

  // Show or hide loading
  set loading(toggle) {
    this.container.classList.toggle('spinner', toggle);
  }


  /**
   * Parse arguments and wrap input
   */
  constructor({
    el = null, value, maxItems = 10, itemTemplate = ITEM_TEMPLATE,
    geoLocate = true, apiRoot = 'https://api.teleport.org/api', apiVersion = 1,
    embeds = 'city:country,city:admin1_division,city:timezone/tz:offsets-now,city:urban_area',
  } = {}) {
    events(this);

    const elem = (typeof el === 'string') ? document.querySelector(el) : el;
    this.setupInput(elem);

    assign(this, {
      maxItems, geoLocate, apiRoot, apiVersion, itemTemplate, embeds, results: [],
      _activeIndex: 0, _cache: {}, _query: this.el.value, value,
    });

    // Prefetch results
    if (this.value && this.value.title) {
      this.query = this.value.title;
    } else if (this.query) {
      this.fetchResults(() => {
        this.value = this.getResultByTitle(this.query);
        this.emit('change', this.value);
      });
    }

    this.getCities = debounce(this.getCities, 200);
    return this;
  }

  /**
   * Init shorthand
   */
  static init(el, options = {}) {
    const opt = (typeof el === 'string' || el instanceof HTMLInputElement) ? assign(options, { el }) : el;
    return new TeleportAutocomplete(opt);
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
   * Clear the selected value
   */
  clear() {
    this.results = [];
    this.selectByIndex(0);
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

    this.list.on('mousedown', this.onlistclick.bind(this));
  }

  /**
   * Event handlers
   */

  // Clicked on list item, select item
  onlistclick(event) {
    const index = [].indexOf.call(this.list.children, event.target.closest('.tp-ac__item'));
    this.selectByIndex(index);
  }

  // Select text on click
  onclick() { this.el.select(); }

  // Input has focus, open list
  onfocus() { this.renderList(); }

  // Input lost focus, close list
  onblur() { this.list.innerHTML = ''; }

  // Input was typed into
  oninput() {
    this._query = this.el.value;
    this.fetchResults(() => this.renderList());
  }

  // Called on keypresses
  onkeydown(event) {
    const code = event.keyCode;

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
    case Key.TAB: if (!this.value) this.selectByIndex(this.activeIndex);
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
    this.activeIndex = index;
    const oldValue = this.value;
    this.value = this.results[index] || null;

    const isGeolocate = this.list.firstChild && this.list.firstChild.classList.contains('geolocate');
    if (isGeolocate) this.currentLocation();

    if (oldValue !== this.value && !isGeolocate) this.emit('change', this.value);

    this.list.innerHTML = '';
    this.query = this.value ? this.value.title : '';
  }


  /**
   * Wrap matching result names in <span>s
   */
  wrapMatches(str = '') {
    let res = str;

    this.query
      .split(/[\,\s]+/)
      .filter(qr => !!qr)
      .forEach(query => {
        const matcher = new RegExp(escapeRegexp(query) + '(?![^<]*>|[^<>]*<\/)', 'gi');
        res = res.replace(matcher, '<span>$&</span>');
      });

    return res;
  }


  /**
   * Render result list
   */
  renderList({ geoLocate = this.geoLocate } = {}) {
    let results = this.results.map(res =>
      itemWrapperTemplate(this.itemTemplate(res)))
      .slice(0, this.maxItems).join('');

    if (!results && this.query !== '' && !this.value) results = NO_RESULTS_TEMPLATE;
    if (this.query === '' && geoLocate) results = GEOLOCATE_TEMPLATE;
    this.list.innerHTML = results;

    this.activeIndex = 0;
  }


  /**
   * Fetch value from results by title
   */
  getResultByTitle(title) {
    if (!this.results || !title) return null;
    return find(this.results, res => res.title.indexOf(title) !== -1);
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
      this.loading = false;
    });

    this.loading = true;
  }


  /**
   * Geolocate current city
   */
  currentLocation() {
    const req = new XMLHttpRequest();
    const embed = `location:nearest-cities/location:nearest-city/${this.embeds ? `{${this.embeds}}` : ''}`;

    this.loading = true;
    this.oldPlaceholder = this.el.placeholder;
    this.el.placeholder = 'Detecting location...';

    navigator.geolocation.getCurrentPosition(({ coords }) => {
      req.open('GET', `${this.apiRoot}/locations/${coords.latitude},${coords.longitude}/?embed=${embed}`);
      req.setRequestHeader('Accept', `application/vnd.teleport.v${this.apiVersion}+json`);
      req.addEventListener('load', () => this.parseLocation(JSON.parse(req.response)));
      req.send();
    }, ({ message }) => {
      this.loading = false;
      this.el.placeholder = message;
      setTimeout(() => this.el.placeholder = this.oldPlaceholder, 3000);
    }, { timeout: 5000 });
  }


  /**
   * Parse current location API response
   */
  parseLocation(json) {
    const res = halfred.parse(json);
    const nearest = res.embeddedArray('location:nearest-cities')[0];
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
  getCities(cb) {
    if (!this.query) return cb([]);
    const embed = `city:search-results/city:item/${this.embeds ? `{${this.embeds}}` : ''}`;

    const req = new XMLHttpRequest();
    const query = encodeURIComponent(this.query);
    req.open('GET', `${this.apiRoot}/cities/?search=${query}&embed=${embed}&limit=${this.maxItems}`);
    req.setRequestHeader('Accept', `application/vnd.teleport.v${this.apiVersion}+json`);
    req.addEventListener('load', () => {
      const results = halfred.parse(JSON.parse(req.response))
        .embeddedArray('city:search-results')
        .map(res => this.parseCity(res));

      cb(results);
    });
    req.send();

    return req;
  }


  /**
   * Parse city
   */
  parseCity(res) {
    const city = res.embedded('location:nearest-city') || res.embedded('city:item');
    city.country = city.embedded('city:country');
    city.admin1_division = city.embedded('city:admin1_division');
    city.timezone = city.embedded('city:timezone');
    city.urban_area = city.embedded('city:urban_area');

    const { full_name: fullName, name, geoname_id: geonameId, population,
      location: { latlon: { latitude, longitude } } } = city;

    const { matching_full_name: title = fullName } = res;

    const result = { title, name, geonameId, latitude, longitude, population };

    if (city.country) assign(result, { country: city.country.name });
    if (city.admin1_division) {
      const { name: admin1Division, geonames_admin1_code: admin1DivisionCode } = city.admin1_division;
      assign(result, { admin1Division, admin1DivisionCode });
    }

    if (city.timezone) {
      const tzNow = city.timezone.embedded('tz:offsets-now');
      assign(result, { tzOffsetMinutes: tzNow.total_offset_min });
    }

    if (city.urban_area) {
      const { slug: uaSlug, name: uaName, ua_id: uaId, teleport_city_url: uaCityUrl } = city.urban_area;
      assign(result, { uaName, uaId, uaCityUrl, uaSlug });
    }

    return result;
  }
}

export default TeleportAutocomplete;
