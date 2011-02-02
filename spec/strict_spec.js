describe("Strict mode", function() {
    function methtest(code) {
        annotated.reset();
        annotated(function() { Init: false; Strict: true; });
        annotated(code);
        annotated.initialize();
        return annotated.getErrors();
    }

    it("Parses a module with 2 module dependencies in the correct order", function() {
        var errors = methtest(function() { 
            Module: Strict.TwoDeps3 = function() {
                Import: Strict.TwoDeps;
                Import: Strict.TwoDeps2;
                this.result = function() { return Strict.TwoDeps.result() + Strict.TwoDeps2.result(); }
            };

            Module: Strict.TwoDeps = function() {
                this.result = function() { return "PA"; }
            };

            Module: Strict.TwoDeps2 = function() {
                this.result = function() { return "SS"; }
            }
        });

        expect(Strict.TwoDeps3.result()).toEqual("PASS");
        expect(errors.length).toEqual(0);
    });



    it("Parses Strings without detecting dependencies", function() {
        var errors = methtest(function() { 
            Module: Strict.ParseString = function() {
                var temp = "; Import: Strict.FakeModule;";
                this.result = function() { return "PASS"; }
            }
        });

        expect(Strict.ParseString.result()).toEqual("PASS");
        expect(errors.length).toEqual(0);
    });



    it("Parses Comments without detecting dependencies", function() {
        var errors = methtest(function() { 
            Module: Strict.ParseComment = function() {
                //; Import: Strict.FakeModule; "
                /* ; Import: Strict.FakeModule;' */
                this.result = function() { return "PASS"; }
            }
        });

        expect(Strict.ParseComment.result()).toEqual("PASS");
        expect(errors.length).toEqual(0);
    });



    it("Parses Regexes without detecting dependencies", function() {
        var errors = methtest(function() { 
            Module: Strict.ParseRegex = function() {
                var temp = /;Import:Strict.FakeModule;/gm;
                this.result = function() { return "PASS"; }
            }
        });

        expect(Strict.ParseRegex.result()).toEqual("PASS");
        expect(errors.length).toEqual(0);
    });



    it("Parses Comments in Strings without detecting dependencies", function() {
        var errors = methtest(function() { 
            Module: Strict.ParseTrick = function() {
                var badString = "// ; Import: Strict.FakeModule; ";
                this.result = function() { return "PASS"; }
            }
        });

        expect(Strict.ParseTrick.result()).toEqual("PASS");
        expect(errors.length).toEqual(0);
    });



    it("Parses A Complex Grammar without detecting dependencies", function() {
        var errors = methtest(function() {
            Module: Strict.ParseTrick2 = function() {
                var temp = /;Import:Strict.FakeModule;/.exec("; Import: Strict.FakeModule;"); // ; Import: Strict.FakeModule ";
                this.result = function() { return "PASS"; }
            }
        });

        expect(Strict.ParseTrick2.result()).toEqual("PASS");
        expect(errors.length).toEqual(0);
    });

    



    it("Handles Module Mixins", function() {
        var errors = methtest(function() {
            Module: Strict.MixinModule__ = function() {
                this.result = function() { return "FAIL"; }
            }

            Module: Strict.MixinModule = function() {
                Mixin: var _super = Strict.MixinModule__;
                this.result = function() { return _super.result().replace("FAIL", "PASS"); }
            }
        });

        expect(Strict.MixinModule__.result()).toEqual("FAIL");
        expect(Strict.MixinModule.result()).toEqual("PASS");
        expect(errors.length).toEqual(0);
    });


    it("Handles Correct Constructor Arg type annotations", function() {
        var errors = methtest(function() {
            Class: Strict.TypedConClass = function(param) {
				param  :String;
                this.result = function() { return param; }
            }

            Module: Strict.TypedModule = function() {
				Import: Strict.TypedConClass;
                var local = new Strict.TypedConClass("PASS")
                this.result = function() { return local.result(); }
            }
        });

        expect(Strict.TypedModule.result()).toEqual("PASS");
        expect(errors.length).toEqual(0);
    });



    it("Handles Correct Method Arg type annotations", function() {
        var errors = methtest(function() {
            Module: Strict.TypedModule1 = function() {
				this.result = function(param) { 
					param :String;
					return param; 
				}
            }

            Module: Strict.TypedModule2 = function() {
				Import: Strict.TypedModule1;
                this.result = function() { return Strict.TypedModule1("PASS"); }
            }
        });

        expect(Strict.TypedModule.result()).toEqual("PASS");
        expect(errors.length).toEqual(0);
    });



    it("Handles Incorrect Constructor Arg type annotations", function() {
		try {
	        var errors = methtest(function() {
	            Class: Strict.TypedClass = function(param) {
					param  :Number;
	                this.result = function() { return param; }
	            }

	            Module: Strict.TypedModule = function() {
					Import: Strict.TypedClass;
	                var local = new Strict.TypedClass("PASS")
	                this.result = function() { return local.result(); }
	            }
	        });
			expect(false).toEqual(true);	
		} catch (e) {
			expect(e.message).toEqual('Module Strict.TypedClass type error; param::number invoked with PASS::string')
		}
    });



    it("Handles Incorrect Method Arg type annotations", function() {
		try {
	        var errors = methtest(function() {
	           	 Module: Strict.TypedModuleA = function() {
						this.result = function(param) { 
							param :Number;
							return param; 
						}
		            }

		            Module: Strict.TypedModuleB = function() {
						Import: Strict.TypedModuleA;
		                Strict.TypedModuleA.result("PASS");
		            }
	        });
			expect(false).toEqual(true);	
		} catch (e) {
			expect(e.message).toEqual('Type Error; PASS is not a number')
		}
    });



    it("Handles Class Mixins", function() {
        var errors = methtest(function() {
            Class: Strict.MixinClass = function() {
                this.result = "FAIL";
            }

            Module: Strict.MixinModule = function() {
                Import: Strict.MixinClass2;
                this.result = function() { return new Strict.MixinClass2().result.replace("FAIL", "PASS"); }
            }

            Class: Strict.MixinClass2 = function() {
                Mixin: Strict.MixinClass;
                this.result = this.result.replace("FAIL", "PASS");
            }
        });

        expect(new Strict.MixinClass().result).toEqual("FAIL");
        expect(new Strict.MixinClass2().result).toEqual("PASS");
        expect(Strict.MixinModule.result()).toEqual("PASS");
        expect(errors.length).toEqual(0);
    });
    


    it("Doesn't load a module with a nonexistent dependency", function() {
        var errors = methtest(function() {
            Module: Strict.UnresolvableDependencies = function() {
                Import: Strict.FakeModule;
            }
        });

        expect(errors[0]).toEqual('Module Strict.UnresolvableDependencies declares an illegal Import: Strict.FakeModule');
        expect(errors.length).toEqual(1);
    });



    it("Parses a module with 2 undeclared module dependencies while reporting an error", function() {
        var errors = methtest(function() {
            Module: Strict.BadTwoDeps3 = function() {
                this.result = Strict.BadTwoDeps.result() + Strict.BadTwoDeps2.result();
            };

            Module: Strict.BadTwoDeps = function() {
                this.result = function() { return "PA"; }
            };

            Module: Strict.BadTwoDeps2 = function() {
                this.result = function() { return "SS"; }
            }
        });

        expect(errors[0]).toEqual('Undeclared dependency Strict.BadTwoDeps in Strict.BadTwoDeps3');
        expect(errors[1]).toEqual('Undeclared dependency Strict.BadTwoDeps2 in Strict.BadTwoDeps3');
        expect(errors.length).toEqual(2);
    });

});
