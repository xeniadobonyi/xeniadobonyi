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

document.querySelectorAll('.flower').forEach(flower => {
    const randomLeft = Math.random() * 100; // Random horizontal position (0% to 100%)
    const randomDelay = Math.random() * 10; // Random animation delay (0s to 10s)
    const randomDuration = Math.random() * 20 + 20; // Random fall duration (20s to 40s)

    flower.style.left = `${randomLeft}%`;
    flower.style.animationDelay = `${randomDelay}s`;
    flower.querySelector('.inner').style.animationDuration = `${randomDuration}s`;
});


$(document).ready(function() {
	if ($(window)) {
		imgShow('ul#imagesDesktop > ul');
		imagesDestopWidth();
	} 
});