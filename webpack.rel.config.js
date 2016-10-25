var path = require('path');
var webpack = require('webpack');
/*
 extract-text-webpack-plugin插件，
 有了它就可以将你的样式提取到单独的css文件里，
 妈妈再也不用担心样式会被打包到js文件里了。
 */
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var CleanPlugin = require('clean-webpack-plugin'); //清理文件夹
/*
 html-webpack-plugin插件，重中之重，webpack中生成HTML的插件，
 具体可以去这里查看https://www.npmjs.com/package/html-webpack-plugin
 */
var HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    output: {
        path: path.join(__dirname, 'wx'), //输出目录的配置，模板、样式、脚本、图片等资源的路径配置都相对于它
        //publicPath: '/wx/',               //模板、样式、脚本、图片等资源对应的server上的路径
        publicPath: 'http://wxcdn.li-li.cn/wx/',               //正式服路径
        filename: 'js/[name]_[chunkhash:8].js',           //每个页面对应的主js的生成配置
        chunkFilename: 'js/[id].chunk.js'   //chunk生成的配置
    },
    module: {
        loaders: [ //加载器，关于各个加载器的参数配置，可自行搜索之。
            {
                test: /\.css$/,
                //配置css的抽取器、加载器。'-loader'可以省去
                loader: ExtractTextPlugin.extract('style-loader', 'css-loader')
            }, {
                test: /\.less$/,
                //配置less的抽取器、加载器。中间!有必要解释一下，
                //根据从右到左的顺序依次调用less、css加载器，前一个的输出是后一个的输入
                //你也可以开发自己的loader哟。有关loader的写法可自行谷歌之。
                loader: ExtractTextPlugin.extract('css!less')
            }, {
                //html模板加载器，可以处理引用的静态资源，默认配置参数attrs=img:src，处理图片的src引用的资源
                //比如你配置，attrs=img:src img:data-src就可以一并处理data-src引用的资源了，就像下面这样
                test: /\.html$/,
                loader: "html?attrs=img:src img:data-src"
            }, {
                //文件加载器，处理文件静态资源
                test: /\.(woff|woff2|ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                loader: 'file-loader?name=./fonts/[name].[ext]'
            }, {
//图片加载器，雷同file-loader，更适合图片，可以将较小的图片转成base64，减少http请求
//如下配置，将小于8192byte的图片转成base64码
                test: /\.(png|jpg|gif)$/,
                loader: 'url-loader?limit=80&name=./img/[name]_[hash].[ext]'
            }
        ]
    },
    plugins: [
		//清空输出目录
	    new CleanPlugin(['wx'], {
	        "root": path.resolve(__dirname, './'),
	        verbose: true,
	        dry: false
	    }),
        new webpack.ProvidePlugin({ //加载jq
            $: 'zepto'
        }),
		new webpack.optimize.UglifyJsPlugin({
			compress: {
				warnings: false
			},
			sourceMap: false,//这里的soucemap 不能少，可以在线上生成soucemap文件，便于调试
			mangle: true
		}),
		/*new webpack.optimize.CommonsChunkPlugin({
			name: "commons", 
			filename: "js/commons_[hash].js",
			chunks:['js1','js2','js3']
		}),*/
		
		new webpack.optimize.CommonsChunkPlugin("commons", "js/commons_[chunkhash:8].js"),
		
        //new webpack.optimize.CommonsChunkPlugin({
        //    name: 'vendors', // 将公共模块提取，生成名为`vendors`的chunk
        //    chunks: ['depart_index'] //提取哪些模块共有的部分
        //    //minChunks: 3 // 提取至少3个模块共有的部分
        //}),
        new ExtractTextPlugin('css/[name]_[contenthash:8].css'), //单独使用link标签加载css并设置路径，相对于output配置中的publicePath

        //new webpack.HotModuleReplacementPlugin() //热加载
    ],
    //devtool: "cheap-module-source-map",
    //使用webpack-dev-server，提高开发效率
    devServer: {
        contentBase: './',
        host: 'localhost',
        port: 9090, //默认8080
        inline: true, //可以监控js变化
        hot: true //热启动
    }
};

function initConfig(pageList) {
    module.exports.entry= {};
    for(var i = 0;i< pageList.length;i ++) {
        var e = pageList[i];
        if(e.match("/")) {
            var pageFileName = e.split("/").join("_");
            var chunks = pageFileName;
        } else {
            var pageFileName = e;
            var chunks = pageFileName;
        }
        module.exports.entry[pageFileName] = "./assets/js/page/" + e + ".js";
        //配置HTML模板
        module.exports.plugins.push(new HtmlWebpackPlugin({
            //根据模板插入css/js等生成最终HTML
            filename: './view/' + pageFileName + ".html",
            //生成的html存放路径，相对于path
            template: './views/page/' + e + '.html',
            //js插入的位置，true/'head'/'body'/false
            inject: 'body',
            hash: false, //为静态资源生成hash值
            chunks: ["commons",chunks],//需要引入的chunk，不配置就会引入所有页面的资源
            minify: {
                removeComments: true,//移除HTML中的注释
                collapseWhitespace: false //删除空白符与换行符
            }
        }));
    }
}

initConfig([
    //页面实际路径
    "index",
    "calendar",
    "remind",
    "activity",
    "newSchedule",
    "newShowEvent"
])