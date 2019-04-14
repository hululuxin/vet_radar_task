let fs          = require("fs");
let del         = require("del");
let path        = require("path");
let args        = require("yargs");
let gulp        = require("gulp");
let zip         = require("gulp-zip");
let sequence    = require("gulp-sequence");
let sourcemaps  = require('gulp-sourcemaps');
let typescript  = require("gulp-typescript");
let run         = require("gulp-run-command").default;


let tsProject = typescript.createProject("tsconfig.json");

// Parse the file and get the runtime dependencies and version.
let packageDefinition = JSON.parse(fs.readFileSync(path.join(__dirname, "package.json"), "utf8"));
let projectName = packageDefinition.name;
let projectVersion = packageDefinition.version;

// Packaging command line argument.
let buildNumber = args.argv.build_number || "dev";
let packageDirectory = args.argv.package_dir || "dist";

gulp.task("default", ["compile"]);

gulp.task("compile", () => {
    let tsResult = tsProject
        .src()
        .pipe(sourcemaps.init())
        .pipe(tsProject());

    return tsResult.js
        .pipe(sourcemaps.write({
            // Return relative source map root directories per file.
            sourceRoot: function (file) {
                return path.relative(path.join(file.cwd, file.path), file.base);
            }
        }))
        .pipe(gulp.dest("dist"));
});

gulp.task("npmprune", run("npm prune --production"));

gulp.task("dependencies", sequence("clean", "compile", "npmprune"));

gulp.task("package", ["dependencies"], () => {

   let packagePaths = [
        "package.json",
        "dist/**",
        "resource/**",
        "**/node_modules/**",
        "!dist/etc",
    ];

    return gulp.src(packagePaths)
        .pipe(zip(projectName + "-" + projectVersion + "." + buildNumber + ".zip"))
        .pipe(gulp.dest(packageDirectory));
});

gulp.task("clean", () => {
    return del([
        "dist",
        "*.zip",
        "coverage",
        ".nyc_output",
        "src/**/*.js",
        "src/**/*.js.map",
    ]);
 });
