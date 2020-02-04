/* eslint-disable object-curly-spacing */
/* eslint-disable comma-dangle */
/* eslint-disable no-undef */
/* eslint-disable no-unused-labels */

'use strict';

import AOS from 'aos';
// import ClipboardJS from 'clipboard';

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

// let clipboard = new ClipboardJS('.btn-clipboard');

// clipboard.on('success', function(e) {
// 	let console = console;
// 	console.info('Action:', e.action);
// 	console.info('Text:', e.text);
// 	console.log('Trigger:', e.trigger);
// 	e.clearSelection();
// });

import './scroll.js';
import './slider.js';
import './header.js';
import './faq.js';
