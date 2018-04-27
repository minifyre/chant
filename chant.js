'use strict';
const chant=function(initalVal={})
{
	const
	self={},
	state=util.clone(initalVal);
	self.get=function(path='')
	{
		const
		{clone,traverse}=util,
		props=util.path2props(path);
		return clone(props.reduce(traverse,state));
	};
	/*self.delete=function(path='')
	{
		const
		props=path.split('.').filter(util.empty),
		prop=props.pop();
		if (prop)
		{
			//delete obj[path.pop()]
		}
		//
		return self;
	};*/
	self.set=function(path='',val=undefined)
	{
		let
		ref=state,
		props=util.path2props(path),
		lastIndex=props.length-1;
		for(let c=0;c<lastIndex;c++)
		{
			let prop=props[c];
			if(!ref[prop])
			{
				ref[prop]={};
			}
			ref=ref[prop];
		}
		ref[props[lastIndex]]=val;
		//@todo self.sync();
		return self;
	};
	self.update=function(path,func)
	{
		const
		init=self.get(path),
		val=func(util.clone(init));
		return self.set(path,val);
	};
/*
	self.sync=function()
	{
		return self;
	};*/
	return self;
},
util={};
util.clone=json=>JSON.parse(JSON.stringify(json));
util.path2props=path=>path.split('.').filter(txt=>txt.length);
util.traverse=(obj,prop)=>obj[prop];
export {chant};