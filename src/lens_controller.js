"use strict";

var _ = require("underscore");
var util = require("substance-util");
var Controller = require("substance-application").Controller;
var LensView = require("./lens_view");
var ReaderController = require("lens-reader").Controller;
var Article = require("lens-article");
var Converter = require("lens-converter");

// Lens.Controller
// -----------------
//
// Main Application Controller

var LensController = function(config) {
  Controller.call(this);

  this.config = config;

  // Main controls
  this.on('open:reader', this.openReader);
  this.on('open:library', this.openLibrary);
  this.on('open:login', this.openLogin);
  this.on('open:test_center', this.openTestCenter);
};

LensController.Prototype = function() {

  // Initial view creation
  // ===================================

  this.createView = function() {
    var view = new LensView(this);
    this.view = view;
    return view;
  };

  // After a file gets drag and dropped it will be remembered in Local Storage
  // ---------

  this.importXML = function(xml) {
    var importer = new Converter.Importer();
    var doc = importer.import(xml);
    this.createReader(doc, {
      context: 'toc'
    });
  };

  // Update URL Fragment
  // -------
  // 
  // This will be obsolete once we have a proper router vs app state 
  // integration.

  this.updatePath = function(state) {
    var path = [];

    path.push(state.context);

    if (state.node) {
      path.push(state.node);
    } else {
      path.push('all');
    }

    if (state.resource) {
      path.push(state.resource);
    }

    if (state.fullscreen) {
      path.push('fullscreen');
    }

    window.app.router.navigate(path.join('/'), {
      trigger: false,
      replace: false
    });
  };

  this.createReader = function(doc, state) {
    var that = this;

    // Create new reader controller instance
    this.reader = new ReaderController(doc, state);

    this.reader.on('state-changed', function() {
      that.updatePath(that.reader.state);
    });

    this.modifyState({
      context: 'reader'
    });
  };

  this.openReader = function(context, node, resource, fullscreen) {
    var that = this;

    // The article view state
    var state = {
      context: context || "toc",
      node: node,
      resource: resource,
      fullscreen: !!fullscreen
    };

    this.trigger("loading:started", "Loading document ...");

    $.get(this.config.document_url)
    .done(function(data) {
      var doc, err;

      // Determine type of resource
      var xml = $.isXMLDoc(data);

      // Process XML file
      if(xml) {
        var importer = new Converter.Importer();
        doc = importer.import(data);
        // Process JSON file
      } else {
        if(typeof data == 'string') data = $.parseJSON(data);
        doc = Article.fromSnapshot(data);
      }
      that.createReader(doc, state);
    })
    .fail(function(err) {
      console.error(err);
    });
  };

  // Provides an array of (context, controller) tuples that describe the
  // current state of responsibilities
  // --------
  //

  this.getActiveControllers = function() {
    var result = [["lens", this]];
    result.push(["reader", this.reader]);
    return result;
  };
};


// Exports
// --------

LensController.Prototype.prototype = Controller.prototype;
LensController.prototype = new LensController.Prototype();
_.extend(LensController.prototype, util.Events);

module.exports = LensController;
