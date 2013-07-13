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

    task :flash8 => :base do
      sh "mtasc -swf build/soundmanager2_debug.swf -main -header 16:16:30 soundmanager/src/SoundManager2.as -version 8"
    end

    task :flash9 => :base do
      sh "/opt/flex-sdk-4.6/bin/mxmlc -debug=true -static-link-runtime-shared-libraries=true -optimize=true -o build/soundmanager2_flash9_debug.swf -file-specs soundmanager/src/SoundManager2_AS3.as"
    end

    task :xdomain => :base do
      Dir.chdir("build") do
        sh "unzip -f ../soundmanager/swf/soundmanager2_flash_xdomain.zip > /dev/null"
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
    css_files << "init.css"

    concat css_files, "dist/player.css"
  end

  task :javascript => "build:fix_animator" do
    concat ["soundmanager/demo/360-player/script/excanvas.js", "build/berniecode-animator.js", "soundmanager/script/soundmanager2.js", "soundmanager/demo/360-player/script/360player.js", "init.js"], "dist/player.js"
    sh "sed -i '/soundManager.onready(threeSixtyPlayer.init);/ d' dist/player.js"
  end

  task :html do
    cp "index.html", "dist"
    cp Dir["*.otf"], "dist"
    cp Dir["tune-1000.*"], "dist"
  end
end

task :dist => [ "dist:base", "dist:soundmanager", "dist:three_sixty_player", "dist:css", "dist:javascript", "dist:html" ]

task :default => :dist
