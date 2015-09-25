/* eslint-env node */

import gulp from 'gulp';
import gulpLoadPlugins from 'gulp-load-plugins';
import del from 'del';
import _assign from 'lodash/object/assign';
import source from 'vinyl-source-stream';
import buffer from 'vinyl-buffer';

import browserify from 'browserify';
import watchify from 'watchify';

import browserSync from 'browser-sync';

const bs = browserSync.create();
const $ = gulpLoadPlugins();


import pkg from './package.json';

const BANNER = `/*! ${pkg.name} - v${pkg.version} | ${pkg.homepage} | ${pkg.license} */
`;


// ----------------------------- BROWSERIFY ------------------------------------

// Browserify params
const browserifyArgs = _assign({}, watchify.args, {
  entries: 'js/autocomplete.js',
  standalone: 'TeleportAutocomplete',
  debug: true,
});

// Browserify bundle command
const rebundle = (bundler) => {
  return bundler.bundle()
    .on('error', $.util.log)
    .pipe(source('teleport-autocomplete.js'))
    .pipe(buffer())
    .pipe($.sourcemaps.init({ loadMaps: true, debug: true }))
    .pipe($.sourcemaps.write('./', { sourceRoot: '..' }))
    .pipe($.if('*.js', $.header(BANNER)))
    .pipe(gulp.dest('dist'))
    .pipe(bs.reload({ stream: true }));
};


/**
 * Browserify + Babel with watchify
 */
gulp.task('watchify', () => {
  const bundler = watchify(browserify(browserifyArgs));

  bundler.on('update', rebundle.bind(this, bundler));
  bundler.on('log', $.util.log);

  return rebundle(bundler);
});


/**
 * Plain browserify
 */
gulp.task('browserify', () => rebundle(browserify(browserifyArgs)));

// -----------------------------------------------------------------------------


/**
 * Compile SASS and prefix it
 */
gulp.task('sass', () => {
  return gulp.src('scss/autocomplete.scss')
    .pipe($.sourcemaps.init())

    .pipe($.sass().on('error', $.sass.logError))

    // Prefix CSS
    .pipe($.autoprefixer())

    .pipe($.rename({
      prefix: 'teleport-',
    }))
    .pipe($.sourcemaps.write('.', { sourceRoot: '../scss' }))
    .pipe($.if('*.css', $.header(BANNER)))
    .pipe(gulp.dest('dist'))
    .pipe($.if('*.css', bs.reload({ stream: true })));
});


/**
 * Concat and minify JS
 */
gulp.task('dist:js', ['browserify'], () => {
  return gulp.src('dist/teleport-autocomplete.js')
    .pipe($.sourcemaps.init({ loadMaps: true }))
    .pipe($.uglify())
    .pipe($.rename({
      extname: '.min.js',
    }))
    .pipe($.sourcemaps.write('.', { sourceRoot: '..' }))
    .pipe(gulp.dest('dist'));
});


/**
 * Minify CSS
 */
gulp.task('dist:css', ['sass'], () => {
  return gulp.src('dist/teleport-autocomplete.css')
    .pipe($.sourcemaps.init({ loadMaps: true, debug: true }))
    .pipe($.minifyCss({ sourceMap: false }))
    .pipe($.rename({
      extname: '.min.css',
    }))
    .pipe($.sourcemaps.write('.', { sourceRoot: 'scss' }))
    .pipe(gulp.dest('dist'));
});


/**
 * Release package
 */
gulp.task('release', ['dist:js', 'dist:css'], () => {

});


/**
 * Clean up generated folder
 */
gulp.task('clean', () => del('dist'));


/**
 * Recompile and Livereload for dev
 */
gulp.task('watch', () => {
  // Recompile CSS
  gulp.watch('scss/**', ['sass']);
});


/**
 * Dev Server
 */
gulp.task('serve', () => {
  bs.init({
    server: {
      baseDir: './examples',
      directory: true,
      routes: { '/dist': 'dist' },
    },
  });
});


/**
 * By default:
 * Compile SASS, ES6, run devserver and watch files
 */
gulp.task('default', ['watch', 'watchify', 'sass', 'serve']);
