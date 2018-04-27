'use strict';
const chant=function(initalVal={})
{
	const
	self={},
	state=util.clone(initalVal);
	self.get=function(path='')
	{
		const
		{clone,empty,traverse}=util,
		props=path.split('.').filter(empty);
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
	};
	self.set=function(path='',val=undefined)
	{
		let
		ref=state,
		props=path.split('.').filter(util.empty),
		lastIndex=props.length-1;
		for(var c=0;c<lastIndex;c++)
		{
			var prop=props[c];
			if(!ref[prop])
			{
				ref[prop]={};
			}
			ref=ref[prop];
		}
		ref[props[lastIndex]]=val;
		return self;
	};*/

	/*self.set=function(path='',val=undefined)//@todo can this act as add(new.prop,val) as well?
	{
		//use recursive Object.assign
		const {arg,args,path,type}=Object.assign(
		{
			arg:undefined,
			path:'',
			type:chant.clone
		},action),
		timestamp=Date.now(),
		{clone,traverse}=util,
		props=path.split('.'),
		val=clone(props.reduce(traverse,state));
		return self;
	};*/
/*	self.update=function()
	{
		//get value
		//set value
		return self;
	};
	self.sync=function()
	{
		return self;
	};*/
	return self;
},
util={};
util.clone=json=>JSON.parse(JSON.stringify(json));
util.empty=txt=>txt.length;
util.map=function(initalArr,func)
{
	let arr=initalArr.slice();
	for (let c=0,l=arr.length;c<l;c++)
	{
		arr[c]=func(arr[c]);
	}
	return arr;
};
util.traverse=(obj,prop)=>obj[prop];
export {chant};