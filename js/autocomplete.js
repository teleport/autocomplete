import Ractive from 'ractive/ractive.runtime';
import _defaults from 'lodash/object/defaults';
import _debounce from 'lodash/function/debounce';
import _take from 'lodash/array/take';

import { getCities } from './api';
import AutocompleteTemplate from '../templates/autocomplete.rac';


const REQUIRED_PARAMS = ['display-key', 'remote'];
const REMOTE_DEBOUNCE = 250;

const Key = { BACK: 8, TAB: 9, ENTER: 13, UP: 38, DOWN: 40 };


/**
 * Ractive XHR Autocomplete
 *
 * Params:
 * value - Current picked value as object
 * no-results - Text shown when there are no matches
 * remote - function(query) returning Promise
 * max-items - Maximum number of items to show
 * display-key - Property shown from results
 * placeholder - HTML attribute
 * tabindex - HTML attribute
 *
 * TODO: Add static list support, publish
 */
const Autocomplete = Ractive.extend({
  template: AutocompleteTemplate,

  data: () => ({
    // Param defaults
    'max-items': (window.matchMedia('screen and (max-width: 24em)').matches ? 5 : 10),
    'no-results': 'No matches',

    // User input
    query: '',

    // Loading indicator
    loading: false,

    // Matches
    list: [],

    // Active item in keyboard
    activeItem: 0,

    // Wrap matches in <span>
    wrapMatches(str = '') {
      let res = str;
      this.get('query').split(/[\,\s]+/).forEach((q) => {
        if (q) res = res.replace(new RegExp(q, 'gi'), '<span>$&</span>');
      });

      return res;
    },

    // Fetch display property
    displayedKey(item) {
      return (item || {})[this.displayKey] || '';
    },
  }),

  /**
   * Validate params
   */
  onconfig() {
    const config = this.get();
    REQUIRED_PARAMS.forEach((p) => {
      if (!config[p]) throw new Error(`Autocomplete param missing: ${p}`);
    });

    _defaults(this, {
      remoteFn: getCities,
      displayKey: this.get('display-key'),
      maxItems: this.get('max-items'),
      fetchRemote: _debounce(this.fetchRemote, REMOTE_DEBOUNCE),
    });

    const query = this.get('displayedKey').call(this, this.get('value'));
    this.set('query', query);
  },

  /**
   * Start listening input
   */
  oninit() {
    this.observe('query', (query) => {
      if (this.queryChanging) return;

      if (query) {
        this.set('loading', true);
        this.fetchRemote(query);
      } else {
        this.select();
      }
    }, { init: false });
  },

  /**
   * Close list on blur
   */
  onrender() {
    const acElem = this.find('.autocomplete');

    this.closeOnBlur = (e) => {
      if (acElem && acElem.contains(e.target)) return;
      const isListItem = e.target && e.target.classList.contains('ac-item');
      if (!this.get('value') && !isListItem) this.set('query', '');
      this.set('list', []);
    };

    document.addEventListener('click', this.closeOnBlur, true);
  },

  onteardown() {
    document.removeEventListener('click', this.closeOnBlur);
  },

  /**
   * Query remote source
   */
  fetchRemote(query) {
    this.remoteFn(query).then((results) => {
      return this.set('list', _take(results, this.maxItems));
    }).then(() => this.set({ loading: false, activeItem: 0 }));
  },

  /**
   * Handle keyboard input
   */
  handleKeys() {
    const e = this.event.original;
    const code = e.keyCode;
    if ([Key.UP, Key.DOWN].indexOf(code) !== -1) e.preventDefault();

    const list = this.get('list');
    const i = this.get('activeItem');

    switch (code) {
    case Key.BACK:
      if (this.get('value')) this.select();
      break;
    case Key.ENTER:
      if (this.get('value') === null && this.get('query')) e.preventDefault();
      if (list[i]) this.select(list[i]);
      break;
    case Key.TAB:
      if (list[i]) this.select(list[i]);
      break;
    case Key.UP: this.set('activeItem', Math.max(0, i - 1));
      break;
    case Key.DOWN: this.set('activeItem', Math.min(list.length - 1, i + 1));
      break;
    }
  },

  /**
   * Select one match
   */
  select(value = null) {
    this.queryChanging = true;

    const query = this.get('displayedKey').call(this, value);
    this.set({ value, query, list: [], loading: false }).then(() => this.queryChanging = false);
  },
});

export default Autocomplete;
