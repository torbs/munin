(function () {
	
	munin.loadSocket(function (success) {
		if (success) {
			var socket = io.connect('http://localhost:8888'),
				client = munin.clientInfo();
			
			client.uid = munin.cookies.getItem('muninId');

			munin.fingerprint(function (fp) {
				if (!client.uid) {
					client.uid = fp + '-' + (+new Date());
					munin.cookies.setItem('muninId', client.uid);
				}
				
				munin.sendBeacon(client.uid);
				socket.emit('client info', client, function (data) {
					console.log(data);
				});
			});
			
		}
	});
}());