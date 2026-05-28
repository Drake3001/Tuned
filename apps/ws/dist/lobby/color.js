const D65 = [95.047, 100.0, 108.883];
function srgbChannelToLinear(c) {
    const n = c / 255;
    return n <= 0.04045 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);
}
function srgbToLinear(rgb) {
    return [srgbChannelToLinear(rgb[0]), srgbChannelToLinear(rgb[1]), srgbChannelToLinear(rgb[2])];
}
function linearToXyz(lin) {
    const [r, g, b] = lin;
    return [
        (r * 0.4124564 + g * 0.3575761 + b * 0.1804375) * 100,
        (r * 0.2126729 + g * 0.7151522 + b * 0.072175) * 100,
        (r * 0.0193339 + g * 0.119192 + b * 0.9503041) * 100,
    ];
}
function fLab(t) {
    const eps = 216 / 24389;
    const k = 24389 / 27;
    return t > eps ? Math.cbrt(t) : (k * t + 16) / 116;
}
function xyzToLab(xyz) {
    const fx = fLab(xyz[0] / D65[0]);
    const fy = fLab(xyz[1] / D65[1]);
    const fz = fLab(xyz[2] / D65[2]);
    return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}
export function rgbToLab(rgb) {
    return xyzToLab(linearToXyz(srgbToLinear(rgb)));
}
const deg = (rad) => (rad * 180) / Math.PI;
const rad = (degVal) => (degVal * Math.PI) / 180;
function hueAngle(b, ap) {
    if (b === 0 && ap === 0)
        return 0;
    const angle = deg(Math.atan2(b, ap));
    return angle >= 0 ? angle : angle + 360;
}
export function ciede2000(lab1, lab2) {
    const [L1, a1, b1] = lab1;
    const [L2, a2, b2] = lab2;
    const C1 = Math.hypot(a1, b1);
    const C2 = Math.hypot(a2, b2);
    const Cbar = (C1 + C2) / 2;
    const G = 0.5 * (1 - Math.sqrt(Math.pow(Cbar, 7) / (Math.pow(Cbar, 7) + Math.pow(25, 7))));
    const a1p = (1 + G) * a1;
    const a2p = (1 + G) * a2;
    const C1p = Math.hypot(a1p, b1);
    const C2p = Math.hypot(a2p, b2);
    const h1p = hueAngle(b1, a1p);
    const h2p = hueAngle(b2, a2p);
    const dLp = L2 - L1;
    const dCp = C2p - C1p;
    let dhp;
    if (C1p * C2p === 0) {
        dhp = 0;
    }
    else {
        const diff = h2p - h1p;
        if (Math.abs(diff) <= 180)
            dhp = diff;
        else if (diff > 180)
            dhp = diff - 360;
        else
            dhp = diff + 360;
    }
    const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(rad(dhp) / 2);
    const Lbarp = (L1 + L2) / 2;
    const Cbarp = (C1p + C2p) / 2;
    let hbarp;
    if (C1p * C2p === 0) {
        hbarp = h1p + h2p;
    }
    else if (Math.abs(h1p - h2p) <= 180) {
        hbarp = (h1p + h2p) / 2;
    }
    else if (h1p + h2p < 360) {
        hbarp = (h1p + h2p + 360) / 2;
    }
    else {
        hbarp = (h1p + h2p - 360) / 2;
    }
    const T = 1 -
        0.17 * Math.cos(rad(hbarp - 30)) +
        0.24 * Math.cos(rad(2 * hbarp)) +
        0.32 * Math.cos(rad(3 * hbarp + 6)) -
        0.2 * Math.cos(rad(4 * hbarp - 63));
    const dTheta = 30 * Math.exp(-Math.pow((hbarp - 275) / 25, 2));
    const Rc = 2 * Math.sqrt(Math.pow(Cbarp, 7) / (Math.pow(Cbarp, 7) + Math.pow(25, 7)));
    const Sl = 1 + (0.015 * Math.pow(Lbarp - 50, 2)) / Math.sqrt(20 + Math.pow(Lbarp - 50, 2));
    const Sc = 1 + 0.045 * Cbarp;
    const Sh = 1 + 0.015 * Cbarp * T;
    const Rt = -Math.sin(rad(2 * dTheta)) * Rc;
    const kL = 1;
    const kC = 1;
    const kH = 1;
    return Math.sqrt(Math.pow(dLp / (kL * Sl), 2) +
        Math.pow(dCp / (kC * Sc), 2) +
        Math.pow(dHp / (kH * Sh), 2) +
        Rt * (dCp / (kC * Sc)) * (dHp / (kH * Sh)));
}
export function deltaE(rgb1, rgb2) {
    return ciede2000(rgbToLab(rgb1), rgbToLab(rgb2));
}
export function rgbToHsb(rgb) {
    const r = rgb[0] / 255;
    const g = rgb[1] / 255;
    const b = rgb[2] / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    const v = max;
    const s = max === 0 ? 0 : d / max;
    if (d === 0)
        return { hue: 0, saturation: s, brightness: v };
    let h;
    switch (max) {
        case r:
            h = (g - b) / d + (g < b ? 6 : 0);
            break;
        case g:
            h = (b - r) / d + 2;
            break;
        default:
            h = (r - g) / d + 4;
    }
    return { hue: h * 60, saturation: s, brightness: v };
}
//# sourceMappingURL=color.js.map