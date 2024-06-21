module.exports = {
    mode: 'development',
    entry: './src/index.tsx',
    module: {
        rules: [
            {test: /\.tsx$/, use: 'ts-loader'},
            {test: /\.css$/, use: ['style-loader', 'css-loader']},
            {test: /\.(jpg|png)$/, type: 'asset/resource'},
        ]
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js']
    },
    devServer: {
        historyApiFallback: true
    }
}