namespace :build do

  task :base do
    mkdir_p "build"
  end

  task :fix_animator => :base do
    File.open("build/berniecode-animator.js", "w") do |f|
      f.puts(File.read("soundmanager/demo/360-player/script/berniecode-animator.js") + ";")
    end
  end

  namespace :soundmanager do
    task :xdomain => :base do
      rm_rf "build/soundmanager2_flash_xdomain"
      Dir.chdir("build") do
        sh "unzip ../soundmanager/swf/soundmanager2_flash_xdomain.zip > /dev/null"
      end
    end
  end

end

namespace :dist do
  task :base do
    mkdir_p "dist/swf"
  end

  task :soundmanager => "build:soundmanager:xdomain" do
    # cp Dir["soundmanager/swf/*.swf"], "dist/swf"
    cp Dir["build/soundmanager2_flash_xdomain/*.swf"], "dist/swf"

    #cp "build/soundmanager2_debug.swf", "dist/swf"
    #cp "build/soundmanager2_debug.swf", "dist/swf/soundmanager2.swf"

    #cp "build/soundmanager2_flash9_debug.swf", "dist/swf"
    #cp "build/soundmanager2_flash9_debug.swf", "dist/swf/soundmanager2_flash9.swf"

    cp Dir["soundmanager/script/soundmanager2.js"], "dist/"
  end

  task :three_sixty_player do
    # cp Dir["soundmanager/demo/360-player/script/*.js"], "dist/script"
    # cp Dir["soundmanager/demo/360-player/360*.css"], "dist/"
    cp Dir["soundmanager/demo/360-player/*.gif"], "dist/"
    cp Dir["soundmanager/demo/360-player/*.png"], "dist/"
  end

  def concat(inputs, output)
    File.open(output, "w") do |f|
      inputs.each do |input|
        f.puts ""
        # f.puts "// #{File.basename(input)} :"
        File.readlines(input).each do |line|
          f.puts line.chomp
        end
      end
    end
  end

  task :css do
    css_files = Dir["soundmanager/demo/360-player/360*.css"].sort.reverse
    # css_files << "init.css"

    concat css_files, "dist/player.css"
  end

  task :javascript => "build:fix_animator" do
    concat ["soundmanager/demo/360-player/script/excanvas.js", "build/berniecode-animator.js", "soundmanager/script/soundmanager2.js", "soundmanager/demo/360-player/script/360player.js", "init.js"], "dist/player.js"
    sh "sed -i '/soundManager.onready(threeSixtyPlayer.init);/ d' dist/player.js"
  end

  task :html do
    cp "index.html", "dist"
    cp "demo.css", "dist"
    cp Dir["*.otf"], "dist"
    cp Dir["tune-1000.*"], "dist"
  end

  task :v2 do
    cp_r "v2", "dist"
    sh "cat soundmanager/script/soundmanager2.js v2/player.js > dist/v2/player.js"
  end

  task :fonts do
    cp_r "fonts", "dist"
  end
end

task :dist => [ "dist:base", "dist:soundmanager", "dist:three_sixty_player", "dist:css", "dist:javascript", "dist:html", "dist:v2", "dist:fonts" ]

task :default => :dist
