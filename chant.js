'use strict';
const chant=function(json={})
{
	let handlers=[];
	const
	self={},
	state=util.clone(json),
	send=function(action)
	{
		//console.log(action);
		return self;
	},
	receive=function(action)
	{
		const
		{type,path,val}=action,
		func=self[type]||(()=>'');//@note blank func protects agains non-existant func
		func(path,val);
	};
	self.delete=function(path='')
	{
		let [ref,prop]=util.getRefParts(state,path);
		delete ref[prop];
		return send({'type':'delete',path});
	};
	self.get=function(path='')
	{
		const
		{clone,path2props,traverse}=util,
		props=path2props(path);
		return clone(props.reduce(traverse,state));
	};
	self.off=function(...args)
	{
		const
		props='path,type,func'.split(','),
		query=args.reduce(function(obj,arg,i)
		{
			const prop=props[i];
			obj[prop]=arg;
			return obj;
		},{}),
		func=query=>x=>util.filterMatches(query,x);
		handlers=handlers.filter(func);
		return self;
	};
	//@arg path=property path, type=action, func=callback
	self.on=function(path,type,func)
	{
		handlers.push({path,type,func});
		console.log(handlers);
		return self;
	};
	self.set=function(path='',val=undefined)
	{
		let [ref,prop]=util.getRefParts(state,path);
		ref[prop]=val;
		return send({type:'set',path,val});
	};
	self.update=function(path,func)
	{
		const
		init=self.get(path),
		val=func(util.clone(init));
		return self.set(path,val);
	};
	//@todo onMessage(receive);
	return self;
},
util={};
util.arrSplit=(arr=[],i=arr.length)=>[arr.slice(0,i),arr.slice(i)];
util.clone=json=>JSON.parse(JSON.stringify(json));
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
util.getRefParts=function(json={},path='')//@note the last prop will mutate, so they must be sent separately to be assembled for use
{
	let
	{arrSplit,getRef,path2props}=util,
	props=path2props(path),
	[firstProps,lastProp]=arrSplit(props,props.length-1),
	ref=getRef(json,firstProps);
	return [ref,lastProp];
};
util.filterMatches=function(query,result)
{
	return Object.keys(query)
	.some(function(prop)
	{
		const [a,b]=[query,result].map(x=>x[prop].toString());
		return a!==b;
	});
};
util.path2props=path=>path.split('.').filter(txt=>txt.length);
util.traverse=(obj,prop)=>obj[prop];
export {chant};