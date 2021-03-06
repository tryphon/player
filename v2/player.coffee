@Tryphon = {}

class @Tryphon
  @log: (message) ->
    console.log message if window.console? and console.log?

  @duration_as_text: (duration) ->
    hours   = Math.floor(duration / 3600)
    minutes = Math.floor((duration - (hours * 3600)) / 60)
    seconds = Math.floor(duration - (hours * 3600) - (minutes * 60))

    hours   = "0" + hours if hours < 10
    minutes = "0" + minutes if minutes < 10
    seconds = "0" +seconds if seconds < 10

    text = "#{minutes}:#{seconds}"
    text = "#{hours}:#{text}" unless hours == "00"
    text

  @dev: () ->
    /tryphon.dev/.test(location.href) or @parse_query(location.href)["dev"] == 'true'

  @parse_query: (url) ->
    query = url.replace(/.*\?(.*)$/g, "$1")
    parts = query.split("&")

    params = {}
    for part in parts
      part_sides = part.split('=')
      params[part_sides[0]] = part_sides[1]

    params

class @Tryphon.Player

  @setup: (options) ->
    {@url_rewriter, @ignore_player_css_url, @ignore_base_player_css_url} = options

  @url_rewriter: (url) ->
    url

  constructor: (@view) ->
    Tryphon.log "Create Player for #{@view[0]}"

    @init()
    unless @view_initialized()
      @init_view()
    else
      Tryphon.log "View already initialized"

    @autoplay = @view_root().hasClass("autoplay")

    @load_attributes()
    @prepare_view()

  @load: () ->
    new Tryphon.Player.Loader({"ignore_base_player_css_url": @ignore_base_player_css_url}).load()

  @domain: () ->
    if Tryphon.dev()
      "player.tryphon.dev"
    else
      "player.tryphon.eu"

  @sound_manager_ok: () ->
    @sound_manager_ready

  @load_all: () ->
    @players = $.map $(".tryphon-player"), (element, index) ->
      element = $(element)
      link =
        if element.prop("tagName") == "A"
          element
        else
          element.find("a.tp-main")

      Tryphon.log "Found player for #{link.attr('href')}"

      player = switch
        when Tryphon.Player.AudioBank.support_url(link.attr('href'))
          new Tryphon.Player.AudioBank(link)
        when Tryphon.Player.Stream.support_url(link.attr('href'))
          new Tryphon.Player.Stream(link)

    if document.readyState == "complete"
      @sound_manager_setup()
    else
      document.onreadystatechange = () =>
        @sound_manager_setup() if document.readyState == "complete"

  @sound_manager_setup: () =>
    Tryphon.log "SoundManager setup"
    soundManager.setup {
      url: "http://#{@domain()}/swf",
      debugMode: true,
      # preferFlash: true,
      # debugFlash: true,
      useHTML5Audio: true,
      html5PollingInterval: 100,
      flashVersion: 9,
      onready: () =>
        @sound_manager_ready = true
        $.each @players, (index, player) ->
          player.register()
    }

    soundManager.flash9Options = {
      usePeakData: true
    }

  @include_player_css: (url) ->
    unless @ignore_player_css_url
      if url? and url.length > 0
        unless @_included_player_css?
          @_included_player_css = true
          include_css = () ->
            Tryphon.log "Include custom CSS : #{url}"
            $('head').append("<link rel='stylesheet' type='text/css' href='#{url}'/>")
          setTimeout(include_css, 1)

  class: (klass) ->
    # "peak left" => "tp-peak tp-left"
    klass.replace(/[^ ]+/g, "tp-$&")

  div_tag: (klass, content) ->
    @content_tag "div", klass, content

  span_tag: (klass, content) ->
    @content_tag "span", klass, content

  content_tag: (tag, klass, content) ->
    content = "" unless content?
    "<#{tag} class='#{@class(klass)}'>#{content}</#{tag}>"

  create_sound: (url) ->
    url = @rewrite_url url
    Tryphon.log "Create Sound #{@sound_name()} for #{url}"
    soundManager.createSound id: @sound_name(), url: url
    if @autoplay
      Tryphon.log "Autoplay"
      @play()

  rewrite_url: (url) =>
    # Token can be provided in original link (in iframe/popup)
    if @token()?
      Tryphon.log "Include token from config : #{@token()}"
      url = "#{url}?token=#{@token()}"
    if Tryphon.Player.url_rewriter?
      @invoke_url_rewriter url
    else
      url

  invoke_url_rewriter: (url) =>
    Tryphon.Player.url_rewriter url

  query_params: () =>
    @_query_params ||= Tryphon.parse_query @view.attr('href')

  token: () =>
    @query_params()["token"]

  view_root: () =>
    @_parent ||= @view.parent().parent()

  view_initialized: () =>
    $(@view).closest("div.tryphon-player").length > 0

  prepare_view: () =>
    $(@view).click () =>
      if @playing()
        Tryphon.log "Unplay"
        @unplay()
      else
        Tryphon.log "Play"
        @play()
      false

    @find_view(".popup").click (event) =>
      event.preventDefault()
      @popup()

    @view_links().find("a").mousedown (event) =>
      link = event.target
      link.href = @rewrite_url($(link).data('link'))

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

  statusChanged: (status) =>
    if status == "playing"
      $(@view).removeClass(@class("play")).addClass(@class(@unplay_mode()))
    else
      @set_peak_data {left: 0, right: 0}
      $(@view).removeClass(@class(@unplay_mode())).addClass(@class("play"))

  playing: () ->
    @sound().playState == 1 and not @paused()

  paused: () ->
    @sound().paused

  pause: () ->
    @sound().pause()

  stop: () ->
    @sound().stop()

  unplay: () ->
    switch @unplay_mode()
      when "stop" then @stop()
      when "pause" then @pause()

  whileplaying: () =>
    peak_data = @sound().peakData
    unless peak_data and peak_data.left > 0 and peak_data.right > 0
      peak_data = @random_peek_data()

    @set_peak_data peak_data

  random_peek_data: () ->
    time = new Date() / 1000

    base_wave = (Math.sin(Math.PI*2* time * 250)+1)/5
    small_wave = Math.sin(Math.PI*2* time * (400 + Math.random() * 100)) / 6

    random = base_wave + small_wave

    left_right_delta = (Math.random()-0.5)/5
    {
      left: Math.max(0, Math.min(1, random)),
      right: Math.max(0, Math.min(1, random + left_right_delta))
    }

  set_peak_data: (peakData) =>
    @view_peak_left().css("width", "#{(peakData.left * 100).toFixed(0)}%")
    @view_peak_right().css("width", "#{(peakData.right * 100).toFixed(0)}%")

  find_view: (selector) ->
    @view_root().find(selector.replace(/\./g, "$&tp-"))

  view_peak_left: () =>
    @_view_peak_left ||= @find_view(".peak.left .level")
  view_peak_right: () =>
    @_view_peak_right ||= @find_view(".peak.right .level")

  init_base_view: () =>
    $(@view).after(@span_tag('peak left', @span_tag('level')) + @span_tag('peak right', @span_tag('level')))
    $(@view).after("<a class='#{@class('popup')}' href='#{@url()}' target='_blank'></a>")
    $(@view).after(@span_tag('links'))

  view_links: () =>
    @_view_links ||= @find_view(".links")

  popup: () ->
    url = @rewrite_url(@url())

    if $('.tryphon-player').length > 0
      width = $('.tryphon-player').css("width")
      height = $('.tryphon-player').css("height")
    else
      width = @view_root().width()
      height = @view_root().height()

    Tryphon.log "Popup with width=#{width},height=#{height}"

    window.open(url, "Tryphon Player", "width=#{width},height=#{height},scrollbars=no,titlebar=no,status=no,location=no,menubar=no")

  create_links: () =>
    Tryphon.log "Create Links"
    for link in @links()
      @view_links().append("<a href=\"#{link.url}\" class=\"#{link.class}\" data-link=\"#{link.url}\" target=\"_blank\">#{link.name}</a>")

class @Tryphon.Player.AudioBank extends Tryphon.Player
  @support_url : (url) ->
    /audiobank.tryphon.(eu|dev)/.test(url)

  init: () ->
    @cast = new Tryphon.AudioBankCast(@view.attr('href'))
    @document_id = @view.data("id")

  invoke_url_rewriter: (url) =>
    if @document_id?
      Tryphon.Player.url_rewriter url, id: @document_id
    else
      super url

  init_view: () ->
    $(@view).wrap("<div class='audiobank #{$(@view).attr('class')}'>#{@div_tag('content')}</div>")
    $(@view).attr("class", @class("main"))
    $(@view).after(@span_tag('bar', @span_tag('progress')))
    @init_base_view()
    $(@view).after(@span_tag('duration'))

  load_attributes: () ->
    @cast.load_attributes (attributes) =>
      @set_attributes(attributes)
    @create_links()

  set_attributes: (attributes) =>
    @view.html (@span_tag('author', attributes.author) + @span_tag('title', attributes.title))
    @set_duration(attributes.duration)
    Tryphon.Player.include_player_css attributes.player_css_url
    $.each attributes.tags, (index, tag) =>
      @view_root().addClass("audiobank-#{tag}")

  view_duration: () =>
    @_view_duration ||= @find_view('.duration')

  set_duration: (duration) =>
    @view_duration().text(Tryphon.duration_as_text(duration))

  set_progress: (position) =>
    position_in_per = position / @cast.duration
    @progress().css("width", "#{(position_in_per * 100).toFixed(0)}%")

    @set_duration(@cast.duration - position)

  prepare_view: () =>
    super
    @view_bar().click (event) =>
      unless @sound().readyState == 0
        relative_position = event.pageX - @view_bar().offset().left

        position_ratio = relative_position / @view_bar().width()
        new_position = position_ratio * @cast.duration * 1000
        @sound().setPosition(new_position)

  progress: () =>
    @_progress ||= @find_view(".progress")

  view_bar: () =>
    @_bar ||= @find_view(".bar")

  default_format: () ->
    if soundManager.canPlayMIME("audio/ogg")
      "ogg"
    else
      "mp3"

  sound_name: () =>
    "audiobank/#{@cast.name}"

  register: () =>
    @create_sound @cast.audiobank_url(@default_format())

  whileplaying: () =>
    super()
    @set_progress @sound().position / 1000.0

  unplay_mode: () ->
    "pause"

  url: () =>
    @cast.audiobank_url()

  links: () =>
    [
      {
        name: "Mp3",
        url: @cast.audiobank_url("mp3"),
        class: "download"
      },
      {
        name: "Ogg/Vorbis",
        url: @cast.audiobank_url("ogg"),
        class: "download"
      },
      {
        name: "Mp3",
        url: @cast.audiobank_url("mp3.m3u"),
        class: "external"
      },
      {
        name: "Ogg/Vorbis",
        url: @cast.audiobank_url("ogg.m3u"),
        class: "external"
      }
    ]

class Tryphon.AudioBankCast
  constructor: (@url) ->
    @name = @url.replace(/.*\/casts\/([^\.\?]+).*$/g, "$1")
    @base_url = @url.replace(/^(.*audiobank.tryphon.(dev|eu))\/.*/g, "$1")

  audiobank_url: (format, options = {}) ->
    # query = ""
    # for key, value of options
    #   if query.length > 0
    #     query += "&"
    #   query += "#{key}=#{value}"

    # if query.length > 0
    #   query = "?#{query}"

    extension =
      if format?
        ".#{format}"
      else
        ""
    "#{@base_url}/casts/#{@name}#{extension}"

  load_attributes: (callback) =>
    Tryphon.log "Load attributes from #{@audiobank_url('json')}"
    $.get @audiobank_url("json"), (attributes) =>
      @duration = attributes.duration
      Tryphon.log "Retrieved attributes from #{@audiobank_url('json')}"
      callback(attributes) if callback

class @Tryphon.Player.Stream extends Tryphon.Player
  @support_url : (url) ->
    /stream.tryphon.(eu|dev)/.test(url)

  init: () ->
    @stream = new Tryphon.Stream(@view.attr('href'))

  init_view: () ->
    $(@view).wrap("<div class='stream #{$(@view).attr('class')}'>#{@div_tag('content')}</div>")
    $(@view).attr("class", @class("main"))
    @init_base_view()

  load_attributes: () ->
    @stream.load_attributes (attributes) =>
      @set_attributes(attributes)
      @create_links()
      @register()

  set_attributes: (attributes) =>
    $(@view).html @span_tag('author', attributes.name)
    Tryphon.Player.include_player_css attributes.player_css_url

  supported_mount_points: () =>
    @_supported_mount_points ||= (mount_point for mount_point in @stream.mount_points when soundManager.canPlayMIME(mount_point.content_type))

  default_mount_point: () =>
    @_default_mount_point ||= @prefered_moint_point()

  prefered_moint_point: () =>
    for mount_point in @supported_mount_points()
      if /^audio\/ogg/.test(mount_point.content_type)
        Tryphon.log "Prefer Ogg/Vorbis stream"
        return mount_point
    @supported_mount_points()[0]

  sound_name: () =>
    "stream/#{@stream.name}"

  register: () =>
    if @stream.ok() and Tryphon.Player.sound_manager_ok() and not @registered?
      @registered = true
      @create_sound @stream.mount_point_url(@default_mount_point().path)


  unplay_mode: () ->
    "stop"

  unplay: () ->
    super()
    Tryphon.log "unload"
    @sound().unload()

  url: () =>
    @stream.stream_url()

  links: () =>
    for mount_point in @stream.mount_points
      {
        name: mount_point.name,
        url: @stream.mount_point_url(mount_point.path) + ".m3u",
        class: "external"
      }

class Tryphon.Stream
  constructor: (@url) ->
    @name = @url.replace(/.*stream.tryphon.(eu|dev)\/([^\.\?]+).*/g, "$2")
    Tryphon.log "Stream #{@name}"
    @base_url = @url.replace(/^(.*stream.tryphon.(dev|eu))\/.*/g, "$1")

  stream_url: (format, options = {}) ->
    # query = ""
    # for key, value of options
    #   if query.length > 0
    #     query += "&"
    #   query += "#{key}=#{value}"

    # if query.length > 0
    #   query = "?#{query}"

    extension =
      if format?
        ".#{format}"
      else
        ""
    "#{@base_url}/#{@name}#{extension}"

  mount_point_url: (path) ->
    "#{@base_url}/#{path}"

  load_attributes: (callback) =>
    Tryphon.log "Load attributes from #{@stream_url('json')}"
    $.get @stream_url('json'), (attributes) =>
      @mount_points = attributes.mount_points
      Tryphon.log "Retrieved attributes from #{@stream_url('json')}"
      callback(attributes) if callback

  ok: () ->
    @mount_points?

class Tryphon.Player.Loader
  constructor: (options) ->
    {@domain, @ignore_base_player_css_url} = options
    @domain ||= "http://#{Tryphon.Player.domain()}/v2"

  load: () ->
    Tryphon.log "Load from #{@domain}"
    unless jQuery?
      @load_jquery @load_with_jquery
    else
      @load_with_jquery()

  load_with_jquery: () =>
    Tryphon.log "jQuery #{jQuery.fn.jquery} is present"

    @load_css() unless @ignore_base_player_css_url
    Tryphon.Player.load_all()

  load_css: () ->
    # if document.createStyleSheet
    $('head').prepend("<link rel='stylesheet' type='text/css' href='#{@resource_url('player.css')}'/>")

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
