/* Free tools: four calculators and a sandbox. Two of them call the Claude proxy worker. */
(function () {
  'use strict';

  var WORKER = 'https://solviqo-tools.nisargmehta-1028.workers.dev';   // set this to your deployed worker
  var EJ = { key: 'QX_zYoZlN7ibZXYNv', service: 'nisargmehta2810', template: 'template_wa24pe8' };

  var doc = document, tool = doc.body.getAttribute('data-tool');
  var KEY = (function () {                                  // ?key=... saves the publish key once, then leaves the URL clean
    try {
      var m = location.search.match(/[?&]key=([^&]+)/);
      if (m) {
        localStorage.setItem('sv-pub', decodeURIComponent(m[1]));
        history.replaceState({}, '', location.pathname + location.search.replace(/([?&])key=[^&]*&?/, '$1').replace(/[?&]$/, ''));
      }
      return localStorage.getItem('sv-pub') || '';
    } catch (e) { return ''; }
  })();
  if (!tool) return;

  function $(s, r) { return (r || doc).querySelector(s); }
  function $$(s, r) { return [].slice.call((r || doc).querySelectorAll(s)); }
  function val(id) { var e = doc.getElementById(id); return e ? e.value : ''; }
  function num(id) { var n = parseFloat(val(id)); return isNaN(n) ? 0 : n; }
  function esc(s) { return String(s == null ? '' : s).replace(/[<>&"]/g, function (c) { return ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[c]; }); }
  var out = function () { return doc.getElementById('tlOut'); };

  /* currency ------------------------------------------------------------- */
  var CUR = { INR: { s: '₹', k: 1 }, USD: { s: '$', k: 1 }, AED: { s: 'AED ', k: 1 }, GBP: { s: '£', k: 1 } };
  function cur() { return CUR[val('curSel') || 'INR'] || CUR.INR; }
  function money(v) {
    var c = cur(), n = Math.round(v);
    if (n >= 10000000) return c.s + (n / 10000000).toFixed(1).replace(/\.0$/, '') + ' Cr';
    if (n >= 100000 && (val('curSel') || 'INR') === 'INR') return c.s + (n / 100000).toFixed(1).replace(/\.0$/, '') + ' L';
    if (n >= 1000000) return c.s + (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1000) return c.s + (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '') + 'k';
    return c.s + n.toLocaleString('en-IN');
  }
  function hrs(v) { return Math.round(v).toLocaleString('en-IN') + ' hrs'; }

  /* shared UI ------------------------------------------------------------ */
  function loading(msg, sub) {
    out().innerHTML = '<div class="load"><div class="dots"><i></i><i></i><i></i></div><p>' + esc(msg) + '</p>' +
      (sub ? '<small>' + esc(sub) + '</small>' : '') + '</div>';
  }
  function fail(msg) { out().innerHTML = '<div class="res-body"><div class="err">' + esc(msg) + '</div></div>'; }

  function fills() {                       // animate every gauge and bar once painted
    setTimeout(function () { $$('.gauge i,.bar-t i', out()).forEach(function (e) { e.style.width = e.getAttribute('data-w') + '%'; }); }, 60);
  }

  var TICK = '<svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  /* actions shown under every result (no email gate, this is used internally) */
  function grab() {
    return '<div class="grab"><div style="display:flex;gap:10px;flex-wrap:wrap">' +
      '<button class="btn btn-ghost" type="button" onclick="window.svPrint(this)">Download PDF</button>' +
      '<a class="btn btn-primary" href="contact.html">Talk it through in 20 minutes<span class="shine"></span></a></div></div>';
  }
  function wireGrab(payload, onUnlock) { if (onUnlock) onUnlock(); }
  function unlock() {
    $$('[data-locked]', out() || doc).forEach(function (e) { e.removeAttribute('hidden'); });
    fills();
  }

  /* download a real PDF file, drawn from the blueprint data */
  function load(src) {
    return new Promise(function (ok, no) {
      var t = doc.createElement('script'); t.src = src; t.onload = ok; t.onerror = no; doc.head.appendChild(t);
    });
  }


  /* ------------------------------------------------- the PDF, drawn not screenshotted */
  var INK = [16, 21, 30], GREY = [104, 118, 136], LINE = [222, 227, 234], AMBER = [205, 110, 6], SOFT = [250, 246, 240];

  function pdfBuild(meta) {
    var jsPDF = window.jspdf && window.jspdf.jsPDF;
    var d = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
    var W = 210, M = 15, w = W - M * 2, y = 0, page = 1;

    function font(size, weight, color) {
      d.setFont('helvetica', weight || 'normal');
      d.setFontSize(size);
      d.setTextColor.apply(d, color || INK);
    }
    function room(need) {
      if (y + need < 282) return;
      foot(); d.addPage(); page++; y = M;
    }
    function foot() {
      font(7.5, 'normal', GREY);
      d.text('solviqodigital.com', M, 289);
      d.text(String(page), W - M, 289, { align: 'right' });
    }
    function para(text, size, color, gap, weight, width) {
      if (!text) return;
      font(size, weight, color);
      var lines = d.splitTextToSize(String(text), width || w);
      for (var i = 0; i < lines.length; i++) {
        room(6);
        d.text(lines[i], M, y);
        y += size * 0.48 + 1.1;
      }
      y += gap == null ? 3 : gap;
    }
    function kicker(t) {
      room(16);
      font(7.5, 'bold', AMBER);
      d.text(String(t).toUpperCase(), M, y);
      y += 5;
    }
    function heading(t) {
      font(14, 'bold', INK);
      var lines = d.splitTextToSize(String(t), w);
      for (var i = 0; i < lines.length; i++) { room(9); d.text(lines[i], M, y); y += 7; }
      y += 1.5;
    }
    function rule() { d.setDrawColor.apply(d, LINE); d.setLineWidth(0.2); d.line(M, y, W - M, y); y += 6; }

    function cards(list, title, body, cols, tint) {
      cols = cols || 2;
      var cw = (w - 4 * (cols - 1)) / cols, i = 0;
      while (i < list.length) {
        var rowItems = list.slice(i, i + cols), h = 0, texts = [];
        rowItems.forEach(function (it) {
          font(9.5, 'bold', INK);
          var t1 = d.splitTextToSize(String(title(it) || ''), cw - 8);
          font(8.5, 'normal', GREY);
          var t2 = d.splitTextToSize(String(body(it) || ''), cw - 8);
          texts.push([t1, t2]);
          h = Math.max(h, 8 + t1.length * 4.4 + t2.length * 3.9);
        });
        room(h + 5);
        rowItems.forEach(function (it, k) {
          var x = M + k * (cw + 4);
          d.setDrawColor.apply(d, LINE);
          d.setFillColor.apply(d, tint ? SOFT : [255, 255, 255]);
          d.roundedRect(x, y, cw, h, 2, 2, 'FD');
          var yy = y + 6;
          font(9.5, 'bold', INK);
          texts[k][0].forEach(function (l) { d.text(l, x + 4, yy); yy += 4.4; });
          yy += 0.6;
          font(8.5, 'normal', GREY);
          texts[k][1].forEach(function (l) { d.text(l, x + 4, yy); yy += 3.9; });
        });
        y += h + 4;
        i += cols;
      }
      y += 3;
    }

    /* a simplified drawing of one app screen */
    function shot(m) {
      var h = 34, rows = (m.rows || []).slice(0, 3), cols = (m.columns || []).slice(0, 3);
      if (m.template === 'dashboard') h = 36;
      room(h + 6);
      d.setDrawColor.apply(d, LINE); d.setFillColor(252, 252, 253);
      d.roundedRect(M, y, w, h, 2, 2, 'FD');
      d.setFillColor(246, 247, 249);
      d.roundedRect(M, y, w, 7, 2, 2, 'F');
      d.setFillColor(246, 247, 249); d.rect(M, y + 4, w, 3, 'F');
      font(6.5, 'normal', GREY);
      d.text(String(m.name || '').toLowerCase(), M + 4, y + 4.6);
      var top = y + 12;

      if (m.template === 'kanban') {
        var st = (m.statuses || ['To do', 'Doing', 'Done']).slice(0, 3), cw2 = (w - 12) / 3;
        st.forEach(function (s, i) {
          var x = M + 4 + i * cw2;
          font(6.5, 'bold', GREY); d.text(String(s).toUpperCase(), x, top);
          var card = (m.rows || [])[i] || [];
          d.setDrawColor.apply(d, LINE); d.setFillColor(255, 255, 255);
          d.roundedRect(x, top + 2, cw2 - 4, 9, 1.5, 1.5, 'FD');
          font(7.5, 'normal', INK);
          d.text(d.splitTextToSize(String(card[0] || 'Item'), cw2 - 10)[0] || '', x + 2.5, top + 7.5);
        });
      } else if (m.template === 'dashboard') {
        var k = (m.kpis || []).slice(0, 3), kw = (w - 12) / 3;
        k.forEach(function (x0, i) {
          var x = M + 4 + i * kw;
          d.setDrawColor.apply(d, LINE); d.setFillColor(255, 255, 255);
          d.roundedRect(x, top - 4, kw - 4, 13, 1.5, 1.5, 'FD');
          font(11, 'bold', INK); d.text(String(x0.value || ''), x + 3, top + 2);
          font(6.5, 'normal', GREY); d.text(String(x0.label || '').toUpperCase(), x + 3, top + 6.5);
        });
        var bx = M + 4, bw = (w - 10) / 7;
        [12, 16, 9, 18, 13, 7, 15].forEach(function (hh, i) {
          d.setFillColor(232, 168, 84);
          d.rect(bx + i * bw, top + 22 - hh * 0.6, bw - 2.5, hh * 0.6, 'F');
        });
      } else if (m.template === 'form') {
        var f = (m.fields || []).slice(0, 4), fw = (w - 12) / 2;
        f.forEach(function (name, i) {
          var x = M + 4 + (i % 2) * fw, yy = top - 3 + Math.floor(i / 2) * 9;
          d.setDrawColor.apply(d, LINE); d.setFillColor(255, 255, 255);
          d.roundedRect(x, yy, fw - 4, 7, 1.2, 1.2, 'FD');
          font(6.8, 'normal', GREY); d.text(String(name), x + 2.5, yy + 4.4);
        });
      } else if (m.template === 'calendar') {
        var cw3 = (w - 12) / 5;
        for (var i2 = 0; i2 < 10; i2++) {
          var x = M + 4 + (i2 % 5) * cw3, yy = top - 4 + Math.floor(i2 / 5) * 10;
          var on = i2 === 1 || i2 === 7;
          d.setDrawColor.apply(d, LINE);
          d.setFillColor.apply(d, on ? [253, 243, 230] : [255, 255, 255]);
          d.roundedRect(x, yy, cw3 - 3, 8.5, 1.2, 1.2, 'FD');
          font(6.2, 'normal', on ? AMBER : GREY);
          d.text(on ? String((m.statuses || ['Visit'])[i2 % (m.statuses || ['Visit']).length]).slice(0, 10) : String(i2 + 1), x + 2, yy + 5.2);
        }
      } else {
        var colw = (w - 10) / Math.max(cols.length || 3, 1);
        font(6.5, 'bold', GREY);
        cols.forEach(function (c, i) { d.text(String(c).toUpperCase(), M + 5 + i * colw, top); });
        d.setDrawColor.apply(d, LINE); d.line(M + 4, top + 1.5, W - M - 4, top + 1.5);
        rows.forEach(function (r, ri) {
          var yy = top + 6 + ri * 5.4;
          font(7.5, 'normal', INK);
          r.slice(0, cols.length || 3).forEach(function (cell, i) {
            d.text(d.splitTextToSize(String(cell), colw - 3)[0] || '', M + 5 + i * colw, yy);
          });
        });
      }
      y += h + 6;
    }

    /* ---------------- the document ---------------- */
    var A = BP.app || {}, R = BP.read || {}, S = BP.simple || {};
    d.setFillColor(11, 14, 20); d.rect(0, 0, W, 46, 'F');
    font(20, 'bold', [255, 255, 255]);
    d.text(String(meta.company || ''), M, 22);
    font(8.5, 'normal', [168, 180, 196]);
    d.text([meta.site, meta.industry, 'prepared ' + new Date(meta.when || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })]
      .filter(Boolean).join('   |   '), M, 30);
    font(8, 'bold', [232, 137, 12]);
    d.text('APPLICATION BLUEPRINT', M, 39);
    y = 58;

    font(17, 'bold', INK); d.text(String(A.name || 'Your application'), M, y); y += 8;
    para(A.one_line, 10.5, GREY, 5);
    rule();

    if (R.does) { kicker('What we read on your site'); heading(R.does); para(R.serves, 9.5, GREY, 4); rule(); }

    if (S.what_it_is) {
      kicker('In plain words'); heading('What this app is.');
      para(S.what_it_is, 10, INK, 4);
      if ((S.before || []).length) {
        var pairs = [];
        var n = Math.max((S.before || []).length, (S.after || []).length);
        for (var i = 0; i < n; i++) pairs.push({ a: (S.before || [])[i] || '', b: (S.after || [])[i] || '' });
        cards(pairs, function (p) { return 'Today: ' + p.a; }, function (p) { return 'With the app: ' + p.b; }, 2, true);
      }
      rule();
    }

    if ((S.steps || []).length) {
      kicker('Step by step'); heading('What a normal day looks like.');
      cards(S.steps, function (s) { return 'Step ' + (s.n || ''); }, function (s) { return s.does; }, 2);
      rule();
    }

    if ((BP.problems || []).length) {
      kicker('The problems this solves'); heading('Where the day goes today.');
      cards(BP.problems, function (p) { return p.said; }, function (p) { return p.costs + '  Fixed by: ' + p.fixed_by; }, 2);
      rule();
    }

    kicker('The application'); heading('What you would be using, screen by screen.');
    (BP.modules || []).forEach(function (m, i) {
      room(26);
      font(11, 'bold', INK); d.text(('0' + (i + 1)).slice(-2) + '  ' + String(m.name || ''), M, y); y += 5.5;
      para(m.purpose, 9, GREY, 2);
      shot(m);
    });
    rule();

    if ((BP.roles || []).length) {
      kicker('Who signs in'); heading('Every role opens on the thing they need.');
      cards(BP.roles, function (r) { return r.role; }, function (r) { return 'Opens on ' + r.sees + '. ' + r.does; }, 2);
      rule();
    }

    if ((BP.benefits || []).length) {
      kicker('What it does for you'); heading('The reason to build it.');
      cards(BP.benefits, function (b) { return b.value + '  ' + b.label; }, function (b) { return b.note; }, 2, true);
      rule();
    }

    if ((BP.features || []).length) {
      kicker('Features that matter'); heading('What your team would feel in week one.');
      cards(BP.features, function (f) { return f.title; }, function (f) { return f.body; }, 2);
      rule();
    }

    if ((BP.integrations || []).length) {
      kicker('Connects to'); heading('It fits the tools you already pay for.');
      cards(BP.integrations, function (x) { return x.tool; }, function (x) { return x.why; }, 3);
      rule();
    }

    if ((BP.phases || []).length) {
      kicker('How it gets built'); heading('Four weeks, in the open.');
      para(A.why_now, 9.5, GREY, 4);
      cards(BP.phases, function (p) { return p.week; }, function (p) { return p.does; }, 2);
      rule();
    }

    if ((BP.risks || []).length) {
      kicker('What could go wrong'); heading('Named early, handled in the plan.');
      cards(BP.risks, function (r) { return r.risk; }, function (r) { return r.handle; }, 2);
      rule();
    }

    if ((S.faq || []).length) {
      kicker('Questions people ask'); heading('Short answers, no jargon.');
      cards(S.faq, function (f) { return f.q; }, function (f) { return f.a; }, 2);
    }

    room(30);
    d.setFillColor(11, 14, 20); d.roundedRect(M, y, w, 22, 2, 2, 'F');
    font(11, 'bold', [255, 255, 255]);
    d.text('Want this built? Twenty minutes is enough to know.', M + 6, y + 9);
    font(9, 'normal', [168, 180, 196]);
    d.text('solviqodigital.com  |  solviqodigital@gmail.com', M + 6, y + 16);
    y += 26;
    foot();
    return d;
  }

  window.svPrint = function (btn) {
    var label = btn && btn.textContent;
    var meta = window.__bpMeta || {};
    var done = function () { if (btn) { btn.textContent = label; btn.disabled = false; } };
    if (!BP || !BP.app) { window.print(); return; }
    if (btn) { btn.textContent = 'Building your PDF'; btn.disabled = true; }
    (window.jspdf ? Promise.resolve() : load('https://cdnjs.cloudflare.com/ajax/libs/jspdf/3.0.1/jspdf.umd.min.js'))
      .then(function () {
        var name = ((meta.company || 'application') + ' blueprint').replace(/[^a-z0-9]+/gi, '-').toLowerCase() + '.pdf';
        pdfBuild(meta).save(name);
        done();
      })
      .catch(function () { done(); window.print(); });
  };

  /* 1 ---------------------------------------------------- spreadsheet leak */
  function leak() {
    var people = num('lkPeople'), hours = num('lkHours'), rate = num('lkRate'), vol = num('lkVol'),
      rework = num('lkRework'), delay = num('lkDelay'), tools = num('lkTools'), errors = num('lkErrors');
    if (!people || !hours || !rate) { fail('Fill in the team size, the hours and the hourly cost so the numbers mean something.'); return; }

    var WEEKS = 46;
    var annualHours = people * hours * WEEKS;
    var labour = annualHours * rate;
    var reworkHours = annualHours * (rework / 100);
    var reworkCost = reworkHours * rate;
    var errorHours = errors * 12 * 3;                    // three hours to unwind each mistake
    var errorCost = errorHours * rate;
    var switchHours = Math.max(0, tools - 1) * people * 1.5 * WEEKS;   // 90 min a week per extra tool
    var switchCost = switchHours * rate;
    var total = labour + reworkCost + errorCost + switchCost;
    var waitDays = vol * 12 * delay;

    var per100 = vol ? (errors * 12) / (vol * 12) * 100 : 0;
    var score = Math.min(100, Math.round(
      Math.min(30, rework * 1.5) +
      Math.min(22, Math.max(0, tools - 2) * 5.5) +
      Math.min(22, per100 * 2.2) +
      Math.min(16, (people * hours) / 4) +
      Math.min(10, delay * 1.6)));
    var band = score >= 66 ? ['High', 'r', 'This process is fragile. The cost is not the hours, it is what happens when one of them goes wrong.']
      : score >= 36 ? ['Moderate', 'a', 'It works, but it leans on people remembering things. That holds until someone is on leave.']
        : ['Low', 'g', 'This is under control for now. Worth watching as volume grows, since these costs scale with headcount.'];

    var leaks = [
      ['Hands on the process', labour - reworkCost, 'People doing the steps by hand every week'],
      ['Rework and corrections', reworkCost, 'Work that had to be done twice'],
      ['Fixing mistakes', errorCost, 'Time spent unwinding errors after the fact'],
      ['Switching between tools', switchCost, 'Copying the same data between ' + (tools || 1) + ' places']
    ].filter(function (l) { return l[1] > 0; }).sort(function (a, b) { return b[1] - a[1]; });
    var top = leaks[0];
    var saving = (reworkCost + errorCost + switchCost) * 0.7 + (labour - reworkCost) * 0.4;

    var html = '<div class="res">' +
      '<div class="res-top"><span class="lbl">What this process costs a year</span>' +
      '<div class="big warn">' + money(total) + '</div>' +
      '<p>That is ' + hrs(annualHours) + ' of people time, plus the rework, the mistakes and the copying between tools. ' +
      'The biggest single leak is <b style="color:var(--t1)">' + esc(top[0].toLowerCase()) + '</b> at ' + money(top[1]) + ' a year.</p></div>' +
      '<div class="res-body">' +
      '<div class="tl-kv"><span>Risk of this process breaking</span><b class="' + (score >= 66 ? 'up' : score < 36 ? 'good' : '') + '">' + band[0] + ', ' + score + ' of 100</b></div>' +
      '<div class="gauge"><i class="' + band[1] + '" data-w="' + score + '"></i></div>' +
      '<p style="color:var(--t2);font-size:13.5px;line-height:1.6;margin:12px 0 0">' + band[2] + '</p>' +

      '<div class="blk"><h4>Where the money goes</h4><div class="tl-bars">' +
      leaks.map(function (l) {
        return '<div class="bar-row"><div class="rt"><span>' + esc(l[0]) + '</span><b>' + money(l[1]) + '</b></div>' +
          '<div class="bar-t"><i data-w="' + Math.round(l[1] / total * 100) + '"></i></div>' +
          '<div style="color:var(--t3);font-size:12px;margin-top:5px">' + esc(l[2]) + '</div></div>';
      }).join('') + '</div></div>' +

      '<div class="blk"><h4>The rest of the picture</h4>' +
      '<div class="tl-kv"><span>People time in the process</span><b>' + hrs(annualHours) + ' a year</b></div>' +
      '<div class="tl-kv"><span>Of that, work done twice</span><b class="up">' + hrs(reworkHours) + '</b></div>' +
      (waitDays ? '<div class="tl-kv"><span>Waiting time across all requests</span><b class="up">' + Math.round(waitDays).toLocaleString('en-IN') + ' days a year</b></div>' : '') +
      '<div class="tl-kv"><span>Cost per request handled</span><b>' + (vol ? money(total / (vol * 12)) : 'Add a volume') + '</b></div>' +
      '<div class="tl-kv"><span>Realistic recovery with one system</span><b class="good">' + money(saving) + ' a year</b></div></div>' +

      '<div class="blk"><h4>What we would fix first</h4><ul class="tl-ticks">' +
      '<li>Put the ' + (vol ? Math.round(vol) + ' requests a month' : 'requests') + ' on one form so the data arrives complete, which is what removes most of the rework.</li>' +
      '<li>Give every request a status and an owner, so the ' + (delay ? Math.round(delay) + ' day wait' : 'wait') + ' becomes visible instead of being chased.</li>' +
      (tools > 2 ? '<li>Connect the ' + Math.round(tools) + ' tools you listed so the same numbers are not typed more than once.</li>' : '') +
      '<li>Log every change, so a mistake can be traced in minutes rather than reconstructed from inboxes.</li></ul></div>' +

      grab('See the full breakdown', 'Where every rupee of that number comes from, the four leaks ranked, and what we would fix first. Open it here and we will send a copy.', {}) +
      '</div></div>';

    out().innerHTML = html;
    wireGrab({
      tool: 'Spreadsheet Leak Audit',
      summary: 'Annual cost: ' + money(total) + '\nRisk score: ' + score + ' (' + band[0] + ')\n' +
        'Team: ' + people + ' people, ' + hours + ' hrs each per week, rate ' + money(rate) + '/hr\n' +
        'Volume: ' + vol + '/month, rework ' + rework + '%, delay ' + delay + ' days, tools ' + tools + ', errors ' + errors + '/month'
    }, unlock);
    fills();
  }

  /* 2 -------------------------------------------------------- build vs buy */
  function buildbuy() {
    var seats = num('bbSeats'), price = num('bbPrice'), rise = num('bbRise'), extra = num('bbExtra'),
      rate = num('bbRate'), build = num('bbBuild'), maint = num('bbMaint'), years = num('bbYears') || 3;
    if (!seats || !price || !build) { fail('Fill in the seats, the price per seat and a rough build budget.'); return; }

    var months = years * 12, buy = [], own = [], cross = 0, b = 0, o = build;
    for (var m = 1; m <= months; m++) {
      var yr = Math.floor((m - 1) / 12);
      var seat = price * Math.pow(1 + rise / 100, yr);
      b += seats * seat + extra * 4.3 * rate;                          // licences plus the workaround labour
      o += (build * (maint / 100)) / 12 + extra * 4.3 * rate * 0.15;   // upkeep plus a little residual manual work
      buy.push(b); own.push(o);
      if (!cross && o < b) cross = m;
    }
    var endBuy = buy[months - 1], endOwn = own[months - 1], diff = endBuy - endOwn;
    var w = 560, h = 190, max = Math.max(endBuy, endOwn, 1), pad = 26;
    function pts(a) {
      return a.map(function (v, i) {
        return (pad + i / (months - 1) * (w - pad - 10)).toFixed(1) + ',' + (h - 26 - v / max * (h - 46)).toFixed(1);
      }).join(' ');
    }
    var cx = cross ? pad + (cross - 1) / (months - 1) * (w - pad - 10) : 0;

    var verdict = cross
      ? 'Custom pays for itself in month ' + cross + '. Over ' + years + ' years you would keep ' + money(diff) + ' that otherwise goes to licences and workarounds.'
      : 'Over ' + years + ' years the subscription still costs less than building this. Keep buying, and revisit when seats or workaround hours grow.';

    out().innerHTML = '<div class="res">' +
      '<div class="res-top"><span class="lbl">' + (cross ? 'Custom becomes cheaper in' : 'Verdict after ' + years + ' years') + '</span>' +
      '<div class="big">' + (cross ? 'Month ' + cross : 'Keep buying') + '</div>' +
      '<p>' + esc(verdict) + '</p></div>' +
      '<div class="res-body">' +
      '<svg class="chart" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none">' +
      '<line class="grid-l" x1="' + pad + '" y1="' + (h - 26) + '" x2="' + (w - 10) + '" y2="' + (h - 26) + '"/>' +
      '<line class="grid-l" x1="' + pad + '" y1="20" x2="' + (w - 10) + '" y2="20"/>' +
      (cross ? '<line class="tl-x" x1="' + cx.toFixed(1) + '" y1="14" x2="' + cx.toFixed(1) + '" y2="' + (h - 26) + '"/>' : '') +
      '<polyline class="tl-ln buy" points="' + pts(buy) + '"/><polyline class="tl-ln build" points="' + pts(own) + '"/>' +
      '<text x="' + pad + '" y="' + (h - 10) + '">Month 1</text>' +
      '<text x="' + (w - 60) + '" y="' + (h - 10) + '">Month ' + months + '</text>' +
      '<text x="' + pad + '" y="14">' + money(max) + '</text></svg>' +
      '<div class="legend"><span><i style="background:var(--steel-400)"></i>Keep subscribing</span><span><i style="background:var(--amber-500)"></i>Build it once</span></div>' +

      '<div class="blk"><h4>Over ' + years + ' years</h4>' +
      '<div class="tl-kv"><span>Licences and workarounds</span><b class="up">' + money(endBuy) + '</b></div>' +
      '<div class="tl-kv"><span>Build once, then maintain</span><b class="good">' + money(endOwn) + '</b></div>' +
      '<div class="tl-kv"><span>Difference</span><b class="' + (diff > 0 ? 'good' : 'up') + '">' + money(Math.abs(diff)) + (diff > 0 ? ' saved' : ' more') + '</b></div>' +
      '<div class="tl-kv"><span>Licence cost in year ' + years + ' alone</span><b>' + money(seats * price * 12 * Math.pow(1 + rise / 100, years - 1)) + '</b></div>' +
      '<div class="tl-kv"><span>Workaround labour a year</span><b class="up">' + money(extra * 52 * rate) + '</b></div></div>' +

      '<div class="blk"><h4>What the numbers assume</h4><ul class="tl-ticks tl-q">' +
      '<li>Licences rise ' + rise + '% a year, which is what most tools do at renewal.</li>' +
      '<li>The ' + extra + ' hours a week of workarounds stay with the subscription, and drop to about 15% of that once the process lives in one place.</li>' +
      '<li>Maintenance on a custom build is ' + maint + '% of the build a year, which covers hosting, small changes and support.</li>' +
      '<li>Seats stay flat. If headcount grows, the subscription line gets steeper and the crossover arrives sooner.</li></ul></div>' +

      grab('Get the full comparison', 'The year by year table, what each assumption does to the answer, and the point where the maths flips.', {}) +
      '</div></div>';

    wireGrab({
      tool: 'Build vs Buy Breakeven',
      summary: 'Crossover: ' + (cross ? 'month ' + cross : 'none within ' + years + ' years') + '\n' +
        years + ' year subscription cost: ' + money(endBuy) + ', build cost: ' + money(endOwn) + '\n' +
        'Inputs: ' + seats + ' seats at ' + money(price) + '/mo, rising ' + rise + '%, ' + extra + ' hrs/wk workarounds at ' + money(rate) + '/hr, build ' + money(build) + ', maintenance ' + maint + '%'
    }, unlock);
    fills();
  }

  /* 3 and 4 ------------------------------------------------------- Claude side */
  function heads() {
    var h = { 'Content-Type': 'application/json' };
    if (KEY) h['x-publish-key'] = KEY;                 // your own browser skips the visitor limits
    return h;
  }

  function call(path, body, tries) {
    return fetch(WORKER.replace(/\/$/, '') + '/' + path, {
      method: 'POST', headers: heads(), body: JSON.stringify(body)
    }).then(function (r) {
      if (r.status >= 500 && (tries || 0) < 1) {               // one quiet retry, these blips happen
        return new Promise(function (go) { setTimeout(go, 1200); }).then(function () { return call(path, body, (tries || 0) + 1); });
      }
      return r;
    });
  }

  function ask(path, input, render, payload) {
    call(path, { input: input }).then(function (r) {
      return r.json().then(function (d) { return { ok: r.ok, d: d }; });
    }).then(function (res) {
      if (!res.ok || !res.d.result) { fail(res.d && res.d.error ? res.d.error : 'Something went wrong. Try again in a moment.'); return; }
      render(res.d.result);
      wireGrab(payload(res.d.result), unlock);
      fills();
    }).catch(function () {
      fail('Could not reach the generator. Check your connection and try again, or book a call and we will run it with you.');
    });
  }

  function spec() {
    var text = val('spText').trim();
    if (text.length < 40) { fail('Describe the process in a few more sentences. The more specific you are, the more useful the specification.'); return; }
    var input = 'Process description:\n' + text +
      '\n\nTeam size: ' + val('spSize') +
      '\nTools in use today: ' + (val('spTools') || 'not stated') +
      '\nMust have: ' + (val('spMust') || 'not stated');
    loading('Writing your build specification', 'Roles, screens, data model, phase one and a four week plan. About twenty seconds.');

    ask('spec', input, function (r) {
      var list = function (a, f) { return (a || []).map(f).join(''); };
      out().innerHTML = '<div class="res">' +
        '<div class="res-top"><span class="lbl">Your build specification</span>' +
        '<div class="big">' + esc(r.name || 'Your app') + '</div>' +
        '<p>' + esc(r.one_line || '') + '</p></div>' +
        '<div class="res-body">' +
        '<div class="blk"><h4>Is it worth building</h4><p style="color:var(--t2);font-size:14.5px;line-height:1.65;margin:0">' + esc(r.verdict || '') + '</p></div>' +

        '<div class="blk"><h4>Who uses it</h4>' + list(r.roles, function (x) {
          return '<div class="mini"><b>' + esc(x.role) + '</b><p>' + esc(x.can) + '</p></div>';
        }) + '</div>' +

        '<div class="blk"><h4>Screens to build</h4>' + list(r.screens, function (x) {
          return '<div class="mini"><b>' + esc(x.name) + '</b><p>' + esc(x.purpose) + '</p>' +
            '<div class="fields">' + (x.key_fields || []).map(function (f) { return '<span>' + esc(f) + '</span>'; }).join('') + '</div></div>';
        }) + '</div>' +

        '<div class="blk"><h4>What the database holds</h4>' + list(r.data, function (x) {
          return '<div class="mini"><b>' + esc(x.entity) + '</b><p>' + esc(x.note || '') + '</p>' +
            '<div class="fields">' + (x.fields || []).map(function (f) { return '<span>' + esc(f) + '</span>'; }).join('') + '</div></div>';
        }) + '</div>' +

        '<div class="blk"><h4>Connects to</h4>' + list(r.integrations, function (x) {
          return '<div class="mini"><b>' + esc(x.tool) + '</b><p>' + esc(x.why) + '</p></div>';
        }) + '</div>' +

        '<div class="blk"><h4>Ships in version one</h4><ul class="tl-ticks">' +
        list(r.phase_one, function (x) { return '<li>' + esc(x) + '</li>'; }) + '</ul></div>' +

        '<div class="blk"><h4>Can wait</h4><ul class="tl-ticks tl-q">' +
        list(r.later, function (x) { return '<li>' + esc(x) + '</li>'; }) + '</ul></div>' +

        '<div class="blk"><h4>What could go wrong</h4>' + list(r.risks, function (x) {
          return '<div class="mini"><b>' + esc(x.risk) + '</b><p>' + esc(x.handle) + '</p></div>';
        }) + '</div>' +

        '<div class="blk"><h4>Four week plan</h4>' + list(r.plan, function (x) {
          return '<div class="wk"><b>' + esc(x.week) + '</b><p>' + esc(x.does) + '</p></div>';
        }) + '</div>' +

        '<div class="blk"><h4>Answer these before anyone builds</h4><ul class="tl-ticks tl-q">' +
        list(r.questions, function (x) { return '<li>' + esc(x) + '</li>'; }) + '</ul></div>' +

        grab('Open the full specification', 'Screens, data model, integrations, phase one scope, risks, the four week plan and the questions to settle first. Yours to keep, whoever builds it.', {}) +
        '</div></div>';
    }, function (r) {
      return {
        tool: 'App Spec Generator',
        summary: 'App: ' + (r.name || '') + '\n' + (r.one_line || '') + '\n\nVerdict: ' + (r.verdict || '') +
          '\n\nTheir description:\n' + text.slice(0, 900)
      };
    });
  }

  function automation() {
    var text = val('auText').trim();
    if (text.length < 40) { fail('List a few more tasks, one per line. Five or more gives a shortlist worth acting on.'); return; }
    var input = 'Weekly tasks, one per line:\n' + text +
      '\n\nTeam: ' + val('auSize') + '\nTools in use: ' + (val('auTools') || 'not stated');
    loading('Scoring every task', 'Automation potential, effort, hours saved and what to start with.');

    ask('automation', input, function (r) {
      var tasks = r.tasks || [];
      var saved = tasks.reduce(function (a, t) { return a + (+t.hours_saved_week || 0); }, 0);
      var quick = tasks.filter(function (t) { return t.verdict === 'Automate now'; }).length;
      out().innerHTML = '<div class="res">' +
        '<div class="res-top"><span class="lbl">Hours a week you could get back</span>' +
        '<div class="big">' + Math.round(saved) + ' hrs</div>' +
        '<p>' + esc(r.summary || '') + '</p></div>' +
        '<div class="res-body">' +
        '<div class="tl-kv"><span>Tasks worth automating now</span><b>' + quick + ' of ' + tasks.length + '</b></div>' +
        '<div class="tl-kv"><span>Current load across the list</span><b>' + (r.hours_week ? Math.round(r.hours_week) + ' hrs a week' : 'Not estimated') + '</b></div>' +
        '<div class="blk"><h4>Start here</h4><p style="color:var(--t2);font-size:14.5px;line-height:1.65;margin:0">' + esc(r.start_with || '') + '</p></div>' +

        '<div class="blk"><h4>Every task, scored</h4>' +
        tasks.map(function (t) {
          var cls = t.verdict === 'Automate now' ? 'ok' : t.verdict === 'Keep human' ? '' : 'warn';
          return '<div class="tl-task"><div class="tl-th"><b>' + esc(t.task) + '</b><span class="tl-tag ' + cls + '">' + esc(t.verdict) + '</span></div>' +
            '<div class="tl-meta"><span class="tl-tag">' + esc(t.effort) + ' effort</span>' +
            '<span class="tl-tag acc">' + (+t.hours_saved_week || 0) + ' hrs a week</span>' +
            '<span class="tl-tag">Score ' + Math.round(+t.score || 0) + '</span></div>' +
            '<div class="bar-t"><i data-w="' + Math.max(3, Math.min(100, Math.round(+t.score || 0))) + '"></i></div>' +
            '<p>' + esc(t.how) + '</p><p class="wo">Watch out: ' + esc(t.watch_out) + '</p></div>';
        }).join('') + '</div>' +

        grab('Open the full shortlist', 'Every task scored, with the specific way to automate it, the effort, the hours it gives back and what breaks if it is done badly.', {}) +
        '</div></div>';
    }, function (r) {
      return {
        tool: 'Automation Shortlist',
        summary: 'Hours saved a week: ' + Math.round((r.tasks || []).reduce(function (a, t) { return a + (+t.hours_saved_week || 0); }, 0)) +
          '\nStart with: ' + (r.start_with || '') + '\n\nTheir tasks:\n' + text.slice(0, 900)
      };
    });
  }

  /* 5 ------------------------------------------------------------- sandbox */
  var SB = {
    approvals: {
      title: 'Requests and approvals', unit: 'Request', who: 'Requested by',
      flow: ['Submitted', 'In review', 'Approved', 'Done'],
      seed: [['Laptop for new joiner', 'Priya S', 0], ['Site visit advance', 'Rahul M', 1], ['Software renewal', 'Ayesha K', 2]]
    },
    inspections: {
      title: 'Inspections and checklists', unit: 'Inspection', who: 'Inspector',
      flow: ['Scheduled', 'On site', 'Submitted', 'Closed'],
      seed: [['Warehouse B monthly', 'Deepak R', 0], ['Fire safety, floor 3', 'Sana V', 1], ['Vehicle 04 pre trip', 'Imran A', 2]]
    },
    assets: {
      title: 'Assets and equipment', unit: 'Asset', who: 'Held by',
      flow: ['In store', 'Issued', 'In service', 'Returned'],
      seed: [['Generator 12 kVA', 'Site A', 1], ['Laser level', 'Survey team', 2], ['Tablet 07', 'Store', 0]]
    }
  };
  var sbState = null;

  function sbRender() {
    var s = sbState, cfg = SB[s.kind];
    var counts = cfg.flow.map(function (f) { return s.rows.filter(function (r) { return r.step === cfg.flow.indexOf(f); }).length; });
    doc.getElementById('sbApp').innerHTML =
      '<div class="tl-sb"><div class="sb-bar"><i></i><i></i><i></i><span>' + esc(s.team.toLowerCase().replace(/\s+/g, '-')) + '.app</span></div>' +
      '<div class="sb-body">' +
      '<div class="sb-top"><h4>' + esc(s.team) + ' &middot; ' + esc(s.label) + '</h4>' +
      '<button class="btn btn-primary" id="sbNew" type="button">New ' + esc(cfg.unit.toLowerCase()) + '<span class="shine"></span></button></div>' +
      '<div class="sb-stats">' + cfg.flow.map(function (f, i) {
        return '<div class="sb-stat"><b>' + counts[i] + '</b><span>' + esc(f) + '</span></div>';
      }).join('') + '</div>' +
      '<div class="sb-rows">' + (s.rows.length ? s.rows.map(function (r, i) {
        var last = r.step >= cfg.flow.length - 1;
        return '<div class="sb-row"><div><b>' + esc(r.name) + '</b><small>' + esc(cfg.who) + ': ' + esc(r.who) + ' &middot; ' + esc(r.when) + '</small></div>' +
          '<span class="tl-tag ' + (last ? 'ok' : r.step === 0 ? '' : 'warn') + '">' + esc(cfg.flow[r.step]) + '</span>' +
          (last ? '<span class="tl-tag ok">Closed</span>' : '<button class="sb-act" data-i="' + i + '">Move to ' + esc(cfg.flow[r.step + 1]) + '</button>') + '</div>';
      }).join('') : '<div class="sb-empty">Nothing here yet. Add the first one.</div>') + '</div>' +
      '<p class="tl-note">Everything you do here is real, running in your browser. Your version would run on your data, with your people signed in, and would not forget when you close the tab.</p>' +
      '</div></div>';

    doc.getElementById('sbNew').onclick = function () {
      var n = s.rows.length + 1;
      s.rows.unshift({ name: s.label.replace(/s$/, '') + ' ' + n, who: 'You', when: 'just now', step: 0 });
      sbRender();
    };
    $$('.sb-act', doc.getElementById('sbApp')).forEach(function (b) {
      b.onclick = function () { s.rows[+b.getAttribute('data-i')].step++; sbRender(); };
    });
  }

  function sandbox() {
    var kind = $('.seg button.on') ? $('.seg button.on').getAttribute('data-k') : 'approvals';
    var cfg = SB[kind];
    var team = val('sbTeam').trim() || 'Operations';
    var label = val('sbItem').trim() || cfg.title;
    sbState = {
      kind: kind, team: team, label: label,
      rows: cfg.seed.map(function (r, i) {
        return { name: r[0], who: r[1], when: ['2 hours ago', 'yesterday', 'Monday'][i] || 'last week', step: r[2] };
      })
    };
    doc.getElementById('sbIntro').setAttribute('hidden', '');
    sbRender();
    doc.getElementById('sbApp').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }


  /* 6 --------------------------------------------------------- blueprint */
  function pill(txt, i) {
    var c = /done|closed|approved|complete|paid|active/i.test(txt) ? 'g' : /progress|review|pending|open|new/i.test(txt) ? 'a' : '';
    return '<span class="scn-pill ' + c + '">' + esc(txt) + '</span>';
  }

  function screen(m, i) {
    var t = m.template || 'table', cols = m.columns || [], rows = m.rows || [], st = m.statuses || [], body = '';

    if (t === 'table' || t === 'portal') {
      var side = t === 'portal'
        ? '<div class="scn-side">' + (BP.modules || []).slice(0, 5).map(function (x, j) {
          return '<span class="' + (j === i ? 'on' : '') + '">' + esc((x.name || '').slice(0, 12)) + '</span>';
        }).join('') + '</div>' : '';
      var tbl = '<table class="scn-t"><thead><tr>' + cols.map(function (c) { return '<th>' + esc(c) + '</th>'; }).join('') +
        '</tr></thead><tbody>' + rows.slice(0, 4).map(function (r) {
          return '<tr>' + r.map(function (cell, k) {
            return '<td>' + (k === r.length - 1 && r.length > 1 ? pill(cell) : esc(cell)) + '</td>';
          }).join('') + '</tr>';
        }).join('') + '</tbody></table>';
      body = side ? '<div class="scn-p">' + side + '<div>' + tbl + '</div></div>' : tbl;

    } else if (t === 'kanban') {
      body = '<div class="scn-kb">' + (st.length ? st : ['To do', 'Doing', 'Done']).slice(0, 3).map(function (s, j) {
        var cards = rows.slice(j, j + 2).map(function (r) {
          return '<div class="scn-cd">' + esc(r[0] || 'Item') + '<i></i></div>';
        }).join('') || '<div class="scn-cd">Item<i></i></div>';
        return '<div class="scn-col"><h6>' + esc(s) + '</h6>' + cards + '</div>';
      }).join('') + '</div>';

    } else if (t === 'dashboard') {
      var k = (m.kpis || []).slice(0, 3);
      var hs = [54, 78, 42, 90, 66, 34, 72];
      body = '<div class="scn-kpis">' + (k.length ? k : [{ label: 'Open', value: '24' }]).map(function (x) {
        return '<div class="scn-kpi"><b>' + esc(x.value) + '</b><span>' + esc(x.label) + '</span>' +
          (x.delta ? '<em>' + esc(x.delta) + '</em>' : '') + '</div>';
      }).join('') + '</div><div class="scn-chart">' + hs.map(function (h, j) {
        return '<i style="height:' + h + '%;animation-delay:' + (j * 60) + 'ms"></i>';
      }).join('') + '</div>' +
        '<table class="scn-t"><tbody>' + rows.slice(0, 2).map(function (r) {
          return '<tr>' + r.slice(0, 3).map(function (cell, kk) {
            return '<td>' + (kk === 2 ? pill(cell) : esc(cell)) + '</td>';
          }).join('') + '</tr>';
        }).join('') + '</tbody></table>';

    } else if (t === 'form') {
      body = '<div class="scn-f">' + (m.fields || ['Field', 'Field', 'Field', 'Field']).slice(0, 6).map(function (f) {
        return '<div><small>' + esc(f) + '</small><i></i></div>';
      }).join('') + '</div><div class="scn-btn">Submit</div>';

    } else {  /* calendar */
      var labels = (st.length ? st : ['Visit', 'Service', 'Audit']);
      body = '<div class="scn-cal">' + [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(function (d, j) {
        var has = j === 1 || j === 4 || j === 8;
        return '<div class="' + (has ? 'has' : '') + '">' + d +
          (has ? '<em>' + esc(labels[j % labels.length]) + '</em>' : '') + '</div>';
      }).join('') + '</div>';
    }

    return '<div class="scn"><div class="scn-bar"><i></i><i></i><i></i><span>' +
      esc((BP.app && BP.app.name ? BP.app.name.toLowerCase().replace(/\s+/g, '') : 'app')) + '.app / ' +
      esc((m.name || '').toLowerCase()) + '</span></div><div class="scn-body">' + body + '</div></div>';
  }

  var BP = {};
  function blueprint() {
    var co = val('bpName').trim(), site = val('bpSite').trim(), what = val('bpWhat').trim(),
      prob = val('bpProb').trim(), ind = val('bpInd');
    if (!co || what.length < 20 || prob.length < 20) {
      fail('Add the company name, a line about what you do, and the problems you want solved. Twenty characters each is enough.');
      return;
    }
    var input = 'Company: ' + co + '\nWebsite: ' + (site || 'not given') + '\nIndustry: ' + ind +
      '\nWhat they do, in their words: ' + what + '\nProblems they want the software to solve: ' + prob;
    loading('Reading ' + (site || co) + ' and designing the application',
      'We read your site, study the usual problems in ' + ind.toLowerCase() + ', then draw the screens. About thirty seconds.');

    call('blueprint', { input: input, url: site }).then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) {
        if (!res.ok || !res.d.result) { fail(res.d && res.d.error ? res.d.error : 'Something went wrong. Try again in a moment.'); return; }
        BP = res.d.result;
        var d = { company: co, site: site, industry: ind, when: Date.now(), result: BP };
        window.__bpMeta = d;
        var slug = co.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'company';
        var base = location.pathname.replace(/[^/]*$/, '');
        var keep = function (id) {
          try {
            localStorage.setItem('sv-bp:' + id, JSON.stringify(d));
            localStorage.setItem('sv-bp-last', id);
          } catch (e) {}
          location.href = base + 'application/?c=' + encodeURIComponent(id);
        };
        loading('Saving your blueprint', 'One moment, it is getting its own address.');
        fetch(WORKER.replace(/\/$/, '') + '/publish', {
          method: 'POST', headers: heads(), body: JSON.stringify(d)
        }).then(function (r) { return r.ok ? r.json() : null; })
          .then(function (p) { keep(p && p.id ? p.id : slug); })
          .catch(function () { keep(slug); });          // offline or blocked: still works in this browser
        return;
        wireGrab({
          tool: 'Application Blueprint',
          summary: 'Company: ' + co + ' (' + site + ', ' + ind + ')\nApp: ' + (BP.app || {}).name + '\n' +
            ((BP.app || {}).one_line || '') + '\n\nTheir problems:\n' + prob.slice(0, 600)
        }, unlock);
        fills();
        var o = out(); if (o && o.scrollIntoView) o.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }).catch(function () {
        fail('Could not reach the generator. Check your connection and try again, or book a call and we will run it with you.');
      });
  }

  function renderBlueprint(co) {
    var A = BP.app || {}, R = BP.read || {}, S = BP.simple || {}, mods = BP.modules || [], sec = function (kick, title, inner, locked) {
      return '<div class="bp-sec"' + '' + '><h4>' + esc(kick) + '</h4><h5>' + esc(title) + '</h5>' + inner + '</div>';
    };

    var signals = (R.signals || []).map(function (s) { return '<span>' + esc(s) + '</span>'; }).join('');
    var problems = (BP.problems || []).map(function (p) {
      return '<div class="bp-card"><b>' + esc(p.said) + '</b><p>' + esc(p.costs) + '</p>' +
        '<span class="fix">Fixed by: ' + esc(p.fixed_by) + '</span></div>';
    }).join('');
    var roles = (BP.roles || []).map(function (r) {
      return '<div class="bp-card"><b>' + esc(r.role) + '</b><p>Opens on ' + esc(r.sees) + '. ' + esc(r.does) + '</p></div>';
    }).join('');
    var feats = (BP.features || []).map(function (f) {
      return '<div class="bp-card"><b>' + esc(f.title) + '</b><p>' + esc(f.body) + '</p></div>';
    }).join('');
    var nums = (BP.benefits || []).map(function (b) {
      return '<div class="bp-num"><b>' + esc(b.value) + '</b><span>' + esc(b.label) + '</span><p>' + esc(b.note) + '</p></div>';
    }).join('');
    var ints = (BP.integrations || []).map(function (i) {
      return '<div class="bp-card"><b>' + esc(i.tool) + '</b><p>' + esc(i.why) + '</p></div>';
    }).join('');
    var plan = (BP.phases || []).map(function (p) {
      return '<div class="wk"><b>' + esc(p.week) + '</b><p>' + esc(p.does) + '</p></div>';
    }).join('');
    var risks = (BP.risks || []).map(function (r) {
      return '<div class="bp-card"><b>' + esc(r.risk) + '</b><p>' + esc(r.handle) + '</p></div>';
    }).join('');

    function modBlock(m, i) {
      return '<div class="bp-mod' + (i % 2 ? ' flip' : '') + '"><div class="bp-copy"><span class="n">' +
        ('0' + (i + 1)).slice(-2) + '</span><h6>' + esc(m.name) + '</h6><p>' + esc(m.purpose) + '</p>' +
        '<div class="who">' + (BP.roles || []).slice(0, 3).map(function (r) { return '<span>' + esc(r.role) + '</span>'; }).join('') +
        '</div></div><div>' + screen(m, i) + '</div></div>';
    }

    out().innerHTML = '<div class="bp">' +
      '<div class="bp-hero"><span class="lbl">Application blueprint for ' + esc(co) + '</span>' +
      '<h3>' + esc(A.name || 'Your application') + '</h3><p>' + esc(A.one_line || '') + '</p>' +
      '<div class="bp-facts"><span>' + mods.length + ' modules</span><span>' + (BP.roles || []).length + ' roles</span>' +
      '<span>' + (BP.phases || []).length + ' week build</span><span>' + esc((BP.integrations || []).length) + ' integrations</span></div></div>' +

      sec('What we read on your site', R.does || 'What you do',
        '<p style="color:var(--t2);font-size:15px;line-height:1.7;margin:0 0 14px;max-width:70ch">' +
        esc(R.serves || '') + '</p><div class="bp-facts">' + signals + '</div>') +

      sec('The problems this solves', 'Where the day goes today.', '<div class="bp-grid">' + problems + '</div>') +

      (S.what_it_is ? sec('In plain words', 'What this app is.',
        '<p class="plain">' + esc(S.what_it_is) + '</p>' +
        (S.before && S.after ? '<div class="ba2">' +
          '<div class="ba-col now"><h6>How it works today</h6><ul>' +
          (S.before || []).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>' +
          '<div class="ba-col next"><h6>How it works with the app</h6><ul>' +
          (S.after || []).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div></div>' : '')) : '') +

      ((S.steps || []).length ? sec('Step by step', 'What a normal day looks like.',
        '<div class="steps3">' + (S.steps || []).map(function (x, i) {
          return '<div class="step3"><b>' + esc(x.n || (i + 1)) + '</b><p>' + esc(x.does) + '</p></div>';
        }).join('') + '</div>') : '') +

      sec('The application', 'What you would be using, screen by screen.',
        mods.slice(0, 1).map(modBlock).join('') +
        '<div>' + mods.slice(1).map(function (m, i) { return modBlock(m, i + 1); }).join('') + '</div>') +

      sec('Who signs in', 'Every role opens on the thing they need.', '<div class="bp-grid">' + roles + '</div>', true) +

      sec('What it does for you', 'The reason to build it.', '<div class="bp-nums">' + nums + '</div>', true) +

      sec('Features that matter', 'Six things your team would feel in week one.', '<div class="bp-grid">' + feats + '</div>', true) +

      sec('Connects to', 'It fits the tools you already pay for.', '<div class="bp-grid">' + ints + '</div>', true) +

      sec('How it gets built', 'Four weeks, in the open.',
        '<p style="color:var(--t2);font-size:15px;line-height:1.7;margin:0 0 18px;max-width:70ch">' + esc(A.why_now || '') + '</p>' + plan, true) +

      sec('What could go wrong', 'Named early, handled in the plan.', '<div class="bp-grid">' + risks + '</div>', true) +

      ((S.faq || []).length ? sec('Questions people ask', 'Short answers, no jargon.',
        '<div class="bp-grid">' + (S.faq || []).map(function (f) {
          return '<div class="bp-card"><b>' + esc(f.q) + '</b><p>' + esc(f.a) + '</p></div>';
        }).join('') + '</div>') : '') +

      '<div class="bp-sec">' + grab('See the whole blueprint',
        'Every module drawn out, the roles, the features, what it saves you, the integrations, the four week plan and the risks.', {}) + '</div>' +
      '</div>';
  }

  /* the saved blueprint, on its own page ---------------------------------- */
  function application() {
    var slug = (location.search.match(/[?&]c=([^&]+)/) || [])[1];
    slug = slug ? decodeURIComponent(slug) : '';
    if (!slug) {
      var m = location.pathname.match(/application\/([^/?#]+)/);
      slug = m ? decodeURIComponent(m[1]) : (localStorage.getItem('sv-bp-last') || '');
    }
    var raw = null;
    try { raw = localStorage.getItem('sv-bp:' + slug); } catch (e) {}
    var host = doc.getElementById('appOut');
    if (!host) return;
    if (!raw) {                                              // not this browser: try the shared copy
      host.innerHTML = '<div class="load"><div class="dots"><i></i><i></i><i></i></div><p>Opening this blueprint</p></div>';
      fetch(WORKER.replace(/\/$/, '') + '/shared?id=' + encodeURIComponent(slug))
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) {
          if (!d || !d.result) {
            host.innerHTML = '<div class="tl-empty" style="padding:70px 30px"><p style="margin:0 0 16px">This link has expired, or it was never shared. ' +
              'Shared blueprints stay open for thirty days.</p>' +
              '<a class="btn btn-primary" href="../tool-blueprint.html">Make a blueprint<span class="shine"></span></a></div>';
            return;
          }
          show(d, slug, true);
        })
        .catch(function () {
          host.innerHTML = '<div class="tl-empty" style="padding:70px 30px"><p style="margin:0">Could not open this blueprint. Check your connection and try again.</p></div>';
        });
      return;
    }
    show(JSON.parse(raw), slug, false);
  }

  function show(d, slug, shared) {
    var host = doc.getElementById('appOut');
    BP = d.result || {};
    window.__bpMeta = d;
    doc.title = (BP.app && BP.app.name ? BP.app.name : 'Application') + ' for ' + d.company + ', Solviqo';
    var pretty = location.pathname.replace(/application\/.*$/, 'application/') + slug;
    try { history.replaceState({}, '', pretty); } catch (e) {}
    var meta = doc.getElementById('appMeta');
    if (meta) {
      meta.innerHTML = '<div><span class="kick"><b></b> Application blueprint</span><h1 class="v6-h1" style="margin-top:12px">' +
        esc(d.company) + '</h1><p class="lede" style="margin-top:10px">' +
        esc(d.site || '') + (d.industry ? ' &middot; ' + esc(d.industry) : '') + ' &middot; prepared ' +
        new Date(d.when || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) + '</p>' +
        (d.until ? '<p class="lede" style="margin-top:6px;font-size:14px;color:var(--t3)">Shared link, open until ' +
          new Date(d.until).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) + '</p>' : '') + '</div>' +
        '<div class="app-acts"><button class="btn btn-primary" type="button" onclick="window.svPrint(this)">Download PDF<span class="shine"></span></button>' +
        '<a class="btn btn-ghost" href="https://cal.com/nisarg-mehta/solviqo/" target="_blank" rel="noopener">Book a call</a></div>';
    }
    out = function () { return host; };
    renderBlueprint(d.company);
    fills();
  }

  /* wiring --------------------------------------------------------------- */
  var RUN = { leak: leak, bb: buildbuy, spec: spec, auto: automation, sandbox: sandbox, blueprint: blueprint };
  if (tool === 'application') { application(); return; }
  var btn = doc.getElementById('tlRun');
  if (btn && RUN[tool]) btn.onclick = function () { RUN[tool](); };

  $$('.seg button').forEach(function (b) {
    b.onclick = function () {
      $$('.seg button', b.parentNode).forEach(function (o) { o.classList.remove('on'); });
      b.classList.add('on');
    };
  });

  $$('form.tl-form').forEach(function (f) { f.onsubmit = function (e) { e.preventDefault(); if (RUN[tool]) RUN[tool](); }; });
})();
