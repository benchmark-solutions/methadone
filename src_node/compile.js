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
      if (path.slice(path.length - 10, path.length + 1) === ".methadone" && !initialized[path]) {
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

var script = fs.readFileSync("extras/methadone.js").toString().replace(/Methadone/g, "MMethadone") + "\nmethadone.setCompile(true);\n";

script = script + getScripts(dirs);

fs.writeFileSync("all.js", script);

// These were necessary to laod my test application;  should abstract this into an app specific harness
window.WebSocket = {};
window.location.search = "";
navigator = {};

var s = document.createElement("script");
s.src = "../all.js"
s.onload = function() {
  window.methadone.initialize();
  console.log("Writing methadone.js");
  fs.writeFileSync("methadone.js", window.methadone.getScript() + "\nmethadone=Methadone.Main.scope\nMethadone.Util.extend(methadone,Methadone.Main,Methadone.State);");
  fs.unlinkSync("all.js");
  console.log("Done.");
};

console.log("Loading Application");
document.head.appendChild(s);

