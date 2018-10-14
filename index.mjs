const {assign}=Object
export default async function chant(updater,from=chant.address())
{
	const
	onmessage=({data})=>updater(assign(JSON.parse(data),{from})),
	socket=chant.socket(from),
	err=await new Promise(function(res,rej)
	{//@todo simplify with promise chain or async compose function?
		const onopen=function({target})
		{
			assign(target,{onerror:chant.error})
			res()
		}
		assign(socket,{onerror:rej,onopen,onmessage})
	})

	if(err) return chant.error(err)

	return function(act)
	{
		if(act.from!==from) socket.send(JSON.stringify(act))
		return act
	}
}
chant.address=(url=location.href)=>url.split('/')[2]//[protocol,_,address]
chant.error=console.error
chant.socket=addr=>new WebSocket('ws://'+addr,'echo-protocol')