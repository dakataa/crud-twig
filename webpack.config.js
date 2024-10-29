const Encore = require('@symfony/webpack-encore');
const {InjectManifest} = require('workbox-webpack-plugin');
const Path = require("path");
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

const ASSET_OUTPUT_PATH = 'public/assets/';
const ASSET_PUBLIC_PATH = '/bundles/dakataacrudtwig/assets';

Encore
    .setOutputPath(ASSET_OUTPUT_PATH)
    .setPublicPath(ASSET_PUBLIC_PATH)
	.setManifestKeyPrefix('bundles/dakataacrudtwig')
    .cleanupOutputBeforeBuild()
    .disableSingleRuntimeChunk()
	.configureCssMinimizerPlugin((config) => {
		config.parallel = true;
		config.minify = [
			CssMinimizerPlugin.cssnanoMinify,
			CssMinimizerPlugin.cleanCssMinify,
		];
		config.minimizerOptions = {
			preset: [
				'default',
				{
					discardComments: {removeAll: true},
				},
			],
		};
	})
    .enableVersioning(true)
    .enableSourceMaps(!Encore.isProduction())
    .addEntry('theme', [
        './assets/theme.js'
    ])
	.enableSassLoader()
	.addPlugin(
		new InjectManifest(({
			swSrc: Path.join(process.cwd(), '/assets/service-worker.js'),
			swDest: 'sw.js',
			mode: Encore.isProduction() ? 'production' : 'dev',
			exclude: [
				/\.map$/,
				/manifest$/,
				/\.htaccess$/,
				/\.DS_Store$/,
				/service-worker\.js$/,
				/sw\.js$/,
				/ckeditor/,
				/node_modules/,
				/docs/,
			],
			include: [
				/\.jpg$/,
				/\.png$/,
				/\.webp$/,
				/\.js$/,
				/\.css$/,
				/\.woff$/,
				/\.woff2$/,
				/\.eot$/,
			],
		}))
	)
    // .configureBabel(function (config) {
    //     // config.plugins.push(['@babel/plugin-transform-classes']);
    //     config.plugins.push(['@babel/plugin-transform-runtime']);
    //     config.plugins.push(['@babel/plugin-transform-template-literals', {loose: true}]);
	//
    // }, {
    //     useBuiltIns: 'usage',
    //     corejs: 3,
    //     includeNodeModules: ['bootstrap']
    // })
;



let webConfig = Encore.getWebpackConfig();
webConfig.name = 'web';

module.exports = [webConfig];
