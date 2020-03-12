/* eslint-disable no-unused-vars */

import { tns } from 'tiny-slider/src/tiny-slider';

const sliderInnerPolkadotJsPlugin = tns({
	container: '#nested_inner_polkadot_js_plugin',
	mode: 'gallery',
	items: 1,
	nested: 'inner',
	slideBy: 'page',
	speed: 400,
	controls: true,
	nav: true,
	navPosition: 'bottom',
	controlsPosition: 'bottom',
	autoplay: false,
	loop: false,
	lazyload: true,
	autoHeight: false
});

const sliderInnerPolkadotJs = tns({
	container: '#nested_inner_slider_polkadot_js',
	mode: 'gallery',
	items: 1,
	nested: 'inner',
	slideBy: 'page',
	speed: 400,
	controls: true,
	nav: true,
	navPosition: 'bottom',
	controlsPosition: 'bottom',
	autoplay: false,
	loop: false,
	lazyload: true,
	autoHeight: false
});

const slider = tns({
	container: '.slider',
	mode: 'carousel',
	nested: 'outer',
	items: 1,
	slideBy: 'page',
	autoplay: false,
	controls: false,
	nav: false,
	loop: false,
	speed: 600,
	lazyload: true,
	autoHeight: false
});

// sliderA

const sliderInnerMycrypto = tns({
	container: '#nested_inner_mycrypto',
	mode: 'gallery',
	items: 1,
	nested: 'inner',
	slideBy: 'page',
	speed: 400,
	controls: true,
	nav: true,
	navPosition: 'bottom',
	controlsPosition: 'bottom',
	autoplay: false,
	loop: false,
	lazyload: true,
	autoHeight: false
});

const sliderA = tns({
	container: '.sliderA',
	mode: 'carousel',
	nested: 'outer',
	items: 1,
	slideBy: 'page',
	autoplay: false,
	controls: false,
	nav: false,
	loop: false,
	speed: 600,
	lazyload: true,
	autoHeight: false
});

slider.events.on('indexChanged', function() {
	updateSliderNav(slider, 'jsSliderGoTo');
});

sliderA.events.on('indexChanged', function() {
	updateSliderNav(sliderA, 'jsSliderGoToA');
});

const updateSliderNav = (slider, navClass) => {
	let indexCurrent = slider.getInfo().index;
	$('.' + navClass + '.jsActive').removeClass('active');
	$('.' + navClass + '.jsActive')
		.eq(indexCurrent)
		.addClass('active');
};

$(document).ready(function() {
	$('.jsSliderGoTo').click(function() {
		let sliderIndex = $(this).data('slider') - 1;
		slider.goTo(sliderIndex);
	});

	$('.jsSliderGoToA').click(function() {
		let sliderIndex = $(this).data('slider') - 1;
		sliderA.goTo(sliderIndex);
	});
});

document.querySelector('.jsGetConvertedAddress').onclick = function() {
	slider.goTo(0);
	sliderInnerPolkadotJsPlugin.goTo(10);
};

let hash = window.location.hash.replace('#', '');

window.onload = function() {
	if (hash == 'generate-polkadot-address-guide-polkadot_js-plugin') {
		slider.goTo(0);
	}

	if (hash == 'generate-polkadot-address-guide-subkey') {
		slider.goTo(1);
	}

	if (hash == 'generate-polkadot-address-guide-polkadot_js') {
		slider.goTo(2);
	}

	if (hash == 'generate-polkadot-address-guide-coinbase') {
		slider.goTo(3);
	}

	if (
		hash == 'get-converted-address' ||
		hash == 'generate-polkadot-address-guide-polkadot_js-plugin-convert-address'
	) {
		$.smoothScroll({
			scrollTarget: '#generate-polkadot-address-guide'
		});
		slider.goTo(0);
		sliderInnerPolkadotJsPlugin.goTo(10);
	}

	if (hash == 'claim-guide-mycrypto-gas-limit') {
		$.smoothScroll({
			scrollTarget: '#claim-guide'
		});
		sliderA.goTo(0);
		sliderInnerMycrypto.goTo(11);
	}
};
