/* eslint-env node */

import gulp from 'gulp';
import gulpLoadPlugins from 'gulp-load-plugins';
import del from 'del';
import assign from 'core-js/library/fn/object/assign';
import source from 'vinyl-source-stream';
import buffer from 'vinyl-buffer';
import { spawn } from 'child_process';
import es from 'event-stream';


import browserify from 'browserify';
import watchify from 'watchify';

import browserSync from 'browser-sync';

const bs = browserSync.create();
const gp = gulpLoadPlugins();


import pkg from './package.json';

const BANNER = `/*! ${pkg.name} - v${pkg.version} | ${pkg.homepage} | ${pkg.license} */
`;


// ----------------------------- BROWSERIFY ------------------------------------

// Browserify params
const browserifyArgs = assign({}, watchify.args, {
  standalone: 'TeleportAutocomplete',
  transform: [
    "babelify",
    ["ractivate", { "extensions": [".rac"] }]
  ],
  debug: true,
});

// Browserify bundle command
const rebundle = (bundler, entry) => {
  return bundler.bundle()
    .on('error', gp.util.log)
    .pipe(source(entry))
    .pipe(gp.derequire())
    .pipe(buffer())
    .pipe(gp.rename({
      dirname: '',
      prefix: 'teleport-',
    }))
    .pipe(gp.sourcemaps.init({ loadMaps: true, debug: true }))
    .pipe(gp.sourcemaps.write('./', { sourceRoot: '..' }))
    .pipe(gp.if('*.js', gp.header(BANNER)))
    .pipe(gulp.dest('dist'))
    .pipe(bs.reload({ stream: true }));
};


/**
 * Browserify + Babel with watchify
 */
gulp.task('watchify', () => {
  const tasks = ['js/autocomplete.js', 'js/autocomplete-ractive.js'].map(entry => {
    const bundler = watchify(browserify(assign(browserifyArgs, { entries: [entry] })));

    bundler.on('update', rebundle.bind(this, bundler, entry));
    bundler.on('log', gp.util.log);

    return rebundle(bundler, entry);
  });

  return es.merge.apply(null, tasks);
});


/**
 * Plain browserify
 */
gulp.task('browserify', () => {
  const tasks = ['js/autocomplete.js', 'js/autocomplete-ractive.js'].map(entry => {
    return rebundle(browserify(assign(browserifyArgs, { entries: [entry] })), entry);
  });

  return es.merge.apply(null, tasks);
});

// -----------------------------------------------------------------------------


/**
 * Compile SASS and prefix it
 */
gulp.task('sass', () => {
  return gulp.src('scss/autocomplete.scss')
    .pipe(gp.sourcemaps.init())

    .pipe(gp.sass().on('error', gp.sass.logError))

    // Prefix CSS
    .pipe(gp.autoprefixer())

    .pipe(gp.rename({
      prefix: 'teleport-',
    }))
    .pipe(gp.sourcemaps.write('.', { sourceRoot: '../scss' }))
    .pipe(gp.if('*.css', gp.header(BANNER)))
    .pipe(gulp.dest('dist'))
    .pipe(gp.if('*.css', bs.reload({ stream: true })));
});


/**
 * Concat and minify JS
 */
gulp.task('dist:js', ['browserify'], () => {
  return gulp.src('dist/teleport-autocomplete.js')
    .pipe(gp.sourcemaps.init({ loadMaps: true }))
    .pipe(gp.uglify({ preserveComments: 'license' }))
    .pipe(gp.rename({
      extname: '.min.js',
    }))
    .pipe(gp.sourcemaps.write('.', { sourceRoot: '..' }))
    .pipe(gulp.dest('dist'));
});


/**
 * Minify CSS
 */
gulp.task('dist:css', ['sass'], () => {
  return gulp.src('dist/teleport-autocomplete.css')
    .pipe(gp.sourcemaps.init({ loadMaps: true, debug: true }))
    .pipe(gp.minifyCss({ sourceMap: false }))
    .pipe(gp.rename({
      extname: '.min.css',
    }))
    .pipe(gp.sourcemaps.write('.', { sourceRoot: 'scss' }))
    .pipe(gulp.dest('dist'));
});


/**
 * Build package
 */
gulp.task('build', ['dist:js', 'dist:css']);


/**
 * Release package
 */
gulp.task('release', ['build'], (done) => {
  spawn('npm', ['publish'], { stdio: 'inherit' }).on('close', done);
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
