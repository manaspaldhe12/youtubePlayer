      // **Taken from the available sourceCode**
      // 2. This code loads the IFrame Player API code asynchronously.
      var tag = document.createElement('script');

      tag.src = "https://www.youtube.com/iframe_api";
      var firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      /* Global variables to track the videolist progress */
      var videoCounter = 0;
      var sectionIndex = 0;
      var thisInstanceData = {};
    
      // **Taken from the available sourceCode**
      // 3. This function creates an <iframe> (and YouTube player)
      //    after the API code downloads.
      var player;
      function onYouTubeIframeAPIReady() {
      	player = new YT.Player('player', {
      		height: '390',
      		width: '640',
          //videoId: 'M7lc1UVf-VE',
          events: {
          	'onReady': onPlayerReady,
          	'onStateChange': onPlayerStateChange
          }
      });
      	// Get the video list.
      	// TODO: Ideally we should get this from backend or some other url
      	// TODO: Remove this: thisInstanceData = JSON.parse(prompt("Please enter the data"));
      }

      // 4. The API will call this function when the video player is ready.
      function onPlayerReady(event) {
      	var player = event.target;
      	playNextVideo(player);
      	player.addEventListener("onStateChange", updateBar);

    }

    /*
    	Plays the next video in the available list 
    */
    function playNextVideo(player) {
    	var data = getPlayList();
    	if (videoCounter >= data['videos'].length) {
    		player.stopVideo();
      		player.clearVideo();
    		return;
    	}
    	var currentId = data['videos'][videoCounter]['videoId'];
    	var start = data['videos'][videoCounter]['segments'][sectionIndex]['start'];
    	var end = data['videos'][videoCounter]['segments'][sectionIndex]['end'];
    	player.cueVideoById({
    		'videoId': currentId,
    		'startSeconds': start, 
    		'endSeconds': end
    	});
    	player.playVideo();
    	updateInfoBox(start, end);
    }

    /*
    	Updates the information displayed at the bottom of the video
    	This adds the video id, length of this segment and the total video length
    */
    function updateInfoBox(start, end) {
    	var data = getPlayList();
    	var infoBox = document.getElementById("extraInfo");
    	var info = "video Id is: " + data['videos'][videoCounter]['videoId'] + "<br>";
    	info = info + "segment is: " + sectionIndex + ". This segment is from " + start + " seconds to " + end + " seconds <br>";
    	// TODO: Add the video title** Looks like Youtube API does not directly support this
    	// So would need to make a url call.
    	infoBox.innerHTML = info;
    }

    /*
		Gets total length of all the segments in the current video
		For example if the current video has three segments:
			5-10
			12-18
			20-22
		then this returns 5+6+2 = 13
		This also adds to the data.video item, the total length so that we do not have to recompute it again
    */
    function getTotalLength(videoCounter, sectionIndex) {
    	var data = getPlayList();
    	if (videoCounter == data['videos'].length) {
    		return;
    	}
    	var currentVid = data['videos'][videoCounter];
    	if (!currentVid.totalLength) {
    		var segments = data['videos'][videoCounter]['segments']
    		var total = 0;
    		for (var i = 0; i < segments.length; i++) {
    			var thisSegment = segments[i];
    			total = total + thisSegment['end'] - thisSegment['start'];
    		}
    		currentVid.totalLength = total;
    	}
    	return currentVid.totalLength;
    }

    /*
		Updates the bar at the bottom of the youtube player of the length of content of this video		
    */
    function updateBar () {
    	if (YT.PlayerState.PLAYING) {
    		var data = getPlayList();
    		if (videoCounter == data['videos'].length) {
    			return;
    		}
    		var start = 0;
    		var end = getTotalLength(videoCounter, sectionIndex);
    		document.getElementById("progressBar").min = start;
    		document.getElementById("progressBar").max = end;

    		var infoBox = document.getElementById("extraInfo");
    		var info = infoBox.innerHTML;
    		if ((info.indexOf("total video length is") == -1) && (player.getDuration() > 0)) {
    			info = info + "total video length is: " + Math.floor(player.getDuration()) + "<br>";
    			infoBox.innerHTML = info;
    		}
    		// compute how much of the video has been played
    		var value = player.getCurrentTime() - data['videos'][videoCounter]['segments'][sectionIndex]['start'];
    		if (!isNaN(value) && (value>=0)) {
    			for (var i = 0; i < sectionIndex; i++){
    				value = value + data['videos'][videoCounter]['segments'][i]['end'] - data['videos'][videoCounter]['segments'][i]['start'];
    			}
    			document.getElementById("progressBar").value = value;
    		}
		    
        // Update the multicolor progress bar
        // Everything not seen is white
        // everything to bee seen is red
        // everything seen is green
        var colors = [];
        var duration = player.getDuration();
        var segments = data['videos'][videoCounter]['segments'];
        var totalPercentage = 0;
        for (var i = 0; i < segments.length; i++) {
          var segment = segments[i];
          if (i > sectionIndex) {
            // not seen
            colors.push({'value': segment['start']*100/duration - totalPercentage, 'barClass':  "yellow"});          
            totalPercentage =  segment['start']*100/duration;
            colors.push({'value': segment['end']*100/duration - totalPercentage, 'barClass':  "red"});
            totalPercentage = segment['end']*100/duration;
          } else if (i == sectionIndex) {
            colors.push({'value': segment['start']*100/duration - totalPercentage, 'barClass':  "yellow"});          
            totalPercentage = segment['start']*100/duration;
            colors.push({'value': player.getCurrentTime()*100/duration - totalPercentage, 'barClass': "green"});
            totalPercentage = player.getCurrentTime()*100/duration;
            colors.push({'value': segment['end']*100/duration - totalPercentage, 'barClass':  "red"});
            totalPercentage = segment['end']*100/duration;
          } else{
            // All seen
            colors.push({'value': segment['start']*100/duration - totalPercentage, 'barClass':  "yellow"});
            totalPercentage = segment['start']*100/duration;
            colors.push({'value': segment['end']*100/duration - totalPercentage, 'barClass':  "green"});
            totalPercentage = segment['end']*100/duration;
          }
        }
        if (totalPercentage < 100){
          colors.push({'value': 100 - totalPercentage, 'barClass': "yellow"});
        }
        $('#plain').multiprogressbar({
          parts:colors
        });

		    // timeout of 200 ms to update the bar after 200 ms;
    		setTimeout(updateBar,200);
    	}
    }

      // 5. The API calls this function when the player's state changes.
      //    The function indicates that when playing a video (state=1),
      //    the player should play for six seconds and then stop.
      var done = false;
      function onPlayerStateChange(event) {
      	onPlayerStateChangeHelper(event.target);
      }

      function onPlayerStateChangeHelper(player) {
      	var data = getPlayList();
      	if (videoCounter >= data['videos'].length) {
      		player.stopVideo();
      		player.clearVideo();
      		return;
      	}
      	var segments = data['videos'][videoCounter]['segments'];
      	var end = data['videos'][videoCounter]['segments'][sectionIndex]['end'];
      	// if this segment has ended?
      	if (player.getCurrentTime && Math.round(player.getCurrentTime()) >= end) {
      		// are all segments done? Then play the next video
      		if (sectionIndex + 1 == segments.length) {
      			videoCounter++;
      			sectionIndex = 0;
      			// TODO: Screen flickering on change of video
      			player.pauseVideo();
	      		//setTimeout(function (){ 
              playNextVideo(player);
              //}, 500);

      		} else {
      			// play the next segment. recheck after the remaining time for next segment or video
      			sectionIndex++;
      			start = data['videos'][videoCounter]['segments'][sectionIndex]['start'];
      			end = data['videos'][videoCounter]['segments'][sectionIndex]['end'];
      			// TODO: Screen flickering if the seekTo position has not been buffered
				player.seekTo(start, true);
      			player.pauseVideo();
      			//setTimeout(function () {
      						player.playVideo();
      						updateInfoBox(start, end) 
      						setTimeout(function() {onPlayerStateChangeHelper(player);}, (end-start+1)*1000);
      			//		}, 500);
      		} 
      	}
     }

      	/*
			Stop the video
      	*/
      	function stopVideo() {
      		player.stopVideo();
      	}

      	/*
			if videoList is available, good, else use default data
      	*/
      	function getPlayList () {
      		if (thisInstanceData && thisInstanceData.videos) {
      			return thisInstanceData
      		}

      		var data = {
      			"videos": [
      				{"videoId": "3RNfaIW5k1g",
      				 "segments": [
      					{"start": 10, "end":15},
      					{"start": 50, "end":53}   			 
      				 ] 
      				},
      				{"videoId": "N5UD9hJzadU",
      				 "segments": [
      					{"start": 1, "end":7},
      					{"start": 17, "end":25}   			 
      				 ] 
      				},
      				{"videoId": "M7INnQGoBkE",
      				 "segments": [
      					{"start": 66, "end":70},
      					{"start": 113, "end":115}   			 
      				 ] 
      				}
      		]
      	}
      	return data;
      }
