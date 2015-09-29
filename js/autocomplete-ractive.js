/* global Ractive */

import assign from 'core-js/library/fn/object/assign';

import Autocomplete from './autocomplete';
import AutocompleteTemplate from '../templates/autocomplete.rac';

export default Ractive.extend({
  template: AutocompleteTemplate,

  data: {
    query: '',
  },

  onrender() {
    const { maxItems, apiRoot, geoLocate, itemTemplate, embeds, value } = this.get();

    this.ac = new Autocomplete(assign({ el: this.find('input') }, {
      maxItems, apiRoot, geoLocate, itemTemplate, embeds, value,
    }));

    this.ac.on('change', val => this.set('value', val));
    this.ac.on('querychange', query => this.set('query', query));
  },

  onteardown() {
    this.ac.destroy();
  },
});
