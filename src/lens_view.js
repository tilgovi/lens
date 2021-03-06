"use strict";

var _ = require("underscore");
var util = require('substance-util');
var html = util.html;
var View = require("substance-application").View;
var $$ = require("substance-application").$$;


// Lens.View Constructor
// ========
// 

var LensView = function(controller) {
  View.call(this);

  this.controller = controller;
  this.$el.attr({id: "container"});

  // Handle state transitions
  // --------
  
  this.listenTo(this.controller, 'state-changed', this.onStateChanged);
  this.listenTo(this.controller, 'loading:started', this.displayLoadingIndicator);

  $(document).on('dragover', function () { return false; });
  $(document).on('ondragend', function () { return false; });
  $(document).on('drop', this.handleDroppedFile.bind(this));
};

LensView.Prototype = function() {

  this.displayLoadingIndicator = function(msg) {
    this.$('#main').empty();
    this.$('.loading').html(msg).show();
  };

  this.handleDroppedFile = function(e) {
    var ctrl = this.controller;
    var files = event.dataTransfer.files;
    var file = files[0];
    var reader = new FileReader();

    reader.onload = function(e) {
      ctrl.importXML(e.target.result);
    };

    reader.readAsText(file);
    return false;
  };

  // Session Event handlers
  // --------
  //

  this.onStateChanged = function() {
    var state = this.controller.state;
    if (state.context === "reader") {
      this.openReader();
    } else {
      console.log("Unknown application state: " + state);
    }
  };


  // Open the reader view
  // ----------
  //

  this.openReader = function() {
    var view = this.controller.reader.createView();
    this.replaceMainView('reader', view);

    var doc = this.controller.reader.__document;
    var publicationInfo = doc.get('publication_info');
    
    // Hide loading indicator
    this.$('.loading').hide();

    if (publicationInfo) {
      // Update URL
      this.$('.go-back').attr({
        href: publicationInfo.doi
      });
    }
  };

  // Rendering
  // ==========================================================================
  //

  this.replaceMainView = function(name, view) {
    $('body').removeClass().addClass('current-view '+name);

    if (this.mainView && this.mainView !== view) {
      this.mainView.dispose();
    }

    this.mainView = view;
    this.$('#main').html(view.render().el);
  };

  this.render = function() {
    this.el.innerHTML = "";

    // Browser not supported dialogue
    // ------------

    this.el.appendChild($$('.browser-not-supported', {
      text: "Sorry, your browser is not supported.",
      style: "display: none;"
    }));

    this.el.appendChild($$('a.go-back', {
      href: "#",
      html: '<i class="icon-chevron-left"></i>',
      title: "Back to original article"
    }));


    // About Lens
    // ------------

    this.el.appendChild($$('a.about-lens', {
      href: "http://lens.substance.io",
      html: 'Lens 0.2.0'
    }));

    // Loading indicator
    // ------------

    this.el.appendChild($$('.loading', {
      style: "display: none;"
    }));

    // Main panel
    // ------------

    this.el.appendChild($$('#main'));
    return this;
  };

  this.dispose = function() {
    this.stopListening();
    if (this.mainView) this.mainView.dispose();
  };
};


// Export
// --------

LensView.Prototype.prototype = View.prototype;
LensView.prototype = new LensView.Prototype();

module.exports = LensView;