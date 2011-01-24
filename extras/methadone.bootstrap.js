__m = new (function() {this.initializeModule=function (current_module) {
            var pending_mixins = [];
            var self = [];
            if (current_module.type === "Module") {
                self.push({});
                pending_mixins.push({});
                var _constructor = MMethadone.Util.getOrCreate(current_module.name);
                this.processMixins(current_module, self, pending_mixins);
                _constructor.apply(self[self.length - 1]);
                this.checkForProperties(self[self.length - 1], current_module.name);
                if (current_module.root) {
                    MMethadone.Util.assign(current_module.name, MMethadone.Util.extend(self[self.length - 1][current_module.root], self[self.length - 1]));
                } else {
                    MMethadone.Util.assign(current_module.name, self[self.length - 1]);
                }
                self.pop();
                pending_mixins.pop();
            } else {
                var new_constructor = this.generateClassConstructor(current_module, MMethadone.Util.getOrCreate(current_module.name), self, pending_mixins);
                MMethadone.Util.assign(current_module.name, new_constructor);
            }
        }
this.checkForProperties=function (obj, name) {
            for (var prop in obj) {
                if (obj.hasOwnProperty(prop)) {
                    if (typeof obj[prop] !== "function" && typeof obj[prop] !== "undefined") {
                        MMethadone.Util.logError("Module " + name + " has illegal public property " + prop);
                    }
                }
            }
        }
this.generateClassConstructor=function (_module, _constructor, self, pending_mixins) {
            var __this = this;
            return function() {
                if (pending_mixins.length > 0 && pending_mixins[pending_mixins.length - 1][_module.name]) {
                    self.push(self[self.length - 1]);
                    delete(pending_mixins[pending_mixins.length - 1][_module.name]);
                } else {
                    self.push(this);
                }

                pending_mixins.push({});
                __this.processMixins(_module, self, pending_mixins);

                var args = Array.prototype.slice.call(arguments);
                _constructor.apply(self[self.length - 1], args);
                pending_mixins.pop();
                return self.pop();
            }
        }
this.processMixins=function (_module, self, pending_mixins) {
            for (var mixin_name in _module.mixins) {
                if (_module.mixins[mixin_name] === "MODULE") {
                    MMethadone.Util.extend(self[self.length - 1], MMethadone.Util.getOrCreate(mixin_name));
                } else if (_module.mixins[mixin_name] === "INSTANCE") {
                    pending_mixins[pending_mixins.length - 1][mixin_name] = true;
                } else {
                    var obj = MMethadone.Util.getOrCreate(mixin_name);
                    MMethadone.Util.extend(self[self.length - 1], new obj());
                }
            }
        }
var MMethadone = {};MMethadone.Util = {};
MMethadone.Util.extend=function (target) {
            var args = Array.prototype.slice.call(arguments).slice(1);
            for (options in args) {
                if (args.hasOwnProperty(options)) {
                    options = args[options];
                    for (name in options) {
                        copy = options[ name ];
                        if (target !== copy && copy !== undefined) {
                            target[ name ] = copy;
                        }
                    }
                }
            }

            return target;
        }
this.extend = MMethadone.Util.extend
MMethadone.Util.assign=function (name, obj) {
            var namespaces = name.split(".");
            var ns         = namespaces[0];
            var nsparent   = window;

            if (namespaces.length > 1) {
                var temp = window[ns];
                for (var i = 1; i < namespaces.length; i ++) {
                    ns       = namespaces[i];
                    nsparent = temp;
                    temp     = temp[ns];
                }
            }

            nsparent[ns] = MMethadone.Util.extend(obj, nsparent[ns]);
        }
this.assign = MMethadone.Util.assign
MMethadone.Util.keys=function (name, obj) {
            var namespaces = name.split(".");
            var ns         = namespaces[0];
            var nsparent   = window;

            if (namespaces.length > 1) {
                var temp = window[ns];
                for (var i = 1; i < namespaces.length; i ++) {
                    ns       = namespaces[i];
                    nsparent = temp;
                    temp     = temp[ns];
                }
            }

            nsparent[ns] = MMethadone.Util.extend(obj, nsparent[ns]);
        }
MMethadone.Util.getOrCreate=function (name) {
            var obj = window;
            name = name.split(".");
            for (var namespace in name) {
                if (name.hasOwnProperty(namespace)) {
                    obj[name[namespace]] = obj[name[namespace]] || {};
                    obj = obj[name[namespace]];
                }
            }
            return obj;
        }
this.getOrCreate = MMethadone.Util.getOrCreate})();__m.getOrCreate("Methadone.State.__Internal");
__m.assign("Methadone.State.__Internal", function () {
        this.strict        = false;
        this.valid         = true;
        this.initialized   = false;
        this.uninitialized = {};
        this.errors        = [];
        this.modules       = {};
        this.autoinit      = true;
        this.preprocess    = false;
        this.compile       = false;
        this.script        = "";
    });
__m.initializeModule({"name":"Methadone.State.__Internal","mixins":{},"type":"Class"});
__m.getOrCreate("Methadone.State");
__m.assign("Methadone.State", function () {

        Import: var internal = Methadone.State.__Internal;

        var __internal;

        this.getInstance   = function() { return __internal; }

        this.getErrors     = function() { return __internal.errors } 

        this.setCompile    = function(val) { __internal.compile = val; }

        this.setIR         = function(ir) { __internal.ir = ir; };
        this.getIR         = function() { return __internal.ir; };

        this.setPreprocess = function(val) { __internal.preprocess = val; };
        this.getPreprocess = function() { return __internal.preprocess; };

        this.getScript     = function() { return __internal.script; };

        this.reset = function() {
            __internal = new Methadone.State.__Internal();
        }

        this.reset();
    });
__m.initializeModule({"name":"Methadone.State","mixins":{},"type":"Module"});
__m.getOrCreate("Methadone.Util");
__m.assign("Methadone.Util", function () {

        Import: Methadone.State;

        this.getOrCreate = function(name) {
            var obj = window;
            name = name.split(".");
            for (var namespace in name) {
                if (name.hasOwnProperty(namespace)) {
                    obj[name[namespace]] = obj[name[namespace]] || {};
                    obj = obj[name[namespace]];
                }
            }
            return obj;
        }

        this.extend = function(target) {
            var args = Array.prototype.slice.call(arguments).slice(1);
            for (options in args) {
                if (args.hasOwnProperty(options)) {
                    options = args[options];
                    for (name in options) {
                        copy = options[ name ];
                        if (target !== copy && copy !== undefined) {
                            target[ name ] = copy;
                        }
                    }
                }
            }

            return target;
        }

        this.cache = function(args) {
            var obj = {};
            for (var i = 0; i < args.length; i ++) {
                obj[args[i]] = this.getOrCreate(args[i]);
            }
            return obj;
        }

        /**
         * Log an error and invalidate the application
         */
        this.logError = function(message) {
            console.error(message);
            Methadone.State.getInstance().errors.push(message);
            Methadone.State.getInstance().valid = false;
        }

        /**
         * Utility funciton to find all of the keys of an object
         * @param o
         */
        this.keys = function(o) {
            var result = [];
            for (var name in o) { if (o.hasOwnProperty(name)) result.push(name); }
            return result;
        }

        /**
         * Assigns an instance of an Object to a namespace.
         */
        this.assign = function(name, obj) {
            var namespaces = name.split(".");
            var ns         = namespaces[0];
            var nsparent   = window;

            if (namespaces.length > 1) {
                var temp = window[ns];
                for (var i = 1; i < namespaces.length; i ++) {
                    ns       = namespaces[i];
                    nsparent = temp;
                    temp     = temp[ns];
                }
            }

            nsparent[ns] = Methadone.Util.extend(obj, nsparent[ns]);
        }
    });
__m.initializeModule({"name":"Methadone.Util","mixins":{},"type":"Module"});
__m.getOrCreate("Methadone.Container");
__m.assign("Methadone.Container", function () {

        Import: Methadone.State;
        Import: Methadone.Util;

        /**
         * Loads all modules registered so far by iterating over the module
         * list and initializing the ones whose depenencies have been
         * initialized.
         */
        this.loadModules = function() {

            var running = true;
            var last_size = 0;
            var size = 0;
            var initialized = {};

            var order = [];
            if (Methadone.State.getInstance().compile) {
                Methadone.State.getInstance().script += "__m = new (function() {" 
                    + "this.initializeModule=" + this.initializeModule.toString() + "\n"
                    + "this.checkForProperties=" + this.checkForProperties.toString() + "\n"
                    + "this.generateClassConstructor=" + this.generateClassConstructor.toString() + "\n"
                    + "this.processMixins=" + this.processMixins.toString() + "\n"
                    + "var Methadone = {};Methadone.Util = {};\n"
                    + "Methadone.Util.extend=" + Methadone.Util.extend.toString() + "\n" 
                    + "this.extend = Methadone.Util.extend\n"
                    + "Methadone.Util.assign=" + Methadone.Util.assign.toString() + "\n" 
                    + "this.assign = Methadone.Util.assign\n"
                    + "Methadone.Util.keys=" + Methadone.Util.assign.toString() + "\n" 
                    + "Methadone.Util.getOrCreate=" + Methadone.Util.getOrCreate.toString() + "\n"
                    + "this.getOrCreate = Methadone.Util.getOrCreate"
                    + "})();"
            }

            if (Methadone.State.getInstance().ir) {
                Methadone.State.getInstance().ir = Methadone.State.getInstance().ir.reverse();
                while (Methadone.State.getInstance().ir.length > 0) {
                    initializeModule(Methadone.State.getInstance().ir.pop());
                }
            } else {
                while (running && Methadone.State.getInstance().valid) {
                    for (var module_name in Methadone.State.getInstance().modules) {
                        if (Methadone.State.getInstance().modules.hasOwnProperty(module_name)) {
                            var current_module = Methadone.State.getInstance().modules[module_name];
                            if (!initialized[current_module.name]) {
                                var deps_satisfied = true;

                                for (var import_name in current_module.imports) {
                                    if (current_module.imports.hasOwnProperty(import_name)) {
                                        if (!initialized[import_name]) deps_satisfied = false;
                                    }
                                }
                                
                                if (deps_satisfied) {
                                    if (Methadone.State.getInstance().preprocess) {
                                        order.push({
                                            name:   current_module.name,
                                            mixins: current_module.mixins,
                                            type:   current_module.type
                                        });
                                    } else if (Methadone.State.getInstance().compile) {
                                        Methadone.State.getInstance().script += "__m.getOrCreate(\"" + current_module.name + "\");\n" 
                                            +  "__m.assign(\"" + current_module.name + "\", " + current_module.raw_code + ");\n"
                                            +  "__m.initializeModule(" + JSON.stringify({
                                                name:   current_module.name,
                                                mixins: current_module.mixins,
                                                type:   current_module.type,
                                                root:   current_module.root
                                            }) + ");\n";
                                    } else {
                                        this.initializeModule(current_module);
                                    }
                                    delete(Methadone.State.getInstance().uninitialized[current_module.name]);
                                    initialized[current_module.name] = true;
                                    size ++;
                                }
                            }
                        }
                    }

                    if (last_size === size) {
                        var xxx = 0;
                        for (var k in Methadone.State.getInstance().uninitialized) xxx ++;
                        if (xxx > 0) Methadone.Util.logError("Dependencies are unsatisfiable for " + JSON.stringify(Methadone.Util.keys(Methadone.State.getInstance().uninitialized)) + "; not loaded");
                        running = false;
                    }

                    last_size = size;
                }

                if (Methadone.State.getInstance().preprocess) {
                    Methadone.State.getInstance().ir = "methadone.setIR(" + JSON.stringify(order) + ");";
                }
            }
        }

        /**
         * Instantiate the module or class.  This includes creating
         * a fake constructor function to handle usage as a Mixin declaration.
         */
        this.initializeModule = function(current_module) {
            var pending_mixins = [];
            var self = [];
            if (current_module.type === "Module") {
                self.push({});
                pending_mixins.push({});
                var _constructor = Methadone.Util.getOrCreate(current_module.name);
                this.processMixins(current_module, self, pending_mixins);
                _constructor.apply(self[self.length - 1]);
                this.checkForProperties(self[self.length - 1], current_module.name);
                if (current_module.root) {
                    Methadone.Util.assign(current_module.name, Methadone.Util.extend(self[self.length - 1][current_module.root], self[self.length - 1]));
                } else {
                    Methadone.Util.assign(current_module.name, self[self.length - 1]);
                }
                self.pop();
                pending_mixins.pop();
            } else {
                var new_constructor = this.generateClassConstructor(current_module, Methadone.Util.getOrCreate(current_module.name), self, pending_mixins);
                Methadone.Util.assign(current_module.name, new_constructor);
            }
        }

        /**
         * Modules may not have exposed properties in this version.
         */
        this.checkForProperties = function(obj, name) {
            for (var prop in obj) {
                if (obj.hasOwnProperty(prop)) {
                    if (typeof obj[prop] !== "function" && typeof obj[prop] !== "undefined") {
                        Methadone.Util.logError("Module " + name + " has illegal public property " + prop);
                    }
                }
            }
        }

        /**
         * Locally binds some vars for the scope of a constructor function;  this is where
         * dispatch happens which switches functionality of this function between
         * Mixin declaration and constructor.
         */
        this.generateClassConstructor = function(_module, _constructor, self, pending_mixins) {
            var __this = this;
            return function() {
                if (pending_mixins.length > 0 && pending_mixins[pending_mixins.length - 1][_module.name]) {
                    self.push(self[self.length - 1]);
                    delete(pending_mixins[pending_mixins.length - 1][_module.name]);
                } else {
                    self.push(this);
                }

                pending_mixins.push({});
                __this.processMixins(_module, self, pending_mixins);

                var args = Array.prototype.slice.call(arguments);
                _constructor.apply(self[self.length - 1], args);
                pending_mixins.pop();
                return self.pop();
            }
        }

        /**
         * Instantiate and collect the classes for a mixin and attach them to the
         * object at the top of the stack.
         */
        this.processMixins = function(_module, self, pending_mixins) {
            for (var mixin_name in _module.mixins) {
                if (_module.mixins[mixin_name] === "MODULE") {
                    Methadone.Util.extend(self[self.length - 1], Methadone.Util.getOrCreate(mixin_name));
                } else if (_module.mixins[mixin_name] === "INSTANCE") {
                    pending_mixins[pending_mixins.length - 1][mixin_name] = true;
                } else {
                    var obj = Methadone.Util.getOrCreate(mixin_name);
                    Methadone.Util.extend(self[self.length - 1], new obj());
                }
            }
        }
    });
__m.initializeModule({"name":"Methadone.Container","mixins":{},"type":"Module"});
__m.getOrCreate("Methadone.Init");
__m.assign("Methadone.Init", function (callback) {

    Import: Methadone.State;

    var __init__ = false;
    /**
     * Recursively waits for the proper moment to start the module loading process;
     * (also tripwired)
     */
    this.registerInitializer = function() {
      if (!__init__) {
        __init = true;
        if (document.addEventListener) {   // For Firefox, Chrome, Safari, Opera, Camino, Netscape Navigator, Konqueror, Lynx ...
          document.addEventListener("DOMContentLoaded", function() {
            if (Methadone.State.getInstance().autoinit) { callback(); }
          }, false);
        } else if (document.attachEvent) { // For IE (sigh) ...
          timer = function() { 
            setTimeout(function() {
              if (window.document.readyState == "complete") {
                if (Methadone.State.getInstance().autoinit) { callback(); }
              } else {
                timer();
              }
            }, 500); 
          };
          timer();
        }
      }
    }
  });
__m.initializeModule({"name":"Methadone.Init","mixins":{},"type":"Module"});
__m.getOrCreate("Methadone.Parse");
__m.assign("Methadone.Parse", function () {

        Import: Methadone.State;
        Import: Methadone.Util;

        /**
         * Removes all non-syntax from Javascript text: Strings, Regex Literals &
         * Comments.  If the original Javascript was valid, then the resultant
         * Javascript should be safe enough to identify keywords via Regex.
         */
        this.clean = function(code) {
            var quote_regex = new RegExp("(\\/\\/|\\/\\*|\\\\\"|\\\\\'|[\\(,=^;]\\s*?/(?!/)|\\/|/)|['\"]", "gm");
            var in_quotes = false;
            var last_quote = "";
            var quote_index = null;
            var strings = [];

            while (quote = quote_regex.exec(code)) {
                if ((quote[0] === '\\"' || quote[0] === "\\'" || quote[0] === "\\/" ) && in_quotes) {
                } else if (quote[0] === last_quote && in_quotes) {
                    last_quote = "";
                    in_quotes = false;
                    strings.push([quote_index, quote_regex.lastIndex]);
                } else if (quote[0][quote[0].length - 1] === "/" && last_quote === "/") {
                    last_quote = "";
                    in_quotes = false;
                    strings.push([quote_index, quote_regex.lastIndex]);
                } else if (quote[0] === "//" && !in_quotes) {
                    var endLine = /$/gm;
                    endLine.lastIndex = quote_regex.lastIndex;
                    endLine.exec(code);
                    strings.push([quote_regex.lastIndex, endLine.lastIndex]);
                    quote_regex.lastIndex = endLine.lastIndex;
                } else if (quote[0] === "/*" && !in_quotes) {
                    var endComment = /\*\//gm;
                    endComment.lastIndex = quote_regex.lastIndex;
                    endComment.exec(code);
                    strings.push([quote_regex.lastIndex, endComment.lastIndex]);
                    quote_regex.lastIndex = endComment.lastIndex;
                } else if (quote[0][quote[0].length - 1] === "/" && !in_quotes) {
                    last_quote = "/";
                    in_quotes = true;
                    quote_index = quote_regex.lastIndex;
                } else if (in_quotes) {
                } else if (quote[0] === "'" || quote[0] === '"') {
                    last_quote = quote[0];
                    in_quotes = true;
                    quote_index = quote_regex.lastIndex;
                }
            }

            strings = strings.reverse();

            for (var i in strings) {
                if (strings.hasOwnProperty(i)) {
                    code = code.slice(0, strings[i][0] - 1) + code.slice(strings[i][1], code.length);
                }
            }

            return code;
        }

        /**
         * Parse the contents of a methadone call to a list of module descriptor structs
         */
        this.parse = function(code) {
            var module_regex = new RegExp("(^|;|{)\\s*(Module|Class)\\s*:", "gm");
            var strict_regex = new RegExp("(^|;|{)\\s*Strict\\s*?:\\s*?true", "gm");
            var init_regex   = new RegExp("(^|;|{)\\s*Init\\s*?:\\s*?false", "gm");
            var modules = [];

            if (strict_regex.exec(code)) Methadone.State.getInstance().strict  = true;
            if (init_regex.exec(code)) Methadone.State.getInstance().autoinit  = false;

            while (moduleParsed = module_regex.exec(code)) {
                var module_name = code.slice(module_regex.lastIndex).match(/\s*(.*?)\s*?=\s*?function/)[1];
                var module_type = moduleParsed[2];

                this.validateModule(module_name);
                Methadone.Util.getOrCreate(module_name);
                Methadone.State.getInstance().uninitialized[module_name] = true;
                Methadone.State.getInstance().modules[module_name] = {
                    name: module_name,
                    type: module_type
                }
                modules.push(module_name);
            }

            return modules;
        }

        this.validateModule = function(name) {
            for (module in Methadone.State.getInstance().modules) {
                if (Methadone.State.getInstance().modules.hasOwnProperty(module) && Methadone.State.getInstance().modules[module].name === name) {
                    Methadone.Util.logError(name + " declared twice");
                }
            }
        }
    });
__m.initializeModule({"name":"Methadone.Parse","mixins":{},"type":"Module"});
__m.getOrCreate("Methadone.Reflect");
__m.assign("Methadone.Reflect", function () {

        Import: Methadone.Parse;
        Import: Methadone.State;
        Import: Methadone.Util;

        /**
         * Finds all of the dependencies for a set of modules
         */
        this.registerDependencies = function() {
            for (var module_name in Methadone.State.getInstance().modules) {
                if (Methadone.State.getInstance().modules.hasOwnProperty(module_name)) {
                    var current_module      = Methadone.State.getInstance().modules[module_name];

                    current_module.code     = Methadone.Parse.clean(Methadone.Util.getOrCreate(module_name).toString());
                    current_module.raw_code = Methadone.Util.getOrCreate(module_name).toString();

                    var explicitModules    = this.findTaggedSymbols(current_module, "Import");
                    var mixinModules       = this.findTaggedSymbols(current_module, "Mixin");
                    var root               = this.findTaggedSymbols(current_module, "Root");
                
                    current_module.imports = Methadone.Util.extend({}, explicitModules, mixinModules);
                    current_module.mixins  = mixinModules;
                    current_module.root    = Methadone.Util.keys(root)[0];

                    current_module.imports = Methadone.Util.extend(current_module.imports, this.findImplicitModules(module_name, current_module.code));
                }
            }
        }

        this.findTaggedSymbols = function(module, regex_) {
            var imports = {};
            regex = new RegExp("(^|;|{)\\s*(" + regex_ + ")\\s*:\\s*((var)?\\s+[a-zA-Z0-9_\\$]+\\s*=\\s*)?", "gm");
            while (regex.exec(module.code)) {
                var import_name = module.code.slice(regex.lastIndex).match(/([a-zA-Z0-9_\\.\\$]+)(\()?/);
                if (regex_ === "Root") {
                    imports[import_name[1].replace("this.", "")] = "ROOT";
                } else if (Methadone.State.getInstance().modules.hasOwnProperty(import_name[1])) {
                    if (Methadone.State.getInstance().modules[import_name[1]].type === "Class" && module.type === "Module" && regex_ === "Mixin") {
                        Methadone.Util.logError("Module " + module.name + " cannot mixin Class " + import_name[1]);
                    } else if (import_name[2] != undefined && import_name[2] != "") {
                        imports[import_name[1]] = "INSTANCE";
                    } else if (Methadone.State.getInstance().modules[import_name[1]].type === "Module") {
                        imports[import_name[1]] = "MODULE";
                    } else {
                        imports[import_name[1]] = "STATIC";
                    }
                } else {
                    Methadone.Util.logError("Module " + module.name + " declares an illegal " + regex_ + ": " + import_name[1]);
                }
            }
            return imports;
        }

        this.findImplicitModules = function(name, code) {
            var imports = {};
            for (var module_name in Methadone.State.getInstance().modules) {
                if (Methadone.State.getInstance().modules.hasOwnProperty(module_name) && name != module_name) {
                    // TODO must simulate lookbehind here to prevent capturing namespace substrings!
                    var regex = new RegExp(module_name.replace(".", "\\.").replace("$", "\\$") + "(?![a-zA-Z0-9_\\$])", "gm");
                    match: while (regex.exec(code)) {
                        for (var __module_name in Methadone.State.getInstance().modules) {
                            if (Methadone.State.getInstance().modules.hasOwnProperty(__module_name) && __module_name != module_name) {
                                var __regex = new RegExp(__module_name.replace(".", "\\.").replace("$", "\\$") + "(?![a-zA-Z0-9_\\$])", "gm");
                                __regex.lastIndex = regex.lastIndex - module_name.length;
                                if (path = __regex.exec(code)) {
                                    if ((__regex.lastIndex - regex.lastIndex) == (__module_name.length - module_name.length)) {
                                        continue match;
                                    }
                                }
                            }
                        }

                        if (!Methadone.State.getInstance().strict) {
                            imports[module_name] = true;
                        } else if (!Methadone.State.getInstance().modules[name].imports[module_name]) {
                            Methadone.Util.logError("Undeclared dependency " + module_name + " in " + name);
                        }
                    }
                }
            }
            return imports;
        }
    });
__m.initializeModule({"name":"Methadone.Reflect","mixins":{},"type":"Module"});
__m.getOrCreate("Methadone");
__m.assign("Methadone", function () {

        Mixin:  Methadone.State;

        Import: Methadone.Container;
        Import: Methadone.Init;
        Import: Methadone.Parse;
        Import: Methadone.Reflect;
        Import: Methadone.Util;

        this.reset();

        var getState = this.getInstance
        delete(this["getInstance"]);

        Root: this.scope = function(raw_code) {
            var cache = undefined;
            if (getState().ir && getState().valid) {
                getState().valid = false;
                for (var current_module in getState().ir) {
                    Methadone.Util.getOrCreate(getState().ir[current_module].name);
                }
            } else if (!getState().ir) {
                cache = Methadone.Util.cache(Methadone.Parse.parse(Methadone.Parse.clean(raw_code.toString())));
            }                        
            raw_code();
            if (!getState().ir) {
                for (var arg in cache) {
                    if (cache.hasOwnProperty(arg)) {
                        Methadone.Util.extend(Methadone.Util.getOrCreate(arg), cache[arg]);
                    }
                }
            }
            Methadone.Init.registerInitializer(this.initialize);
        };

        this.initialize = function() {
            if (!getState().initialized) {
                getState().initialized = true;
                if (!getState().ir) Methadone.Reflect.registerDependencies();
                Methadone.Container.loadModules();
            }
        };
    });
__m.initializeModule({"name":"Methadone","mixins":{"Methadone.State":"MODULE"},"type":"Module","root":"scope"});

methadone=Methadone;