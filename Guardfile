# A sample Guardfile
# More info at https://github.com/guard/guard#readme

ignore %r{^dist/}

input_dir = '.'
coffeescript_options = {
  input: input_dir,
  output: input_dir,
  patterns: [%r{(.+\.(?:coffee|coffee\.md|litcoffee))$}]
}

guard 'coffeescript', coffeescript_options do
  coffeescript_options[:patterns].each { |pattern| watch(pattern) }
end

guard 'sass', output: "." do
  watch %r{(.+\.s[ac]ss)$}
end
