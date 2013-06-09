Function.prototype.bind = function(scope) {
  var _function = this;
  
  return function() {
    return _function.apply(scope, arguments);
  };
};

Array.prototype.contains = function(obj) {
    var i = this.length;
    while (i--) {
        if (this[i] === obj) {
            return true;
        }
    }
    return false;
}

function TryphonPlayer() {
    
    this.domain = function() {
        return "http://player.tryphon.eu";
    };

    this.init = function() {
        console.log("init");

        soundManager.url = this.domain() + "/swf/";
        soundManager.debugMode = false;

        this.initThreeSixtyPlayer();

        window.onload = function() {
            this.loadCSS();
            this.rewritePlayerClasses();
        }.bind(this);
    };

    this.initThreeSixtyPlayer = function() {
        threeSixtyPlayer.config.scaleFont = (navigator.userAgent.match(/msie/i)?false:true);
        threeSixtyPlayer.config.showHMSTime = false;

        // enable some spectrum stuffs

        threeSixtyPlayer.config.useWaveformData = true;
        threeSixtyPlayer.config.useEQData = true;
        threeSixtyPlayer.config.usePeakData = true;

        threeSixtyPlayer.config.loadRingColor = threeSixtyPlayer.config.playRingColor = threeSixtyPlayer.config.backgroundRingColor;

        // enable this in SM2 as well, as needed

        if (threeSixtyPlayer.config.useWaveformData) {
            soundManager.flash9Options.useWaveformData = true;
        }
        if (threeSixtyPlayer.config.useEQData) {
            soundManager.flash9Options.useEQData = true;
        }
        if (threeSixtyPlayer.config.usePeakData) {
            soundManager.flash9Options.usePeakData = true;
        }

        if (threeSixtyPlayer.config.useWaveformData || threeSixtyPlayer.flash9Options.useEQData || threeSixtyPlayer.flash9Options.usePeakData) {
            // even if HTML5 supports MP3, prefer flash so the visualization features can be used.
            soundManager.preferFlash = true;
        }

        if (window.location.href.match(/html5/i)) {
            // for testing IE 9, etc.
            soundManager.useHTML5Audio = true;
        }
    };

    this.loadCSS = function() {
        console.log("load CSS");

        var cssLink = document.createElement("link");
        cssLink.rel="stylesheet";
        cssLink.type="text/css";
        cssLink.href= this.domain() + "/player.css";

        document.getElementsByTagName("body")[0].appendChild(cssLink);
    };

    this.rewritePlayerClasses = function() {
        var players = document.getElementsByClassName("player");

        for (var i=0; i < players.length; i++) {
            var player = players[i];
            var classes = player.className.split(" ");

            classes.push("ui360");
            
            if (classes.contains("large")) {
                classes.push("ui360-vis");   
            }

            player.className = classes.join(" ");
		    };  
    };

};

new TryphonPlayer().init();



