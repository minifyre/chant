'use strict';
const chant=function(json={})
{
	let handlers=[];
	const
	self={},
	state=util.clone(json),
	defHandler={func:x=>x,path:'',type:''};
	self.delete=function(path='')
	{
		let [ref,prop]=util.getRefParts(state,path);
		delete ref[prop];
		return self.emit({'type':'delete',path});
	};
	self.emit=function(action)
	{
		action=Object.assign({timestamp:Date.now()},action);
		handlers.forEach(function(obj)
		{
			const {path,type,func}=obj;
			if (action.path.match(path)&&
			    action.type.match(type))
			{
				func(action);
			}
		});
		return self;
	};
	self.get=function(path='')
	{
		const
		{clone,path2props,traverse}=util,
		props=path2props(path);
		return clone(props.reduce(traverse,state));
	};
	self.off=function(handler)
	{
		const query=Object.assign({timestamp:Date.now()},defHandler,handler);
		handlers=handlers.filter(function(result)
		{
			return !Object.keys(query)
			.some(prop=>query[prop].toString()===result[prop].toString());
		});
		return self;
	};
	self.on=function(handler)//={path:property-path,type:action,func:callback}
	{
		handlers.push(Object.assign({timestamp:Date.now()},defHandler,handler));
		return self;
	};
	self.set=function(path='',val=undefined)
	{
		let [ref,prop]=util.getRefParts(state,path);
		ref[prop]=val;
		return self.emit({type:'set',path,val});
	};
	self.update=function(path,func)
	{
		const
		init=self.get(path),
		val=func(util.clone(init));
		return self.set(path,val);
	};
	return self;
},
util=
{
	arrSplit:(arr=[],i=arr.length)=>[arr.slice(0,i),arr.slice(i)],
	clone:json=>JSON.parse(JSON.stringify(json)),
	path2props:path=>path.split('.').filter(txt=>txt.length),
	traverse:(obj,prop)=>obj[prop]
};
util.getRef=function(ref={},props=[])
{
	for(let c=0,l=props.length;c<l;c++)//@note optimized for speed
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
util.getRefParts=function(json={},path='')
{
	let
	{arrSplit,getRef,path2props}=util,
	props=path2props(path),
	[firstProps,lastProp]=arrSplit(props,props.length-1),
	ref=getRef(json,firstProps);
	return [ref,lastProp];//@note must be sent sepearately as lastProp will mutate
};
export {chant};