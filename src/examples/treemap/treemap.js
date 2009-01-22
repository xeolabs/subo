CellController = function(cfg) {

    cfg.onStart = function(args) {

        this.addState(new Subo.State({
            name: 'undivided',

            onEnter:function(args) {

                // On entry into each state, Subo clears the controller's model and destroys it's view and
                // event handlers. So we need to rebuild the model, create a new view (mandatory), and add
                // new view event handlers. Subo complains if we forget to create the new view, but the rest
                // is optional.

                this.setModel({
                    width:args.width,
                    height:args.height,
                    axis:args.axis
                });

                // Add the controller's view for this state.

                this.setView(new Subo.View({

                    // The view is a single-cell table that when clicked on fires a 'clicked' view event at
                    // this controller.

                    getHtml: function() {
                        var model = this.getModel();
                        var randomColour = (function () {
                            var array = new Array("f", "e", "d", "c", "b", "a", "9", "8", "7", "6", "5", "4", "3", "2", "1");
                            var endHex = "";
                            do  { // Dont want white, can't see it
                                endHex = "#";
                                for (var i = 0; i < 6; i++) {
                                    endHex += array[Math.round(Math.random() * (array.length - 1))];
                                }
                            } while (endHex == "#ffffff")   ;
                            return endHex;
                        }());
                        return '<table  border="0px" cellpadding="0px" cellspacing="0px" ' +
                               'width="' + model.width + '" height="' + model.height + '">' +
                               '<tr><td bgcolor = "' + randomColour + '" width = "' + model.width + '" height = "' +
                               model.height + '"><a href = "' + this.getViewEventUrl('clicked') +
                               '"><img src = "blank.gif" border = "0px" width = "' + model.width +
                               '" height = "' + model.height + '"></a></td></tr></table>';
                    }
                }));

                // Add a handler to process a 'clicked' event from the view. It will cause this controller
                // to transition to one of the two other states depending on which axis this controller is
                // configured to divide on.

                this.addViewEventHandler(new Subo.EventHandler({
                    name: 'clicked',
                    onEvent:function(args) {
                        var model = this.getModel();
                        switch (model.axis) {
                            case 'hor':
                                this.doTransition('hordivided', model);
                                break;
                            case 'vert':
                                this.doTransition('vertdivided', model);
                                break;
                        }
                    }
                }))
            }
        }));

        this.addState(new Subo.State({
            name: 'hordivided',

            onEnter:function(args) {
                this.setModel(args);

                this.setView(new Subo.View({
                    getHtml: function() {
                        var model = this.getModel();
                        return '<table border="0px" cellpadding="0px" cellspacing="0px" width="' +
                               model.width +
                               '" height="' +
                               model.height +
                               '"><tr><td height="50%">' +
                               this.getChildControllerHtml('a') +
                               '</td><td height="50%">' +
                               this.getChildControllerHtml('b') +
                               '</td></tr></table>';
                    }
                }));

                this.addChildController(new CellController({
                    name: 'a',
                    args: {
                        'width' : this.getModel().width / 2,
                        'height' : this.getModel().height,
                        'axis' : 'vert'
                    }
                }));

                this.addChildController(new CellController({
                    name: 'b',
                    args: {
                        'width' : this.getModel().width / 2,
                        'height' : this.getModel().height,
                        'axis' : 'vert'
                    }
                }));
            }
        }));

        this.addState(new Subo.State({
            name: 'vertdivided',

            onEnter:function(args) {
                this.setModel(args);

                this.setView(new Subo.View({
                    getHtml: function() {
                        var model = this.getModel();
                        return '<table border="0px" cellpadding="0px" cellspacing="0px" width="' +
                               model.width +
                               '" height="' +
                               model.height +
                               '"><tr><td width="50%">' +
                               this.getChildControllerHtml('a') +
                               '</td></tr><tr><td width="50%">' +
                               this.getChildControllerHtml('b') +
                               '</td></tr></table>';
                    }
                }));

                this.addChildController(new CellController({
                    name: 'a',
                    args: {
                        width : this.getModel().width,
                        height : this.getModel().height / 2,
                        axis : 'hor'
                    }
                }));

                this.addChildController(new CellController({
                    name: 'b',
                    args: {
                        width : this.getModel().width,
                        height : this.getModel().height / 2,
                        axis : 'hor'
                    }
                }));
            }
        }));
    };
    CellController.superclass.constructor.call(this, cfg);
}

Subo.extend(CellController, Subo.Controller, {


});

var treemap = new Subo.Application({
    name: 'treemap',

    onStart: function(args) {
        this.setRootController(new Subo.Controller({
            name:'root',

            onStart:function(args) {
                this.addState(new Subo.State({
                    name: 'initial',

                    onEnter: function(args) {

                        this.setView(new Subo.View({
                            getHtml:function() {
                                return '<center>' +
                                       '</br>' +
                                       '<img border="0px" src="logo.png" width="440" height="145"/>' +
                                       '</br>' +
                                       '<a href="' +
                                       this.getViewEventUrl('clear') +
                                       '">Clear</a>' +
                                       '</br>' +
                                       '</br>' +
                                       '<table cellpadding="0px" cellspacing="0px" border="0px" width="400" height="300">' +
                                       '<tr>' +
                                       '<td>' +
                                       this.getChildControllerHtml('root') +
                                       '</td>' +
                                       '</tr>' +
                                       '</table>' +
                                       '</br>' +
                                       '<small>A treemap is a space-constrained visualization of a hierarchical structure, in this case a controller hierarchy.</br>' +
                                       'When you click on a cell, its controller creates two child controllers, each with their own cell, and arranges</br>' +
                                       'the cells of the children within its own. The arrangement alternates between horizontal and vertical as </br>' +
                                       'one descends into the hierarchy. Eventually, you will end up with a binary tree of Controllers.</br> </br>' +
                                       'Notice how fast the subdivision occurs, thanks to Jandals use of AJAX.</br></br>' +
                                       '</br>Clicking <b>Clear</b> clears the map by deleting the child controllers of the root.</small>' +
                                       '</center>';
                            }
                        }));

                        this.addViewEventHandler(new Subo.EventHandler({
                            name: 'clear',
                            onEvent:function(args) {
                                this.doTransition('initial');
                            }
                        }));

                        this.addChildController(new CellController({
                            name: 'root',
                            args: {'width': 400, 'height': 300, 'axis':'vert', 'colour':'#9999FF'}
                        }))
                    }
                }));
            }
        }))
    }
});


treemap.start({});