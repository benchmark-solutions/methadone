# Methadone.js #
Dependency Management for Javascript




## Overview ##

Despite a cavalcade of frameworks, libraries, toolkits and other
gizmos, dependency management in Javascript is still a pain.  
There's always a catch -  either you need to pre-process your 
Javascript, or your classes are loaded via XMLHttpRequest/eval 
(yuck!), or you are required to import dependencies explicitly in 
every class via a bizarre string based naming system (requiring 
special IDE support).  Methadone.js aims to fix all that:

- Runs directly in the browser with no code transformation or
  compilation - what you see in the IDE is what you get in the
  browser.

- Classes and Modules define a clean, simple API for structuring
  Object Oriented Applications in Javascript, with an intuitive
  mapping to standard Javascript Objects.

- Mixins provide simple, flexible inheritance model.

- Dependencies can be detected automagically;  with strict mode 
  enabled, modules and classes with missing dependencies will not 
  initialize, displaying an error in the browser console.

- Modules and classes are declarative, so can be defined in any order, 
  in any methadone block, in any file.  Methadone.js handles
  dependencies, load ordering, parent object instantiation, detects
  circular and invalid dependencies in your architecture!

- Once all the modules and classes have been loaded, they exist as
  top-level Javascript Objects - use them just like you normally
  would, no strings attached!

- Less than 6k minimized

- EXPERIMENTAL - Run the dependency analysis offline & deploy your
  application with no reflection overhead.



## Usage ##

### Modules & Classes ###

In order to use Methadone.js in your Javascript project, you will need
to ensure that it is the first script loaded on your page - Methadone
will ensure that all further load order dependencies are satisfied.

    <head>
        <script src="script/methadone.js"></script>

        <!-- Your application's script tags go here ... -->

    </head>

Because Methadone.js uses code reflection to accomplish it's magic,
Methadone.js API functions do not work like vanilla Javascript
functions - they must be embedded in a call to the global function 
methadone to work.

    methadone(function() {

        // Your code w/ module & class declarations go here ...
        
    });

Within a methadone block, you can declare Modules and Classes (which
will execute asynchronously), as well as write standard javascript 
(which will execute synchronously).  

A Module is simply an object which can be referenced from other
Modules or Classes as a dependency - analogous to a module in Ruby or
a static class in Java.  Modules have the same syntax as Java
namespaces, but act just like globally defined Javascript objects - 
the only restriction being that Modules (unlike Classes) may not
have public properties, only functions.

    methadone(function() {

        Module: Org.App.DateUtils = function() {
            this.daysOfWeek = function() { 
                return [ 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday' ]; 
            }
            this.printDate =  function() {
                console.log('The current date is ' + (new Date()).toString());
            };
        }

        // Now that we've declared our module, you can use it in any
        // other module or class the same way you would use a standard
        // Javascript object;  Methadone.js will ensure that they are
        // instantiated in the correct order, or warn you if such an 
        // order does not exist.

        Module: Org.App.OtherModule = function() {
             console.log(Org.App.DateUtils.daysOfWeek()[2])  // prints 'Wednesday' on pageload
        }

        // This module will fail to load because it exposes a public string

        Module: Org.App.WontLoad = function() {
            this.test = "Look ma, I broke the module!";
        }

    });

A Class is simply a Javascript constructor function attached to a
global object - analagous to Ruby or Java classes.  Any properties or
functions declared in a class will only be accessible once the Class
is insantiated with the 'new' keyword, and any private members will be
private to that instance - identically to a standard Javascript
Object.

    methadone(function() {

        Class: Org.App.MyClass = function() {
            this.counter  = 0;
            this.increment = function() {
                this.counter ++;
            };
        }

        Module: Org.App.MyClass = function() {
            var instance      = new Org.MyApp.MyClass();
            var otherInstance = new Org.MyApp.MyClass();

            console.log(instance.counter);       // prints 0
            instance.increment();
            console.log(instance.counter);       // prints 1
            console.log(otherInstance.counter);  // prints 0
        }

    });

That's it!  Methadone.js does the heavy lifting for you.



### Mixins ###

Methadone.js supports mixins via the mixin function - analagous 
to Ruby mixins.

    methadone(function() {

        Class: Org.App.Cat = function() {
            Mixin: Org.App.Animal;
        }

        // You can alias mixins, too!

        Class: Org.App.Dog = function() {
            Mixin: var __super__ = Org.App.Animal;
            this.speak = function() { 
                __super__.speak(); 
                console.log("... is what cats say, I say Woof");  
            }
        }

        Module: Org.App.Animal = function() {
            this.speak = function() { console.log("Meow"); }
        }

        Module: Org.App.Main = function() {
            var cat = new Org.App.Cat();
            var dog = new Org.App.Dog();
            cat.speak();   // prints "Meow"
            dog.speak();   // prints "Meow\n... is what cats say, I say Woof"
        }

    });

When you mixin a class, Methadone.js will instantiate an instance of
this class for you regardless of whether or not you provide
constructor arguments.

    methadone(function() {

        // With constructor args
        Class: Org.App.Cat = function() {
            Mixin: Org.App.Animal('meow');
        }

        // Without constructor args
        Class: Org.App.Dog = function() {
            Mixin: Org.App.Animal;
        }       

        Class: Org.App.Animal = function(sound) {
            sound = sound || 'woof';
            this.speak = function() { console.log(sound); }
        }

        Module: Org.App.Main = function() {
            var cat = new Org.App.Cat();
            var dog = new Org.App.Dog();
            cat.speak();   // prints "meow"
            dog.speak();   // prints "woof"
        }

    });
    


### Strict Mode ###

For all of you architecture nazis out there (you know who you are
...), Methadone.js includes a strict mode which adds additional
dependency safety and required explicit dependency declaration.
Strict mode is enabled via a Methadone.js annotation.

    methadone(function() {

        Strict: true;

        // your code goes here ...

    });

You need only apply this annotation once, in any methadone code block;
once set, all modules and classes in all scripts will be treated 
strictly.  In strict mode, dependencies must be declared explicitly 
with the Import annotation:

    methadone(function() {

        Strict: true;

        Module: Org.App.Cat = function() {
            Import: Org.App.AnimalUtils;
            this.meow = function() { Org.App.AnimalUtils.say("Meow, bitches!"); };

            // Imports can be given aliases too
            Import: var alias = Org.App.BathUtils;
            this.wash = alias.wash;
        }

        // This module will cause your application to error on load, as it
        // contains a reference to Cat with no corresponding Import

        Module: Org.App.Invalid = function() {
             Org.App.Cat.meow();
        }

    });


## Experimental/Advanced features ##

### Initialization Record ###

This feature is not fully tested and may not correctly generate an IR on all
applications.

If application start time is critical for your deployed application, you can
calculate an Initialization Record for your application offline, then include
the generated ir.js file in your application's head tag to eliminate the
overhead associated with startup overhead - providing the same speed-up a
compilation step would provide, while preserving 1:1 code correspondence in the
IDE and browser.

If you would like to play with Initialization Record mode & provide feedback,
simply follow these instructions (subject to change):

1.  Install Node.js & NPM

2.  Run 'npm bundle' to install the dependencies

3.  Run 'node node_src/preprocess.js' followed by a list of directories/files
    you want to analyze.

4.  Include the resulting script ir.js in your application's head tag,
    immediately after methadone.js

5.  Buckle your seatbelts (because a high performance sportscar is an
    appropriate metaphor for the loadtime speedup your application will
    experience)

### Bootstrap ###

Though it is currently larger & slower than the pure-js version, ongoing &
future feature development will occur only on the self-hosted code,
though the API for this version may change drastically before it
replaces the pure-js version. If you would like to experiment with it,
you can compile Methadone.js with the following command:

    cp extras/methadone.js .
    node src_node/compile.js src_meth
    
This will overwrite the methadone.js in yoour project root with the 
compiled library.  You can then use the resultant methadone.js to run the 
compilation again:

    node src_node/compile.js src_meth

Note that the compiler currently will not work correctly on most other
applications, as it only recognizes a restricted subset of
Methadone.js necessary for self-hosting
