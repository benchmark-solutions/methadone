// -*- Mode: js; tab-width: 2; indent-tabs-mode: t; c-basic-offset: 2; -*-

describe("Nonstrict mode", function() {
	function methtest(code) {
		annotated.reset();
		annotated(function() { Init: false; });
		annotated(code);
		annotated.initialize();
		return annotated.getErrors();
	}

	it("Parses a module with 2 module dependencies in the correct order", function() {
		var errors = methtest(function() { 
			Module: Inferred.TwoDeps3 = function() {
				this.result = function() { return Inferred.TwoDeps.result() + Inferred.TwoDeps2.result(); }
			}

			Module: Inferred.TwoDeps = function() {
				this.result = function() { return "PA"; }
			}

			Module: Inferred.TwoDeps2 = function() {
				this.result = function() { return "SS"; }
			}
		});

		expect(Inferred.TwoDeps3.result()).toEqual("PASS");
		expect(errors.length).toEqual(0);
	});



	it("Parses a module with dependencies obscrued by bizarre roadblocks", function() {
		var errors = methtest(function() { 
			Module: Inferred.BizarreDeps3 = function() {
				this.result = function() { 
					return  /*  //  */ Inferred.BizarreDeps.result() /* // */ + Inferred.BizarreDeps2.result();
				}
			}

			Module: Inferred.BizarreDeps = function() {
				this.result = function() { return "PA"; }
			}

			Module: Inferred.BizarreDeps2 = function() {
				this.result = function() { return "SS"; }
			}
		});

		expect(Inferred.BizarreDeps3.result()).toEqual("PASS");
		expect(errors.length).toEqual(0);
	});



	it("Parses Strings without detecting dependencies", function() {
		var errors = methtest(function() { 
			Module: Inferred.ParseString = function() {
				var temp = "; Import: Inferred.FakeModule;";
				this.result = function() { return "PASS"; }
			}
		});

		expect(Inferred.ParseString.result()).toEqual("PASS");
		expect(errors.length).toEqual(0);
	});



	it("Parses Comments without detecting dependencies", function() {
		var errors = methtest(function() { 
			Module: Inferred.ParseComment = function() {
				//; Import: Inferred.FakeModule; "
				/* ; Import: Inferred.FakeModule;' */
				this.result = function() { return "PASS"; }
			}
		});

		expect(Inferred.ParseComment.result()).toEqual("PASS");
		expect(errors.length).toEqual(0);
	});



	it("Parses Regexes without detecting dependencies", function() {
		var errors = methtest(function() { 
			Module: Inferred.ParseRegex = function() {
				var temp = /;Import:Inferred.FakeModule;/gm;
				this.result = function() { return "PASS"; }
			}
		});

		expect(Inferred.ParseRegex.result()).toEqual("PASS");
		expect(errors.length).toEqual(0);
	});



	it("Parses Comments in Strings without detecting dependencies", function() {
		var errors = methtest(function() { 
			Module: Inferred.ParseTrick = function() {
				var badString = "// ; Import: Inferred.FakeModule; ";
				this.result = function() { return "PASS"; }
			}
		});

		expect(Inferred.ParseTrick.result()).toEqual("PASS");
		expect(errors.length).toEqual(0);
	});



	it("Parses A Complex Grammar without detecting dependencies", function() {
		var errors = methtest(function() {
			Module: Inferred.ParseTrick2 = function() {
				var temp = /;Import:Inferred.FakeModule;/.exec("; Import: Inferred.FakeModule;"); // ; Import: Inferred.FakeModule ";
				this.result = function() { return "PASS"; }
			}
		});

		expect(Inferred.ParseTrick2.result()).toEqual("PASS");
		expect(errors.length).toEqual(0);
	});





	it("Handles Module Mixins", function() {
		var errors = methtest(function() {
			Module: Inferred.MixinModule__ = function() {
				this.result = function() { return "FAIL"; }
			}

			Module: Inferred.MixinModule = function() {
				Mixin: var _super = Inferred.MixinModule__;
				this.result = function() { return _super.result().replace("FAIL", "PASS"); }
			}
		});

		expect(Inferred.MixinModule__.result()).toEqual("FAIL");
		expect(Inferred.MixinModule.result()).toEqual("PASS");
		expect(errors.length).toEqual(0);
	});



	it("Handles Class Mixins", function() {
		var errors = methtest(function() {
			Class: Inferred.InstanceMixinClass = function() {
				this.result = "FAIL";
			  this.method = function() { return "PASS"; }
			}

			Class: Inferred.MixinClass = function() {
				this.result = "FAIL";
				this.method2 = function() { return "PASS"; }
			}

			Module: Inferred.MixinModule = function() {
				this.result = function() { return new Inferred.MixinClass2().result.replace("FAIL", "PASS"); }
			}

			Class: Inferred.MixinClass2 = function() {
				Mixin: Inferred.InstanceMixinClass();
				Mixin: Inferred.MixinClass;
				this.result = this.result.replace("FAIL", "PASS");
			}
		});

		expect(new Inferred.MixinClass().result).toEqual("FAIL");
		expect(new Inferred.MixinClass2().result).toEqual("PASS");
		expect(new Inferred.MixinClass2().method()).toEqual("PASS");
		expect(new Inferred.MixinClass2().method2()).toEqual("PASS");
		expect(Inferred.MixinModule.result()).toEqual("PASS");
		expect(errors.length).toEqual(0);
	});





	it("Handles Correct Constructor Arg type annotations", function() {
		var errors = methtest(function() {
			Module: Inferred.TypedModule = function() {
				var local = new Inferred.TypedClass("PASS")
				this.result = function() { return local.result(); }
			}
			Class: Inferred.TypedClass = function(param) {
				param  :String;
				this.result = function() { return param; }
			}

		});

		expect(Inferred.TypedModule.result()).toEqual("PASS");
		expect(errors.length).toEqual(0);
	});



	it("Handles Correct Method Arg type annotations", function() {
		var errors = methtest(function() {
			Module: Inferred.TypedModule2 = function() {
				this.result = function() { return Inferred.TypedModule1("PASS"); }
			}
			Module: Inferred.TypedModule1 = function() {
				this.result = function(param) { 
					param :String;
					return param; 
				}
			}

		});

		expect(Inferred.TypedModule.result()).toEqual("PASS");
		expect(errors.length).toEqual(0);
	});



	it("Handles Incorrect Constructor Arg type annotations", function() {
		try {
			var errors = methtest(function() {
				Module: Inferred.TypedModule = function() {
					var local = new Inferred.TypedConClass("PASS")
					this.result = function() { return local.result(); }
				}
				Class: Inferred.TypedConClass = function(param) {
					param  :Number;
					this.result = function() { return param; }
				}

			});
			expect(false).toEqual(true);	
		} catch (e) {
			expect(e.message).toEqual('Module Inferred.TypedConClass type error; param::number invoked with PASS::string')
		}
	});



	it("Handles Incorrect Method Arg type annotations", function() {
		try {
			var errors = methtest(function() {
				Module: Inferred.TypedModuleB = function() {
					Inferred.TypedModuleA.result("PASS");
				}
				Module: Inferred.TypedModuleA = function() {
					this.result = function(param) { 
						param :Number;
						return param; 
					}
				}

			});
			expect(false).toEqual(true);	
		} catch (e) {
			expect(e.message).toEqual('Type Error; PASS is not a number')
		}
	});
	
	

	it("Doesn't load a module with a nonexistent dependency", function() {
		var errors = methtest(function() {
			Module: Inferred.UnresolvableDependencies = function() {
				Import: Inferred.FakeModule;
			}
		});

		expect(errors[0]).toEqual('Module Inferred.UnresolvableDependencies declares an illegal Import: Inferred.FakeModule');
		expect(errors.length).toEqual(1);
	});
	
	it("Deals with a restriction on a type constructor, without wrapping the constructor twice", function() {
         var errors = methtest(function() {
             Class: Strict.ConflictClassA = function(val) {
                 val :String;
                 this.result = val
             };

             Class: Strict.ConflictClassA.ConflictClassB = function(val) {
                 val :String;
                 
                 this.result = new Strict.ConflictClassA(val).result;
             };
         });

         expect(new Strict.ConflictClassA.ConflictClassB('PASS').result).toEqual('PASS');
         expect(errors.length).toEqual(0);
     });
    
      it("Handles Modules with illegal properties", function() {
          try {
             var errors = methtest(function() {
                 Module: Strict.IllegalProperty = function() {
                     this.result = "FAIL";
                 }
             });
             expect(true).toEqual(false);
         } catch (ex) {
             expect(ex.message).toEqual("Module Strict.IllegalProperty has illegal public property result");
         }
     });

    

});
