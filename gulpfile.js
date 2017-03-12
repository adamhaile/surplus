var gulp = require('gulp'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename');

gulp.task('dist', function() {
    gulp.src([
        "src/_preamble.js",
        "src/sourcemap.js",
        "src/tokenize.js",
        "src/AST.js",
        "src/parse.js",
        "src/genCode.js",
        "src/shims.js",
        "src/preprocess.js",
        "src/_postamble.js"
    ])
    .pipe(concat("htmlliterals-preprocessor.js"))
    .pipe(gulp.dest("dist"))
    .pipe(rename("htmlliterals-preprocessor.min.js"))
    .pipe(uglify())
    .pipe(gulp.dest("dist"));
});

gulp.task('default', ['dist']);
gulp.watch('src/*.js', ['dist']);
