// ============================================================
// ==================== HSV PALETTE SETUP ====================
// ============================================================

const PALETTE_COUNT = 6;
const rgb           = [];

function updateColor() {
    const picker = colorWheelPicker;
    if (!picker) return;

    for (let i = 0; i < PALETTE_COUNT; i++) {
        const { hueIndex, satIndex } = picker.slots[i];
        const [r, g, b]              = picker._slotColor(hueIndex, satIndex);
        rgb[i] = { r, g, b };
    }

    if (typeof gradienter0 !== 'undefined') {
        [gradienter0, gradienter1, gradienter2].forEach(g => g.refreshPaletteColors());
    }
}

updateColor();


// ============================================================
// ==================== IMAGE PROCESSING =====================
// ============================================================

function scale8bit(input, scaler255) {
    return (input * scaler255) >> 8;
}

const image       = new Image();
image.crossOrigin = 'Anonymous';

const imageSelect = document.getElementById('imageSelect');

function loadSelectedImage() {
    image.src = imageSelect.value;
}

loadSelectedImage();

var globalWidth  = 'not ready';
var globalHeight = 'not ready';

const canvas = [];
const ctx    = [];

for (let i = 0; i < 2; i++) {
    canvas[i] = document.getElementById('canvas' + i);
    ctx[i]    = canvas[i].getContext('2d');
}

canvas[2] = document.getElementById('canvas2'); // scan canvas
ctx[2]    = canvas[2].getContext('2d');
canvas[3] = document.getElementById('canvas3'); // scan + gradient overlay
ctx[3]    = canvas[3].getContext('2d');

image.onload = () => {
    const targetHeight = 300;
    const targetWidth  = Math.round(image.naturalWidth * (targetHeight / image.naturalHeight));

    for (let i = 0; i < 2; i++) {
        canvas[i].width  = targetWidth;
        canvas[i].height = targetHeight;
        ctx[i].drawImage(image, 0, 0, targetWidth, targetHeight);
    }

    globalWidth  = targetWidth;
    globalHeight = targetHeight;

    // Resize gradient canvases to match image for per-pixel channel mapping
    [gradienter0, gradienter1, gradienter2].forEach(g => {
        g.canvas.width  = targetWidth;
        g.canvas.height = targetHeight;
        const canvasContainer = g.canvas.closest('.canvas-container');
        canvasContainer.style.width  = targetWidth  + 'px';
        canvasContainer.style.height = targetHeight + 'px';
        g.drawGradient();
    });

    processImage(canvas[0], canvas[1]);

    canvas[2].width  = targetWidth;
    canvas[2].height = targetHeight;
    canvas[3].width  = targetWidth;
    canvas[3].height = targetHeight;
    startScanAnimation(canvas[1], canvas[2], canvas[3]);

    // Wire color picker changes to re-run the full image pipeline
    if (colorWheelPicker) {
        colorWheelPicker.onChange = () => {
            updateColor();
            processImage(canvas[0], canvas[1]);
        };
    }
};


// ============================================================
// ==================== PALETTE MAPPING ======================
// ============================================================

// Map each RGB channel of srcCanvas through its respective gradient and write to dstCanvas.
function processImage(srcCanvas, dstCanvas) {
    redrawWithPallet(srcCanvas, dstCanvas);
}

// Per-pixel palette mapping: R → gradient 0, G → gradient 1, B → gradient 2.
function redrawWithPallet(srcCanvas, dstCanvas) {
    const srcCtx = srcCanvas.getContext('2d');
    const dstCtx = dstCanvas.getContext('2d');
    const w      = srcCanvas.width;
    const h      = srcCanvas.height;

    const srcData  = srcCtx.getImageData(0, 0, w, h).data;
    const palImage = dstCtx.createImageData(w, h);
    const palData  = palImage.data;

    for (let i = 0; i < palData.length; i += 4) {
        palData[i + 0] = 0;
        palData[i + 1] = 0;
        palData[i + 2] = 0;
        palData[i + 3] = 255;
    }

    const grad0 = gradienter0.ctx.getImageData(0, 0, gradienter0.canvas.width, gradienter0.canvas.height).data;
    const grad1 = gradienter1.ctx.getImageData(0, 0, gradienter1.canvas.width, gradienter1.canvas.height).data;
    const grad2 = gradienter2.ctx.getImageData(0, 0, gradienter2.canvas.width, gradienter2.canvas.height).data;

    for (let p = 0; p < srcData.length; p += 4) {
        // R channel → gradient 0
        palData[p + 0] += scale8bit(grad0[p + 0], srcData[p + 0]);
        palData[p + 1] += scale8bit(grad0[p + 1], srcData[p + 0]);
        palData[p + 2] += scale8bit(grad0[p + 2], srcData[p + 0]);

        // G channel → gradient 1
        palData[p + 0] += scale8bit(grad1[p + 0], srcData[p + 1]);
        palData[p + 1] += scale8bit(grad1[p + 1], srcData[p + 1]);
        palData[p + 2] += scale8bit(grad1[p + 2], srcData[p + 1]);

        // B channel → gradient 2
        palData[p + 0] += scale8bit(grad2[p + 0], srcData[p + 2]);
        palData[p + 1] += scale8bit(grad2[p + 1], srcData[p + 2]);
        palData[p + 2] += scale8bit(grad2[p + 2], srcData[p + 2]);
    }

    dstCtx.putImageData(palImage, 0, 0);
}

// Unused — kept as reference: removes red/blue from left half, green/blue from right half.
const removeRed2 = (srcCanvas, dstCanvas) => {
    const srcCtx  = srcCanvas.getContext('2d');
    const dstCtx  = dstCanvas.getContext('2d');
    const w       = srcCanvas.width;
    const imageData = srcCtx.getImageData(0, 0, w, srcCanvas.height);
    const data      = imageData.data;
    const rowSize   = w * 4;

    for (let j = 0; j < data.length; j += rowSize) {
        for (let i = 0; i < w * 4; i += 4) {
            if (i < w * 2) {
                data[j + i + 0] = 0;
                data[j + i + 2] = 0;
            } else {
                data[j + i + 1] = 0;
                data[j + i + 2] = 0;
            }
        }
    }

    dstCtx.putImageData(imageData, 0, 0);
};

// Unused — kept as reference: copies srcCanvas to dstCanvas with a black gradient overlay.
function applyGradientOverlay(srcCanvas, dstCanvas) {
    const srcCtx  = srcCanvas.getContext('2d');
    const dstCtx  = dstCanvas.getContext('2d');
    const imageData = srcCtx.getImageData(0, 0, srcCanvas.width, srcCanvas.height);

    dstCtx.putImageData(imageData, 0, 0);

    const grad = dstCtx.createLinearGradient(0, 0, dstCanvas.width, 0);
    grad.addColorStop(0.00, 'rgba(0, 0, 0, 1.0)');
    grad.addColorStop(0.49, 'rgba(0, 0, 0, 1.0)');
    grad.addColorStop(0.50, 'rgba(0, 0, 0, 0.1)');
    grad.addColorStop(0.60, 'rgba(0, 0, 0, 0.7)');
    grad.addColorStop(1.00, 'rgba(0, 0, 0, 1.0)');

    dstCtx.fillStyle = grad;
    dstCtx.fillRect(0, 0, dstCanvas.width, dstCanvas.height);
}


// ============================================================
// ================== SCAN ANIMATION =========================
// ============================================================

let scanX      = 0;
let scanStep   = 5;
let scanAnimId = null;
let scanCycle  = 0;

const scanStepSlider = document.getElementById('scanStepSlider');
const scanStepValue  = document.getElementById('scanStepValue');

scanStepSlider.addEventListener('input', (e) => {
    scanStep                  = parseInt(e.target.value);
    scanStepValue.textContent = scanStep;
});

// Copies scanStep columns per frame from srcCanvas to dstCanvas, left to right.
// If overlayCanvas is provided, also draws a moving gradient overlay onto it.
function scanFrame(srcCanvas, dstCanvas, overlayCanvas = null) {
    const srcCtx = srcCanvas.getContext('2d');
    const dstCtx = dstCanvas.getContext('2d');
    const w      = srcCanvas.width;
    const h      = srcCanvas.height;

    const cols    = Math.min(scanStep, w - scanX);
    const colData = srcCtx.getImageData(scanX, 0, cols, h);
    dstCtx.putImageData(colData, scanX, 0);

    scanX += cols;

    if (scanX >= w) {
        scanX = 0;
        scanCycle++;
    } else if (scanX < 0) {
        scanX = w - 1;
    }

    if (overlayCanvas) {
        // Gradient is 2× image width; right edge advances over 2 full scan cycles.
        const gradientX = (scanCycle % 2) * w + scanX;
        drawScanGradientOverlay(dstCanvas, overlayCanvas, gradientX);
    }

    scanAnimId = requestAnimationFrame(() => scanFrame(srcCanvas, dstCanvas, overlayCanvas));
}

function startScanAnimation(srcCanvas, dstCanvas, overlayCanvas = null) {
    if (scanAnimId) cancelAnimationFrame(scanAnimId);
    scanX     = 0;
    scanCycle = 0;
    dstCanvas.getContext('2d').clearRect(0, 0, dstCanvas.width, dstCanvas.height);
    scanAnimId = requestAnimationFrame(() => scanFrame(srcCanvas, dstCanvas, overlayCanvas));
}

// Copies srcCanvas onto dstCanvas, then draws two moving gradient bands on top.
// The right edge of each band follows x (the scan head position).
// Gradient: transparent on the right, fades to black on the left, 2× image width wide,
// with a duplicate offset by 2× image width for a seamless repeating pattern.
function drawScanGradientOverlay(srcCanvas, dstCanvas, x) {
    const srcCtx = srcCanvas.getContext('2d');
    const dstCtx = dstCanvas.getContext('2d');
    const w      = srcCanvas.width;
    const h      = srcCanvas.height;

    dstCtx.putImageData(srcCtx.getImageData(0, 0, w, h), 0, 0);

    // Band 1: right edge at x
    drawGradientBand(dstCtx, x - w * 2, x, w, h);
    // Band 2: duplicate one full 2× width to the right
    drawGradientBand(dstCtx, x, x + w * 2, w, h);
}

// Draws a black-to-transparent gradient band from xLeft to xRight, clipped to canvas bounds.
function drawGradientBand(ctx, xLeft, xRight, canvasW, canvasH) {
    const clipL = Math.max(0, xLeft);
    const clipR = Math.min(canvasW, xRight);
    if (clipR <= clipL) return;

    const grad = ctx.createLinearGradient(xLeft, 0, xRight, 0);
    grad.addColorStop(0.00, 'rgba(0, 0, 0, 1.0)');
    grad.addColorStop(0.50, 'rgba(0, 0, 0, 1.0)');
    grad.addColorStop(0.75, 'rgba(0, 0, 0, 0.8)');
    grad.addColorStop(0.90, 'rgba(0, 0, 0, 0.3)');
    grad.addColorStop(1.00, 'rgba(0, 0, 0, 0.0)');

    ctx.save();
    ctx.beginPath();
    ctx.rect(clipL, 0, clipR - clipL, canvasH);
    ctx.clip();
    ctx.fillStyle = grad;
    ctx.fillRect(clipL, 0, clipR - clipL, canvasH);
    ctx.restore();
}
