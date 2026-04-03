class Gradienter {
    constructor(number) {
		
		
        // Get canvas and context
		this.container = document.querySelector('#container'+number);
		this.canvas = this.container.querySelector('#gradientCanvas');
		//this.canvas = document.querySelector('#gradientCanvas');
        this.canvas = this.container.querySelector('#gradientCanvas');
        this.ctx = this.canvas.getContext('2d');

        if (typeof transferWidth !== 'undefined') {
            this.canvas.width = transferWidth;
            this.canvas.height = transferHeight;
            console.log(" transfered" + transferWidth);
        }

        // Animation variables
        this.animationId = null;
        this.offset = 0;
        this.rotation = 0;
        this.rotateDirection = 1;
        this.slideDirection = 1; // 1 for left to right, -1 for right to left
        this.slideSpeed = 5;
        this.rotationSpeed = 5;

        this.animationType = 'slide'; // 'slide', 'rotate', 'both'
        
        this.slideChecked = false; //animationtypes
        this.rotateChecked = false;
        this.rainbowChecked = false;

        this.virticleChecked = false;  //gradient types
        this.horizontalChecked = true;
        this.diagnolChecked = false;
        this.radialChecked = false;

        // Rotation center variables
        this.rotationCenter = { x: this.canvas.width / 2, y: this.canvas.height / 2 };
        this.rotationCenterMode = 'center';
        this.mouseX = this.canvas.width / 2;
        this.mouseY = this.canvas.height / 2;
        
        // Default colors
        this.startColor = '#0000ff';
        this.middleColor = '#2fff00';
        this.endColor = '#0000ff';
        this.colorCount = 2; // 2 = wrap first color to end, 3 = full three colors
        this.onUpdate = null; // optional callback fired after every drawGradient
        this.startPalette  = -1; // palette index assigned to each slot (-1 = none)
        this.middlePalette = -1;
        this.endPalette    = -1;

        this.startColorInput = this.container.querySelector('#startColor');
        this.middleColorInput = this.container.querySelector('#middleColor');
        this.endColorInput = this.container.querySelector('#endColor');
        this.middleColorContainer = this.container.querySelector('#middleColorContainer');
        this.endColorContainer = this.container.querySelector('#endColorContainer');
        
        // Speed slider
        this.slideSpeedSlider = this.container.querySelector('#slideSpeedSlider');
        this.slideSpeedValue = this.container.querySelector('#slideSpeedValue');
        
        this.rotationSpeedSlider = this.container.querySelector('#rotateSpeedSlider');
        this.rotationSpeedValue = this.container.querySelector('#rotateSpeedValue');
        this.stretchSlider = this.container.querySelector('#stretchSlider');
        this.stretchValue  = this.container.querySelector('#stretchValue');
        this.stretchFactor = 1;

        this.initEventListeners();
        this.drawGradient();
        
        // Clean up animation on page unload
        window.addEventListener('beforeunload', () => {
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
            }
        });
    }

    initEventListeners() {
        // Speed slider event listeners
        this.slideSpeedSlider.addEventListener('input', (e) => {
            this.slideSpeed = parseInt(e.target.value);
            this.slideSpeedValue.textContent = this.slideSpeed;
        });
        
        this.rotationSpeedSlider.addEventListener('input', (e) => {
            this.rotationSpeed = parseInt(e.target.value);
            this.rotationSpeedValue.textContent = this.rotationSpeed;
        });

        this.stretchSlider.addEventListener('input', (e) => {
            this.stretchFactor = parseFloat(e.target.value);
            this.stretchValue.textContent = this.stretchFactor.toFixed(1);
            this.drawGradient();
        });
        
        this.container.querySelector('#colorCountSelect').addEventListener('change', (e) => {
            this.setColorCount(e.target.value);
        });
        
        // Mouse move handler for follow mode
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            
            this.mouseX = (e.clientX - rect.left) * scaleX;
            this.mouseY = (e.clientY - rect.top) * scaleY;
            
            if (this.rotationCenterMode === 'mouse') {
                this.rotationCenter = { x: this.mouseX, y: this.mouseY };
            }
        });
    }

    setGradientType(type) {
        this.container.querySelector('#horizontalChecked').checked = false;
        this.container.querySelector('#virticleChecked').checked = false;
        this.container.querySelector('#diagnolChecked').checked = false;
        this.container.querySelector('#radialChecked').checked = false;

        this.container.querySelector(`#${type}`).checked = true;
        this.horizontalChecked = this.container.querySelector('#horizontalChecked').checked;
        this.virticleChecked   = this.container.querySelector('#virticleChecked').checked;
        this.diagnolChecked    = this.container.querySelector('#diagnolChecked').checked;
        this.radialChecked     = this.container.querySelector('#radialChecked').checked;

        this.drawGradient();
    }

    // Function to set animation type
    setAnimationType(type) {
        this.animationType = type;
        console.log(type);
        
        this.slideChecked = this.container.querySelector('#slideChecked').checked;
        this.rotateChecked = this.container.querySelector('#rotateChecked').checked;
        
        if (this.slideChecked || this.rotateChecked) {
            this.startAnimation();
        } else {
            this.stopAnimation();
        }

        // Show/hide rotation controls
        const rotationControl = this.container.querySelector('#rotationControl');
        if (this.rotateChecked) {
            rotationControl.style.display = 'flex';
        } else {
            rotationControl.style.display = 'none';
        }
        
        // Reset and redraw
        this.resetGradient();
        this.updateStatus();
    }

    // Function to set rotation center
    setRotationCenter(mode) {
        this.rotationCenterMode = mode;
        
        switch(mode) {
            case 'center':
                this.rotationCenter = { x: this.canvas.width / 2, y: this.canvas.height / 2 };
                break;
            case 'mouse':
                this.rotationCenter = { x: this.mouseX, y: this.mouseY };
                break;
            case 'random':
                this.rotationCenter = {
                    x: Math.random() * this.canvas.width,
                    y: Math.random() * this.canvas.height
                };
                break;
        }
        
        this.drawGradient();
    }

    // Function to parse hex color to RGB
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    // Function to draw gradient with rotation
    drawGradient() {
        let width = this.canvas.width;
        let height = this.canvas.height;
        
        const diagnol = Math.sqrt((height * height) + (width * width));
        let halfDiagnolOffset = (diagnol - height) / 2;
        
        if (this.virticleChecked) {
            halfDiagnolOffset = (diagnol - width) / 2;
        }
        
        const gradW = width  * this.stretchFactor;
        const gradH = height * this.stretchFactor;

        let gradient;
        if (this.radialChecked) {
            const cx = width / 2, cy = height / 2;
            gradient = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.sqrt(cx * cx + cy * cy) * this.stretchFactor);
        } else if (this.virticleChecked) {
            gradient = this.ctx.createLinearGradient(0, 0, 0, gradH);
        } else {
            gradient = this.ctx.createLinearGradient(0, 0, gradW, 0);
        }
        
        if (this.rainbowChecked) {
            for (let i = 0; i < 20; i++) {
                let hue = i * 18;
                gradient.addColorStop(i * .05, `hsl(${hue} 100% 50%)`);
            }
        } else if (this.colorCount === 1) {
            gradient.addColorStop(0, this.startColor);
            gradient.addColorStop(1, this.startColor);
        } else if (this.colorCount === 2) {
            gradient.addColorStop(0, this.startColor);
            gradient.addColorStop(0.5, this.middleColor);
            gradient.addColorStop(1, this.startColor);
        } else {
            gradient.addColorStop(0, this.startColor);
            gradient.addColorStop(0.333, this.middleColor);
            gradient.addColorStop(0.667, this.endColor);
            gradient.addColorStop(1, this.startColor);
        }
        
        this.ctx.fillStyle = gradient;

        // Clear canvas
        this.ctx.resetTransform();
        this.ctx.clearRect(0, 0, width, height);

        if (this.rotateChecked) {
            // Pure rotation - create a gradient and rotate it
            this.ctx.translate(this.rotationCenter.x, this.rotationCenter.y);
            this.ctx.rotate(this.rotation * Math.PI / 180);
            this.ctx.translate(-this.rotationCenter.x, -this.rotationCenter.y);

            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, -halfDiagnolOffset, gradW, diagnol);
        }

        if (this.horizontalChecked) {
            if (this.slideChecked) {
                this.ctx.translate(-this.offset, 0);
            }
            const hTiles = Math.ceil(width / gradW) + 2;
            this.ctx.translate(-gradW, 0);
            for (let i = 0; i <= hTiles; i++) {
                this.ctx.translate(+gradW, 0);
                this.ctx.fillRect(0, -halfDiagnolOffset, gradW, diagnol);
            }
        } else if (this.virticleChecked) {
            if (this.slideChecked) {
                this.ctx.translate(0, -this.offset);
            }
            const vTiles = Math.ceil(height / gradH) + 2;
            this.ctx.translate(0, -gradH);
            for (let i = 0; i <= vTiles; i++) {
                this.ctx.translate(0, +gradH);
                this.ctx.fillRect(-halfDiagnolOffset, 0, diagnol, gradH);
            }
        } else if (this.radialChecked) {
            this.ctx.fillRect(0, 0, width, height);
        }

        if (this.onUpdate) this.onUpdate();
    }

    // Animation function
    animate() {
        // Update based on animation type
        if (this.slideChecked) {
            const dim = this.virticleChecked ? this.canvas.height : this.canvas.width;
            const gradDim = dim * this.stretchFactor;
            this.offset = (this.offset + this.slideSpeed * this.slideDirection + gradDim) % gradDim;
        }
        
        if (this.rotateChecked) {
            this.rotation = (this.rotation + this.rotationSpeed * this.rotateDirection % 360);
        }
        
        // Update rotation center if needed
        if (this.rotationCenterMode === 'random' && (this.animationType === 'rotate' || this.animationType === 'both')) {
            this.rotationCenter = {
                x: (this.rotationCenter.x + Math.random() * 4 - 2 + this.canvas.width) % this.canvas.width,
                y: (this.rotationCenter.y + Math.random() * 4 - 2 + this.canvas.height) % this.canvas.height
            };
        }
        
        // Draw the gradient
        this.drawGradient();
        
        // Request next frame
        this.animationId = requestAnimationFrame(() => this.animate());
        
        // Update status
        this.updateStatus();
    }

    // Update status display
    updateStatus() {
        let typeText = 'whatever';
        let directionText = '';
        
        if (this.slideChecked) {
            directionText += this.slideDirection === 1 ? 'Left to Right' : 'Right to Left';
        }
        if (this.rotateChecked) {
            directionText += this.rotateDirection === 1 ? 'Clockwise' : 'Counter-clockwise';
        }
        
        let centerText = '';
        if (this.rotateChecked) {
            centerText = ` | Center: ${this.rotationCenterMode}`;
        }
        
        this.container.querySelector('#animationStatus').innerHTML = 
            `Animation: ${this.animationId ? 'Running' : 'Stopped'} | Type: ${typeText} | Direction: ${directionText}${centerText}`;
    }

    // Update direction button text
    updateDirectionButton() {
        // Function body kept empty as in original
    }

    // Start animation
    startAnimation() {
        if (!this.animationId) {
            this.animate();
        }
    }

    // Stop animation
    stopAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
            this.updateStatus();
        }
    }

    // Reset gradient to starting position
    resetGradient() {
        this.offset = 0;
        this.rotation = 0;
        if (this.rotationCenterMode === 'center') {
            this.rotationCenter = { x: this.canvas.width / 2, y: this.canvas.height / 2 };
        }
        this.drawGradient();
    }

    // Toggle animation direction
    toggleSlideDirection() {
        this.slideDirection *= -1;
        this.updateDirectionButton();
        this.updateStatus();
    }

    toggleRotateDirection() {
        this.rotateDirection *= -1;
        this.updateDirectionButton();
        this.updateStatus();
    }

    setColorCount(count) {
        if (count === 'rainbow') {
            this.rainbowChecked = true;
            this.colorCount = 0;
            this.middleColorContainer.style.display = 'none';
            this.endColorContainer.style.display = 'none';
        } else {
            this.rainbowChecked = false;
            this.colorCount = parseInt(count);
            const show3 = this.colorCount === 3;
            this.middleColorContainer.style.display = (this.colorCount >= 2) ? '' : 'none';
            this.endColorContainer.style.display = show3 ? '' : 'none';
        }
        this.drawGradient();
    }

    rgbToHex(rgbStr) {
        const m = rgbStr.match(/\d+/g);
        if (!m) return '#000000';
        return '#' + m.slice(0, 3).map(v => parseInt(v).toString(16).padStart(2, '0')).join('');
    }

    refreshPaletteColors() {
        ['start', 'middle', 'end'].forEach(slot => {
            const idx = this[slot + 'Palette'];
            if (idx >= 0) this.setPaletteColor(slot, String(idx));
        });
    }

    setPaletteColor(slot, paletteIndex) {
        if (paletteIndex === '-1') return;
        this[slot + 'Palette'] = parseInt(paletteIndex);
        const idx     = parseInt(paletteIndex);
        const { r, g, b } = (typeof rgb !== 'undefined' && rgb[idx]) ? rgb[idx] : { r: 0, g: 0, b: 0 };
        const hex     = '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');

        const selectMap = { start: '#startColorSelect', middle: '#middleColorSelect', end: '#endColorSelect' };
        this.container.querySelector(selectMap[slot]).value = paletteIndex;

        if (slot === 'start') {
            this.startColor = hex;
            this.startColorInput.value = hex;
        } else if (slot === 'middle') {
            this.middleColor = hex;
            this.middleColorInput.value = hex;
        } else if (slot === 'end') {
            this.endColor = hex;
            this.endColorInput.value = hex;
        }
        this.drawGradient();
    }

}

// Initialize the gradienter when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.gradienter0 = new Gradienter(0);
    window.gradienter1 = new Gradienter(1);
    window.gradienter2 = new Gradienter(2);

    // Default palette assignments
    window.gradienter0.setPaletteColor('start',  '0');
    window.gradienter0.setPaletteColor('middle', '1');
    window.gradienter1.setPaletteColor('start',  '2');
    window.gradienter1.setPaletteColor('middle', '5');
    window.gradienter1.setPaletteColor('end',    '0');
    window.gradienter2.setColorCount(1);
    window.gradienter2.setPaletteColor('start', '4');

    // Redraw processed image whenever any gradient updates (only once image is loaded)
    const triggerRedraw = () => { if (typeof globalWidth !== 'undefined' && globalWidth !== 'not ready') processImage(canvas[0], canvas[1]); };
    window.gradienter0.onUpdate = triggerRedraw;
    window.gradienter1.onUpdate = triggerRedraw;
    window.gradienter2.onUpdate = triggerRedraw;

});