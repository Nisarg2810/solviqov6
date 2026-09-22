/* Free tools: four calculators and a sandbox. Two of them call the Claude proxy worker. */
(function () {
  'use strict';

  var WORKER = 'https://solviqo-tools.nisargmehta-1028.workers.dev';   // set this to your deployed worker
  var EJ = { key: 'QX_zYoZlN7ibZXYNv', service: 'nisargmehta2810', template: 'template_wa24pe8' };

  var doc = document, tool = doc.body.getAttribute('data-tool');
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

  /* lead capture --------------------------------------------------------- */
  var LEAD = { sent: false };
  function grab(title, blurb, payload) {
    if (LEAD.sent) { return '<div class="grab"><div class="done">' + TICK + '<div>The full report is open below, and a copy is on its way to us. We will send it over and follow up only if you ask.</div></div></div>'; }
    return '<div class="grab" id="grab"><h4>' + esc(title) + '</h4><p>' + esc(blurb) + '</p>' +
      '<div class="q2"><div class="tl-q"><input type="text" id="ldName" placeholder="Your name" autocomplete="name"></div>' +
      '<div class="tl-q"><input type="text" id="ldCo" placeholder="Company" autocomplete="organization"></div></div>' +
      '<div class="tl-q"><input type="email" id="ldMail" placeholder="Work email" autocomplete="email"></div>' +
      '<button class="btn btn-primary" id="ldBtn" type="button" style="width:100%">Unlock the full report<span class="shine"></span></button>' +
      '<p class="tl-note" style="margin-top:12px">No list, no drip sequence. One email with your report, and nothing else unless you reply.</p></div>';
  }

  function wireGrab(payload, onUnlock) {
    var btn = doc.getElementById('ldBtn');
    if (!btn) { onUnlock(); return; }
    btn.onclick = function () {
      var name = val('ldName').trim(), mail = val('ldMail').trim(), co = val('ldCo').trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) {
        doc.getElementById('ldMail').style.borderColor = 'var(--bad-500)';
        doc.getElementById('ldMail').focus();
        return;
      }
      btn.disabled = true; btn.textContent = 'Opening your report';
      var msg = 'New tool lead: ' + payload.tool + '\n\n' + name + (co ? ' at ' + co : '') + '\n' + mail + '\n\n' + payload.summary;
      fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: EJ.service, template_id: EJ.template, user_id: EJ.key,
          template_params: {
            page_name: payload.tool, link: location.href, time: new Date().toLocaleString(),
            location: co || 'Not given', button_label: name + ' <' + mail + '>',
            event: 'Tool lead', message: msg
          }
        })
      }).catch(function () {});
      LEAD.sent = true;
      onUnlock();
    };
  }

  function unlock() {
    $$('[data-locked]', out()).forEach(function (e) { e.removeAttribute('hidden'); });
    var g = doc.getElementById('grab');
    if (g) g.outerHTML = '<div class="grab"><div class="done">' + TICK +
      '<div><b style="color:var(--t1)">Report unlocked.</b> Everything below is yours. Use the print button for a PDF, and we will email a copy as well.</div></div>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:15px">' +
      '<button class="btn btn-ghost" type="button" onclick="window.print()">Save as PDF</button>' +
      '<a class="btn btn-primary" href="contact.html">Talk it through in 20 minutes<span class="shine"></span></a></div></div>';
    fills();
  }

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

      '<div class="blk" data-locked hidden><h4>Where the money goes</h4><div class="tl-bars">' +
      leaks.map(function (l) {
        return '<div class="bar-row"><div class="rt"><span>' + esc(l[0]) + '</span><b>' + money(l[1]) + '</b></div>' +
          '<div class="bar-t"><i data-w="' + Math.round(l[1] / total * 100) + '"></i></div>' +
          '<div style="color:var(--t3);font-size:12px;margin-top:5px">' + esc(l[2]) + '</div></div>';
      }).join('') + '</div></div>' +

      '<div class="blk" data-locked hidden><h4>The rest of the picture</h4>' +
      '<div class="tl-kv"><span>People time in the process</span><b>' + hrs(annualHours) + ' a year</b></div>' +
      '<div class="tl-kv"><span>Of that, work done twice</span><b class="up">' + hrs(reworkHours) + '</b></div>' +
      (waitDays ? '<div class="tl-kv"><span>Waiting time across all requests</span><b class="up">' + Math.round(waitDays).toLocaleString('en-IN') + ' days a year</b></div>' : '') +
      '<div class="tl-kv"><span>Cost per request handled</span><b>' + (vol ? money(total / (vol * 12)) : 'Add a volume') + '</b></div>' +
      '<div class="tl-kv"><span>Realistic recovery with one system</span><b class="good">' + money(saving) + ' a year</b></div></div>' +

      '<div class="blk" data-locked hidden><h4>What we would fix first</h4><ul class="tl-ticks">' +
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

      '<div class="blk" data-locked hidden><h4>Over ' + years + ' years</h4>' +
      '<div class="tl-kv"><span>Licences and workarounds</span><b class="up">' + money(endBuy) + '</b></div>' +
      '<div class="tl-kv"><span>Build once, then maintain</span><b class="good">' + money(endOwn) + '</b></div>' +
      '<div class="tl-kv"><span>Difference</span><b class="' + (diff > 0 ? 'good' : 'up') + '">' + money(Math.abs(diff)) + (diff > 0 ? ' saved' : ' more') + '</b></div>' +
      '<div class="tl-kv"><span>Licence cost in year ' + years + ' alone</span><b>' + money(seats * price * 12 * Math.pow(1 + rise / 100, years - 1)) + '</b></div>' +
      '<div class="tl-kv"><span>Workaround labour a year</span><b class="up">' + money(extra * 52 * rate) + '</b></div></div>' +

      '<div class="blk" data-locked hidden><h4>What the numbers assume</h4><ul class="tl-ticks tl-q">' +
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
  function ask(path, input, render, payload) {
    fetch(WORKER.replace(/\/$/, '') + '/' + path, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ input: input })
    }).then(function (r) {
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

        '<div class="blk" data-locked hidden><h4>Screens to build</h4>' + list(r.screens, function (x) {
          return '<div class="mini"><b>' + esc(x.name) + '</b><p>' + esc(x.purpose) + '</p>' +
            '<div class="fields">' + (x.key_fields || []).map(function (f) { return '<span>' + esc(f) + '</span>'; }).join('') + '</div></div>';
        }) + '</div>' +

        '<div class="blk" data-locked hidden><h4>What the database holds</h4>' + list(r.data, function (x) {
          return '<div class="mini"><b>' + esc(x.entity) + '</b><p>' + esc(x.note || '') + '</p>' +
            '<div class="fields">' + (x.fields || []).map(function (f) { return '<span>' + esc(f) + '</span>'; }).join('') + '</div></div>';
        }) + '</div>' +

        '<div class="blk" data-locked hidden><h4>Connects to</h4>' + list(r.integrations, function (x) {
          return '<div class="mini"><b>' + esc(x.tool) + '</b><p>' + esc(x.why) + '</p></div>';
        }) + '</div>' +

        '<div class="blk" data-locked hidden><h4>Ships in version one</h4><ul class="tl-ticks">' +
        list(r.phase_one, function (x) { return '<li>' + esc(x) + '</li>'; }) + '</ul></div>' +

        '<div class="blk" data-locked hidden><h4>Can wait</h4><ul class="tl-ticks tl-q">' +
        list(r.later, function (x) { return '<li>' + esc(x) + '</li>'; }) + '</ul></div>' +

        '<div class="blk" data-locked hidden><h4>What could go wrong</h4>' + list(r.risks, function (x) {
          return '<div class="mini"><b>' + esc(x.risk) + '</b><p>' + esc(x.handle) + '</p></div>';
        }) + '</div>' +

        '<div class="blk" data-locked hidden><h4>Four week plan</h4>' + list(r.plan, function (x) {
          return '<div class="wk"><b>' + esc(x.week) + '</b><p>' + esc(x.does) + '</p></div>';
        }) + '</div>' +

        '<div class="blk" data-locked hidden><h4>Answer these before anyone builds</h4><ul class="tl-ticks tl-q">' +
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

        '<div class="blk" data-locked hidden><h4>Every task, scored</h4>' +
        tasks.map(function (t) {
          var cls = t.verdict === 'Automate now' ? 'ok' : t.verdict === 'Keep human' ? '' : 'warn';
          return '<div class="tl-task"><div class="tl-th"><b>' + esc(t.task) + '</b><span class="tl-tag' + cls + '">' + esc(t.verdict) + '</span></div>' +
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
          '<span class="tl-tag' + (last ? 'ok' : r.step === 0 ? '' : 'warn') + '">' + esc(cfg.flow[r.step]) + '</span>' +
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

  /* wiring --------------------------------------------------------------- */
  var RUN = { leak: leak, bb: buildbuy, spec: spec, auto: automation, sandbox: sandbox };
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
