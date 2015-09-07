/**
 * 路由控制
 */
function route(handler,url){
	var result = {};
	if (typeof handler[url] === 'function') {
		result.flag = true;
		result.msg = handler[url]();
	} else {
		result.flag = false;
		result.msg = 'No request handler found for '+url;
	}
	return result;
}

exports.route = route;