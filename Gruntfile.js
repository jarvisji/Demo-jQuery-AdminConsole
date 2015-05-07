module.exports = function (grunt) {
    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        replace: {
            txyun: {
                src: ['built/scripts/main.js', 'built/scripts/app/Conf.js', 'built/mobiwebsite/scripts/Conf.js', 'built/php/Config.php' ],
                overwrite: true,
                replacements: [
                    {
                        from: '$grunt_replace_serviceUrl',
                        to: 'http://service.freecoder.biz'
                    },
                    {
                        from: '$grunt_replace_debug',
                        to: '' // empty string will be convert to false
                    },
                    {
                        from: '$grunt_replace_envmode',
                        to: 'PROD'
                    }
                ]
            },
            txtest: {
                src: ['built/scripts/main.js', 'built/scripts/app/Conf.js', 'built/mobiwebsite/scripts/Conf.js', 'built/php/Config.php' ],
                overwrite: true,
                replacements: [
                    {
                        from: '$grunt_replace_serviceUrl',
                        to: 'http://devservice.freecoder.biz'
                    },
                    {
                        from: '$grunt_replace_debug',
                        to: 'true' // empty string will be convert to false
                    },
                    {
                        from: '$grunt_replace_envmode',
                        to: 'DEV'
                    }
                ]
            }
        },
        requirejs: {
            compile: {
                options: {
                    appDir: "./",
                    mainConfigFile: "./scripts/main.js",
                    dir: "./built",
                    fileExclusionRegExp: /node_modules|.svn|.idea/,
                    modules: [
                        //First set up the common build layer.
                        {
                            //module names are relative to baseUrl
                            name: '../main',
                            //List common dependencies here. Only need to list
                            //top level dependencies, "include" will find
                            //nested dependencies.
                            include: ['jquery',
                                'bootstrap',
                                'ace-extra',
                                'ace-elements',
                                'app/Conf',
                                'app/common/Constants'
                            ]
                        },

                        //Now set up a build layer for each main layer, but exclude the common one.
                        {
                            //module names are relative to baseUrl/paths config
                            name: 'app/Activate',
                            exclude: ['../main']
                        },
                        {
                            name: 'app/AudioList',
                            exclude: ['../main']
                        },
                        {
                            name: 'app/AutoReply',
                            exclude: ['../main']
                        },
                        {
                            name: 'app/FollowReply',
                            exclude: ['../main']
                        },
                        {
                            name: 'app/ForgotPassword',
                            exclude: ['../main']
                        },
                        {
                            name: 'app/Header',
                            exclude: ['../main']
                        },
                        {
                            name: 'app/Index',
                            exclude: ['../main']
                        },
                        {
                            name: 'app/KeywordReply',
                            exclude: ['../main']
                        },
                        {
                            name: 'app/Login',
                            exclude: ['../main']
                        },
                        {
                            name: 'app/Menu',
                            exclude: ['../main']
                        },
                        {
                            name: 'app/MultipleImageText',
                            exclude: ['../main']
                        },
                        {
                            name: 'app/MwsCategoryTemplate',
                            exclude: ['../main']
                        },
                        {
                            name: 'app/MwsContentTemplate',
                            exclude: ['../main']
                        },
                        {
                            name: 'app/MwsEntry',
                            exclude: ['../main']
                        },
                        {
                            name: 'app/MwsIndex',
                            exclude: ['../main']
                        },
                        {
                            name: 'app/MwsWizard',
                            exclude: ['../main']
                        },
                        {
                            name: 'app/PictureList',
                            exclude: ['../main']
                        },
                        {
                            name: 'app/Registration',
                            exclude: ['../main']
                        },
                        {
                            name: 'app/SingleImageText',
                            exclude: ['../main']
                        },
                        {
                            name: 'app/TextList',
                            exclude: ['../main']
                        },
                        {
                            name: 'app/UserBasicInformation',
                            exclude: ['../main']
                        },
                        {
                            name: 'app/VideoList',
                            exclude: ['../main']
                        },
                        {
                            name: 'app/WxAccountIndex',
                            exclude: ['../main']
                        },
                        {
                            name: 'app/WXPublic',
                            exclude: ['../main']
                        },
                        {
                            name: 'app/WXPublicList',
                            exclude: ['../main']
                        }

                    ]
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-text-replace');
    grunt.loadNpmTasks('grunt-contrib-requirejs');

//    grunt.registerTask('default', ['requirejs']);
    grunt.registerTask('txyun', ['requirejs', 'replace:txyun']);
    grunt.registerTask('txtest', ['requirejs', 'replace:txtest']);
};
