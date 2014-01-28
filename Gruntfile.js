'use strict';

module.exports = function(grunt) {

  grunt.initConfig({

    pkg: grunt.file.readJSON('bower.json'),

    clean: {
      dev: [
        'browser_extensions/chrome_dev/'
      ],
      dist: [
        'dist/',
        'browser_extensions/chrome_dist/'
      ]
    },

    copy: {
      dev: {
        files: [
          {
            expand: true,
            cwd: 'browser_extensions/chrome/',
            src: [
              '_locales/**/*',
              'images/icon_*',
              'js/**/*',
              'pages/**/*',
              'sounds/**/*',
              'stylesheets/**/*.css',
              'vendors/**/*',
              'manifest.json'
            ],
            dest: 'browser_extensions/chrome_dev/'
          },
          {
            src: 'src/pangu.js',
            dest: 'browser_extensions/chrome_dev/vendors/pangu.min.js'
          }
        ]
      },
      dist: {
        files: [
          {
            src: 'dist/pangu.min.js',
            dest: 'browser_extensions/chrome/vendors/pangu.min.js'
          },
          {
            expand: true,
            cwd: 'browser_extensions/chrome/',
            src: [
              '_locales/**/*',
              'images/icon_*',
              'js/**/*',
              'pages/**/*',
              'sounds/**/*',
              'stylesheets/**/*.css',
              'vendors/**/*',
              'manifest.json'
            ],
            dest: 'browser_extensions/chrome_dist/'
          },
          {
            src: '/Users/vinta/Dropbox/Developer/Projects/paranoid-auto-spacing/key.pem',
            dest: 'browser_extensions/chrome_dist/key.pem'
          }
        ]
      }
    },

    karma: {
      dist: {
        options: {
          // base path, that will be used to resolve files and exclude
          basePath: '',
          // start these browsers
          browsers: [
            'PhantomJS'
          ],
          // list of files / patterns to load in the browser
          files: [
            'dist/*.js',
            'tests/lib/jquery/jquery-1.10.2.min.js',
            'tests/lib/jasmine-jquery/jasmine-jquery.js',
            'tests/spec/**/*.js',
            {
              pattern: 'tests/fixtures/**/*.html',
              included: false,
              served: true
            }
          ],
          // list of files to exclude
          exclude: [],
          // frameworks to use
          frameworks: [
            'jasmine'
          ],
          // preprocessors allow you to do some work with your files before they get served to the browser.
          preprocessors: {
            '**/*.html': []
          },
          // test results reporter to use, possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
          reporters: [
            'progress'
          ],
          // continuous Integration mode, if true, it capture browsers, run tests and exit
          singleRun: true
        }
      }
    },

    // remove console.log()
    strip: {
      dist: {
        src: 'src/pangu.js',
        dest: 'dist/pangu.js'
      },
      dist_chrome: {
        src: 'browser_extensions/chrome_dist/js/*.js',
        options: {
          inline: true
        }
      }
    },

    uglify: {
      options: {
        banner: grunt.file.read('src/banner.js')
      },
      dist: {
        src: 'dist/pangu.js',
        dest: 'dist/pangu.min.js'
      }
    },

    watch: {
      dev: {
        files: [
          'Gruntfile.js',
          'bower.json',
          'src/**/*',
          'browser_extensions/chrome/**/*',
          '!browser_extensions/chrome/vendors/pangu.min.js'
        ],
        tasks: [
          'dev'
        ]
      }
    }

  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-strip');

  grunt.registerTask('dev', [
    'clean:dev',
    'copy:dev'
  ]);

  // 準備打包到 Chrome Web Store
  // browser_extensions/chrome_dev/ 是開發用的
  // browser_extensions/chrome_dist/ 是打包用的
  grunt.registerTask('dist', [
    'clean:dist',
    'strip:dist',
    'uglify',
    'copy:dist',
    'strip:dist_chrome'
  ]);

  grunt.registerTask('test', [
    'dist',
    'karma'
  ]);

  grunt.registerTask('default', [
    'test'
  ]);

};
