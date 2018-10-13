const {assign}=Object
export default function chant(updater,from=chant.address())
{
	const
	onmessage=({data})=>updater(assign(JSON.parse(data),{from})),
	send=await new Promise(function(res,rej)
	{//@todo simplify with promise chain or async compose function?
		const
		onerror=chant.error,
		onopen=({target})=>res(assign(target,{onerror,onmessage}).send)

		assign(chant.socket(from),{onerror:rej,onopen})
	})

	if(send instanceof Error) return send

	send(`{"type":"get"}`)
	return function(act)
	{
		if(act.from!==from) send(JSON.stringify(act))
		return act
	}
}
chant.address=(url=location.href)=>url.split('/')[2]//[protocol,_,address]
chant.error=console.error
chant.socket=addr=>new WebSocket('ws://'+addr,'echo-protocol')