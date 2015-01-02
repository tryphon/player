(function() {
  var __modulo = function(a, b) { return (+a % (b = +b) + b) % b; },
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.Tryphon = {};

  this.Tryphon = (function() {
    function Tryphon() {}

    Tryphon.log = function(message) {
      if ((window.console != null) && (console.log != null)) {
        return console.log(message);
      }
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

    Tryphon.dev = function() {
      return /tryphon.dev/.test(location.href);
    };

    Tryphon.parse_query = function(url) {
      var params, part, part_sides, parts, query, _i, _len;
      query = url.replace(/.*\?(.*)$/g, "$1");
      parts = query.split("&");
      params = {};
      for (_i = 0, _len = parts.length; _i < _len; _i++) {
        part = parts[_i];
        part_sides = part.split('=');
        params[part_sides[0]] = part_sides[1];
      }
      return params;
    };

    return Tryphon;

  })();

  this.Tryphon.Player = (function() {
    Player.setup = function(options) {
      return this.url_rewriter = options.url_rewriter, options;
    };

    Player.url_rewriter = function(url) {
      return url;
    };

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
      this.view_initialized = __bind(this.view_initialized, this);
      this.view_root = __bind(this.view_root, this);
      this.token = __bind(this.token, this);
      this.query_params = __bind(this.query_params, this);
      Tryphon.log("Create Player for " + this.view);
      this.init();
      if (!this.view_initialized()) {
        this.init_view();
      } else {
        Tryphon.log("View already initialized");
      }
      this.load_attributes();
      this.prepare_view();
    }

    Player.load = function() {
      return new Tryphon.Player.Loader().load();
    };

    Player.domain = function() {
      if (Tryphon.dev()) {
        return "player.tryphon.dev";
      } else {
        return "player.tryphon.eu";
      }
    };

    Player.load_all = function() {
      var players;
      players = $.map($(".tryphon-player"), function(element, index) {
        var link, player;
        element = $(element);
        link = element.prop("tagName") === "A" ? element : element.find("a");
        Tryphon.log("Found player for " + (link.attr('href')));
        return player = (function() {
          switch (false) {
            case !Tryphon.Player.AudioBank.support_url(link.attr('href')):
              return new Tryphon.Player.AudioBank(link);
            case !Tryphon.Player.Stream.support_url(link.attr('href')):
              return new Tryphon.Player.Stream(link);
          }
        })();
      });
      soundManager.setup({
        url: "http://" + (this.domain()) + "/swf",
        debugMode: true,
        preferFlash: true,
        useHTML5Audio: true,
        html5PollingInterval: 100,
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

    Player.prototype.create_sound = function(url) {
      url = this.rewrite_url(url);
      Tryphon.log("Create Sound " + (this.sound_name()) + " for " + url);
      return soundManager.createSound({
        id: this.sound_name(),
        url: url
      });
    };

    Player.prototype.rewrite_url = function(url) {
      if (this.token() != null) {
        url = "" + url + "?token=" + (this.token());
      }
      if (Tryphon.Player.url_rewriter != null) {
        return Tryphon.Player.url_rewriter(url);
      } else {
        return url;
      }
    };

    Player.prototype.query_params = function() {
      return this._query_params || (this._query_params = Tryphon.parse_query(this.view.attr('href')));
    };

    Player.prototype.token = function() {
      return this.query_params["token"];
    };

    Player.prototype.view_root = function() {
      return this._parent || (this._parent = this.view.parent().parent());
    };

    Player.prototype.view_initialized = function() {
      return $(this.view).closest("div.tryphon-player").length > 0;
    };

    Player.prototype.prepare_view = function() {
      $(this.view).click((function(_this) {
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
      return this.view_root().find(".popup").click((function(_this) {
        return function() {
          return _this.popup();
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

    Player.prototype.popup = function() {
      var url;
      url = this.rewrite_url(this.url());
      return window.open(url, "Tryphon Player", "width=" + (this.view_root().width()) + ",height=" + (this.view_root().height()) + ",scrollbars=no,titlebar=no,status=no,location=no,menubar=no");
    };

    return Player;

  })();

  this.Tryphon.Player.AudioBank = (function(_super) {
    __extends(AudioBank, _super);

    function AudioBank() {
      this.url = __bind(this.url, this);
      this.whileplaying = __bind(this.whileplaying, this);
      this.register = __bind(this.register, this);
      this.sound_name = __bind(this.sound_name, this);
      this.view_bar = __bind(this.view_bar, this);
      this.progress = __bind(this.progress, this);
      this.prepare_view = __bind(this.prepare_view, this);
      this.set_progress = __bind(this.set_progress, this);
      this.set_duration = __bind(this.set_duration, this);
      this.view_duration = __bind(this.view_duration, this);
      this.set_attributes = __bind(this.set_attributes, this);
      return AudioBank.__super__.constructor.apply(this, arguments);
    }

    AudioBank.support_url = function(url) {
      return /audiobank.tryphon.(eu|dev)/.test(url);
    };

    AudioBank.prototype.init = function() {
      return this.cast = new Tryphon.AudioBankCast(this.view.attr('href'));
    };

    AudioBank.prototype.init_view = function() {
      $(this.view).wrap("<div class='audiobank " + ($(this.view).attr('class')) + "'><div class='content'></div></div>");
      $(this.view).attr("class", "");
      $(this.view).after("<span class='bar'><span class='progress'></span></span>");
      this.init_view_peak_bar();
      $(this.view).after("<span class='duration'></span>");
      return $(this.view).after("<span class='popup'></span>");
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

    AudioBank.prototype.prepare_view = function() {
      AudioBank.__super__.prepare_view.apply(this, arguments);
      return this.view_bar().click((function(_this) {
        return function(event) {
          var new_position, position_ratio, relative_position;
          if (_this.sound().readyState !== 0) {
            relative_position = event.pageX - _this.view_bar().offset().left;
            position_ratio = relative_position / _this.view_bar().width();
            new_position = position_ratio * _this.cast.duration * 1000;
            return _this.sound().setPosition(new_position);
          }
        };
      })(this));
    };

    AudioBank.prototype.progress = function() {
      return this._progress || (this._progress = this.view_root().find(".progress"));
    };

    AudioBank.prototype.view_bar = function() {
      return this._bar || (this._bar = this.view_root().find(".bar"));
    };

    AudioBank.prototype.default_format = function() {
      if (soundManager.canPlayMIME("audio/ogg")) {
        return "ogg";
      } else {
        return "mp3";
      }
    };

    AudioBank.prototype.sound_name = function() {
      return "audiobank/" + this.cast.name;
    };

    AudioBank.prototype.register = function() {
      return this.create_sound(this.cast.audiobank_url(this.default_format()));
    };

    AudioBank.prototype.whileplaying = function() {
      AudioBank.__super__.whileplaying.call(this);
      return this.set_progress(this.sound().position / 1000.0);
    };

    AudioBank.prototype.unplay_mode = function() {
      return "pause";
    };

    AudioBank.prototype.url = function() {
      return this.cast.audiobank_url();
    };

    return AudioBank;

  })(Tryphon.Player);

  Tryphon.AudioBankCast = (function() {
    function AudioBankCast(url) {
      this.url = url;
      this.load_attributes = __bind(this.load_attributes, this);
      this.name = this.url.replace(/.*\/casts\/([^\.\?]+).*$/g, "$1");
      this.base_url = this.url.replace(/^(.*audiobank.tryphon.(dev|eu))\/.*/g, "$1");
    }

    AudioBankCast.prototype.audiobank_url = function(format, options) {
      var extension;
      if (options == null) {
        options = {};
      }
      extension = format != null ? "." + format : "";
      return "" + this.base_url + "/casts/" + this.name + extension;
    };

    AudioBankCast.prototype.load_attributes = function(callback) {
      Tryphon.log("Load attributes from " + (this.audiobank_url('json')));
      return $.get(this.audiobank_url("json"), (function(_this) {
        return function(attributes) {
          _this.duration = attributes.duration;
          Tryphon.log("Retrieved attributes from " + (_this.audiobank_url('json')));
          if (callback) {
            return callback(attributes);
          }
        };
      })(this));
    };

    return AudioBankCast;

  })();

  this.Tryphon.Player.Stream = (function(_super) {
    __extends(Stream, _super);

    function Stream() {
      this.url = __bind(this.url, this);
      this.register = __bind(this.register, this);
      this.sound_name = __bind(this.sound_name, this);
      this.prefered_moint_point = __bind(this.prefered_moint_point, this);
      this.default_mount_point = __bind(this.default_mount_point, this);
      this.supported_mount_points = __bind(this.supported_mount_points, this);
      this.set_attributes = __bind(this.set_attributes, this);
      return Stream.__super__.constructor.apply(this, arguments);
    }

    Stream.support_url = function(url) {
      return /stream.tryphon.(eu|dev)/.test(url);
    };

    Stream.prototype.init = function() {
      return this.stream = new Tryphon.Stream(this.view.attr('href'));
    };

    Stream.prototype.init_view = function() {
      $(this.view).wrap("<div class='stream " + ($(this.view).attr('class')) + "'><div class='content'></div></div>");
      $(this.view).attr("class", "");
      this.init_view_peak_bar();
      return $(this.view).after("<span class='popup'></span>");
    };

    Stream.prototype.load_attributes = function() {
      return this.stream.load_attributes((function(_this) {
        return function(attributes) {
          _this.set_attributes(attributes);
          return _this.register();
        };
      })(this));
    };

    Stream.prototype.set_attributes = function(attributes) {
      return $(this.view).html("<span class='author'>" + attributes.name + "</span>");
    };

    Stream.prototype.supported_mount_points = function() {
      var mount_point;
      return this._supported_mount_points || (this._supported_mount_points = (function() {
        var _i, _len, _ref, _results;
        _ref = this.stream.mount_points;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          mount_point = _ref[_i];
          if (soundManager.canPlayMIME(mount_point.content_type)) {
            _results.push(mount_point);
          }
        }
        return _results;
      }).call(this));
    };

    Stream.prototype.default_mount_point = function() {
      return this._default_mount_point || (this._default_mount_point = this.prefered_moint_point());
    };

    Stream.prototype.prefered_moint_point = function() {
      var mount_point, _i, _len, _ref;
      _ref = this.supported_mount_points();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        mount_point = _ref[_i];
        if (/^audio\/ogg/.test(mount_point.content_type)) {
          Tryphon.log("Prefer Ogg/Vorbis stream");
          return mount_point;
        }
      }
      return this.supported_mount_points()[0];
    };

    Stream.prototype.sound_name = function() {
      return "stream/" + this.stream.name;
    };

    Stream.prototype.register = function() {
      if (this.stream.ok() && soundManager.ok() && (this.registered == null)) {
        this.registered = true;
        return this.create_sound(this.stream.mount_point_url(this.default_mount_point().path));
      }
    };

    Stream.prototype.unplay_mode = function() {
      return "stop";
    };

    Stream.prototype.unplay = function() {
      Stream.__super__.unplay.call(this);
      Tryphon.log("unload");
      return this.sound().unload();
    };

    Stream.prototype.url = function() {
      return this.stream.stream_url();
    };

    return Stream;

  })(Tryphon.Player);

  Tryphon.Stream = (function() {
    function Stream(url) {
      this.url = url;
      this.load_attributes = __bind(this.load_attributes, this);
      this.name = this.url.replace(/.*stream.tryphon.(eu|dev)\/([^\.\?]+).*/g, "$2");
      Tryphon.log("Stream " + this.name);
      this.base_url = this.url.replace(/^(.*stream.tryphon.(dev|eu))\/.*/g, "$1");
    }

    Stream.prototype.stream_url = function(format, options) {
      var extension;
      if (options == null) {
        options = {};
      }
      extension = format != null ? "." + format : "";
      return "" + this.base_url + "/" + this.name + extension;
    };

    Stream.prototype.mount_point_url = function(path) {
      return "" + this.base_url + "/" + path;
    };

    Stream.prototype.load_attributes = function(callback) {
      Tryphon.log("Load attributes from " + (this.stream_url('json')));
      return $.get(this.stream_url('json'), (function(_this) {
        return function(attributes) {
          _this.mount_points = attributes.mount_points;
          Tryphon.log("Retrieved attributes from " + (_this.stream_url('json')));
          if (callback) {
            return callback(attributes);
          }
        };
      })(this));
    };

    Stream.prototype.ok = function() {
      return this.mount_points != null;
    };

    return Stream;

  })();

  Tryphon.Player.Loader = (function() {
    function Loader(domain) {
      this.domain = domain;
      this.load_with_jquery = __bind(this.load_with_jquery, this);
      this.domain || (this.domain = "http://" + (Tryphon.Player.domain()) + "/v2");
    }

    Loader.prototype.load = function() {
      Tryphon.log("Load from " + this.domain);
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
      return $('head').prepend("<link rel='stylesheet' type='text/css' href='" + (this.resource_url('player.css')) + "'/>");
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
