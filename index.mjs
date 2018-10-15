const {assign}=Object
export default async function chant(from=chant.address())
{
	const
	receive=(cb,{data})=>cb(assign(JSON.parse(data),{from})),
	socket=chant.socket(from),
	{data,err}=await new Promise(function(res,rej)
	{
		assign(socket,{onerror:rej,onmessage:evt=>receive(res,evt)})
	})
	.then(data=>({data}))
	.catch(err=>({err}))

	if(err) return chant.error(err)

	return {state:data.value,send:function(update)
	{
		assign(socket,{onmessage:evt=>receive(update,evt)})
		return function(act)
		{
			if(act.from!==from) socket.send(JSON.stringify(act))
			return act
		}
	}}
}
chant.address=(url=location.href)=>url.split('/')[2]//[protocol,_,address]
chant.error=console.error
chant.socket=addr=>new WebSocket('ws://'+addr,'echo-protocol')