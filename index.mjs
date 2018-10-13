const {assign}=Object
export default function chant(updater,from=chant.address())
{
	const
	onmessage=({data})=>updater(assign(JSON.parse(data),{from})),
	send=await new Promise(function(res,onerror)
	{
		assign(chant.socket(from),
		{
			onerror,
			onopen:function({target})
			{
				const {send}=assign(target,{onerror:chant.error,onmessage})
				send(`{"type":"get"}`)//@todo if(type==='get'&&!path.length) set all
				res({send})
			}
		})
	})

	return send instanceof Error?chant.error(send):function(act)
	{
		if(act.from!==from) send(JSON.stringify(act))
		return act
	}
}
chant.address=(url=location.href)=>url.split('/')[2]//[protocol,_,address]
chant.error=console.error
chant.socket=addr=>new WebSocket('ws://'+addr,'echo-protocol')