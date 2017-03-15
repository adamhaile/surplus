var gulp = require('gulp'),
    concat = require('gulp-concat');

gulp.task('preprocessor', function() {
    gulp.src([
        "src/preprocessor/_preamble.js",
        "src/preprocessor/sourcemap.js",
        "src/preprocessor/tokenize.js",
        "src/preprocessor/AST.js",
        "src/preprocessor/parse.js",
        "src/preprocessor/genCode.js",
        "src/preprocessor/shims.js",
        "src/preprocessor/preprocess.js",
        "src/preprocessor/_postamble.js"
    ])
    .pipe(concat("preprocessor.js"))
    .pipe(gulp.dest("."));
});

gulp.task('runtime', function() {
    gulp.src([
        "src/runtime/_preamble.js",
        "src/runtime/domlib.js",
        "src/runtime/Html.js",
        "src/runtime/insert.js",
        //"src/runtime/mixins/*.js",
        "src/runtime/_postamble.js"
    ])
    .pipe(concat("index.js"))
    .pipe(gulp.dest("."));
});

gulp.task('w', function () {
    gulp.watch('src/preprocessor/*.js', ['preprocessor']);
    gulp.watch('src/runtime/*.js', ['runtime']);
});

gulp.task('default', ['preprocessor', 'runtime']);
