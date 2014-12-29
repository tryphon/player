(function() {
  var __modulo = function(a, b) { return (+a % (b = +b) + b) % b; },
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.Tryphon = {};

  this.Tryphon = (function() {
    function Tryphon() {}

    Tryphon.log = function(message) {
      return console.log(message);
    };

    Tryphon.duration_as_text = function(duration) {
      switch (false) {
        case !(duration < 60):
          return "" + (duration.toFixed(0));
        case !(duration < 3600):
          return "" + (Math.floor(duration / 60)) + ":" + ((__modulo(duration, 60)).toFixed(0));
        default:
          return "" + (Math.floor(duration / 3600)) + ":" + ((Math.floor(__modulo(duration, 3600) / 60)).toFixed(0)) + ":" + ((__modulo(duration, 60)).toFixed(0));
      }
    };

    return Tryphon;

  })();

  this.Tryphon.Player = (function() {
    function Player(view) {
      this.view = view;
      this.init_view_peak_bar = __bind(this.init_view_peak_bar, this);
      this.view_peak_right = __bind(this.view_peak_right, this);
      this.view_peak_left = __bind(this.view_peak_left, this);
      this.set_peak_data = __bind(this.set_peak_data, this);
      this.whileplaying = __bind(this.whileplaying, this);
      this.statusChanged = __bind(this.statusChanged, this);
      this.sound = __bind(this.sound, this);
      this.prepare_view = __bind(this.prepare_view, this);
      this.view_root = __bind(this.view_root, this);
      Tryphon.log("Create Player for " + this.view);
      this.init_view();
      this.load_attributes();
      this.prepare_view();
    }

    Player.load = function() {
      return new Tryphon.Player.Loader().load();
    };

    Player.load_all = function() {
      var players;
      players = $.map($("a.tryphon-player"), function(link, index) {
        var player;
        return player = (function() {
          switch (false) {
            case !Tryphon.Player.AudioBank.support_url(link.href):
              return new Tryphon.Player.AudioBank(link);
            case !Tryphon.Player.Stream.support_url(link.href):
              return new Tryphon.Player.Stream(link);
          }
        })();
      });
      soundManager.setup({
        url: 'http://player.tryphon.dev/swf',
        debugMode: true,
        preferFlash: true,
        useHTML5Audio: true,
        flashVersion: 9,
        onready: function() {
          return $.each(players, function(index, player) {
            return player.register();
          });
        }
      });
      return soundManager.flash9Options = {
        usePeakData: true
      };
    };

    Player.prototype.view_root = function() {
      return this._parent || (this._parent = $(this.view).parent().parent());
    };

    Player.prototype.prepare_view = function() {
      return $(this.view).click((function(_this) {
        return function() {
          if (_this.playing()) {
            Tryphon.log("Unplay");
            _this.unplay();
          } else {
            Tryphon.log("Play");
            _this.play();
          }
          return false;
        };
      })(this));
    };

    Player.prototype.sound = function() {
      return soundManager.getSoundById(this.sound_name());
    };

    Player.prototype.play = function() {
      if (!this.paused()) {
        soundManager.stopAll();
        return this.sound().play({
          whileplaying: this.whileplaying,
          onpause: (function(_this) {
            return function() {
              return _this.statusChanged("paused");
            };
          })(this),
          onresume: (function(_this) {
            return function() {
              return _this.statusChanged("playing");
            };
          })(this),
          onstop: (function(_this) {
            return function() {
              return _this.statusChanged("stopped");
            };
          })(this),
          onfinish: (function(_this) {
            return function() {
              return _this.statusChanged("stopped");
            };
          })(this),
          onplay: (function(_this) {
            return function() {
              return _this.statusChanged("playing");
            };
          })(this)
        });
      } else {
        return this.sound().resume();
      }
    };

    Player.prototype.statusChanged = function(status) {
      if (status === "playing") {
        return $(this.view).removeClass("play").addClass(this.unplay_mode());
      } else {
        this.set_peak_data({
          left: 0,
          right: 0
        });
        return $(this.view).removeClass(this.unplay_mode()).addClass("play");
      }
    };

    Player.prototype.playing = function() {
      return this.sound().playState === 1 && !this.paused();
    };

    Player.prototype.paused = function() {
      return this.sound().paused;
    };

    Player.prototype.pause = function() {
      return this.sound().pause();
    };

    Player.prototype.stop = function() {
      return this.sound().stop();
    };

    Player.prototype.unplay = function() {
      switch (this.unplay_mode()) {
        case "stop":
          return this.stop();
        case "pause":
          return this.pause();
      }
    };

    Player.prototype.whileplaying = function() {
      var peak_data;
      peak_data = this.sound().peakData;
      if (!(peak_data && peak_data.left > 0 && peak_data.right > 0)) {
        peak_data = this.random_peek_data();
      }
      return this.set_peak_data(peak_data);
    };

    Player.prototype.random_peek_data = function() {
      var base_wave, left_right_delta, random, small_wave, time;
      time = new Date() / 1000;
      base_wave = (Math.sin(Math.PI * 2 * time * 250) + 1) / 5;
      small_wave = Math.sin(Math.PI * 2 * time * (400 + Math.random() * 100)) / 6;
      random = base_wave + small_wave;
      left_right_delta = (Math.random() - 0.5) / 5;
      return {
        left: Math.max(0, Math.min(1, random)),
        right: Math.max(0, Math.min(1, random + left_right_delta))
      };
    };

    Player.prototype.set_peak_data = function(peakData) {
      this.view_peak_left().css("width", "" + ((peakData.left * 100).toFixed(0)) + "%");
      return this.view_peak_right().css("width", "" + ((peakData.right * 100).toFixed(0)) + "%");
    };

    Player.prototype.view_peak_left = function() {
      return this._view_peak_left || (this._view_peak_left = this.view_root().find(".peak.left .level"));
    };

    Player.prototype.view_peak_right = function() {
      return this._view_peak_right || (this._view_peak_right = this.view_root().find(".peak.right .level"));
    };

    Player.prototype.init_view_peak_bar = function() {
      return $(this.view).after("<span class='peak left'><span class='level'></span></span><span class='peak right'><span class='level'></span></span>");
    };

    return Player;

  })();

  this.Tryphon.Player.AudioBank = (function(_super) {
    __extends(AudioBank, _super);

    function AudioBank() {
      this.whileplaying = __bind(this.whileplaying, this);
      this.register = __bind(this.register, this);
      this.sound_name = __bind(this.sound_name, this);
      this.progress = __bind(this.progress, this);
      this.set_progress = __bind(this.set_progress, this);
      this.set_duration = __bind(this.set_duration, this);
      this.view_duration = __bind(this.view_duration, this);
      this.set_attributes = __bind(this.set_attributes, this);
      return AudioBank.__super__.constructor.apply(this, arguments);
    }

    AudioBank.support_url = function(url) {
      return /audiobank.tryphon.(eu|dev)/.test(url);
    };

    AudioBank.prototype.init_view = function() {
      this.cast = new Tryphon.AudioBankCast(this.view.href);
      $(this.view).removeClass("tryphon-player");
      $(this.view).wrap("<div class='tryphon-player audiobank'><div class='content'></div></div>");
      $(this.view).after("<span class='bar'><span class='progress'></span></span>");
      this.init_view_peak_bar();
      return $(this.view).after("<span class='duration'></span>");
    };

    AudioBank.prototype.load_attributes = function() {
      return this.cast.load_attributes((function(_this) {
        return function(attributes) {
          return _this.set_attributes(attributes);
        };
      })(this));
    };

    AudioBank.prototype.set_attributes = function(attributes) {
      $(this.view).html("<span class='author'>" + attributes.author + "</span><span class='title'>" + attributes.title + "</span>");
      this.set_duration(attributes.duration);
      return $.each(attributes.tags, (function(_this) {
        return function(index, tag) {
          return _this.view_root().addClass("audiobank-" + tag);
        };
      })(this));
    };

    AudioBank.prototype.view_duration = function() {
      return this._view_duration || (this._view_duration = this.view_root().find(".duration"));
    };

    AudioBank.prototype.set_duration = function(duration) {
      return this.view_duration().text(Tryphon.duration_as_text(duration));
    };

    AudioBank.prototype.set_progress = function(position) {
      var position_in_per;
      position_in_per = position / this.cast.duration;
      this.progress().css("width", "" + ((position_in_per * 100).toFixed(0)) + "%");
      return this.set_duration(this.cast.duration - position);
    };

    AudioBank.prototype.progress = function() {
      return this._progress || (this._progress = this.view_root().find(".progress"));
    };

    AudioBank.prototype.default_format = function() {
      if (soundManager.canPlayMIME("audio/ogg")) {
        return "ogg";
      } else {
        return "mp3";
      }
    };

    AudioBank.prototype.sound_name = function() {
      return this.cast.name;
    };

    AudioBank.prototype.register = function() {
      return soundManager.createSound({
        id: this.sound_name(),
        url: this.cast.audiobank_url(this.default_format())
      });
    };

    AudioBank.prototype.whileplaying = function() {
      AudioBank.__super__.whileplaying.call(this);
      return this.set_progress(this.sound().position / 1000.0);
    };

    AudioBank.prototype.unplay_mode = function() {
      return "pause";
    };

    return AudioBank;

  })(Tryphon.Player);

  Tryphon.AudioBankCast = (function() {
    function AudioBankCast(url) {
      this.url = url;
      this.load_attributes = __bind(this.load_attributes, this);
      this.name = this.url.replace(/.*\/casts\/(.+)$/g, "$1");
    }

    AudioBankCast.prototype.audiobank_url = function(format, options) {
      if (options == null) {
        options = {};
      }
      return "" + this.url + "." + format;
    };

    AudioBankCast.prototype.load_attributes = function(callback) {
      var request;
      request = new XMLHttpRequest();
      request.open("GET", this.audiobank_url("json"), true);
      request.responseType = "json";
      request.setRequestHeader('Content-type', 'application/json');
      request.onload = (function(_this) {
        return function() {
          var attributes;
          attributes = request.response;
          _this.duration = attributes.duration;
          Tryphon.log("Retrieved attributes from " + (_this.audiobank_url('json')));
          if (callback) {
            return callback(attributes);
          }
        };
      })(this);
      Tryphon.log("Load attributes from " + (this.audiobank_url('json')));
      return request.send(null);
    };

    return AudioBankCast;

  })();

  this.Tryphon.Player.Stream = (function(_super) {
    __extends(Stream, _super);

    function Stream() {
      this.register = __bind(this.register, this);
      this.sound_name = __bind(this.sound_name, this);
      return Stream.__super__.constructor.apply(this, arguments);
    }

    Stream.support_url = function(url) {
      return /stream.tryphon.(eu|dev)/.test(url);
    };

    Stream.prototype.init_view = function() {
      this.stream = new Tryphon.Stream(this.view.href);
      $(this.view).removeClass("tryphon-player");
      $(this.view).wrap("<div class='tryphon-player stream'><div class='content'></div></div>");
      return this.init_view_peak_bar();
    };

    Stream.prototype.load_attributes = function() {};

    Stream.prototype.default_format = function() {
      return "mp3";
    };

    Stream.prototype.sound_name = function() {
      return this.stream.name;
    };

    Stream.prototype.register = function() {
      return soundManager.createSound({
        id: this.sound_name(),
        url: this.stream.stream_url(this.default_format())
      });
    };

    Stream.prototype.unplay_mode = function() {
      return "stop";
    };

    Stream.prototype.unplay = function() {
      Stream.__super__.unplay.call(this);
      Tryphon.log("unload");
      return this.sound().unload();
    };

    return Stream;

  })(Tryphon.Player);

  Tryphon.Stream = (function() {
    function Stream(url) {
      this.url = url;
      this.load_attributes = __bind(this.load_attributes, this);
      this.name = this.url.replace(/.*stream.tryphon.eu\/(.+)$/g, "$1");
    }

    Stream.prototype.stream_url = function(format, options) {
      if (options == null) {
        options = {};
      }
      return "" + this.url + "." + format;
    };

    Stream.prototype.load_attributes = function(callback) {
      var request;
      request = new XMLHttpRequest();
      request.open("GET", this.stream_url("json"), true);
      request.responseType = "json";
      request.setRequestHeader('Content-type', 'application/json');
      request.onload = (function(_this) {
        return function() {
          var attributes;
          attributes = request.response;
          _this.duration = attributes.duration;
          Tryphon.log("Retrieved attributes from " + (_this.stream_url('json')));
          if (callback) {
            return callback(attributes);
          }
        };
      })(this);
      Tryphon.log("Load attributes from " + (this.stream_url('json')));
      return request.send(null);
    };

    return Stream;

  })();

  Tryphon.Player.Loader = (function() {
    function Loader(domain) {
      this.domain = domain;
      this.load_with_jquery = __bind(this.load_with_jquery, this);
      this.domain || (this.domain = "http://player.tryphon.dev/v2");
    }

    Loader.prototype.load = function() {
      if (typeof jQuery === "undefined" || jQuery === null) {
        return this.load_jquery(this.load_with_jquery);
      } else {
        return this.load_with_jquery();
      }
    };

    Loader.prototype.load_with_jquery = function() {
      Tryphon.log("jQuery " + jQuery.fn.jquery + " is present");
      this.load_css();
      return Tryphon.Player.load_all();
    };

    Loader.prototype.load_css = function() {
      return $('head').append("<link rel='stylesheet' type='text/css' href='" + (this.resource_url('player.css')) + "'/>");
    };

    Loader.prototype.resource_url = function(path) {
      return "" + this.domain + "/" + path;
    };

    Loader.prototype.load_jquery = function(success) {
      var done, head, script;
      if (typeof jQuery === "undefined" || jQuery === null) {
        Tryphon.log("Init jQuery");
        script = document.createElement("script");
        script.src = this.resource_url("jquery.js");
        head = document.getElementsByTagName("head")[0];
        done = false;
        script.onload = script.onreadystatechange = function() {
          if (!done && (!this.readyState || this.readyState === 'loaded' || this.readyState === 'complete')) {
            done = true;
            success();
            script.onload = script.onreadystatechange = null;
            return head.removeChild(script);
          }
        };
        return head.appendChild(script);
      }
    };

    return Loader;

  })();

}).call(this);