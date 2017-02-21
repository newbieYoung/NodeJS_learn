var harp = require('harp');

harp.server('../../PxDiffFrameAnimation',{port:9001},function(){
	console.log('PxDiffFrameAnimation -> http://localhost:9001');
});