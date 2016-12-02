// timeline scrubber for video thumbnails
(function ( $ ) {
    
    $.fn.scrubber = function( options, sprites, timings ) {
    	sprites = sprites || {};
    	timings = timings || {};

    	// default values for configurable options 
    	var defaults = {
            spriteURL: 'img/sprite_178x129_54.jpg',
            thumbWidth: 178,
            thumbHeight: 129,
            numImages: 54,
            duration: 3456,
            offset: 478
        };

        var settings = $.extend( {}, defaults, options );

        // for each element in the page that should be a scrubber, we return the following magic
		return this.each(function(i) {
			// the scrubber element, this, is $('.scrub-link span')
			var thumbBox = $(this),
			    thumb = thumbBox.find('img'),
			    thumbId = thumb.attr('id'),
			    hLink = thumbBox.parent(),
			    // all your video thumbs should have an id for the piece of content they represent
			    contentId = $(this).attr('id').replace('t-',''),
			    spriteImgSrc = !$.isEmptyObject(sprites) ? sprites[i].url : settings.spriteURL,
			    duration = !$.isEmptyObject(timings) ? timings[i].duration : settings.duration,
			    // thumbOffset is the value for the default thumb being shown (if supplied) and startOffset 
			    // is the value updated by scrubbing, used to set the start time on the video that will be 
			    // played when the thumb is clicked
			    thumbOffset = !$.isEmptyObject(timings) ? timings[i].offset : settings.offset,
			    startOffset = thumbOffset,
			    loaderImgStr = '<span class="sprite-loading-overlay" id="li-'+contentId+'"></span>',
			    initialLink = hLink.attr('href'),
			    // all of these will get set below
			    loaderImg = null,
		    	timeBox = {},
    			timeBoxBody = {},
    			arrow = {},
    			timedot = {},
    			timeline = {},
    			initLoadTimeOut = null,
    			scrubTimeOut = null;

	    	thumb.attr('class','i0'); // initial class for the sprite's loading status. See initScrubImage() below for details

			// fractions of seconds throw off the video playback on the system for which this was 
			// originally built; hence, we smooth things out a bit. It's not exact but it works well visually
			var durIntervals  = Math.floor(duration/settings.numImages),
				timelineValue = Math.round(thumbOffset/durIntervals);

			var prepScrubbing = function() {
			    // we add a little bit of delay so that mousing across a screen full of
			    // thumbnails doesn't kick off a whole bunch of loader and sprite requests
			    initLoadTimeOut = window.setTimeout(initScrubImage, 500);
			};

			var initScrubImage = function() {
			    // class is the loading sprite status.
				// class === 'i0', loading has not been initiated
				// class === 'i1', loading has been initiated
				// class === 'i2', loading is completed (gets set in the callback for the image load immediately below this function)
			    if(thumb.attr('class') !== 'i0') {
					// anything other than i0 means this thumb has been scrubbed. If so, nothing to load
					return;
				}

    			thumb.attr('class','i1');

    			// show loading image
    			if(!$('#li-'+ contentId).length) {
    			    thumbBox.append(loaderImgStr);
    			    loaderImg = $('#li-'+ contentId);
    			}
    			hideScrubElements();
    			loaderImg.show();

    			// update source from representative thumbnail to scrubbable sprite
    			thumb.attr('src',spriteImgSrc);
			};


			// once the scrubbable sprite is loaded, it's time to show the timeline and timebox, and enable scrubbing action
			thumb.on('load', (function(e) {
				if(thumb.attr('class') === 'i1'){
					thumb.attr('class','i2'); // loading has completed

					// hide image loader
					$(loaderImg).hide();
					// position sprite to initial timeline value
					thumb.css("top",'-'+(timelineValue === 0 ? 0 : (timelineValue * settings.thumbHeight)) + 'px');
					// make sure this timeout has been cleared for this element 
					if(initLoadTimeOut != null) clearTimeout(initLoadTimeOut);

					// we no longer want these fucntions to be called on any future mouseover of this thumb
					thumbBox.unbind('mouseover', prepScrubbing);
					thumbBox.unbind('mouseover', initScrubElements);

					// show timeline and time position on it
					showScrubElements();

					// bind the user action (moving the mouse across the thumb) to showing the elements and scrubbing through the scene
					thumbBox.mousemove(function(e){
					    showScrubElements();
					    scrubThumb(e);
					});
			    }
			}));


			// scrubbing action across thumb
			var scrubThumb = function(e) {
			    // don't hide the time pill while we're scrubbing
			    clearTimeout(scrubTimeOut);

    			var uiValue = Math.floor( (e.pageX - thumb.offset().left) / ( settings.thumbWidth / (settings.numImages - 1) ) );
    				
				if(uiValue < 0) {
					uiValue = 0;
				}

				// multiply the number of the scene grab we are on by the height of the thumb to get the css position of the background sprite
				var idx = uiValue,
					ypos = (idx * settings.thumbHeight);
				// set the background position
				thumb.css("top",'-'+ypos+'px');

				// update the startOffset in the link so the video can be played from that time on click
				startOffset = durIntervals * uiValue;
   				hLink.attr("href", initialLink+'/'+startOffset);
   				// update the time as we scrub
    			timeBoxBody.text(formatScrubTime(durIntervals * uiValue));

    			// set the position of the timebox, arrow and dot to move with the mouse
    			var timeboxPosition = Math.floor((e.pageX - thumb.offset().left)-(timeBox.width()/2)),
    				arrowPosition = Math.floor((timeboxPosition + (timeBox.width()/2)) -2);
    			
    			// set some upper and lower boundaries and make some display tweaks to keep it pretty
    			if(timeboxPosition < -3) {
    				timeboxPosition = -3;
    			}
    			if(arrowPosition < 0) {
    				arrowPosition = 0;
    			}
    			if(arrowPosition > (settings.thumbWidth-11)) {
    				arrowPosition = (settings.thumbWidth-11);
    			}
    			
				if((timeBoxBody.text().length <= 4 && uiValue > 48) || (timeBoxBody.text().length > 4 && uiValue > 47)) {
					timeBox.css({left:'',right:'2px'});
				} else {
					timeBox.css({left:timeboxPosition+'px',right:''});
				}

				// set the position
    			arrow.css({left:arrowPosition+'px',right:''});
    			timedot.css({left:(arrowPosition + 3)+'px',right:''});

    			// if the user stops moving the mouse and neither the timebox nor the 
    			// arrow is where the mouse is hovering, get the timebox out of the way
    			if(timeBox.filter(':hover').length === 0 && arrow.filter(':hover').length === 0) {
    				scrubTimeOut = window.setTimeout(hideTimePill, 600);
    			}
			};

			// again, these are floored to prevent fractional seconds, and pinpoint accuracy is not the goal
			var formatScrubTime = function(secs) {
				var hours = Math.floor(secs/3600);
				if(hours < 1) {
				    hours = '';
				}
				var minutes = Math.floor((secs / 60) % 60);
				if(hours >= 1) {
				    if(minutes < 10) {
				        minutes = ":0"+minutes;
				    } else {
				        minutes = ":"+minutes;
				    }
				}
				var seconds = secs % 60;
				if(seconds < 10) {
					seconds = "0"+seconds;
				}

				return hours+minutes+":"+seconds;
			};

			// this only gets called the first time the scrub process is kicked off
			var initScrubElements = function() {
			    // add these elements by request to save on what was already a heavy page without them;
			    // if none of the thumbs are scrubbed, the user never has to wait for these to be drawn
			    var scrubElStr = '<span class="timebox" id="tb'+thumbId+'">\
	                  <span class="timebox-body" id="tbb'+thumbId+'">'+duration+'</span>\
	                  <span class="timebox-cap"></span>\
	                </span>\
	                <span class="arrow" id="a'+thumbId+'"></span>\
	                <span class="timedot" id="td'+thumbId+'"></span>\
	                <span class="timeline" id="tl'+thumbId+'"></span>';

			    thumbBox.append(scrubElStr);

			    timeBox = $('#tb'+thumbId),
	    		timeBoxBody = $('#tbb'+thumbId),
	    		arrow = $('#a'+thumbId),
	    		timedot = $('#td'+thumbId),
	    		timeline = $('#tl'+thumbId);

	            // add init class so we know the elements have been drawn and we don't call this function again
	            thumbBox.addClass('init');

	            // default start positions, in case the offset is 0
	            var tbStartPos = -3,
	                arrowStartPos = 0;
				    
			    // give the timebox the initial offset time and position the elements to it
			    timeBoxBody.text(formatScrubTime(thumbOffset));
    			tbStartPos = Math.floor((timelineValue*3)-(timeBox.width()/2));
    			arrowStartPos = Math.floor((tbStartPos + (timeBox.width()/2)) -2);

    			// smooth things out if initial values are outside of visual boundaries
    			if(tbStartPos < -3) tbStartPos = -3;
    			if(arrowStartPos < 0) arrowStartPos = 0;
    			if(arrowStartPos > (settings.thumbWidth-11)) arrowStartPos = (settings.thumbWidth-11);

    			if((timeBoxBody.text().length <= 4 && timelineValue > 48) || (timeBoxBody.text().length > 4 && timelineValue > 47)) {
    				timeBox.css("right",'2px');
    				arrow.css("right",Math.floor((timeBox.width()/2)-5)+'px');
    				timedot.css("right",Math.floor((timeBox.width()/2)-2)+'px');
    			} else {
    				timeBox.css("left",tbStartPos+'px');
    				arrow.css("left",arrowStartPos+'px');
    				timedot.css("left",(arrowStartPos+3)+'px');
    			}

    			// add the initial offset to the link 
   				hLink.attr('href', initialLink+'/'+thumbOffset);

   				if(thumb.attr('class') === 'i0') showScrubElements();
			};

			// these next 2 are self-explanatory
			var showScrubElements = function() {
    			timeBox.show();
    			arrow.show();
    			timedot.show();
    			timeline.show();
			};

			var hideTimePill = function() {
				timeBox.hide();
				arrow.hide();
			};

			var hideScrubElements = function() {
				// cancel the initial load timeout if the mouseout was very quick; again, mousing across a screen
	    		// full of thmumbnails ideally shouldn't kick off a whole bunch of loader and sprite requests
				clearTimeout(initLoadTimeOut);
				if(timeline.length){
				    timeBox.hide();
				    arrow.hide();
				    timedot.hide();
				    timeline.hide();
				}
			};

			// here's where it all starts: mousing over the thumbnail
			thumbBox.mouseover(function(){
			    if(!$(this).hasClass('init')) {
			        initScrubElements();
			    } else {
			    	showScrubElements();
			    }
			    prepScrubbing();
			});

			// on mouseout, hide everything but leave the sprite placement as-is
			thumbBox.mouseout(function(){
				hideScrubElements();
			});

		});
	};

}( jQuery ));