export default function chant(updater,from=chant.address())
{
	const {err,send}=await new Promise(function(res,rej)
	{
		const
		socket=chant.socket(from),
		{send}=socket

		socket.onopen=function()
		{
			socket.onerror=console.error
			//@todo if get:'', then it needs to set everything
			socket.onmessage=({data})=>updater(Object.assign(JSON.parse(data),{from}))
			send(`{"type":"get"}`)
			res({send})
		}
		socket.onerror=err=>rej({err})
	})

	return err?chant.error(err):function(act)
	{
		if(act.from!==from) send(JSON.stringify(act))
		return act
	}
}
chant.address=(url=location.href)=>url.split('/')[2]//[protocol,_,address]
chant.error=console.error
chant.socket=addr=>new WebSocket('ws://'+addr,'echo-protocol')
chant.truth=truth