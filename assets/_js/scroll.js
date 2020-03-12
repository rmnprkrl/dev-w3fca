import 'jquery-smooth-scroll';

let hash = window.location.hash.replace('#', '');

$(document).ready(function() {
	if (hash) {
		$.smoothScroll({
			scrollTarget: '#' + hash
		});
	}

	$('a').smoothScroll();

	$('.jsGoToAnchor').on('click', function() {
		let anchor = $(this).data('anchor');
		$.smoothScroll({
			scrollTarget: anchor
		});
		return false;
	});
});
