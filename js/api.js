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
  return fetch(`${API_URL}/cities/?search=${query}&embed=city:search-results/city:item/{city:country,city:admin1_division,city:timezone/tz:offsets-now}`)
    .then(res => res.json())
    .then(json => halfred.parse(json).embeddedArray('city:search-results'))
    .then(results => results.map(res => {
      const city = res.embedded('city:item');
      const admin1Division = city.embedded('city:admin1_division');
      const country = city.embedded('city:country');
      const timezone = city.embedded('city:timezone');
      const timezoneOffsets = timezone.embedded('tz:offsets-now');

      let { name, geoname_id, population, location: { latlon: { latitude, longitude } } } = city;
      let { matching_full_name: title } = res;
      let { name: countryName } = country || {};
      let { name: admin1DivisionName } = admin1Division || {};
      let { total_offset_min: tzOffsetMinutes } = timezoneOffsets || {};

      return { title, name, geoname_id, latitude, longitude, population, admin1Division: admin1DivisionName, country: countryName, tzOffsetMinutes };
    }));
}
