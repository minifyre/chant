'use strict';
const util=
{
	clone:json=>JSON.parse(JSON.stringify(json)),
	id:()=>([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,util.idHelper),
	idHelper:c=>(c^util.rand()[0]&15>>c/4).toString(16),
	objMaker:defaultObj=>(opts={})=>Object.assign(defaultObj,opts),
	rand:()=>crypto.getRandomValues(new Uint8Array(1))
};
export {util};