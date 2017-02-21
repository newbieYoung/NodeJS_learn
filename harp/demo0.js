var harp = require('harp');
var path = require('path');

harp.server(path.join(__dirname,'../../PxDiffFrameAnimation'),{port:9001},function(){
	console.log('PxDiffFrameAnimation -> http://localhost:9001');
});