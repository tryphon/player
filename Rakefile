namespace :build do

  task :base do
    mkdir_p "build"
  end

  task :fix_animator => :base do
    File.open("build/berniecode-animator.js", "w") do |f|
      f.puts(File.read("soundmanager/demo/360-player/script/berniecode-animator.js") + ";")
    end
  end

end

namespace :dist do
  task :base do
    mkdir_p "dist/swf"
  end

  task :soundmanager => :base do
    # cp Dir["soundmanager/script/*.js"], "dist/script"
    cp Dir["soundmanager/swf/*.swf"], "dist/swf"
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
        f.puts "// #{File.basename(input)} :"
        File.readlines(input).each do |line|
          f.puts line.chomp
        end
      end
    end
  end

  task :css do
    concat Dir["soundmanager/demo/360-player/360*.css"].sort, "dist/player.css"
  end

  task :javascript => "build:fix_animator" do
    concat ["soundmanager/demo/360-player/script/excanvas.js", "build/berniecode-animator.js", "soundmanager/script/soundmanager2.js", "soundmanager/demo/360-player/script/360player.js", "init.js"], "dist/player.js"
  end

  task :html do
    cp "index.html", "dist"
    cp "crossdomain.xml", "dist"
    cp Dir["tune-1000.*"], "dist"
  end
end

task :dist => [ "dist:base", "dist:soundmanager", "dist:three_sixty_player", "dist:css", "dist:javascript", "dist:html" ]

task :default => :dist
