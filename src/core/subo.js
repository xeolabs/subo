Subo = {version: '0.1'};


Subo.apply = function(o, c, defaults) {
    if (defaults) {
        // no "this" reference for friendly out of scope calls
        Subo.apply(o, defaults);
    }
    if (o && c && typeof c == 'object') {
        for (var p in c) {
            o[p] = c[p];
        }
    }
    return o;
};

(function() {
    Subo.apply(Subo, {

        idSeed : 0,
        getId : function() {
            return 'subo-' + '-' + (++this.idSeed);
        },

        controllers : [],
        getController : function(id) {
            return this.controllers[id];
        },

        postForm : function(controllerId, eventName, form) {
            var args = [];
            var inputs = form.getElementsByTagName("*");
            for (var i = 0; i < inputs.length; i++) {
                if (inputs[i].type == "file" || inputs[i].type == "FILE") {
                    throw 'File upload not supported';
                }
                if (inputs[i].tagName == "input" || inputs[i].tagName == "INPUT") {
                    if (inputs[i].type == "hidden" || inputs[i].type == "HIDDEN") {
                        args[inputs[i].name] = inputs[i].value;
                    }
                    if (inputs[i].type == "text" || inputs[i].type == "TEXT") {
                        args[inputs[i].name] = inputs[i].value;
                    }
                    if (inputs[i].type == "checkbox" || inputs[i].type == "CHECKBOX") {
                        args[inputs[i].name] = inputs[i].checked;
                    }
                    if (inputs[i].type == "radio" || inputs[i].type == "RADIO") {
                        args[inputs[i].name] = inputs[i].checked;
                    }
                }
                if (inputs[i].tagName == "select" || inputs[i].tagName == "SELECT") {
                    var sel = inputs[i];
                    args[inputs[i].name] = inputs[sel.selectedIndex].value;
                }
            }
            this.fireViewEvent(controllerId, eventName, args);
        },

        fireViewEvent : function(controllerId, eventName, args) {
            var c = this.getController(controllerId);
            if (c == null) {
                throw 'Can\'t find Controller with ID \'' + controllerId + '\'';
            }
            var h = c.viewEventHandlers[eventName];
            if (h == null) {
                throw 'Can\'t find view-EventHandler \'' + eventName + '\' on Controller';
            }
            h.processEvent(args);
            c.application.reRender();
        },

        emptyFn : function() {
        },

        /** Adds elements of c to o where not existing in o, returns o
         *
         * @param o
         * @param c
         */
        applyIf : function(o, c) {
            if (o && c) {
                for (var p in c) {
                    if (typeof o[p] == "undefined") {
                        o[p] = c[p];
                    }
                }
            }
            return o;
        }
        ,

        /**
         *
         * @param origclass
         * @param overrides
         */
        extend : function() {
            // inline overrides
            var io = function(o) {
                for (var m in o) {
                    this[m] = o[m];
                }
            };
            var oc = Object.prototype.constructor;

            return function(sb, sp, overrides) {
                if (typeof sp == 'object') {
                    overrides = sp;
                    sp = sb;
                    sb = overrides.constructor != oc ? overrides.constructor : function() {
                        sp.apply(this, arguments);
                    };
                }
                var F = function() {
                };
                var sbp;
                var spp = sp.prototype;
                F.prototype = spp;
                sbp = sb.prototype = new F();
                sbp.constructor = sb;
                sb.superclass = spp;
                if (spp.constructor == oc) {
                    spp.constructor = sp;
                }
                sb.override = function(o) {
                    Subo.override(sb, o);
                };
                sbp.override = io;
                Subo.override(sb, overrides);
                sb.extend = function(o) {
                    Subo.extend(sb, o);
                };
                return sb;
            };
        }
                (),

        override : function(origclass, overrides) {
            if (overrides) {
                var p = origclass.prototype;
                for (var method in overrides) {
                    p[method] = overrides[method];
                }
            }
        },
        ns : function() { // in intellij using keyword "namespace" causes parsing errors
            var a = arguments, o = null, i, j, d, rt;
            for (i = 0; i < a.length; ++i) {
                d = a[i].split(".");
                rt = d[0];
                eval('if (typeof ' + rt + ' == "undefined"){' + rt + ' = {};} o = ' + rt + ';');
                for (j = 1; j < d.length; ++j) {
                    o[d[j]] = o[d[j]] || {};
                    o = o[d[j]];
                }
            }
        }
    });
})();


Subo.ns("Subo");

/** A Subo Application.  An Application is constructed with a configuration object that specifies its name, and a
 * callback that is invoked when it is rendered. For example:
 * <pre>
 * var app = new Subo.Application({
 *                       name : 'myApp',
 *                       onStart : function(args) {
 *                           this.addService('apha', ... );
 *                           this.addService('baker', ... );
 *                           this.addRootController('charlie',  ... ));
 *                       }
 *               });
 * </pre>
 *
 * The name parameter must correspond to the ID of a DIV element existing in the document. When the Application is
 * rendered, the HTML will be inserted within the DIV. As shown above, the onStart callback adds services, which are
 * optional, and a root Controller, which is mandatory.
 *
 * The Application is then started thus, with some arguments:
 *
 * <pre>
 * app.start({
 *           someArg: 'delta',
 *           someOtherArg: 'echo'
 *       });
 * </pre>
 *
 * The start method calls the onStart callback, passing in the given arguments. It then starts the root Controller before
 * rendering the Application.
 *
 * @param cfg
 */
Subo.Application = function(cfg) {
    cfg = cfg || {};
    if (!cfg.onStart) {
        throw 'Mandatory onStart callback not specified for Application';
    }
    if (!cfg.name) {
        throw 'Mandatory name not specified for Application';
    }
    this.name = cfg.name;
    function getName() {
        //   return name;
    }
    this.getName = getName;

    this.onStart = cfg.onStart;
    this.rootController = null;
    this.services = [];


    /** Starts this Application. After ensuring that the root Controller and services are destroyed if existing, this
     * method calls the onStart callback, which must then create the root Controller, and optionally add any services.
     * It then starts the root Controller and renders this Application to the DIV tag with the ID matching this
     * Application's name.
     *
     * @param args
     */
    this.start = function(args) {
        args = args || {};
        this.rootController = null;
        this.services = [];
        this.onStart(args);
        if (!this.rootController) {
            throw 'Mandatory root Controller not set in Application onStart callback';
        }
        this.rootController.start();
        this.render();
    };

    /** Adds a service object which elements within the Application can obtain by name. A service can be anything you
     *  like - there is no API that it must impliment. Subo calls it a 'service' because it is typically some kind of
     * service layer proxy, such as a DAO or a server facade. In fact, in most cases it will be an HTTP client through
     * which the Application communicates with a server.
     *
     * @param name Name to register the service under.
     * @param service The service object.
     */
    this.addService = function(name, service) {
        if (this.services[name] != null) {
            throw 'Duplicate service set in Application onStart callback: ' + name;
        }
        this.services[name] = service;
    }

/** Returns the service withe the given name
 * @param Name of service
 * @return The service
 */
   this.getService = function(name) {
        var s = this.controller.application.services[name];
        if (s == null) {
            throw 'Reference to undefined Service in EventHandler onEvent callback: "' + name + '"';
        }
        return s;
    }

    /** Sets the root controller for this Application.
     * @param c
     */
    this.setRootController = function(c) {
        if (this.rootController != null) {
            throw 'Duplicate root controller set in Application onStart callback: ' + c.name;
        }
        this.rootController = c;
        this.rootController.application = this;
    };

    this.render = function() {
        var e = document.getElementById(this.name);
        if (e == null) {
            throw 'No DIV tag found for Application to render at: \'' + this.name + '\''
        }
        e.innerHTML = this.rootController.getHtml();
        var sl;
    };

    this.reRender = function() {
        this.rootController.render();
    }
};

/** A Subo Controller.
 *
 * @param cfg
 */
Subo.Controller = function(cfg) {
    cfg = cfg || {};
    this.id = Subo.getId();
    if (!cfg.name) {
        throw 'Mandatory name not specified for Controller';
    }
    this.name = cfg.name;
    if (!cfg.onStart) {
        throw 'Mandatory onStart callback not specified for Controller';
    }
    this.onStart = cfg.onStart;
    this.args = (cfg.args) ? cfg.args : {};
    this.application = null;
    this.parentController = null;
    this.model = {}; // Cleared on each state transition
    this.states = [];

    this.reset = function() {
        this.view = null;
        this.model = [];
        this.viewEventHandlers = [];
        this.childEventHandlers = [];
        this.parentEventHandlers = [];
        this.childControllers = [];
        this.currentState = null;
        this.needsViewRefresh = true;
    };
    this.reset();

    this.start = function() {
        Subo.controllers[this.id] = this;
        this.reset();
        this.onStart(this.args);
        if (this.currentState == null) {
            throw 'No States added in Controller onStart callback - at least one must be added';
        }
        this.currentState.enter(this.args);
    };

    this.addState = function(s) {
        if (this.states[s.name] != null) {
            throw 'Duplicate State added in Controller onStart callback: "' + s.name + '"';
        }
        s.controller = this;
        if (this.currentState == null) {
            this.currentState = s;
        }
        this.states[s.name] = s;
    };

    this.getHtml = function() {
        return '<div id="' + this.id + '">' + this.view.getHtml() + '</div>';
    };

    this.render = function() {
        if (this.needsViewRefresh) {
            document.getElementById(this.id).innerHTML = this.view.getHtml();
            this.needsViewRefresh = false;
        } else {
            for (var name in this.childControllers) {
                if (name != "length") {
                    this.childControllers[name].render();
                }
            }
        }
    };

    this.destroyChildControllers = function() {
        for (var name in this.childControllers) {
            if (name != "length") {
                this.childControllers[name].destroy();
            }
        }
    };

    this.destroy = function() {
        delete Subo.controllers[this.id];
        for (var name in this.childControllers) {
            if (name != "length") {
                this.childControllers[name].destroy();
            }
        }
    };

    if (cfg.onStart) this.onStart = cfg.onStart;
}

/** Defines the mandatory View, and optional model data, child-Controllers and EventHandlers for a Controller's current
 * state of execution. A State sets these elements on its Controller within an onEntry callback, then removes them when
 * transitioned out of. The next State then defines new elements with its onEntry callback, and so on. A Controller must
 * have at least one State, otherwise it would have no such elements.
 *
 * @param cfg - provides name and onEntry callback
 */
Subo.State = function(cfg) {
    cfg = cfg || {};
    if (!cfg.name) {
        throw 'Mandatory name not specified for State';
    }
    this.name = cfg.name;
    if (!cfg.onEnter) {
        throw 'Mandatory onEnter callback not specified for State';
    }
    this.onEnter = cfg.onEnter;
    this.controller = null; // Will be set by my controller

    this.enter = function(args) {
        this.controller.destroyChildControllers();
        this.controller.reset();
        this.controller.currentState = this;
        this.onEnter(args);
        if (this.controller.view == null) {
            throw 'Mandatory View not set in Controller onEntry callback';
        }
    };

    /** Sets the Controller's current View.
     *
     * @param v The View
     * @throws Exception if View already added.
     */
    this.setView = function(v) {
        if (this.controller.view != null) {
            throw 'Set duplicate Controller View in State onEnter callback';
        }
        this.controller.view = v;
        this.controller.view.controller = this.controller;
    };


    /** Adds a child-Controller to the Controller.
     *
     * @param c New child-Controller
     * @throws Exception if name clashes with existing child Controller.
     */
    this.addChildController = function(c) {
        if (this.controller.childControllers[c.name] != null) {
            throw 'Added duplicate child Controller in State onEnter callback: "' + c.name + '"';
        }
        this.controller.childControllers[c.name] = c;
        c.controller = this.controller;
        c.application = this.controller.application;
        c.start();
    };

    /** Adds an EventHandler to the Controller to handle an event originating from the View.
     *
     * @param h An EventHandler
     * @throws Exception if name clashes with existing view EventHandler.
     */
    this.addViewEventHandler = function(h) {
        if (this.controller.viewEventHandlers[h.name] != null) {
            throw 'Added duplicate view-EventHandler in State onEnter callback:"' + h.name + '"';
        }
        this.controller.viewEventHandlers[h.name] = h;
        h.controller = this.controller;
    };

    /** Adds an EventHandler to the Controller to handle an event originating from the parent Controller.
     *
     * @param h An EventHandler
     * @throws Exception if name clashes with existing parent event EventHandler.
     */
    this.addParentEventHandler = function(h) {
        if (this.controller.parentEventHandlers[h.name] != null) {
            throw 'Added duplicate parent-EventHandler in State onEnter callback: "' + h.name + '"';
        }
        this.controller.parentEventHandlers[h.name] = h;
        h.controller = this.controller;
    };

    /** Adds an EventHandler to the Controller to handle an event originating from a child Controller.
     *
     * @param h An EventHandler
     * @throws Exception if name clashes with existing child event EventHandler.
     */
    this.addChildEventHandler = function(h) {
        if (this.controller.childEventHandlers[h.name] != null) {
            throw 'Added duplicate child-EventHandler in State onEnter callback: "' + h.name + '"';
        }
        this.controller.childEventHandlers[h.name] = h;
        h.controller = this.controller;
    };

    /** Returns a reference to the Controller's data model.
     *
     * @returns The data model reference.
     */
    this.getModel = function() {
        return this.controller.model;
    }

    /** Replaces the Controller's data model.
     *
     * @param newModel New data model.
     */
    this.setModel = function(newModel) {
        this.controller.model = newModel;
    }
};

/** An HTML view for a Controller. You must supply a onHtml callback that returns the HTML. The View provides methods
 * for you to to use within onHtml to obtain its Controller's model, as well as HTML from Views of child-Controllers.
 * View also provides a method to render a FORM for firing a view event, and Javascript invokation for firing a view
 * event off an anchor tag.
 *
 * @param cfg Configures the view with a getHtml callback
 */
Subo.View = function(cfg) {
    cfg = cfg || {};
    if (!cfg.getHtml) {
        throw 'Mandatory getHtml callback not specified for View';
    }
    this.getHtml = cfg.getHtml;

    /**
     * Returns an HTML FORM tag enclosing the given inner HTML, that fires a view event of the given name when
     * submitted, with parameters as specified by the form inputs.
     *
     * @param eventName Name of view event.
     * @param innerHtml HTML to enclose within the form tag.
     * @throws Exception if no view EventHandler matching the event name is found on the Controller.
     */
    this.getViewEventForm = function(eventName, innerHtml) {
        var v = this.controller.viewEventHandlers[eventName];
        if (v == null) {
            throw 'Reference to undefined view-EventHandler in View getHtml callback: "' + eventName + "'";
        }
        var formId = this.controller.id + ":" + eventName;
        return '<form method = "POST" action="javascript:Subo.postForm(\'' + this.controller.id + '\',\'' + eventName + '\', document.getElementById(\'' + formId + '\'));" name="'
                + formId + '" id="' + formId + '">'
                + innerHtml
                + '</form>';
    }

    /** Returns a string that contains some Javascript that fires the given view event at this View's Controller. The
     * invokation is intended to be used as the value of the 'url' attribute of an HTML anchor tag, for example.
     *
     * @param eventName Name of view event.
     * @param args Arguments for the view event
     * @throws Exception if no matching view EventHandler exists on this View's Controller.
     */
    this.getViewEventUrl = function(eventName, args) {   // TODO args for js call
        args = (args) ? args : {};
        var v = this.controller.viewEventHandlers[eventName];
        if (v == null) {
            throw 'Reference to undefined view-EventHandler in View getHtml callback: "' + eventName + "'";
        }
        var argsStr = '{';
        var first = true;
        for (var name in args) {
            if (!first) {
                argsStr += ',';
                first = true;
            }
            argsStr += '\'' + name + '\':\'' + args[name] + '\'';
        }
        argsStr += '}';
        return 'javascript:Subo.fireViewEvent(\'' + this.controller.id + '\',\'' + eventName + '\',' + argsStr + ')';
    }

    /** Returns the HTML view of a child Controller of this View's Controller. The HTML will be that returned by the
     * getHtml method on the View of the child Controller.
     *
     * @param name Name of child Controller of this View's Controller
     * @throws Exception if such child Controller exists on this View's Controller.
     */
    this.getChildControllerHtml = function(name) {
        var c = this.controller.childControllers[name];
        if (c == null) {
            throw 'Reference to undefined child Controller in View getHtml callback: "' + name + "'";
        }
        return '<div id="' + c.id + '">' + c.view.getHtml() + '</div>';
    }

    /** Returns a reference to this View's Controller's data model.
     *
     * @returns The data model reference.
     */
    this.getModel = function() {
        return this.controller.model;
    }

/** Returns the service with the given name
 * @param Name of service
 * @return The service
 */
   this.getService = function(name) {
        var s = this.controller.application.services[name];
        if (s == null) {
            throw 'Reference to undefined Service in EventHandler onEvent callback: "' + name + '"';
        }
        return s;
    }
}

Subo.EventHandler = function(cfg) {
    cfg = cfg || {};
    if (!cfg.name) {
        throw 'Mandatory name not specified for EventHandler';
    }
    this.name = cfg.name;
    if (!cfg.onEvent) {
        throw 'Mandatory onEvent callback not specified for EventHandler';
    }
    this.onEvent = cfg.onEvent;
    this.state = null;

    this.processEvent = function(args) {
        this.onEvent(args);
        this.controller.needsViewRefresh = true;
    };

    /** Transitions controller into the given state
     *
     * @param stateName Name of state to transition into
     * @param args Arguments that accompany the transition
     */
    this.doTransition = function(stateName, args) {
        args = (args) ? args : {};
        var s = this.controller.states[stateName];
        if (s == null) {
            throw 'Transition to undefined State in EventHandler onEvent callback: "' + stateName + '"';
        }
        s.enter(args);
        this.controller.currentState = s;
    };


    this.fireChildEvent = function(name, args) {
        args = (args) ? args : {};
        var h = this.controller.childEventHandlers[name];
        if (h != null) {
            h.processEvent(args);
        }
    }

    this.fireParentEvent = function(name, args) {
        args = (args) ? args : {};
        var h = this.controller.parentEventHandlers[name];
        if (h != null) {
            h.processEvent(args);
        }
    }

/** Returns the service with the given name
 * @param Name of service
 * @return The service
 */
    this.getService = function(name) {
        var s = this.controller.application.services[name];
        if (s == null) {
            throw 'Reference to undefined Service in EventHandler onEvent callback: "' + name + '"';
        }
        return s;
    }

    /** Returns a reference to this EventHandler's Controller's data model.
     *
     * @returns The data model reference.
     */
    this.getModel = function() {
        return this.controller.model;
    }
}



