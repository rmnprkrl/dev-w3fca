'use strict';

require('expose-loader?$!jquery');
import AOS from 'aos';
import 'bootstrap';
import ClipboardJS from 'clipboard/dist/clipboard.js';

AOS.init({
	duration: 1100,
	once: true,
	disable: false,
	startEvent: 'load'
});

document.addEventListener('aos:in:step-checker', ({ detail }) => {
	setTimeout(function() {
		document
			.querySelector('.process-overview-line-progress')
			.classList.add('visible');
	}, 1200);
});

const clipboard = new ClipboardJS('.btn-clipboard');

clipboard.on('success', function(e) {
	let buttonText = e.trigger.children[1];
	buttonText.innerHTML = 'Copied';

	setTimeout(function() {
		buttonText.innerHTML = 'Copy';
		if (document.activeElement != document.body) document.activeElement.blur();
	}, 600);

	e.clearSelection();
});

import './scroll.js';
import './slider.js';
import './header.js';
