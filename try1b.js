
/*
const canvas0 = document.getElementById("canvas0");
const ctx0 = canvas0.getContext("2d");

const img = new Image();

img.src = "https://raw.githubusercontent.com/doriantgt/IMAGES/refs/heads/main/RHINO.png";

img.crossOrigin = "Anonymous";


img.addEventListener("load", () => {
  ctx0.drawImage(img, 0, 0,300,227);
  //img.style.display = "none";
});







const hoveredColor = document.getElementById("hovered-color");
const selectedColor = document.getElementById("selected-color");

const pick = (event, destination) => {
  const bounding = canvas0.getBoundingClientRect();
  const x = event.clientX - bounding.left;
  const y = event.clientY - bounding.top;
  const pixel = ctx0.getImageData(x, y, 1, 1);
  const data = pixel.data;

  const rgbColor = `rgb(${data[0]} ${data[1]} ${data[2]} / ${data[3] / 255})`;
  destination.style.background = rgbColor;
  destination.textContent = rgbColor;

  return rgbColor;
};

canvas0.addEventListener("mousemove", (event) => pick(event, hoveredColor));
canvas0.addEventListener("click", (event) => pick(event, selectedColor));

	/*
		const hueSlider ;
        const satSlider ;
        const valSlider;
        const hueValue ;
        const satValue ;
        const valValue ;
        const colorPreview;
        const rgbValues;
	*/	
		 hueSlider = [];
         satSlider = [];
         valSlider = [];
         hueValue =  [];
         satValue = [];
         valValue = [];
         colorPreview =  [];
         rgbValues = [];
		
	
        // Get DOM elements
		for (let i = 0; i < 4; i++) {
		 hueSlider[i] = document.getElementById('hue-slider'+i);
         satSlider[i] = document.getElementById('sat-slider'+i);
         valSlider[i] = document.getElementById('val-slider'+i);
         hueValue[i] = document.getElementById('hue-value'+i);
         satValue[i] = document.getElementById('sat-value'+i);
         valValue[i] = document.getElementById('val-value'+i);
         colorPreview[i] = document.getElementById('color-preview'+i);
         rgbValues[i] = document.getElementById('rgb-values'+i);

        // Update color preview when sliders change
	}
		 hsv = [new HSV(1,1,1)];
             rgb = [HSVtoRGB255(hsv[0])];
        function updateColor() {
		/*
            const hsv = {
                h: parseInt(hueSlider.value),
                s: parseInt(satSlider.value),
                v: parseInt(valSlider.value)
            };
            */
		

			for (let i = 0; i < 4; i++) {
			 hsv[i] = new HSV(parseInt(hueSlider[i].value),parseInt(satSlider[i].value), parseInt(valSlider[i].value));
            //const rgb = hsv2rgb_rainbowFROMFASTLEDWITH_ADJUSTMENT(hsv);
			//		console.log('hue-slider'+1);
		//	console.log(hueSlider[1]);

			rgb[i] = HSVtoRGB255(hsv[i]);
            // Update slider value displays
		
            hueValue[i].textContent = hsv[i].h;
            satValue[i].textContent = hsv[i].s;
            valValue[i].textContent = hsv[i].v;
            
            // Update color preview
            colorPreview[i].style.backgroundColor = `rgb(${rgb[i].r}, ${rgb[i].g}, ${rgb[i].b})`;
            
            // Update RGB values display
            rgbValues[i].textContent = `RGB: (${rgb[i].r}, ${rgb[i].g}, ${rgb[i].b})`;
        

        // Add event listeners to sliders
        hueSlider[i].addEventListener('input', updateColor);
        satSlider[i].addEventListener('input', updateColor);
        valSlider[i].addEventListener('input', updateColor);
		}
		}
        // Initial update
        updateColor();
	

	function scale8bit( input, scaler255){
		
		return (input*scaler255)>>8;
	}
	
	const image = new Image();
//image.src = "https://raw.githubusercontent.com/doriantgt/IMAGES/refs/heads/main/RHINO.png";
image.src = "https://raw.githubusercontent.com/doriantgt/IMAGES/refs/heads/main/smiley2.png";

//image.src = 'RHINO.jpg';

image.crossOrigin = "Anonymous";

var globalWidth= "not ready";
var globalHeight= "not ready";

let canvas=[];
let ctx =[];
for(let i=0; i<3; i++){
 canvas[i] = document.getElementById("canvas"+i);
 ctx[i] = canvas[i].getContext("2d");

}
 //canvas[1] = document.getElementById("canvas1");
// ctx[1] = canvas[1].getContext("2d");

// canvas[2] = document.getElementById("canvas2");
// ctx[2] = canvas[2].getContext("2d");

let imageDimensionsMultiplier = 3;

image.onload = () => {
  image.width*=imageDimensionsMultiplier;
  image.height*=imageDimensionsMultiplier
  
	for(let i=0; i<3; i++){
	
			canvas[i].width= image.width;
			canvas[i].height= image.height;
			ctx[i].drawImage(image, 0, 0,  image.width, image.height);
		}
	 /* const elements = document.querySelectorAll('.imageDimensions');
			elements.forEach(element => {
				 element.style.height = image.naturalHeight;
				element.style.width = image.naturalWidth;
				element.style.height = image.width;
				element.style.width = image.height;
			});*/
	  
    globalWidth = image.width;
    globalHeight =image.height;
	
	/*
	console.log("should have transfereed" + transferWidth);
	const para = document.createElement("iframe");
             para.src = "gradientAnimation2DS.html";
			 para.width ="50%";
			 para.height = "100%";
             document.body.appendChild(para);
			 */
		//  ctx[0].drawImage(image, 0, 0,  image.width*imageDimensionsMultiplier,  image.height*imageDimensionsMultiplier);
		  redrawWithPallet();
		  removeGB();
	};




const redrawWithPallet = () => {
  let imageData = ctx[0].getImageData(0, 0, canvas[0].width, canvas[0].height);
  let data = imageData.data;
  let palImage = ctx[0].getImageData(0, 0, canvas[0].width, canvas[0].height);//ctx2.createImageData(cavas1.width, cavas1.height);
  palImageData = palImage.data;
  
  
  
  
   for (let i = 0; i < palImageData.length; i+=4) {
    palImageData[i] = 0; // remove red color from each pixel
    palImageData[i+1] = 0; // remove green color from each pixel
    palImageData[i+2] = 0; // remove blue color from each pixel
    palImageData[i+3] = 255; // keep alpha color from each pixel
  }
  
  
  let rowSize=canvas[0].width*4;
  for (let j = 0; j < data.length; j+=rowSize) {
  for (let i = 0; i < canvas[0].width*4; i += 4) {
  pixel = [0,0,0];
  
    palImageData[j+i+0] +=  scale8bit( rgb[0].r , data[j+i+0]);
     palImageData[j+i+1] +=  scale8bit( rgb[0].g , data[j+i+0]);
    palImageData[j+i+2] +=  scale8bit( rgb[0].b , data[j+i+0]);
  
   palImageData[j+i+0] +=  scale8bit( rgb[1].r , data[j+i+1]);
     palImageData[j+i+1] +=  scale8bit( rgb[1].g , data[j+i+1]);
    palImageData[j+i+2] +=  scale8bit( rgb[1].b , data[j+i+1]);
	
	palImageData[j+i+0] +=  scale8bit( rgb[2].r , data[j+i+2]);
     palImageData[j+i+1] +=  scale8bit( rgb[2].g , data[j+i+2]);
    palImageData[j+i+2] +=  scale8bit( rgb[2].b , data[j+i+2]);

	//data[i+3] = 30;
  }}
  
  ctx[1].putImageData(palImage, 0, 0);
  //colsole.read();
    //ctx2.drawImage(image, 0, 0, canvas2.width, canvas2.height);
	removeGB();
};

const removeRed2 = () => {
  let imageData = ctx[0].getImageData(0, 0, canvas[0].width, canvas[0].height);
  let data = imageData.data;
  
  let rowSize=canvas[0].width*4;
  for (let j = 0; j < data.length; j+=rowSize) {
  for (let i = 0; i < canvas[0].width*4; i += 4) {
  if(i < canvas[0].width*2){
    data[j+i+0] = 0; // remove red color from each pixel
	data[j+i+2] = 0; // remove red color from each pixel
  }else{
    data[j+i+1] = 0; // remove red color from each pixel
	data[j+i+2] = 0; // remove red color from each pixel
  }
  

	//data[i+3] = 30;
  }}
  
  ctx[1].putImageData(imageData, 0, 0);
  //colsole.read();
    //ctx2.drawImage(image, 0, 0, canvas2.width, canvas2.height);
};

const removeGB = () => {
  const imageData = ctx[1].getImageData(0, 0, canvas[0].width, canvas[0].height);
 // let data = new img();
  let data = imageData.data;//pass by reference
 // console.log(data);
  for (let i = 0; i < data.length; i += 4) {
    //data[i+1] = 0; // remove red color from each pixel
	//data[i+2] = 0; // remove red color from each pixel

	//data[i+3] = 30;
  }
  ctx[2].putImageData(imageData, 0, 0);
  
    const gradient = ctx[2].createLinearGradient(0, 0, canvas[2].width, 0);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');    // Transparent
   
   gradient.addColorStop(.49, 'rgba(0, 0, 0, 1)');    // Transparent
  gradient.addColorStop(0.5, 'rgba(0, 0,  0, .1)'); // Opaque red
    gradient.addColorStop(.6, 'rgba(0, 0, 0, .7)');    // Transparent

  gradient.addColorStop(1, 'rgba(0, 0, 0, 1)');    // Transparent
  
  ctx[2].fillStyle = gradient;
 // ctx3.rotate(20 * Math.PI / 180);
  ctx[2].fillRect(0, 0, canvas[0].width, canvas[0].height);
  //colsole.read();
    //ctx2.drawImage(image, 0, 0, canvas2.width, canvas2.height);

 for (let i = 0; i < 4; i++) {
 hueSlider[i].addEventListener('input', redrawWithPallet);
 satSlider[i].addEventListener('input', redrawWithPallet);
 valSlider[i].addEventListener('input', redrawWithPallet);
 }
};


//console.log("sending " + transferHeight);
