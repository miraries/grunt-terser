/*
 * grunt-terser
 * https://github.com/adascal/grunt-terser
 * + modifications for async usage with terser v5
 *
 * Copyright (c) 2018 Alexandr Dascal, (c) 2020 James Nylen
 * Licensed under the MIT license.
 */

const Terser = require('terser');
const maxmin = require('maxmin');

module.exports = function(grunt) {
  // Please see the Grunt documentation for more information regarding task
  // creation: http://gruntjs.com/creating-tasks

  grunt.registerMultiTask(
    'terser',
    'Grunt plugin for A JavaScript parser, mangler/compressor and beautifier toolkit for ES6+.',
    async function() {
      const done = this.async();

      // Merge task-specific and/or target-specific options with these defaults.
      const options = this.options();
      let createdFiles = 0;

      // Iterate over all specified file groups.
      for (const f of this.files) {

        if (!f.src.length) {
          grunt.log.warn('Source files not found for \x1b[31m%s\x1b[0m ', f.dest);
          continue;
        }

        // Concat specified files.
        const src = f.src
          .reduce(function(sources, filepath) {
            sources[filepath] = grunt.file.read(filepath);

            return sources;
          }, {});

        // Minify file code.
        let result;
        try {
          result = await Terser.minify(src, options);
        } catch (err) {
          grunt.log.error('Terser failed minifying \x1b[36m%s\x1b[0m:', f.dest);
          grunt.log.error(err);
          grunt.verbose.error(err.stack);
          return false;
        }

        if (result.error) {
          grunt.log.error(result.error);
          return false;
        }

        if (result.warnings) {
          grunt.log.warn(result.warnings.join('\n'));
        }

        // Write the destination file.
        grunt.file.write(f.dest, result.code);

        if (options.sourceMap) {
          const mapFileName = options.sourceMap.filename ?
            options.sourceMap.filename :
            f.dest + '.map';
          // Write the source map file.
          grunt.file.write(mapFileName, result.map);
        }

        // Print a success message
        const diff = maxmin(Object.values(src).map(s => s.length).reduce((a, b) => a + b), result.code.length);
        grunt.log.writeln(`>> File \x1b[36m%s\x1b[0m created. `, f.dest, diff);

        // Increment created files counter
        createdFiles++;
      }

      if (createdFiles > 0) {
        grunt.log.ok(`${createdFiles} ${grunt.util.pluralize(createdFiles, 'file/files')} created.`);
      }

      done();
    },
  );
};
