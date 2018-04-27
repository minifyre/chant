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
	self.getRef=function(props=[])
	{
		let ref=state;
		for(let c=0,l=props.length;c<l;c++)
		{
			let prop=props[c];
			if(!ref[prop])
			{
				ref[prop]={};
			}
			ref=ref[prop];
		}
		return ref;
	};
	self.delete=function(path='')
	{
		let
		props=util.path2props(path),
		[firstProps,lastProps]=util.arrSplit(props,props.length-1),
		ref=self.getRef(firstProps);
		delete ref[lastProps];
		return self.sync({'type':'delete',path});
	};
	self.set=function(path='',val=undefined)
	{
		let
		props=util.path2props(path),
		[firstProps,lastProps]=util.arrSplit(props,props.length-1),
		ref=self.getRef(firstProps);
		ref[lastProps]=val;
		return self.sync({type:'set',path,val});
	};
	self.update=function(path,func)
	{
		const
		init=self.get(path),
		val=func(util.clone(init));
		return self.set(path,val);
	};
	self.sync=function(action)
	{
		//@todo send socket
		return self;
	};
	return self;
},
util={};
util.arrSplit=(arr=[],i=arr.length)=>[arr.slice(0,i),arr.slice(i)];
util.clone=json=>JSON.parse(JSON.stringify(json));
util.path2props=path=>path.split('.').filter(txt=>txt.length);
util.traverse=(obj,prop)=>obj[prop];
export {chant};