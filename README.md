# Teleport Cities Autocomplete

An autocomplete widget for entering city names based on [Teleport APIs](https://developers.teleport.org/api/).

The widget is a modified public preview version of the autocomplete widgets used in [Teleport](https://teleport.org) products, e.g. [Flock](https://flock.teleport.org/) and [Sundial](https://sundial.teleport.org/). It's still under active development. Eventually we would like to replace the autocomplete widgets of our products with this one.

## Features

- Find city by city name or alternate name
- Find city by administrative division and/or country
- Initially populate the field using the browsers Geolocation API if available

## API

#### new TeleportAutocomplete(options)

The constructor function. It takes an [options hash](#options) as its only
argument.

```javascript
new TeleportAutocomplete({ el: '.my-input', maxItems: 5 });
```


#### TeleportAutocomplete.init(selector:string|elem:HTMLInputElement, [options])

Shorthand initializer for constructor. Returns an autocomplete instance.

```javascript
TeleportAutocomplete.init('.my-input').on('change', function(value) { console.log(value); });
```

#### TeleportAutocomplete#destroy()

Destroys autocomplete instance, removing the wrapper and events from the input element.


#### TeleportAutocomplete#clear()

Clears selected autocomplete value.


### Options

When initializing a TeleportAutocomplete component, you can set following parameters:

* `el` – Selector string or `HTMLInputElement` to wrap around. **Required**.
* `maxItems` *(default: 10)* - Maximum number of items to display in dropdown.
* `geoLocate` *(default: true)* - If `true`, enables dropdown item to geolocate current location. When set to  `nopick`, the geolocated value is not automatically picked.
* `embed` *(default: 'city:country,city:admin1_division,city:timezone/tz:offsets-now,city:urban_area')* - Override set of resources embedded intro response. Defaults to adding country, administrative level, timezone and urban area info to response.
* `itemTemplate` - Function which gets called with result item as first argument. Can be used for customizing list output. Default: `function renderItem(item) { return this.wrapMatches(item.title); };`.
`wrapMatches` is a helper function, which wraps query string matches of title between `<span>` tags.

### Events
* `change` – Fired when autocomplete value object is changed. The event handler will be invoked
with value argument.
* `querychange` – Fired when autocomplete query value is changed. The event handler will be invoked
with query argument.


## Live Demo

A live demo of the widget is available at the [Teleport developer site](https://developers.teleport.org/api/autocomplete_widget/).

![Screenshot](https://developers.teleport.org/assets/autocomplete/screenshot.png)

## Build and Development Server

Using a working node.js/npm installation:

* Install dependencies
  ```sh
  npm install
  ```

* (optional) Install gulp.js globally
  ```sh
  npm install -g gulp
  ```

* Build and run development server

  ```sh
  ./node_modules/.bin/gulp
  ```

  Or with global gulp installation:

  ```sh
  gulp
  ```

## License

Copyright (c) 2015 Teleport, Inc.

Licensed under the MIT License.
