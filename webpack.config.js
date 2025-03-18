const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (env, argv) => {
    const isProduction = argv.mode === 'production';

    return {
        context: path.resolve(__dirname, 'src/main/react'), // 기본 디렉토리 설정
        watch: !isProduction, // 개발 환경에서만 watch 활성화
        watchOptions: {
            ignored: /node_modules/,
            aggregateTimeout: 300,
            poll: 1000, // 변경 감지 주기 (ms)
        },
        entry: {
            login: './components/auth/Login.js',
            main: './components/main/Main.js',
            // Sales
            order: './components/sales/Order.js',
            orderList: './components/sales/OrderList.js',
            orderReport: './components/sales/OrderReport.js',
            orderDispatch: './components/sales/OrderDispatch.js',
            // Product
            productList: './components/product/ProductList.js',
            productPrice: './components/price/Price.js',
            productCategory: './components/product/ProductCategory.js',
            // Customer
            customerList: './components/customer/CustomerList.js',
            // HR
            employeeList: './components/hr/EmployeeList.js',
            employeeAttend: './components/hr/EmployeeAttend.js',
            employeeSalary: './components/hr/EmployeeSalary.js',
            // Email
            email: './components/conversation/EmailWrite.js',
            receivedMail: './components/conversation/ReceivedMail.js',
            sentMail: './components/conversation/SentMail.js',
            draftMailBox: './components/conversation/DraftMailBox.js',
            TrashMailBox: './components/conversation/TrashMailBox.js',
        },
        mode: isProduction ? 'production' : 'development',
        devtool: isProduction ? false : 'source-map', // 개발 시 디버깅 용이
        cache: {
            type: 'filesystem',
        },
        output: {
            path: path.resolve(__dirname, 'src/main/resources/static/bundle'),
            filename: '[name].bundle.js',
            clean: true,
        },
        optimization: {
            minimize: isProduction, // 배포 시 압축
            minimizer: isProduction ? [new TerserPlugin()] : [],
            splitChunks: {
                chunks: 'all',
                automaticNameDelimiter: '.',
            },
            runtimeChunk: false,
        },
        module: {
            rules: [
                {
                    test: /\.m?js$/,
                    resolve: {
                        fullySpecified: false, // 모듈 확장자 생략 허용
                    },
                },
                {
                    test: /\.js?$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: [
                                '@babel/preset-env', // ES6+ 지원
                                ['@babel/preset-react', { development: !isProduction }],
                            ],
                        },
                    },
                },
                {
                    test: /\.css$/,
                    use: ['style-loader', 'css-loader'],
                },
                {
                    test: /\.(png|jpg|jpeg|gif|svg)$/,
                    type: 'asset/resource', // Webpack 5 내장 모듈
                    generator: {
                        filename: 'assets/[name][ext]', // 간소화된 출력 경로
                    },
                },
            ],
        },
        plugins: [
            new webpack.ProvidePlugin({
                process: 'process/browser', // "process is not defined" 해결
            }),
            {
                apply: (compiler) => {
                    compiler.hooks.done.tap('DonePlugin', (stats) => {
                        const now = new Date().toLocaleString();
                        console.log("\x1b[31m%s\x1b[0m", "\n\n\n=============================================");
                        console.log("\x1b[31m%s\x1b[0m", `${now} 빌드 완료`);
                        console.log("\x1b[31m%s\x1b[0m", "=============================================");
                    });
                },
            },
        ],
        resolve: {
            modules: [path.resolve(__dirname, 'src/main/react'), 'node_modules'],
            extensions: ['.js', '.jsx'], // .jsx 지원 추가
            fallback: {
                url: require.resolve('url/'), // url 모듈 대체
            },
        },
    };
};