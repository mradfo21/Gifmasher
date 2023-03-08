// gif loading

var gifplayer;
var gifLoadList = [];
var gifLoadedList = [];
var currentGifLoad =1;
var gifPath = "/gifs/";
var loadedGifs = false;
var currentLoadGif =0;
var currentPlayingGif =0;
var frameChangeTime =0;
var currentFrameChangeTime = Math.random()*10;

var lightingChangeURL = "/lightingchange"

var t =0;


// AUDIO ANALYSIS
var audioContext = null;
var microphone = null;
var analyzer = null;
var bufferLength = null;
var dataArray = null;


// Threshold for detecting a beat
var THRESHOLD = 1.4;
var localthreshold =1.0;

// Minimum time between beats (in miliseconds)
var MIN_INTERVAL = .12;
var BEAT_TIME = 0.0;
// Time of the last detected beat
var previousTime = 0.0;
var currentTime = 0.0;
var deltaTime = 0.0;




/// AUDIO ANALYSIS GRAPH
var canvas =  null;
var canvasContext = null;




document.addEventListener('click', function () {
  // Get audio context

  let select = document.querySelector("#mic-selector");

  // Get the user's microphone
  if (!select){

  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(function (stream) {

	     // Get the list of audio inputs
	    const audioInputs = stream.getAudioTracks();

	    console.log(audioInputs	)

	 // Create a dropdown menu to select the microphone
	    select = document.createElement('select');
		select.setAttribute("id", "mic-selector");

	    audioInputs.forEach(function (input) {
	      const option = document.createElement('option');
	      option.value = input.id;
	      option.text = input.label;
	      select.add(option);
	    });

	    // Add the dropdown menu to the page



	    // Select the desired microphone
	    microphone = audioInputs[0];
   		audioContext = new AudioContext({sampleRate: 48000});
   		microphone = audioContext.createMediaStreamSource(stream);
   		// uncomment this to stop debug playing of the microphone
   		//microphone.connect(audioContext.destination);

		select.classList.add('microphone');

		select.style.display = 'block';
		const settingsPanel = document.querySelector('#controls');
		settingsPanel.appendChild(select);

      console.log("got microphone: "+microphone)
      setupAudioAnalysis();
    })
    .catch(function (error) {
      console.error(error);
    });
	}
});





function setupAudioAnalysis(){

	// Create an analyzer node
	analyzer = audioContext.createAnalyser();
	analyzer.fftSize = 4096;
	analyzer.minDecibels = -60;
	analyzer.maxDecibels = 60;
	// Connect the microphone to the analyzer
	microphone.connect(analyzer);
	// Create a buffer to hold the audio data
	bufferLength = analyzer.frequencyBinCount;
	dataArray = new Uint8Array(bufferLength);

}

function draw() {
  // Clear the canvas
  if (canvasContext!= null && analyzer!= null){
	  canvasContext.clearRect(0, 0, canvas.width, canvas.height);

	  // Get the frequency data

	  // Draw the frequency data
	  for (let i = 0; i < bufferLength; i++) {
	    const value = dataArray[i];
	    const percent = value / 256;
	    const height = canvas.height * percent;
	    const offset = canvas.height - height - 1;
	    const barWidth = canvas.width / bufferLength;
	    canvasContext.fillStyle = 'black';
	    canvasContext.fillRect(i * barWidth, offset, barWidth, height);
	  }
	}

}


function flashBeat(){
  const beatDiv = document.getElementById('beat');  
  beatDiv.classList.add('beatInvisible');
  setTimeout(() => {
    beatDiv.classList.remove('beatInvisible');
  }, 100);
}
function detectBeats() {
  // Get the audio data from the analyzer
  if (analyzer!= null){
  currentTime = Date.now()/1000.0;
  deltaTime = currentTime - previousTime;
  previousTime = currentTime;

  analyzer.getByteTimeDomainData(dataArray);
    // Loop Thresholdough the data and find the peak amplitude
  let maxAmplitude = 0;
	  draw();
	  for (let i = 0; i < bufferLength; i++) {
	    const amplitude = Math.abs(dataArray[i] / 128.0 - 1.0);
	    if (amplitude > maxAmplitude) {
	      maxAmplitude = amplitude;
	    }
  }

	
  	localthreshold -=deltaTime;

   // Check if a beat was detected
  if (maxAmplitude > localthreshold) {
    // A beat was detected!
    //console.log('Beat detected at time', currentTime);
    flashBeat();

    if (BEAT_TIME > getMinInterval()){
	    BEAT_TIME = 0.0;
	    localthreshold = getThreshold();
	    switchGif();    	
    }


  }
   BEAT_TIME+= 1.0*deltaTime;

  // Perform the beat detection algorithm here
  // (see below for an example)
  // Schedule the next beat detection

	}
  requestAnimationFrame(detectBeats);

}








function requestGifList(theUrl)
{
	//console.log("requesting gif url: "+theUrl)
	//console.log("global player: "+gifplayer)
    var request = new XMLHttpRequest();
    request.onreadystatechange = function(){
    	if (request.responseText != undefined && request.responseText.length > 10 && loadedGifs == false){
       		//console.log("ajax request for gifs returned: "+request.responseText.length);
	    	gifListReceived(request.responseText);
	    	loadedGifs = true;
    	}
    }
    request.open( "GET", theUrl); // false for synchronous request
    request.send();

}


function getAverageColor(imageSrc) {
    return new Promise(function(resolve, reject) {
        // Create a canvas element
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');

        // Create an image element
        var image = new Image();
        image.src = imageSrc;

        // Use the onload event to make sure the image is fully loaded before drawing it on the canvas
        image.onload = function() {
            // Set the width and height of the canvas to the same as the image
            canvas.width = image.width;
            canvas.height = image.height;

            // Draw the image on the canvas
            ctx.drawImage(image, 0, 0);

            // Get the ImageData object for the area of the canvas that the image is drawn on
            var imageData = ctx.getImageData(0, 0, image.width, image.height);

            // Get the pixel data from the ImageData object
            var data = imageData.data;

            // Initialize variables to store the sum of the red, green, and blue values
            var r = 0;
            var g = 0;
            var b = 0;

            // Iterate over all the pixels, summing the red, green, and blue values
            for (var i = 0; i < data.length; i += 4) {
                r += data[i];
                g += data[i + 1];
                b += data[i + 2];
            }

            // Calculate the average values by dividing the sums by the number of pixels
            var pixelCount = image.width * image.height;
            r = Math.floor(r / pixelCount);
            g = Math.floor(g / pixelCount);
            b = Math.floor(b / pixelCount);

            // Resolve the Promise with the average color as an object with r, g, and b properties
            resolve({
                r: r,
                g: g,
                b: b
            });
        };

        // Use the onerror event to reject the Promise if there is an error loading the image
        image.onerror = function(error) {
            reject(error);
        };
    });
}


function requestLightingChange(theUrl, red, green, blue)
{
	//console.log("requesting lighting change");
    var request = new XMLHttpRequest();
    request.responseType = 'json';
    request.onload = function() {
    	var response = request.response;
    	//console.log(response);
	};
    request.open('POST', '/lightingchange');
    request.setRequestHeader('Content-Type', 'application/json');
	request.send(JSON.stringify({
	    r: red,
	    g: green,
	    b: blue
	}));

}

function lightingChanedRecieved(data)
{
	//console.log("lighting change: "+data)
}
function gifListReceived(data)
{
	filenames =  (JSON.parse(data).filenames) 
	//console.log("ok got "+filenames.length + " gifs");
	for (var i = 0; i < filenames.length-1; i++){
		//console.log("pushing: "+filenames[i])
		gifLoadList.push(filenames[i]);
	}
	startGifLoad();

}


function startGifLoad(){

	for (var i = 0; i < gifLoadList.length; i++){
		//console.log("loading: "+gifPath+gifLoadList[i])
		setTimeout(function(i){
			loadImage(encodeURI(gifPath+gifLoadList[currentLoadGif]));
			currentLoadGif+=1;
		},i * 100)
	}
}

function loadImage(url){
	var img = new Image();
	img.onload = function(){
		//img.src = this.src;
		gifLoadedList.push(img);
		t+=1;
		//console.log(t);
	}
	img.src = url;
}


function getOppositeColor(rgbColor) {
  // Convert RGB color to HSL
  const r = rgbColor[0] / 255;
  const g = rgbColor[1] / 255;
  const b = rgbColor[2] / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  // Compute opposite hue and convert back to RGB
  const oppositeHue = (h + 0.5) % 1;
  const oppositeRgb = hslToRgb(oppositeHue, s, l);
  return oppositeRgb;
}

function hslToRgb(h, s, l) {
  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}




function switchGif(){

	if ( gifLoadedList.length > 1){


		currentPlayingGif+=1;
		if (currentPlayingGif > gifLoadedList.length-1){
			currentPlayingGif = 0;
		}
		gifplayer.src = gifLoadedList[currentPlayingGif].src;
		//console.log("asking for image data for : " + gifplayer.src);
		

		getAverageColor(gifplayer.src)
	    .then(function(averageColor) {
	    	var oppositeColor = getOppositeColor([averageColor.r,averageColor.g,averageColor.b]);

	    	requestLightingChange(lightingChangeURL, averageColor.r,averageColor.g,averageColor.b)
			//console.log("image color = " +averageColor.r+"," +averageColor.g+"," + averageColor.b)

			var textColor = "rgb(" + oppositeColor[0]*3 + ", " +  oppositeColor[1]*.5 + ", " +  oppositeColor[2]*.5  + ")"; // create an rgb string from the average color
			document.getElementById("gifmasher").style.color = textColor;
			document.getElementById("options").style.color = textColor;
			document.getElementById("footer").style.color = textColor;
      document.getElementById("beat").style.color = textColor;

			var averageColorDiv = document.getElementById('average-color');
	        averageColorDiv.style.backgroundColor = 'rgb('+averageColor.r+','+averageColor.g+','+averageColor.b+')';

	    })
	    .catch(function(error) {
	        console.error(error);
	    });

	}



	//console.log("playing gif: "+currentPlayingGif + " / "+gifLoadedList.length);
}

function getThreshold() {
  const speedSlider = document.getElementById('threshold-slider');
  return speedSlider.value;
}

function getMinInterval() {
  const speedSlider = document.getElementById('min_interval-slider');
  return speedSlider.value;
}





window.onload = function () {



window.addEventListener('mousemove', function(event) {
	const optionsPanel = document.querySelector('.controls-panel');

  // Check the position of the mouse on the x-axis
  const mouseX = event.clientX;
  const screenWidth = window.innerWidth;
  const distanceFromLeft = mouseX / screenWidth;
  //console.log(distanceFromLeft)

  // If the mouse is within 20% of the left edge of the screen, animate the options panel
  if (distanceFromLeft < 0.3) {
    optionsPanel.classList.add('slide-in-left');
    optionsPanel.classList.remove('fade-out');

  } else {

    optionsPanel.classList.remove('slide-in-left');
    optionsPanel.classList.add('fade-out');

  }
});




	canvas = document.getElementById('canvas');
	canvasContext = canvas.getContext('2d');
	// appliction start
	setTimeout(function(){
		gifplayer = document.getElementById("gifplayer");
		console.log("found playet element: "+gifplayer);
	    requestGifList("images");


	}, 2000)	




	detectBeats();



	const thresholdValue = document.getElementById('threshold-value');
	const minIntervalValue = document.getElementById('min_interval-value');

	//update loop
	//switchGif();
	setInterval(function(){
		//console.log("gif progress: "+ gifLoadedList.length +" / "+gifLoadList.length);
		//console.log("frame change time: " +frameChangeTime + "   currentFrameChangeTime:   "+ currentFrameChangeTime);
		if (frameChangeTime > currentFrameChangeTime && gifLoadedList.length > 1){
			
			//console.log("gif change! ");
			currentFrameChangeTime = 5+Math.random()*(20*Math.random());
			frameChangeTime = 0.0;
			//switchGif();
			thresholdValue.textContent = getThreshold();
			minIntervalValue.textContent = getMinInterval();

		}
		frameChangeTime += .1;
		
	},.1)


}




