var numberGuess = new Subo.Application({
    name: 'numberguess',

    onStart: function(args) {

        // Add a service to provide the number to guess. A service can be any kind of object; we call it a
        // service because its intended to provide the service layer to the application.

        this.addService('numberGenerator', {
            getNumber : function() {
                return 5;
            }
        });

        // Add a service to get URLs to resources (images etc) relative to the application's home URL.
 
        this.addService('resourceFinder', {
            getUrl : function(name) {
                return (args.homeUrl || '') + '/' + name;
            }
        });

        // Application's root controller just provides a frame around the whole application

        this.setRootController(new Subo.Controller({
            name:'frame',

            onStart:function() {

                // On start, the root controller adds its sole state

                this.addState(new Subo.State({
                    name:'playing',

                    // As soon as it starts, the root controller enters the first State that was added. This state
                    // adds to its Controller a View, a simple frame around everything with a logo, plus a child-Controller
                    // that manages the actual game.

                    onEnter:function(args) {

                        // You can see below how the View has the child-Controller's HTML embedded within it, containing an image. 
                        // We're using the resource finder service to get an absolute URL to the image: 

                        this.setView(new Subo.View({
                            getHtml: function() {
                                return '<img src="' + this.getService('resourceFinder').getUrl('logo.jpg') + '"/>' +
                                       '<br/><br/>' + this.getChildControllerHtml('game');
                            }
                        }));

                        this.addChildController(new Subo.Controller({
                            name: 'game',

                            onStart: function() {

                                this.addState(new Subo.State({
                                    name: 'guessing',

                                    onEnter: function() {

                                        this.setView(new Subo.View({
                                            getHtml: function() {
                                                return this.getViewEventForm(
                                                        'guess',
                                                        'Guess a number: <input name="number" type="text" value=""/>'
                                                                + '<br/><br/><input type="submit" value="Submit"/>'
                                                        );
                                            }
                                        }));

                                        this.addViewEventHandler(new Subo.EventHandler({
                                            name: 'guess',

                                            onEvent:function(args) {
                                                var correctNumber = this.getService('numberGenerator').getNumber();
                                                var testNumber = parseInt(args['number'], 10);
                                                
                                                if (isNaN(testNumber)) {
                                                    this.doTransition('incorrect', {message:'That\'s not a number!'});
                                                } else if (correctNumber > testNumber) {
                                                    this.doTransition('incorrect', {message:'Too low'});
                                                } else if (correctNumber < testNumber) {
                                                    this.doTransition('incorrect', {message:'Too high'});
                                                } else {
                                                    this.doTransition('correct');
                                                }
                                            }
                                        }));
                                    }
                                }));

                                this.addState(new Subo.State({
                                    name: 'incorrect',

                                    onEnter:function(args) {

                                        this.setModel({
                                            message : args['message']
                                        });

                                        this.setView(new Subo.View({

                                            getHtml: function() {
                                                return '<b>'
                                                        + this.getModel().message
                                                        + '</b><br/><br/><a href="'
                                                        + this.getViewEventUrl('playAgain')
                                                        + '">Play Again</a>';
                                            }
                                        }));

                                        this.addViewEventHandler(new Subo.EventHandler({
                                            name:'playAgain',

                                            onEvent:function(args) {
                                                this.doTransition('guessing');
                                            }
                                        }));
                                    }
                                }));

                                this.addState(new Subo.State({
                                    name: 'correct',

                                    onEnter:function(args) {

                                        this.setView(new Subo.View({

                                            getHtml: function() {
                                                return '<b>Correct!</b><br/><br/><a href="'
                                                        + this.getViewEventUrl('playAgain')
                                                        + '">Play Again</a>';
                                            }
                                        }));

                                        this.addViewEventHandler(new Subo.EventHandler({
                                            name:'playAgain',

                                            onEvent:function(args) {
                                                this.doTransition('guessing');
                                            }
                                        }));
                                    }
                                }));
                            }
                        }));
                    }
                }));
            }
        }));
    }
});

