'use strict';
const util=
{
	arrSplit:(arr=[],i=arr.length)=>[arr.slice(0,i),arr.slice(i)],
	clone:json=>JSON.parse(JSON.stringify(json)),
	id:()=>([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,util.idHelper),
	idHelper:c=>(c^util.rand()[0]&15>>c/4).toString(16),
	mk:defaultObj=>(opts={})=>Object.assign(defaultObj,opts),
	path2props:function(path,separator='.')
	{
		return path.split(separator).filter(txt=>txt.length);
	},
	rand:()=>crypto.getRandomValues(new Uint8Array(1)),
	traverse:(obj,prop)=>obj[prop]

};
util.getRef=function(ref={},props=[])
{
	for (let c=0,l=props.length;c<l;c++)//@note optimized for speed
	{
		let prop=props[c];
		if (!ref[prop])
		{
			ref[prop]={};
		}
		ref=ref[prop];
	}
	return ref;
};
util.getRefParts=function(json={},path='',separator='.')
{
	let
	{arrSplit,getRef,path2props}=util,
	props=path2props(path,separator),
	[firstProps,lastProp]=arrSplit(props,props.length-1),
	ref=getRef(json,firstProps);
	return [ref,lastProp];//must be sent sepearately as lastProp will mutate
};
export {util};