/**
 * 路由控制
 * handle:路由映射处理
 * res:response
 * data:请求数据
 */
function route(handler,res,data){
	var url = data.url;
	if (typeof handler[url] === 'function') {
		handler[url](res,data);
	} else {
		handler['/error'](res,data);
	}
}

exports.route = route;