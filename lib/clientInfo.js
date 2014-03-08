munin.clientInfo  = function () {
	
	var navigator	= window.navigator,
		client		= {
			lang	: navigator.language,
			cookies : navigator.cookieEnabled,
			plugins	: [],
			vendor	: navigator.vendor,
			platform: navigator.platform
		},
		beacon, i;

	for (i = 0, l = navigator.plugins.length; i < l; i++) {
		client.plugins.push(navigator.plugins[i].name);
	}

	return client;
};