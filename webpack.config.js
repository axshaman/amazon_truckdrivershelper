const Encore = require('@symfony/webpack-encore');


const webpack = require('webpack')

//const HtmlWebpackInlineSourcePlugin = require('html-webpack-inline-source-plugin');
//const HtmlWebpackPlugin = require('html-webpack-plugin')

if (!Encore.isRuntimeEnvironmentConfigured()) {
    Encore.configureRuntimeEnvironment(process.env.NODE_ENV || 'dev');
}



Encore
    // directory where compiled assets will be stored
    .setOutputPath('build/')
    // public path used by the web server to access the output path
    .setPublicPath('/build')

    .addEntry('app', './assets/app.js')
    .addEntry('load', './assets/load.js')

    .enableVueLoader(() => {}, {
        runtimeCompilerBuild: true,
        version: 3
    })

    /*
    .splitEntryChunks()
    .configureSplitChunks((splitChunks) => {
             splitChunks.name = 'vendors';
        }
    )*/

    //.enableSourceMaps(!Encore.isProduction())
    .enableSourceMaps(false)

    //.enableSingleRuntimeChunk()
    .disableSingleRuntimeChunk()

    //.addPlugin(new HtmlWebpackInlineSourcePlugin())
    //.addPlugin(new HtmlWebpackPlugin({
    //    inlineSource: '.(js|css)$' // embed all javascript and css inline
    //}))

    /*
    .addPlugin(
        new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery',
            "window.jQuery":"jquery",
            'window.$': 'jquery',
        }),
    )
     */

/*
    .addPlugin( new webpack.DefinePlugin({
        __VUE_OPTIONS_API__: true,
        __VUE_PROD_DEVTOOLS__: false,
    }))
*/
    //.addAliases({'vue': 'vue/dist/vue.esm-bundler.js'})
// ...
;





//    .addEntry('whatwg-fetch')

    /*
    .addPlugin(new webpack.ProvidePlugin({

        'Promise': 'es6-promise',
        'fetch': 'imports?this=>global!exports?global.fetch!whatwg-fetch'

       // 'Promise': 'imports?this=>global!exports?global.Promise!es6-promise', // Thanks Aaron (https://gist.github.com/Couto/b29676dd1ab8714a818f#gistcomment-1584602)
       // 'fetch': 'imports?this=>global!exports?global.fetch!whatwg-fetch'
    }))

    /*
    .addPlugin(new webpack.DefinePlugin({
        __VUE_OPTIONS_API__: true,
        __VUE_PROD_DEVTOOLS__: false,
    }))
    */
    //.addAliases({'vue': 'vue/dist/vue.esm-bundler.js'})


module.exports = Encore.getWebpackConfig();
