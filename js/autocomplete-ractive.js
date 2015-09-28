/* global Ractive */

import assign from 'core-js/library/fn/object/assign';

import Autocomplete from './autocomplete';
import AutocompleteTemplate from '../templates/autocomplete.rac';

export default Ractive.extend({
  template: AutocompleteTemplate,

  onrender() {
    const { maxItems, apiRoot, geoLocate, itemTemplate, embeds } = this.get();

    this.ac = new Autocomplete(assign({ el: this.find('input') }, {
      maxItems, apiRoot, geoLocate, itemTemplate, embeds,
    }));

    this.ac.on('change', value => this.set('value', value));
    this.ac.on('querychange', query => this.set('query', query));
  },

  onteardown() {
    this.ac.destroy();
  },
});
