class Gradienter {
    constructor(number) {
		
		
        // Get canvas and context
		this.container = document.querySelector('#container'+number);
		this.number = number;
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
        this.slideSpeed = 0;
        this.rotationSpeed = 0;

   
        this.rainbowChecked = false;

        this.linearChecked = true;
        this.radialChecked = false;

        // Rotation center variables
        this.rotationCenter = { x: this.canvas.width / 2, y: this.canvas.height / 2 };
        this.rotationCenterMode = 'center';
        this.mouseX = this.canvas.width / 2;
        this.mouseY = this.canvas.height / 2;
        
        this.colorCount   = 2; // number of distinct gradient stops (1–3); 0 = rainbow
        this.onUpdate     = null; // optional callback fired after every drawGradient
        this.colorSelections = []; // ordered list of checked palette slot indices
        
        // Speed slider
        this.slideSpeedSlider = this.container.querySelector('#slideSpeedSlider');
        this.slideSpeedValue = this.container.querySelector('#slideSpeedValue');
        
        this.rotationSpeedSlider = this.container.querySelector('#rotateSpeedSlider');
        this.rotationSpeedValue = this.container.querySelector('#rotateSpeedValue');
        this.stretchSlider = this.container.querySelector('#stretchSlider');
        this.stretchValue  = this.container.querySelector('#stretchValue');
        this.stretchFactor = 1;
        this.slidePhaseSlider  = this.container.querySelector('#slidePhaseSlider');
        this.slidePhaseValue   = this.container.querySelector('#slidePhaseValue');
        this.rotatePhaseSlider = this.container.querySelector('#rotatePhaseSlider');
        this.rotatePhaseValue  = this.container.querySelector('#rotatePhaseValue');

        this.initEventListeners();
        this.drawGradient();
        this.startAnimation();

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

        this.container.querySelector('#slideSpeedResetBtn').addEventListener('click', () => {
            this.slideSpeed                  = 0;
            this.slideSpeedSlider.value      = 0;
            this.slideSpeedValue.textContent = 0;
        });

        this.container.querySelector('#rotateSpeedResetBtn').addEventListener('click', () => {
            this.rotationSpeed                    = 0;
            this.rotationSpeedSlider.value        = 0;
            this.rotationSpeedValue.textContent   = 0;
        });

        this.stretchSlider.addEventListener('input', (e) => {
            this.stretchFactor = parseFloat(e.target.value);
            this.stretchValue.textContent = this.stretchFactor.toFixed(1);
            this.drawGradient();
        });

        if (this.slidePhaseSlider) {
            this.slidePhaseSlider.addEventListener('input', (e) => {
                const pct     = parseInt(e.target.value) / 360;
                const dim     = this.virticleChecked ? this.canvas.height : this.canvas.width;
                this.offset   = pct * dim * this.stretchFactor;
                this.slidePhaseValue.textContent = e.target.value;
                this.drawGradient();
            });
        }

        if (this.rotatePhaseSlider) {
            this.rotatePhaseSlider.addEventListener('input', (e) => {
                this.rotation = parseInt(e.target.value);
                this.rotatePhaseValue.textContent = this.rotation;
                this.drawGradient();
            });
        }

        const slideSnapBtn = this.container.querySelector('#slidePhaseSnapBtn');
        if (slideSnapBtn) {
            slideSnapBtn.addEventListener('click', () => {
                const snapped = Math.round(parseInt(this.slidePhaseSlider.value) / 45) * 45 % 360;
                this.slidePhaseSlider.value      = snapped;
                this.slidePhaseValue.textContent = snapped;
                const pct   = snapped / 360;
                const dim   = this.virticleChecked ? this.canvas.height : this.canvas.width;
                this.offset = pct * dim * this.stretchFactor;
                this.drawGradient();
            });
        }

        const rotateSnapBtn = this.container.querySelector('#rotatePhaseSnapBtn');
        if (rotateSnapBtn) {
            rotateSnapBtn.addEventListener('click', () => {
                const snapped        = Math.round(parseInt(this.rotatePhaseSlider.value) / 45) * 45 % 360;
                this.rotatePhaseSlider.value      = snapped;
                this.rotatePhaseValue.textContent = snapped;
                this.rotation                     = snapped;
                this.drawGradient();
            });
        }

        const colorCountSelect = this.container.querySelector('#colorCountSelect');
        if (colorCountSelect) {
            colorCountSelect.addEventListener('change', (e) => {
                this.setColorCount(e.target.value);
            });
        }

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
        
       
        
        const gradW = width  * this.stretchFactor;
        const gradH = height * this.stretchFactor;

        let gradient;
        if (this.radialChecked) {
            const cx = width / 2, cy = height / 2;
            gradient = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.sqrt(cx * cx + cy * cy) * this.stretchFactor);
        }  else if (this.linearChecked) {
            gradient = this.ctx.createLinearGradient(0, 0, gradW, 0);
        }
        
        if (this.rainbowChecked) {
            for (let i = 0; i < 20; i++) {
                let hue = i * 18;
                gradient.addColorStop(i * .05, `hsl(${hue} 100% 50%)`);
            }
        } else if (this.colorCount > 0) {
            gradient.addColorStop(0, this._slotHex(0));
            for (let i = 1; i < this.colorCount; i++) {
                gradient.addColorStop(i / this.colorCount, this._slotHex(i));
            }
            gradient.addColorStop(1, this._slotHex(0));
        }

        
        
  
        
        this.ctx.fillStyle = gradient;

        // Clear canvas
        this.ctx.resetTransform();
        this.ctx.clearRect(0, 0, width, height);

        // Apply rotation around canvas centre
        this.ctx.translate(width / 2, height / 2);
        this.ctx.rotate(this.rotation * Math.PI / 180);
        this.ctx.translate(-width / 2, -height / 2);

        if (this.linearChecked) {
            this.ctx.translate(-this.offset, 0);
            const extraLeft = Math.ceil(diagnol / gradW);
            const hTiles    = Math.ceil(width / gradW) + 2 + extraLeft;
            this.ctx.translate(-gradW * (1 + extraLeft), 0);
            for (let i = 0; i <= hTiles; i++) {
                this.ctx.translate(+gradW, 0);
                this.ctx.fillRect(0, -halfDiagnolOffset, gradW, diagnol);
            }
        }  else if (this.radialChecked) {
            this.ctx.fillRect(0, 0, width, height);
        }

        if (this.onUpdate) this.onUpdate();
    }

    setGradientType(type) {
        this.linearChecked = (type === 'linearChecked');
        this.radialChecked = (type === 'radialChecked');
        this.drawGradient();
    }

    // Animation function
    animate() {
        const dim     = this.canvas.width;
        const gradDim = Math.max(1, dim * this.stretchFactor);

        this.offset   = ((this.offset + this.slideSpeed) % gradDim + gradDim) % gradDim;
        this.rotation = ((this.rotation + this.rotationSpeed) % 360 + 360) % 360;

        this._syncPhaseSliders();
        this.drawGradient();

        this.animationId = requestAnimationFrame(() => this.animate());
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

    _syncPhaseSliders() {
        if (this.slidePhaseSlider) {
            const dim     = this.virticleChecked ? this.canvas.height : this.canvas.width;
            const gradDim = dim * this.stretchFactor;
            const pct     = gradDim > 0 ? Math.round((this.offset / gradDim) * 360) : 0;
            this.slidePhaseSlider.value      = pct;
            this.slidePhaseValue.textContent = pct;
        }
        if (this.rotatePhaseSlider) {
            const rot = ((Math.round(this.rotation) % 360) + 360) % 360;
            this.rotatePhaseSlider.value      = rot;
            this.rotatePhaseValue.textContent = rot;
        }
    }

    setColorCount(count) {
        if (count === 'rainbow') {
            this.rainbowChecked = true;
            this.colorCount = 0;
        } else {
            this.rainbowChecked = false;
            this.colorCount = parseInt(count);
        }
        this.drawGradient();
    }

    rgbToHex(rgbStr) {
        const m = rgbStr.match(/\d+/g);
        if (!m) return '#000000';
        return '#' + m.slice(0, 3).map(v => parseInt(v).toString(16).padStart(2, '0')).join('');
    }

    refreshPaletteColors() {
        this._updatePaletteColors();
        this._applyColorSelections();
    }

    _slotHex(stopIndex) {
        const palIdx      = this.colorSelections[stopIndex];
        const { r, g, b } = (typeof rgb !== 'undefined' && rgb[palIdx]) ? rgb[palIdx] : { r: 0, g: 0, b: 0 };
        return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
    }

    onPaletteToggle(slotIndex, isChecked) {
        if (isChecked) {
            if (!this.colorSelections.includes(slotIndex)) {
                this.colorSelections.push(slotIndex);
            }
        } else {
            this.colorSelections = this.colorSelections.filter(s => s !== slotIndex);
        }
        this._updatePaletteLabels();
        this._applyColorSelections();
    }

    _updatePaletteLabels() {
        this.container.querySelectorAll(`input[name="paletteSlot${this.number}"]`).forEach(cb => {
            const label    = cb.nextElementSibling;
            const slotIdx  = parseInt(cb.value);
            const orderIdx = this.colorSelections.indexOf(slotIdx);
            label.textContent = orderIdx >= 0 ? String(orderIdx + 1) : '';
        });
    }

    _updatePaletteColors() {
        this.container.querySelectorAll(`input[name="paletteSlot${this.number}"]`).forEach(cb => {
            const slotIdx     = parseInt(cb.value);
            const { r, g, b } = (typeof rgb !== 'undefined' && rgb[slotIdx]) ? rgb[slotIdx] : { r: 60, g: 60, b: 60 };
            const hex         = '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
            const label       = cb.nextElementSibling;
            if (label) label.style.backgroundColor = hex;
        });
    }

    _applyColorSelections() {
        this.colorCount   = this.colorSelections.length;
        this.rainbowChecked = (this.colorCount === 0);
        this._updatePaletteColors();
        this.drawGradient();
    }

    setPaletteSlots(indices) {
        this.colorSelections = [...indices];
        this.container.querySelectorAll(`input[name="paletteSlot${this.number}"]`).forEach(cb => {
            cb.checked = this.colorSelections.includes(parseInt(cb.value));
        });
        this._updatePaletteLabels();
        this._applyColorSelections();
    }

}

// Initialize the gradienter when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.gradienter0 = new Gradienter(0);
    window.gradienter1 = new Gradienter(1);
    window.gradienter2 = new Gradienter(2);

    // Default palette assignments
    window.gradienter0.setPaletteSlots([0]);
    window.gradienter1.setPaletteSlots([1]);
    window.gradienter2.setPaletteSlots([2]);

    // Redraw processed image whenever any gradient updates (only once image is loaded)
    const triggerRedraw = () => { if (typeof globalWidth !== 'undefined' && globalWidth !== 'not ready') processImage(canvas[0], canvas[1]); };
    window.gradienter0.onUpdate = triggerRedraw;
    window.gradienter1.onUpdate = triggerRedraw;
    window.gradienter2.onUpdate = triggerRedraw;

});