var harp = require('harp');
var path = require('path');

harp.server(path.join(__dirname,'../../PxDiffFrameAnimation'),{port:9001},function(){
	console.log('PxDiffFrameAnimation -> http://localhost:9001');
});

harp.server(path.join(__dirname,'../../Html_learn'),{port:9002},function(){
	console.log('Html_learn -> http://localhost:9002');
});