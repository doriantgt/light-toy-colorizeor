const NUM_HUES   = 32;
const SAT_LEVELS = [0, 0.5, 1.0];   // sat index 0 = white, 1 = half, 2 = full
const NUM_SATS   = SAT_LEVELS.length;
const NUM_SLOTS  = 6;

// Default slots: hues 0,6,12,18,24 (red→purple evenly), slot 6 = white (sat=0)
const DEFAULT_SLOTS = [
    { hueIndex:  0, satIndex: 2 },  // red
    { hueIndex:  6, satIndex: 2 },  // yellow
    { hueIndex: 12, satIndex: 2 },  // green
    { hueIndex: 18, satIndex: 2 },  // blue
    { hueIndex: 24, satIndex: 2 },  // purple
    { hueIndex:  0, satIndex: 0 },  // white (sat = 0)
];

class Pallet {
    constructor(name, offsets = [], sats = []) {
        this.name    = name;
        this.colors  = new Array(NUM_SLOTS).fill(null).map(() => ({ r: 0, g: 0, b: 0 }));
        this.hues    = new Array(NUM_SLOTS).fill(0);
        this.sats    = sats.length ? sats : new Array(NUM_SLOTS).fill(0);
        this.offsets = offsets.length ? offsets : new Array(NUM_SLOTS - 1).fill(0);
    }
}

// offsets: hue offsets for slots 2–6 relative to slot 1
// sats:    saturation index for each of the 6 slots
const palletFullHue       = new Pallet('fullHue',       [ 5, 10, 15, 20,  0], [2, 2, 2, 2, 2, 0]);
const palletPastel        = new Pallet('pastel',        [ 5, 10, 15, 20,  0], [1, 1, 1, 1, 1, 0]);
const palletWhiteSecond   = new Pallet('whiteSecond',   [ 0,  5, 10, 15,  0], [2, 0, 2, 2, 2, 0]);
const palletWhiteFirst    = new Pallet('whiteFirst',    [ 5, 10, 15, 20, 16], [0, 2, 2, 2, 2, 0]);
const palletComplementary = new Pallet('complementary', [16,  1, 17, 31,  0], [2, 2, 2, 2, 2, 0]);
const palletTriadic       = new Pallet('triadic',       [11, 21,  1, 12,  0], [2, 2, 2, 2, 2, 0]);
const palletAnalogous     = new Pallet('analogous',     [ 2,  4,  6,  8,  0], [2, 2, 2, 2, 2, 0]);
const palletSplitComp     = new Pallet('splitComp',     [14, 18, 15, 17,  0], [2, 2, 2, 2, 2, 0]);
const palletTetradic      = new Pallet('tetradic',      [ 8, 16, 24,  1,  0], [2, 2, 2, 2, 2, 0]);
const palletMonochromatic = new Pallet('monochromatic', [ 0,  0,  0,  0,  0], [2, 1, 2, 1, 2, 0]);
const palletCustom        = new Pallet('custom');

const PALLETS = [
    palletFullHue, palletPastel, palletWhiteSecond, palletWhiteFirst,
    palletComplementary, palletTriadic, palletAnalogous, palletSplitComp,
    palletTetradic, palletMonochromatic, palletCustom,
];

class ColorWheelPicker {
    constructor(canvasId, size = 300) {
        this.canvas = document.getElementById(canvasId);
        this.ctx    = this.canvas.getContext('2d');
        this.size   = size;
        this.radius = size / 2;

        this.canvas.width  = size;
        this.canvas.height = size;

        this.slots      = DEFAULT_SLOTS.map(s => ({ ...s }));
        this.activeSlot = 0;
        this.isDragging = false;
        this.palletType = palletFullHue;
        this.onChange   = null;

        this._buildWheel();
        this._initEvents();
        this.render();
        this._refreshAllSlots();
        this._highlightActiveSlot();
    }

    // ── Wheel generation ──────────────────────────────────────────────────────

    _buildWheel() {
        this.offscreen        = document.createElement('canvas');
        this.offscreen.width  = this.size;
        this.offscreen.height = this.size;
        const offCtx = this.offscreen.getContext('2d');

        const imageData = offCtx.createImageData(this.size, this.size);
        const data      = imageData.data;
        const hueStep   = 360 / NUM_HUES;

        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                const dx = x - this.radius;
                const dy = y - this.radius;
                const r  = Math.sqrt(dx * dx + dy * dy);

                if (r <= this.radius) {
                    const angleDeg = ((Math.atan2(dy, dx) * 180 / Math.PI)+360) % 360;
                    const hueIdx   = Math.floor(angleDeg / hueStep) % NUM_HUES;
                    const hueDeg   = hueIdx * hueStep;
                    const satIdx   = Math.min(Math.floor((r / this.radius) * NUM_SATS), NUM_SATS - 1);
                    const satVal   = SAT_LEVELS[satIdx];

                    const [R, G, B] = this._hsvToRgb(hueDeg, satVal, 1);
                    const idx = (y * this.size + x) * 4;
                    data[idx]     = R;
                    data[idx + 1] = G;
                    data[idx + 2] = B;
                    data[idx + 3] = 255;
                }
            }
        }

        offCtx.putImageData(imageData, 0, 0);
        this._drawDividers(offCtx);
    }

    _drawDividers(ctx) {
        const cx      = this.radius;
        const cy      = this.radius;
        const hueStep = (2 * Math.PI) / NUM_HUES;

        ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.lineWidth   = 1;

        for (let i = 1; i < NUM_SATS; i++) {
            const r = (i / NUM_SATS) * this.radius;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.stroke();
        }

        for (let i = 0; i < NUM_HUES; i++) {
            const angle = i * hueStep;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + Math.cos(angle) * this.radius, cy + Math.sin(angle) * this.radius);
            ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(cx, cy, this.radius - 0.5, 0, Math.PI * 2);
        ctx.stroke();
    }

    // ── Render ────────────────────────────────────────────────────────────────

    render() {
        this.ctx.clearRect(0, 0, this.size, this.size);
        this.ctx.drawImage(this.offscreen, 0, 0);

        // Draw inactive markers first, active slot drawn last (on top)
        for (let i = 0; i < NUM_SLOTS; i++) {
            if (i !== this.activeSlot) this._drawMarker(i);
        }
        this._drawMarker(this.activeSlot);
    }

    _markerPos(i) {
        const { hueIndex, satIndex } = this.slots[i];
        const hueStep   = (2 * Math.PI) / NUM_HUES;
        const angle     = hueIndex * hueStep + hueStep / 2;
        const ringInner = (satIndex / NUM_SATS) * this.radius;
        const ringOuter = ((satIndex + 1) / NUM_SATS) * this.radius;
        const r         = (ringInner + ringOuter) / 2;
        return {
            x: this.radius + Math.cos(angle) * r,
            y: this.radius + Math.sin(angle) * r,
        };
    }

    _drawMarker(i) {
        const { x, y }            = this._markerPos(i);
        const { hueIndex, satIndex } = this.slots[i];
        const [R, G, B]           = this._slotColor(hueIndex, satIndex);
        const isActive            = i === this.activeSlot;
        const outerR              = isActive ? 20 : 11;
        const innerR              = isActive ? 17 : 9;
        const label               = String(i + 1);

        const color    = `rgb(${R}, ${G}, ${B})`;

        // Black outer ring
        this.ctx.beginPath();
        this.ctx.arc(x, y, outerR, 0, Math.PI * 2);
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.lineWidth   = 3;
        this.ctx.stroke();

        // White filled circle (provides contrast for colored number)
        this.ctx.beginPath();
        this.ctx.arc(x, y, innerR, 0, Math.PI * 2);
        this.ctx.fillStyle   = 'white';
        this.ctx.fill();
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth   = 2;
        this.ctx.stroke();

        // Number — slot color interior, black outer stroke (mirrors the marker ring style)
        const fontSize = isActive ? Math.round(innerR * 1.8) : Math.round(innerR * 1.8 * 1.2);
        this.ctx.font         = `bold ${fontSize}px monospace`;
        this.ctx.textAlign    = 'center';
        this.ctx.textBaseline = 'middle';

        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.lineWidth   = 3;
        this.ctx.strokeText(label, x, y);

        this.ctx.fillStyle = color;
        this.ctx.fillText(label, x, y);
    }

    // ── Event handling ────────────────────────────────────────────────────────

    _initEvents() {
        this.canvas.addEventListener('mousedown', (e) => {
            const hit = this._hitTestMarkers(e);
            if (hit !== -1) {
                this.activeSlot = hit;
                this._highlightActiveSlot();
                this.render();
            } else {
                this._pick(e);
            }
            this.isDragging = true;
        });
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isDragging) this._pick(e);
        });
        window.addEventListener('mouseup', () => {
            this.isDragging = false;
        });

        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const hit = this._hitTestMarkers(e.touches[0]);
            if (hit !== -1) {
                this.activeSlot = hit;
                this._highlightActiveSlot();
                this.render();
            } else {
                this._pick(e.touches[0]);
            }
            this.isDragging = true;
        }, { passive: false });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (this.isDragging) this._pick(e.touches[0]);
        }, { passive: false });
        window.addEventListener('touchend', () => {
            this.isDragging = false;
        });

        // Pallet type radio buttons
        document.querySelectorAll('input[name="palletType"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.palletType = PALLETS.find(p => p.name === e.target.value) ?? palletCustom;
                this._applyPalletType(this.palletType);
            });
        });


    }

    _hitTestMarkers(e) {
        const rect   = this.canvas.getBoundingClientRect();
        const scaleX = this.size / rect.width;
        const scaleY = this.size / rect.height;
        const cx     = (e.clientX - rect.left) * scaleX;
        const cy     = (e.clientY - rect.top)  * scaleY;

        // Check active slot first so it takes priority when overlapping
        const order = [];
        for (let i = 0; i < NUM_SLOTS; i++) {
            if (i !== this.activeSlot) order.push(i);
        }
        order.push(this.activeSlot);

        for (let i = order.length - 1; i >= 0; i--) {
            const slot       = order[i];
            const { x, y }  = this._markerPos(slot);
            const dist       = Math.sqrt((cx - x) ** 2 + (cy - y) ** 2);
            const hitR       = slot === this.activeSlot ? 17 : 11;
            if (dist <= hitR + 4) return slot;
        }
        return -1;
    }

    _pick(e) {
        const rect   = this.canvas.getBoundingClientRect();
        const scaleX = this.size / rect.width;
        const scaleY = this.size / rect.height;

        const x  = (e.clientX - rect.left) * scaleX;
        const y  = (e.clientY - rect.top)  * scaleY;
        const dx = x - this.radius;
        const dy = y - this.radius;
        const r  = Math.sqrt(dx * dx + dy * dy);

        if (r > this.radius) return;

        const angleDeg = ((Math.atan2(dy, dx) * 180 / Math.PI) + 360) % 360;
        this.slots[this.activeSlot] = {
            hueIndex: Math.floor(angleDeg / (360 / NUM_HUES)) % NUM_HUES,
            satIndex: Math.min(Math.floor((r / this.radius) * NUM_SATS), NUM_SATS - 1),
        };

        if (this.palletType.name !== 'custom') {
            const activeOffset = this.activeSlot === 0 ? 0 : this.palletType.offsets[this.activeSlot - 1];
            const baseHue = (this.slots[this.activeSlot].hueIndex - activeOffset + NUM_HUES) % NUM_HUES;
            this._applyPalletType(this.palletType, baseHue);
        } else {
            this.render();
            this._refreshAllSlots();
        }
    }

    // ── Display updates ───────────────────────────────────────────────────────

    _applyPalletType(pallet, baseHue = this.slots[0].hueIndex) {
        if (pallet.name === 'custom') return;

        this.slots[0].hueIndex = baseHue;
        this.slots[0].satIndex = pallet.sats[0];
        for (let i = 1; i < NUM_SLOTS; i++) {
            this.slots[i].hueIndex = (baseHue + pallet.offsets[i - 1]) % NUM_HUES;
            this.slots[i].satIndex = pallet.sats[i];
        }
        this.render();
        this._refreshAllSlots();
    }

    _highlightActiveSlot() {
        for (let i = 0; i < NUM_SLOTS; i++) {
            const el = document.getElementById(`slot-${i}`);
            if (el) el.classList.toggle('active', i === this.activeSlot);
        }
    }

    _refreshAllSlots() {
        for (let i = 0; i < NUM_SLOTS; i++) {
            this._updateSlotDisplay(i);
        }
        if (this.onChange) this.onChange();
    }

    _updateSlotDisplay(i) {
        const { hueIndex, satIndex } = this.slots[i];
        const [R, G, B] = this._slotColor(hueIndex, satIndex);

        const slotEl = document.getElementById(`slot-${i}`);
        if (slotEl) slotEl.style.backgroundColor = `rgb(${R}, ${G}, ${B})`;

        const hueEl = document.getElementById(`hue-${i}`);
        const satEl = document.getElementById(`sat-${i}`);

        const deltaEl = document.getElementById(`delta-${i}`);

        if (i === 0) {
            if (deltaEl) deltaEl.textContent = '';
        } else {
            let diff = ((hueIndex - this.slots[0].hueIndex) + NUM_HUES) % NUM_HUES;
            if (diff > NUM_HUES / 2) diff -= NUM_HUES;
            const sign = diff >= 0 ? '+' : '';
            if (deltaEl) deltaEl.textContent = `${sign}${diff}`;
        }
        if (hueEl) hueEl.textContent = `hue: ${hueIndex}`;
        if (satEl) satEl.textContent = `sat: ${satIndex}`;
    }

    // ── Colour helpers ────────────────────────────────────────────────────────

    _slotColor(hueIndex, satIndex) {
        return this._hsvToRgb(hueIndex * (360 / NUM_HUES), SAT_LEVELS[satIndex], 1);
    }

    _hsvToRgb(h, s, v) {
        const i = Math.floor(h / 60) % 6;
        const f = (h / 60) - Math.floor(h / 60);
        const p = v * (1 - s);
        const q = v * (1 - f * s);
        const t = v * (1 - (1 - f) * s);

        let r, g, b;
        switch (i) {
            case 0: r = v; g = t; b = p; break;
            case 1: r = q; g = v; b = p; break;
            case 2: r = p; g = v; b = t; break;
            case 3: r = p; g = q; b = v; break;
            case 4: r = t; g = p; b = v; break;
            case 5: r = v; g = p; b = q; break;
        }

        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }
}

var colorWheelPicker;
function _initColorWheelPicker() {
    colorWheelPicker = new ColorWheelPicker('wheelCanvas', 300);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _initColorWheelPicker);
} else {
    _initColorWheelPicker();
}
