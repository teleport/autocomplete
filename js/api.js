import 'whatwg-fetch';
import { polyfill } from 'es6-promise';
polyfill();

import halfred from 'halfred';

const API_URL = 'https://api.teleport.org/api';

/**
 * String.prototype.startsWith polyfill
 */
if (!String.prototype.startsWith) {
  String.prototype.startsWith = function(searchString, position) {
    position = position || 0;
    return this.indexOf(searchString, position) === position;
  };
}

/**
 * Cities API call
 */
export function getCities(query) {
  return fetch(`${API_URL}/cities/?search=${query}&embed=city:search-results/city:item/city:country&embed=city:search-results/city:item/city:admin1_division`)
    .then(res => res.json())
    .then(json => halfred.parse(json).embeddedArray('city:search-results'))
    .then(results => results.map(res => {
      const city = res.embedded('city:item');
      const admin1Division = city.embedded('city:admin1_division');
      const country = city.embedded('city:country');

      let { name, geoname_id, population, location: { latlon: { latitude, longitude } } } = city;
      let title = `${name}, ${admin1Division.name}, ${country.name}`;

      // Append alternate name if exists and query is not the same with name
      const { matching_alternate_names: [{ name: alternate = null }] = [{}] } = res;
      const queryMatchesName = query.toLowerCase().split(/[\,\s]+/)
        .some((q) => q && name.toLowerCase().startsWith(q));
      if (alternate && !queryMatchesName) title += ` (${alternate})`;

      return { title, name, geoname_id, latitude, longitude, population };
    }));
}
