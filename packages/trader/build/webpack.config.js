const path = require('path');
const { ALIASES, IS_RELEASE, MINIMIZERS, plugins, rules } = require('./constants');

module.exports = function (env) {
    const base = env && env.base && env.base !== true ? `/${env.base}/` : '/';

    return {
        context: path.resolve(__dirname, '../'),
        devtool: IS_RELEASE ? 'source-map' : 'eval-cheap-module-source-map',
        entry: {
            trader: path.resolve(__dirname, '../src', 'index.tsx'),
        },
        mode: IS_RELEASE ? 'production' : 'development',
        module: {
            rules: rules(),
        },
        resolve: {
            alias: ALIASES,
            extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
        optimization: {
            chunkIds: 'named',
            moduleIds: 'named',
            minimize: IS_RELEASE,
            minimizer: MINIMIZERS,
            splitChunks: {
                chunks: 'all',
                cacheGroups: {
                    // Split CSS by route to enable lazy loading
                    styles: {
                        name: (module, chunks) => `${chunks.map(c => c.name).join('~')}.styles`,
                        test: /\.s?css$/,
                        chunks: 'all',
                        enforce: true,
                        priority: 20,
                    },
                    // Keep vendor CSS separate
                    vendorStyles: {
                        name: 'vendors',
                        test: /[\\/]node_modules[\\/].*\.s?css$/,
                        chunks: 'all',
                        enforce: true,
                        priority: 30,
                    },
                },
            },
        },
        output: {
            filename: 'trader/js/[name].js',
            publicPath: base,
            path: path.resolve(__dirname, '../dist'),
            chunkFilename: 'trader/js/trader.[name].[contenthash].js',
            libraryExport: 'default',
            library: '@deriv/trader',
            libraryTarget: 'umd',
        },
        externals: [
            {
                react: 'react',
                'react-dom': 'react-dom',
                'react-router-dom': 'react-router-dom',
                'react-router': 'react-router',
                mobx: 'mobx',
                'mobx-react-lite': 'mobx-react-lite',
                '@deriv/shared': '@deriv/shared',
                '@deriv/components': '@deriv/components',
                '@deriv-com/translations': '@deriv-com/translations',
                '@deriv-com/smartcharts-champion': '@deriv-com/smartcharts-champion',
                '@deriv-com/analytics': '@deriv-com/analytics',
            },
            /^@deriv\/shared\/.+$/,
            /^@deriv\/components\/.+$/,
            /^@deriv-com\/translations\/.+$/,
            /^@deriv\/reports\/.+$/,
        ],
        target: 'web',
        plugins: plugins(base, false),
    };
};
