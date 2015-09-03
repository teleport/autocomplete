# Teleport Cities Autocomplete

An autocomplete widget for entering city names based on [Teleport APIs](https://developers.teleport.org/api/).

The widget is a modified public preview version of the autocomplete widgets used in [Teleport](https://teleport.org) products, e.g. [Flock](https://flock.teleport.org/) and [Sundial](https://sundial.teleport.org/). It's still under active development. Eventually we would like to replace the autocomplete widgets of our products with this one.

## Features

- Find city by city name or alternate name
- Find city by administrative division and/or country
- Initially populate the field using the browsers Geolocation API if available 

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
