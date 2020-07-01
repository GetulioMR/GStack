/**
 * Packages
 */

// General
const path        = require('path');
const browserSync = require('browser-sync').create();
const gulp        = require('gulp');
const fileInclude = require('gulp-file-include');
const flatten     = require('gulp-flatten');
const header      = require('gulp-header');
const plumber     = require('gulp-plumber');
const rename      = require('gulp-rename');
const package     = require('./package.json');

// Scripts
const jshint      = require('gulp-jshint');
const stylish     = require('jshint-stylish');
const uglify      = require('gulp-uglify');

// Styles
const sass        = require('gulp-sass');
const sassGlob    = require('gulp-sass-glob');

// Media.
const imagemin    = require('gulp-imagemin');

// Html
const htmlmin     = require('gulp-htmlmin');

/**
 * Config to project
 */
const config = {
  "banner":
      "/*!\n" +
      " * <%= package.name %> v<%= package.version %> <<%= package.homepage %>>\n"+
      " * <%= package.title %> : <%= package.description %>\n" +
      " * (c) " + new Date().getFullYear() + " <%= package.author.name %> <<%= package.author.url %>>\n" +
      " * <%= package.license.type %> License <<%= package.license.url %>>\n" +
      " * <%= package.repository.url %>\n" +
      " */\n\n",
  "js": {
      "src": "assets/**/*.js",
      "dest": "build/js/"
  },
  "css": {
      "src": "{assets,components}/**/*.{scss,sass}",
      "dest": "build/css/",
      "includePaths": [
          path.resolve(__dirname, "./"),
          path.resolve(__dirname, "./assets/css/"),
          path.resolve(__dirname, "./node_modules/")
      ]
  },
  "html": {
      "src": "*.html",
      "dest": "build/"
  },
  "images": {
      "src": "assets/img/**/*",
      "dest": "build/img/"
  },
  "fonts": {
      "src": "{assets/fonts/**/,node_modules/@fortawesome/fontawesome-free-webfonts/webfonts/}",
      "dest": "build/fonts/"
  }
}

/**
 * Gulp Taks
 */

// Lint scripts
gulp.task('js:lint', () => {
    return gulp.src(config.js.src)
        .pipe(plumber())
        .pipe(jshint())
        .pipe(jshint.reporter(stylish));
});

// File include and concatenate scripts
gulp.task('js:compile', gulp.series('js:lint', () => {
    return gulp.src(config.js.src)
        .pipe(plumber())
        .pipe(fileInclude({
            prefix: '@@',
            basepath: '@file'
        }))
        .pipe(flatten())
        .pipe(gulp.dest(config.js.dest))
        .pipe(browserSync.stream());
}));

// Compress and add banner scripts
gulp.task('js:build', gulp.series('js:compile', () => {
    return gulp.src([config.js.dest+'*.js','!'+config.js.dest+'*.min.js'])
        .pipe(plumber())
        .pipe(uglify())
        .pipe(rename({suffix: ".min"}))
        .pipe(header(config.banner, {package: package}))
        .pipe(flatten())
        .pipe(gulp.dest(config.js.dest));
}));

// Process SASS files styles
gulp.task('css:compile', () => {
    return gulp.src(config.css.src)
        .pipe(plumber())
        .pipe(sassGlob())
        .pipe(sass({
            outputStyle: 'expanded',
            sourceComments: true,
            includePaths: config.css.includePaths,
            indentedSyntax: false
        }).on('error', sass.logError))
        .pipe(flatten())
        .pipe(gulp.dest(config.css.dest))
        .pipe(browserSync.stream());
});

// Compress and add banner scripts
gulp.task('css:build', gulp.series('css:compile', () => {
    return gulp.src(config.css.src)
        .pipe(plumber())
        .pipe(sassGlob())
        .pipe(sass({
            outputStyle: 'compressed',
            sourceComments: false,
            includePaths: config.css.includePaths,
            indentedSyntax: false
        }).on('error', sass.logError))
        .pipe(rename({suffix: '.min'}))
        .pipe(header(config.banner, {package: package}))
        .pipe(flatten())
        .pipe(gulp.dest(config.css.dest));
}));

// Copy image src -> build to watch
gulp.task('img:compile', () => {
    return gulp.src(config.images.src)
        .pipe(plumber())
        .pipe(gulp.dest(config.images.dest))
        .pipe(browserSync.stream());
});

// Compress image files
gulp.task('img:build', () => {
    return gulp.src(config.images.src)
        .pipe(plumber())
        .pipe(imagemin())
        .pipe(gulp.dest(config.images.dest));
});

// Copy fonts files to build
gulp.task('fonts:build', () => {
    return gulp.src(config.fonts.src+'*.{svg,eot,ttf,woff,woff2}')
        .pipe(flatten())
        .pipe(gulp.dest(config.fonts.dest));
});

gulp.task('html:compile', () => {
    return gulp.src(config.html.src)
        .pipe(fileInclude({
            prefix: '@@',
            basepath: '@file'
        }))
        .pipe(gulp.dest(config.html.dest))
        .pipe(header(config.banner, {package: package}));
});

gulp.task('html:build', gulp.series('html:compile', () => {
    return gulp.src(config.html.dest+'/'+config.html.src)
      .pipe(htmlmin({ collapseWhitespace: true }))
      .pipe(gulp.dest(config.html.dest));
}));

// Compile and compress js, css and img. Move others files to build, like app/fonts directory (default)
gulp.task('default', gulp.series(
  'js:build',
  'css:build',
  'img:build',
  'fonts:build',
  'html:build'
));

// Starts a BrowerSync instance
gulp.task('start-server', function(){
    browserSync.init(package.serveDev);
});

// Watch files for changes
gulp.task('watch', function(done) {
  gulp.watch(config.images.src, gulp.series('img:build')).on('change', browserSync.reload);
  gulp.watch(config.css.src, gulp.series('css:build')).on('change', browserSync.reload);
  gulp.watch(config.js.src, gulp.series('js:build')).on('change', browserSync.reload);
  gulp.watch([config.html.src, 'components/**/' + config.html.src], gulp.series('html:build')).on('change', browserSync.reload);
});

// Compile, init serve and watch files
gulp.task('server', gulp.parallel(
    'start-server',
    'default',
    'watch'
));