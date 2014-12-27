@Tryphon = {}

class @Tryphon
  @log: (message) ->
    console.log message

  @duration_as_text: (duration) ->
    switch
      when duration < 60
        "#{duration.toFixed(0)}"
      when duration < 3600
        "#{duration // 60}:#{(duration %% 60).toFixed(0)}"
      else
        "#{duration // 3600}:#{(duration %% 3600 // 60).toFixed(0)}:#{(duration %% 60).toFixed(0)}"

class @Tryphon.Player
  constructor: (@view) ->
    Tryphon.log "Create Player for #{@view}"

    @init_view()
    @load_attributes()
    @prepare_view()

  @load: () ->
    new Tryphon.Player.Loader().load()

  @load_all: () ->
    players = $.map $("a.tryphon-player"), (link, index) ->
      player = switch
        when Tryphon.Player.AudioBank.support_url(link.href)
          new Tryphon.Player.AudioBank(link)
        when Tryphon.Player.Stream.support_url(link.href)
          new Tryphon.Player.Stream(link)

    soundManager.setup {
      url: 'http://player.tryphon.eu/swf',
      debugMode: true,
      useHTML5Audio: true,
      onready: () ->
        $.each players, (index, player) ->
          player.register()
    }

  view_root: () =>
    @_parent ||= $(@view).parent().parent()

  prepare_view: () =>
    $(@view).click () =>
      if @playing()
        Tryphon.log "Pause"
        @pause()
      else
        Tryphon.log "Play"
        @play()
      false

  sound: () =>
    soundManager.getSoundById @sound_name()

  play: () ->
    unless @paused()
      soundManager.stopAll()
      @sound().play {
        whileplaying: @whileplaying,
        onpause: () => @statusChanged("paused"),
        onresume: () => @statusChanged("playing"),
        onstop: () => @statusChanged("stopped"),
        onfinish: () => @statusChanged("stopped"),
        onplay: () => @statusChanged("playing")
      }
    else
      @sound().resume()

  whileplaying: () =>

  statusChanged: (status) =>
    if status == "playing"
      $(@view).removeClass("play").addClass("pause")
    else
      $(@view).removeClass("pause").addClass("play")

  playing: () ->
    @sound().playState == 1 and not @paused()

  paused: () ->
    @sound().paused

  pause: () ->
    @sound().pause()

class @Tryphon.Player.AudioBank extends Tryphon.Player
  @support_url : (url) ->
    /audiobank.tryphon.(eu|dev)/.test(url)

  init_view: () ->
    @cast = new Tryphon.AudioBankCast(@view.href)

    $(@view).removeClass("tryphon-player")
    $(@view).wrap("<div class='tryphon-player audiobank'><div class='content'></div></div>")
    $(@view).after("<span class='duration'></span>")
    $(@view).after("<span class='bar'><span class='progress'></span></span>")

  load_attributes: () ->
    @cast.load_attributes (attributes) =>
      @set_attributes(attributes)

  set_attributes: (attributes) =>
    $(@view).html "<span class='author'>#{attributes.author}</span><span class='title'>#{attributes.title}</span>"
    @set_duration(attributes.duration)
    $.each attributes.tags, (index, tag) =>
      @view_root().addClass("audiobank-#{tag}")

  view_duration: () =>
    @_view_duration ||= @view_root().find(".duration")

  set_duration: (duration) =>
    @view_duration().text(Tryphon.duration_as_text(duration))

  set_progress: (position) =>
    position_in_per = position / @cast.duration
    @progress().css("width", "#{(position_in_per * 100).toFixed(0)}%")

    @set_duration(@cast.duration - position)

  progress: () =>
    @_progress ||= @view_root().find(".progress")

  default_format: () ->
    if soundManager.canPlayMIME("audio/ogg")
      "ogg"
    else
      "mp3"

  sound_name: () =>
    @cast.name

  register: () =>
    soundManager.createSound id: @sound_name(), url: @cast.audiobank_url(@default_format())

  whileplaying: () =>
    @set_progress @sound().position / 1000.0

class Tryphon.AudioBankCast
  constructor: (@url) ->
    @name = @url.replace(/.*\/casts\/(.+)$/g, "$1")

  audiobank_url: (format, options = {}) ->
    # query = ""
    # for key, value of options
    #   if query.length > 0
    #     query += "&"
    #   query += "#{key}=#{value}"

    # if query.length > 0
    #   query = "?#{query}"

    "#{@url}.#{format}"

  load_attributes: (callback) =>
    request = new XMLHttpRequest()

    request.open "GET", @audiobank_url("json"), true
    request.responseType = "json"
    request.setRequestHeader 'Content-type', 'application/json'
    request.onload = () =>
      attributes = request.response
      @duration = attributes.duration
      Tryphon.log "Retrieved attributes from #{@audiobank_url('json')}"
      callback(attributes) if callback

    Tryphon.log "Load attributes from #{@audiobank_url('json')}"
    request.send null

class @Tryphon.Player.Stream extends Tryphon.Player
  @support_url : (url) ->
    /stream.tryphon.(eu|dev)/.test(url)

  init_view: () ->
    @stream = new Tryphon.Stream(@view.href)

    $(@view).removeClass("tryphon-player")
    $(@view).wrap("<div class='tryphon-player stream'><div class='content'></div></div>")

  load_attributes: () ->

  default_format: () ->
    "mp3"

  sound_name: () =>
    @stream.name

  register: () =>
    soundManager.createSound id: @sound_name(), url: @stream.stream_url(@default_format())

class Tryphon.Stream
  constructor: (@url) ->
    @name = @url.replace(/.*stream.tryphon.eu\/(.+)$/g, "$1")

  stream_url: (format, options = {}) ->
    # query = ""
    # for key, value of options
    #   if query.length > 0
    #     query += "&"
    #   query += "#{key}=#{value}"

    # if query.length > 0
    #   query = "?#{query}"

    "#{@url}.#{format}"

  load_attributes: (callback) =>
    request = new XMLHttpRequest()

    request.open "GET", @stream_url("json"), true
    request.responseType = "json"
    request.setRequestHeader 'Content-type', 'application/json'
    request.onload = () =>
      attributes = request.response
      @duration = attributes.duration
      Tryphon.log "Retrieved attributes from #{@stream_url('json')}"
      callback(attributes) if callback

    Tryphon.log "Load attributes from #{@stream_url('json')}"
    request.send null

class Tryphon.Player.Loader
  constructor: (@domain) ->
    @domain ||= "http://player.tryphon.dev/v2"

  load: () ->
    unless jQuery?
      @load_jquery @load_with_jquery
    else
      @load_with_jquery()

  load_with_jquery: () =>
    Tryphon.log "jQuery #{jQuery.fn.jquery} is present"

    @load_css()
    Tryphon.Player.load_all()

  load_css: () ->
    $('head').append("<link rel='stylesheet' type='text/css' href='#{@resource_url('player.css')}'/>")

  resource_url: (path) ->
    "#{@domain}/#{path}"

  load_jquery: (success) ->
    unless jQuery?
      Tryphon.log "Init jQuery"

      script = document.createElement "script"
      script.src = @resource_url("jquery.js")

      head = document.getElementsByTagName("head")[0]
      done = false;

      script.onload = script.onreadystatechange = () ->
        if (!done && (!@readyState || @readyState == 'loaded' || @readyState == 'complete'))
          done = true;
          success();

          script.onload = script.onreadystatechange = null
          head.removeChild(script)

      head.appendChild(script)
