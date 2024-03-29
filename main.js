function imgShow(imgContainer) {
	let item = $('.link');
	item.click(function(e) {
		let itemClass = $(this).attr('id');
		let txtBase = 'ul#texts > li';
		let imgBase = imgContainer;
		let txt = $(txtBase + '.' + itemClass);
		let img = $( imgBase + '.' + itemClass);
		if ($(this).hasClass('selected')) {
			//UNSELECTED
			$(this).css('padding-left', '22px');
			$(txtBase).hide();
			$(imgBase).hide();
			$(this).removeClass('selected');
		} else {
			//SELECTED
			$('ul#titles > li').css('padding-left', '22px');
			$(this).css('padding-left', '37px');
			$(txtBase).hide();
			$(imgBase).hide();
			$(txt).toggle();
			$(img).show();
			item.removeClass('selected');
			$(this).addClass('selected');
		}
	});
}


function imagesDestopWidth() {
	let titles = $('ul#titles');
	let texts = $('ul#texts');
	let imgDesktop = $('ul#imagesDesktop');
	let width = titles.outerWidth() + texts.outerWidth();
};


$(document).ready(function() {
	if ($(window)) {
		imgShow('ul#imagesDesktop > ul');
		imagesDestopWidth();
	} 
});