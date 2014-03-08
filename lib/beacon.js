munin.sendBeacon = function (uid) {
	beacon = new Image();
	beacon.src = 'http://localhost:8888/beacon?uid=' + uid;
};