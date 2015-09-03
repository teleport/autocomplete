import 'whatwg-fetch';
import 'es6-promise';
import halfred from 'halfred';


const API_PROXY = 'https://apiproxy.prestaging.teleport.ee';

/**
 * Cities API call
 */
export function getCities(query) {
  return fetch(`${API_PROXY}/api/cities/?search=${query}&embed=city:search-results/city:item/city:country&embed=city:search-results/city:item/city:admin1_division`, {
    headers: { Accept: 'application/json' },
  }).then((res) => res.json())
    .then((json) => halfred.parse(json).embeddedArray('city:search-results'))
    .then((results) => results.map((res) => {
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
