/* Oti, drawn in code in a soft 3D emoji style, with a wardrobe.
   window.otiSVG(look) returns an SVG string. Any element with data-oti="lookName" is filled automatically. */
(function () {
  'use strict';
  var n = 0, P = 'assets/oti/prop-';
  var LOOKS = {
    classic:   { expr: 'smile' },
    movie:     { glasses: 'round', hat: null, top: 'hoodie', prop: 'popcorn', expr: 'happy', label: 'Movie night' },
    builder:   { hat: 'hardhat', top: 'vest', prop: 'tools', expr: 'smile', label: 'Builder' },
    founder:   { top: 'suit', prop: 'laptop', expr: 'smile', label: 'Founder mode' },
    coder:     { ears: 'headphones', top: 'hoodie', prop: 'laptop', expr: 'focus', label: 'Deep work' },
    party:     { hat: 'party', top: 'bowtie', prop: 'party', expr: 'happy', label: 'Launch party' },
    detective: { hat: 'detective', prop: 'magnifier', expr: 'wink', label: 'Detective' },
    cozy:      { hat: 'beanie', top: 'scarf', prop: 'coffee', expr: 'happy', label: 'Coffee break' },
    scholar:   { hat: 'grad', glasses: 'round', prop: 'book', expr: 'smile', label: 'Bookworm' },
    cool:      { hat: 'cap', glasses: 'sun', prop: 'sparkles', expr: 'smile', label: 'Too cool' },
    planner:   { top: 'bowtie', glasses: 'round', prop: 'calendar', expr: 'smile', label: 'Planner' },
    postie:    { hat: 'cap', top: 'tee', prop: 'envelope', expr: 'happy', label: 'Special delivery' },
    coach:     { hat: 'cap', top: 'hoodie', prop: 'stopwatch', expr: 'focus', label: 'On the clock' },
    idea:      { glasses: 'round', top: 'tee', prop: 'bulb', expr: 'happy', label: 'Bright idea' },
    manager:   { glasses: 'round', top: 'suit', prop: 'clipboard', expr: 'smile', label: 'On it' },
    caller:    { ears: 'headset', top: 'suit', prop: 'phone', expr: 'happy', label: 'Let us talk' },
    fan:       { hat: 'party', prop: 'heart', expr: 'happy', label: 'Big fan' },
    sleepy:    { hat: 'night', prop: 'zzz', expr: 'sleep', label: 'Nap time' },
    support:   { ears: 'headset', top: 'tee', prop: 'heart', expr: 'happy', label: 'Here to help' },
    launch:    { top: 'scarf', prop: 'rocket', expr: 'wink', label: 'Ship it' },
    boss:      { top: 'suit', glasses: 'sun', prop: 'chart', expr: 'smile', label: 'Numbers up' }
  };

  function otiSVG(name) {
    var L = typeof name === 'string' ? (LOOKS[name] || LOOKS.classic) : name, id = 'ot' + (++n);
    var g = function (k) { return 'url(#' + id + k + ')'; };
    var s = '<svg viewBox="0 0 240 270" class="oti-svg" role="img" aria-label="Oti the otter"><defs>' +
      '<radialGradient id="' + id + 'fur" cx="38%" cy="28%" r="80%"><stop offset="0" stop-color="#b57a60"/><stop offset=".55" stop-color="#8a5543"/><stop offset="1" stop-color="#5c3629"/></radialGradient>' +
      '<radialGradient id="' + id + 'head" cx="40%" cy="30%" r="75%"><stop offset="0" stop-color="#bd8468"/><stop offset=".6" stop-color="#8f5a46"/><stop offset="1" stop-color="#613a2c"/></radialGradient>' +
      '<radialGradient id="' + id + 'muz" cx="45%" cy="35%" r="70%"><stop offset="0" stop-color="#f1d9c6"/><stop offset="1" stop-color="#c99e86"/></radialGradient>' +
      '<radialGradient id="' + id + 'bel" cx="45%" cy="30%" r="75%"><stop offset="0" stop-color="#f0a85a"/><stop offset="1" stop-color="#b8661f"/></radialGradient>' +
      '<radialGradient id="' + id + 'eye" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#4a3128"/><stop offset="1" stop-color="#120b08"/></radialGradient>' +
      '<linearGradient id="' + id + 'amb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb547"/><stop offset="1" stop-color="#d9760a"/></linearGradient>' +
      '<linearGradient id="' + id + 'suit" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8f8a84"/><stop offset="1" stop-color="#5a5550"/></linearGradient>' +
      '<linearGradient id="' + id + 'navy" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b4b72"/><stop offset="1" stop-color="#1f2a44"/></linearGradient>' +
      '<filter id="' + id + 'sh" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="5"/></filter>' +
      '</defs>';
    s += '<ellipse cx="120" cy="256" rx="70" ry="9" fill="rgba(0,0,0,.28)" filter="url(#' + id + 'sh)"/>';
    /* tail */
    s += '<path d="M168 214 C 214 214 226 176 212 140 C 206 126 196 124 194 134 C 204 162 196 194 160 200 Z" fill="' + g('fur') + '"/>';
    /* body */
    s += '<ellipse cx="120" cy="178" rx="64" ry="72" fill="' + g('fur') + '"/>';
    s += '<ellipse cx="120" cy="190" rx="42" ry="50" fill="' + g('bel') + '"/>';
    /* clothes over the body */
    var top = L.top;
    if (top === 'hoodie') {
      s += '<path d="M60 170 C 60 128 86 112 120 112 C 154 112 180 128 180 170 L 184 236 C 150 250 90 250 56 236 Z" fill="' + g('amb') + '"/>' +
        '<path d="M92 204 L 148 204 L 142 232 L 98 232 Z" fill="rgba(0,0,0,.14)"/><path d="M110 124 L 108 160 M130 124 L 132 160" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".85"/>' +
        '<path d="M78 130 Q 120 150 162 130" stroke="rgba(0,0,0,.18)" stroke-width="10" fill="none" stroke-linecap="round"/>';
    } else if (top === 'suit') {
      s += '<path d="M58 168 C 58 130 84 114 120 114 C 156 114 182 130 182 168 L 186 236 C 150 250 90 250 54 236 Z" fill="' + g('suit') + '"/>' +
        '<path d="M104 116 L 120 196 L 136 116 Z" fill="#5a2440"/><path d="M104 116 L 116 136 L 100 150 L 92 124 Z M136 116 L 124 136 L 140 150 L 148 124 Z" fill="#6c6760"/>' +
        '<path d="M116 132 L 124 132 L 128 184 L 120 196 L 112 184 Z" fill="' + g('amb') + '"/><circle cx="120" cy="212" r="3.4" fill="#2a2724"/><circle cx="120" cy="228" r="3.4" fill="#2a2724"/>';
    } else if (top === 'vest') {
      s += '<path d="M66 150 C 70 128 90 118 106 118 L 112 236 C 90 240 70 236 60 230 Z M174 150 C 170 128 150 118 134 118 L 128 236 C 150 240 170 236 180 230 Z" fill="#f4c21b"/>' +
        '<path d="M64 182 L 110 182 M130 182 L 176 182 M62 206 L 110 206 M130 206 L 178 206" stroke="#e8e8e8" stroke-width="7"/>';
    } else if (top === 'scarf') {
      s += '<path d="M72 122 Q 120 148 168 122 L 170 138 Q 120 164 70 138 Z" fill="' + g('amb') + '"/><path d="M142 136 L 156 190 L 140 192 L 130 142 Z" fill="#d9760a"/>' +
        '<path d="M142 186 L 157 186 M141 180 L 155 180" stroke="#ffd79a" stroke-width="2"/>';
    } else if (top === 'bowtie') {
      s += '<path d="M120 132 L 98 120 L 98 146 Z M120 132 L 142 120 L 142 146 Z" fill="#E8890C"/><circle cx="120" cy="132" r="6" fill="#b8600a"/>';
    } else if (top === 'tee') {
      s += '<path d="M58 170 C 58 132 86 118 120 118 C 154 118 182 132 182 170 L 184 236 C 150 250 90 250 56 236 Z" fill="' + g('navy') + '"/>' +
        '<g transform="translate(104,150) scale(.14)"><g fill="none" stroke-width="30" stroke-linecap="square"><g transform="translate(70,168) rotate(-25) scale(.62)" stroke="#9FAABA"><polyline points="-27,-30 28,0 -27,30"/></g><g transform="translate(118,128) rotate(-12) scale(.82)" stroke="#E2E8F0"><polyline points="-27,-30 28,0 -27,30"/></g><g transform="translate(172,72) rotate(2) scale(1.05)" stroke="#E8890C"><polyline points="-27,-30 28,0 -27,30"/></g></g></g>';
    }
    /* feet */
    s += '<ellipse cx="96" cy="244" rx="20" ry="11" fill="#5c3629"/><ellipse cx="144" cy="244" rx="20" ry="11" fill="#5c3629"/>';
    /* ears (under hats) */
    s += '<circle cx="74" cy="56" r="14" fill="#6e4232"/><circle cx="166" cy="56" r="14" fill="#6e4232"/><circle cx="74" cy="57" r="7" fill="#4a2b20"/><circle cx="166" cy="57" r="7" fill="#4a2b20"/>';
    /* head */
    s += '<ellipse cx="120" cy="88" rx="60" ry="54" fill="' + g('head') + '"/>';
    s += '<ellipse cx="102" cy="58" rx="22" ry="10" fill="rgba(255,255,255,.18)" transform="rotate(-18 102 58)"/>';
    s += '<path d="M78 96 C 80 74 100 70 120 76 C 140 70 160 74 162 96 C 162 124 142 136 120 136 C 98 136 78 124 78 96 Z" fill="' + g('muz') + '"/>';
    s += '<circle cx="86" cy="106" r="8" fill="#e98f7a" opacity=".3"/><circle cx="154" cy="106" r="8" fill="#e98f7a" opacity=".3"/>';
    /* eyes */
    var e = L.expr || 'smile';
    if (e === 'happy') s += '<path d="M90 86 Q 99 76 108 86" stroke="#1d120e" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M132 86 Q 141 76 150 86" stroke="#1d120e" stroke-width="5" fill="none" stroke-linecap="round"/>';
    else if (e === 'sleep') s += '<path d="M90 86 Q 99 92 108 86" stroke="#1d120e" stroke-width="4.5" fill="none" stroke-linecap="round"/><path d="M132 86 Q 141 92 150 86" stroke="#1d120e" stroke-width="4.5" fill="none" stroke-linecap="round"/>';
    else {
      s += '<g class="oti-eye"><ellipse cx="99" cy="84" rx="9" ry="10.5" fill="' + g('eye') + '"/><circle cx="102" cy="80" r="3.4" fill="#fff"/><circle cx="96" cy="88" r="1.5" fill="#fff" opacity=".7"/></g>';
      if (e === 'wink') s += '<path d="M132 86 Q 141 78 150 86" stroke="#1d120e" stroke-width="5" fill="none" stroke-linecap="round"/>';
      else s += '<g class="oti-eye"><ellipse cx="141" cy="84" rx="9" ry="10.5" fill="' + g('eye') + '"/><circle cx="144" cy="80" r="3.4" fill="#fff"/><circle cx="138" cy="88" r="1.5" fill="#fff" opacity=".7"/></g>';
      if (e === 'focus') s += '<path d="M88 70 L 108 74 M152 70 L 132 74" stroke="#4a2b20" stroke-width="4" stroke-linecap="round"/>';
    }
    /* nose, mouth, whisker dots */
    s += '<path d="M110 98 Q 120 92 130 98 Q 128 108 120 110 Q 112 108 110 98 Z" fill="#2e1c17"/><ellipse cx="116" cy="98" rx="3.4" ry="1.8" fill="rgba(255,255,255,.55)"/>';
    s += e === 'sleep' ? '<path d="M113 120 Q 120 124 127 120" stroke="#5a3428" stroke-width="3" fill="none" stroke-linecap="round"/>' :
      (e === 'happy' ? '<path d="M108 116 Q 120 132 132 116 Q 120 120 108 116 Z" fill="#6b2a24"/><ellipse cx="120" cy="124" rx="5" ry="2.4" fill="#e0776e"/>' :
      '<path d="M110 116 Q 115 123 120 117 Q 125 123 130 116" stroke="#5a3428" stroke-width="3" fill="none" stroke-linecap="round"/>');
    s += '<g fill="#8a6a58"><circle cx="100" cy="112" r="1.6"/><circle cx="96" cy="118" r="1.6"/><circle cx="140" cy="112" r="1.6"/><circle cx="144" cy="118" r="1.6"/></g>';
    /* eyewear */
    if (L.glasses === 'round') s += '<g fill="rgba(255,255,255,.12)" stroke="#1b1b1b" stroke-width="4"><circle cx="99" cy="85" r="15"/><circle cx="141" cy="85" r="15"/></g><path d="M114 84 Q 120 80 126 84" stroke="#1b1b1b" stroke-width="4" fill="none"/>';
    if (L.glasses === 'sun') s += '<path d="M80 76 L 116 76 L 114 92 Q 98 100 84 92 Z M124 76 L 160 76 L 156 92 Q 142 100 126 92 Z" fill="#111"/><path d="M116 80 L 124 80" stroke="#111" stroke-width="4"/><path d="M88 80 L 100 80" stroke="rgba(255,255,255,.4)" stroke-width="3" stroke-linecap="round"/>';
    /* headwear */
    var hat = L.hat;
    if (hat === 'hardhat') s += '<path d="M66 60 Q 70 18 120 16 Q 170 18 174 60 Z" fill="' + g('amb') + '"/><rect x="56" y="54" width="128" height="12" rx="6" fill="#c46f00"/><path d="M112 20 Q 120 18 128 20 L 128 56 L 112 56 Z" fill="rgba(255,255,255,.3)"/>';
    if (hat === 'party') s += '<path d="M120 -10 L 146 50 L 94 50 Z" fill="#4C7DFF"/><path d="M110 16 L 132 20 M104 32 L 140 36" stroke="#ffb547" stroke-width="5"/><circle cx="120" cy="-10" r="8" fill="#ffb547"/>';
    if (hat === 'grad') s += '<path d="M60 36 L 120 14 L 180 36 L 120 58 Z" fill="#1b2130"/><rect x="92" y="40" width="56" height="20" rx="4" fill="#232a3b"/><path d="M168 40 L 172 74" stroke="#ffb547" stroke-width="3"/><circle cx="172" cy="76" r="5" fill="#ffb547"/>';
    if (hat === 'detective') s += '<path d="M70 58 Q 72 20 120 18 Q 168 20 170 58 Z" fill="#8a6a44"/><path d="M60 58 L 180 58 L 172 66 L 68 66 Z" fill="#6e5234"/><path d="M84 30 L 156 30 M78 44 L 162 44" stroke="#6e5234" stroke-width="3"/>';
    if (hat === 'beanie') s += '<path d="M68 60 Q 68 18 120 16 Q 172 18 172 60 Z" fill="#4C7DFF"/><rect x="64" y="52" width="112" height="14" rx="7" fill="#3a63d6"/><circle cx="120" cy="14" r="10" fill="#e9eefb"/>';
    if (hat === 'cap') s += '<path d="M70 58 Q 72 22 120 20 Q 168 22 170 58 Z" fill="' + g('amb') + '"/><path d="M150 52 Q 196 52 204 62 L 160 64 Z" fill="#c46f00"/><circle cx="120" cy="22" r="4" fill="#c46f00"/>';
    if (hat === 'night') s += '<path d="M70 58 Q 80 16 128 18 Q 170 22 196 70 Q 176 54 170 60 L 70 60 Z" fill="#5b6ea8"/><rect x="66" y="52" width="108" height="12" rx="6" fill="#e9eefb"/><circle cx="196" cy="72" r="9" fill="#e9eefb"/>';
    if (L.ears === 'headphones' || L.ears === 'headset') {
      s += '<path d="M64 88 Q 64 20 120 18 Q 176 20 176 88" stroke="#1b2130" stroke-width="9" fill="none" stroke-linecap="round"/>' +
        '<rect x="50" y="72" width="22" height="36" rx="10" fill="' + g('amb') + '"/><rect x="168" y="72" width="22" height="36" rx="10" fill="' + g('amb') + '"/>';
      if (L.ears === 'headset') s += '<path d="M60 104 Q 66 130 96 128" stroke="#1b2130" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="98" cy="128" r="5" fill="#1b2130"/>';
    }
    /* paws and prop */
    var prop = L.prop;
    if (prop && prop !== 'zzz') {
      s += '<image href="' + P + prop + '.png" x="82" y="140" width="76" height="76"/>';
      s += '<ellipse cx="86" cy="182" rx="12" ry="14" fill="#6e4232"/><ellipse cx="154" cy="182" rx="12" ry="14" fill="#6e4232"/>';
    } else {
      s += '<ellipse cx="94" cy="170" rx="12" ry="15" fill="#6e4232" transform="rotate(20 94 170)"/><ellipse cx="146" cy="170" rx="12" ry="15" fill="#6e4232" transform="rotate(-20 146 170)"/>';
    }
    if (prop === 'zzz') s += '<image href="' + P + 'zzz.png" x="160" y="-4" width="64" height="64" class="oti-zz"/>';
    return s + '</svg>';
  }
  window.otiSVG = otiSVG; window.OTI_LOOKS = LOOKS;
  function fill(root) { (root || document).querySelectorAll('[data-oti]').forEach(function (el) { if (!el.firstChild) el.innerHTML = otiSVG(el.getAttribute('data-oti')); }); }
  window.otiFill = fill;
  fill();
})();
