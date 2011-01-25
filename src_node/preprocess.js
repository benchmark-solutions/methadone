var jsdom = require("jsdom").jsdom,
sys = require("sys"),
Script = process.binding('evals').Script,
fs = require("fs");

var document = jsdom("<html><head></head><body></body></html>"),
window = document.createWindow(),
dirs = process.argv.slice(2),
initialized = {};

function getScripts(paths) {
    var script = "";
    var nextDirs = [];
    for (var path in paths) {
        var path = paths[path];
        var stat = fs.statSync(path);
        if (stat.isFile()) {
            if ((path.slice(path.length - 3, path.length + 1) === ".js"  || path.slice(path.length - 10, path.length + 1) === ".annotated") && !initialized[path]) {
                console.log("Adding " + path);
                initialized[path] = true;
                script = script + fs.readFileSync(path).toString();
            }
        } else {
            if (path.slice(path.length - 6, path.length + 1) !== "vendor") {
                nextDirs.push(path);
            }
        }
    }
    for (var dir in nextDirs) {
        var files = fs.readdirSync(nextDirs[dir]);
        for (var f in files) {
            files[f] = nextDirs[dir] + '/' + files[f];
        }
        script = script + getScripts(files);
    }
    return script;
}

var script = fs.readFileSync("lib/annotated.js") + "\nannotated.setPreprocess(true);\n";

script = script + getScripts(dirs);
fs.writeFileSync("all.js", script);

// These were necessary to laod my test application;  should abstract this into an app specific harness
window.WebSocket = {};
window.location.search = "";
navigator = {};

var s = document.createElement("script");
s.src = "../all.js"
s.onload = function() {
    console.log("Calculating IR");
    window.annotated.initialize();
    console.log("Writing ir.js");
    fs.writeFileSync("ir.js", window.annotated.getIR());
    fs.unlinkSync("all.js");
    console.log("Done.  Place ir.js in your application's head immediately after annotated.js");
};

console.log("Loading Application");
document.head.appendChild(s);

