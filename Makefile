NODE_PATH ?= ./node_modules
JS_COMPILER = $(NODE_PATH)/uglify-js/bin/uglifyjs
JS_TESTER = $(NODE_PATH)/vows/bin/vows

JS_FILES = fizzywig.js 

all: \
	$(JS_FILES) \
	$(JS_FILES:.js=.min.js)

fizzywig.js: \
	src/preamble.js \
	src/externs.js \
	src/fizzywig/core.js \
	src/fizzywig/emitter.js \
	src/fizzywig/content.js \
	src/fizzywig/toolbar.js \
	src/fizzywig/content-node.js \
	src/fizzywig/button.js \
	src/fizzywig/range.js \
	src/fizzywig/sanitizer.js \
	src/ext/object.js \
	src/ext/element.js \
	src/ext/event.js \
	src/postamble.js

test: all
	@$(JS_TESTER)
	
%.min.js: %.js Makefile
	@rm -f $@
	$(JS_COMPILER) < $< > $@

fizzywig.%: Makefile
	@rm -f $@
	cat $(filter %.js,$^) > $@
	@chmod a-w $@

install:
	mkdir -p node_modules
	npm install

# package.json: fizzywig.js src/package.js
#   node src/package.js > $@

clean:
	rm -f fizzywig*.js