module.exports = {
	addClassVerified: (id) => {
		let element, name, arr;
		element = document.getElementById(id);
		name = 'verified';
		arr = element.className.split(' ');
		if (arr.indexOf(name) == -1) {
			element.className += ' ' + name;
		}
	},

	removeClassVerified: (id) => {
		let element = document.getElementById(id);
		element.className = element.className.replace(/\bverified\b/g, '');
	},

	addClassWaiting: (id) => {
		let element, name, arr;
		element = document.getElementById(id);
		name = 'waiting';
		arr = element.className.split(' ');
		if (arr.indexOf(name) == -1) {
			element.className += ' ' + name;
		}
	},

	removeClassWaiting: (id) => {
		let element = document.getElementById(id);
		element.className = element.className.replace(/\bwaiting\b/g, '');
	}
};


