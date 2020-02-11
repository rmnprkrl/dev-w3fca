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

$(document).ready(function() {
	$('.jsSliderGoTo').click(function() {
		let sliderIndex = $(this).data('slider') - 1;
		slider.goTo(sliderIndex);
		let index = slider.getInfo().index;
		$('.jsSliderGoTo.jsActive').removeClass('active');
		$('.jsSliderGoTo.jsActive')
			.eq(index)
			.addClass('active');
	});

	$('.jsSliderGoToA').click(function() {
		let sliderIndex = $(this).data('slider') - 1;
		sliderA.goTo(sliderIndex);
		let index = sliderA.getInfo().index;
		$('.jsSliderGoToA.jsActive').removeClass('active');
		$('.jsSliderGoToA.jsActive')
			.eq(index)
			.addClass('active');
	});

	$('.jsGetConvertedAddress').click(function() {
		slider.goTo(0);
		sliderInnerPolkadotJsPlugin.goTo(10);
	});
});

window.onload = function() {
	let hash = window.location.hash.replace('#', '');
	if (hash == 'get-converted-address') {
		$.smoothScroll({
			scrollTarget: '#wallet-create'
		});
		slider.goTo(0);
		sliderInnerPolkadotJsPlugin.goTo(10);
	}
};
