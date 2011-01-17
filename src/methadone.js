/**
 *  Methadone.js
 *
 *  Copyright (c) 2010-2011 Andrew Stein & Benchmark Solutions
 *
 *  Permission is hereby granted, free of charge, to any person obtaining
 *  a copy of this software and associated documentation files (the
 *  "Software"), to deal in the Software without restriction, including
 *  without limitation the rights to use, copy, modify, merge, publish,
 *  distribute, sublicense, and/or sell copies of the Software, and to
 *  permit persons to whom the Software is furnished to do so, subject to
 *  the following conditions:
 *
 *  The above copyright notice and this permission notice shall be
 *  included in all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 *  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 *  MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 *  NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 *  LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 *  OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 *  WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */

(function() {

  ////////////////////////////////////////////////////////////////////////////
  ////
  //// State

  var __modules;
  var __strict;
  var __autoinit;
  var __initialized;
  var __uninitialized;
  var __valid;
  var __errors;
  var __preprocess;
  var __ir;
  var __startup_time;

  ////////////////////////////////////////////////////////////////////////////
  ////
  //// Public

  window.methadone = function(raw_code) {
    startTimer();
    if (__ir && __valid) {
      __valid = false;
      for (var current_module in __ir) {
        getOrCreate(__ir[current_module].name);
      }
    } else if (!__ir) {
      parse(clean(raw_code.toString()));
    }
    stopTimer();
    raw_code();
    registerInitializer();
  };

  window.methadone.initialize = function() {
    startTimer();
    if (!window.methadone.initialized) {
      __initialized = true;
      if (!__ir) registerDependencies();
      loadModules();
    }
    stopTimer();
  };

  window.methadone.reset = function() {
    __strict        = false;
    __valid         = true;
    __initialized   = false;
    __uninitialized = {};
    __errors        = [];
    __modules       = {};
    __autoinit      = true;
    __preprocess    = false;
    __startup_time  = 0;
  };

  window.methadone.reset();

  window.methadone.errors = function() { return __errors; };

  window.methadone.setIR  = function(ir) { __ir = ir; };

  window.methadone.getIR  = function() { return __ir; };

  window.methadone.getPreprocess = function() { return __preprocess; };

  window.methadone.setPreprocess = function(val) { __preprocess = val; };

  window.methadone.getTime = function() { return __startup_time / 1000; };

  ////////////////////////////////////////////////////////////////////////////
  ////
  //// Parsing & Polishing

  /**
   * Removes all non-syntax from Javascript text: Strings, Regex Literals &
   * Comments.  If the original Javascript was valid, then the resultant
   * Javascript should be safe enough to identify keywords via Regex.
   */
  function clean(code) {
    // TODO There are some combinations of regex literals, strings & comments
    // which @$!&*$! this parser - can be fixed by handling all 3 with
    // the state machine. These will likely sink any attempt at a bootstrap ...
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
  function parse(code) {
    var module_regex = new RegExp("(^|;|{)\\s*(Module|Class)\\s*:", "gm");
    var strict_regex = new RegExp("(^|;|{)\\s*Strict\\s*?:\\s*?true", "gm");
    var init_regex   = new RegExp("(^|;|{)\\s*Init\\s*?:\\s*?false", "gm");

    if (strict_regex.exec(code)) __strict  = true;
    if (init_regex.exec(code)) __autoinit  = false;

    while (moduleParsed = module_regex.exec(code)) {
      var module_name = code.slice(module_regex.lastIndex).match(/\s*(.*?)\s*?=\s*?function/)[1];
      var module_type = moduleParsed[2];

      validateModule(module_name);
      getOrCreate(module_name);
      __uninitialized[module_name] = true;
      __modules[module_name] = {
        name: module_name,
        type: module_type
      }
    }
  }

  function validateModule(name) {
    for (module in __modules) {
      if (__modules.hasOwnProperty(module) && __modules[module].name === name) {
        logError(name + " declared twice");
      }
    }
  }


  ////////////////////////////////////////////////////////////////////////////
  ////
  //// Modules

  function getOrCreate(name) {
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

  function extend(target) {
    var args = Array.prototype.slice.call(arguments);
    args = args.slice(1);
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

  /**
   * Finds all of the dependencies for a set of modules
   */
  function registerDependencies() {
    for (var module_name in __modules) {
      if (__modules.hasOwnProperty(module_name)) {
        var current_module = __modules[module_name];
        current_module.code = clean(getOrCreate(module_name).toString());

        var explicitModules = findTaggedSymbols(current_module, "Import");
        var mixinModules = findTaggedSymbols(current_module, "Mixin");

        current_module.imports = extend({}, explicitModules, mixinModules);
        current_module.mixins = mixinModules;

        current_module.imports = extend(current_module.imports, findImplicitModules(module_name, current_module.code));

      }
    }
  }

  function findTaggedSymbols(module, regex_) {
    var imports = {};
    regex = new RegExp("(^|;|{)\\s*(" + regex_ + ")\\s*:\\s*(var\\s+[a-zA-Z0-9_\\$]+\\s*=\\s*)?", "gm");
    while (regex.exec(module.code)) {
      var import_name = module.code.slice(regex.lastIndex).match(/([a-zA-Z0-9_\\.\\$]+)(\()?/);
      if (__modules.hasOwnProperty(import_name[1])) {
        if (__modules[import_name[1]].type === "Class" && module.type === "Module" && regex_ === "Mixin") {
          logError("Module " + module.name + " cannot mixin Class " + import_name[1]);
        } else if (import_name[2] != undefined && import_name[2] != "") {
          imports[import_name[1]] = "INSTANCE";
        } else if (__modules[import_name[1]].type === "Module") {
          imports[import_name[1]] = "MODULE";
        } else {
          imports[import_name[1]] = "STATIC";
        }
      } else {
        logError("Module " + module.name + " declares an illegal " + regex_ + ": " + import_name[1]);
      }
    }
    return imports;
  }

  function findImplicitModules(name, code) {
    var imports = {};
    for (var __module_name in __modules) {
      if (__modules.hasOwnProperty(__module_name) && name != __module_name) {
        // TODO must simulate lookbehind here to prevent capturing namespace substrings!
        var regex = new RegExp(__module_name.replace(".", "\\.").replace("$", "\\$") + "(?![a-zA-Z0-9_\\$])", "gm");
        if (regex.exec(code)) {
          if (!__strict) {
            imports[__module_name] = true;
          } else if (!__modules[name].imports[__module_name]) {
            logError("Undeclared dependency " + __module_name + " in " + name);
          }
        }
      }
    }
    return imports;
  }

  /**
   * Assigns an instance of an Object to a namespace.
   */
  function assign(name, obj) {
    var namespaces = name.split(".");
    var ns = namespaces[0];
    var nsparent = window;

    if (namespaces.length > 1) {
      var temp = window[ns];
      for (var i = 1; i < namespaces.length; i ++) {
        ns = namespaces[i];
        nsparent = temp;
        temp = temp[ns];
      }
    }

    if (typeof nsparent[ns] === "object" && keys(nsparent[ns]).length === 0) {
      nsparent[ns] = obj;
    } else {
      nsparent[ns] = extend(obj, nsparent[ns]);
    }
  }

  /**
   * Loads all modules registered so far by iterating over the module
   * list and initializing the ones whose depenencies have been
   * initialized.
   */
  function loadModules() {
    var running = true;
    var last_size = 0;
    var size = 0;
    var initialized = {};

    var order = [];

    if (__ir) {
      __ir = __ir.reverse();
      while (__ir.length > 0) {
        initializeModule(__ir.pop());
      }
    } else {
      while (running && __valid) {
        for (var module_name in __modules) {
          if (__modules.hasOwnProperty(module_name)) {
            var current_module = __modules[module_name];
            if (!initialized[current_module.name]) {
              var deps_satisfied = true;

              for (var import_name in current_module.imports) {
                if (current_module.imports.hasOwnProperty(import_name)) {
                  if (!initialized[import_name]) deps_satisfied = false;
                }
              }
              if (deps_satisfied) {
                if (__preprocess) {
                  order.push({
                    name:   current_module.name,
                    mixins: current_module.mixins,
                    type:   current_module.type
                  });
                } else {
                  initializeModule(current_module);
                }
                delete(__uninitialized[current_module.name]);
                initialized[current_module.name] = true;
                size ++;
              }
            }
          }
        }

        if (last_size === size) {
          var xxx = 0;
          for (var k in __uninitialized) xxx ++;
          if (xxx > 0) logError("Dependencies are unsatisfiable for " + JSON.stringify(keys(__uninitialized)) + "; not loaded");
          running = false;
        }

        last_size = size;
      }

      if (__preprocess) {
        __ir = "methadone.setIR(" + JSON.stringify(order) + ");";
      }
    }
  }

  /**
   * Instantiate the module or class.  This includes creating
   * a fake constructor function to handle usage as a Mixin declaration.
   */
  function initializeModule(current_module) {
    var pending_mixins = [];
    var self = [];
    if (current_module.type === "Module") {
      self.push({});
      pending_mixins.push({});
      var __constructor = getOrCreate(current_module.name);
      processMixins(current_module, self, pending_mixins);
      stopTimer();
      __constructor.apply(self[self.length - 1]);
      startTimer();
      checkForProperties(self[self.length - 1], current_module.name);
      assign(current_module.name, self[self.length - 1]);
      self.pop();
      pending_mixins.pop();
    } else {
      var new_constructor = generateClassConstructor(current_module, getOrCreate(current_module.name), self, pending_mixins);
      assign(current_module.name, new_constructor);
    }
  }

  /**
   * Modules may not have exposed properties in this version.
   */
  function checkForProperties(obj, name) {
    for (var prop in obj) {
      if (obj.hasOwnProperty(prop)) {
        if (typeof obj[prop] !== "function" && typeof obj[prop] !== "undefined") {
          logError("Module " + name + " has illegal public property " + prop);
        }
      }
    }
  }

  /**
   * Locally binds some vars for the scope of a constructor function;  this is where
   * dispatch happens which switches functionality of this function between
   * Mixin declaration and constructor.
   */
  function generateClassConstructor(_module, _constructor, self, pending_mixins) {
    return function() {
      if (pending_mixins.length > 0 && pending_mixins[pending_mixins.length - 1][_module.name]) {
        self.push(self[self.length - 1]);
        delete(pending_mixins[pending_mixins.length - 1][_module.name]);
      } else {
        self.push(this);
      }

      pending_mixins.push({});
      processMixins(_module, self, pending_mixins);

      var args = Array.prototype.slice.call(arguments);
      stopTimer();
      _constructor.apply(self[self.length - 1], args);
      startTimer();
      pending_mixins.pop();
      return self.pop();
    }
  }

  /**
   * Instantiate and collect the classes for a mixin and attach them to the
   * object at the top of the stack.
   */
  function processMixins(_module, self, pending_mixins) {
    for (var mixin_name in _module.mixins) {
      if (_module.mixins[mixin_name] === "MODULE") {
        extend(self[self.length - 1], getOrCreate(mixin_name));
      } else if (_module.mixins[mixin_name] === "INSTANCE") {
        pending_mixins[pending_mixins.length - 1][mixin_name] = true;
      } else {
        var obj = getOrCreate(mixin_name);
        extend(self[self.length - 1], new obj());
      }
    }
  }



  ////////////////////////////////////////////////////////////////////////////
  ////
  //// Initialization

  /**
   * Recursively waits for the proper moment to start the module loading process;
   * (also tripwired)
   */
  function registerInitializer() {
    if (!window.methadone.runModules) {
      window.methadone.runModules = true;
      if (document.addEventListener) {   // For Firefox, Chrome, Safari, Opera, Camino, Netscape Navigator, Konqueror, Lynx ...
        document.addEventListener("DOMContentLoaded", function() {
          if (__autoinit) { window.methadone.initialize() }
        }, false);
      } else if (document.attachEvent) { // For IE (sigh) ...
        setTimeout(function() {
          if (window.document.readyState == "complete") {
            if (__autoinit) { window.methadone.initialize(); }
          } else {
            registerInitializer();
          }
        }, 500);
      }
    }
  }


  ////////////////////////////////////////////////////////////////////////////
  ////
  //// Utilities

  /**
   * Log an error and invalidate the application
   */
  function logError(message) {
    console.error(message);
    __errors.push(message);
    __valid = false;
  }

  var __time__;

  function startTimer() {
    __time__ = new Date().getTime();
  }

  function stopTimer() {
    __startup_time += (new Date().getTime()) - __time__;
  }

  /**
   * Utility funciton to find all of the keys of an object
   * @param o
   */
  function keys(o) {
    var result = [];
    for (var name in o) { if (o.hasOwnProperty(name)) result.push(name); }
    return result;
  }
})();