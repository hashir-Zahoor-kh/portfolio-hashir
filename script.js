// ── Terminal interlude ───────────────────────────────────────────
(function initTerminal() {
  const termBox   = document.getElementById('term-box');
  const termBody  = document.getElementById('term-body');
  const termInput = document.getElementById('term-input');
  const inputLine = document.getElementById('term-input-line');

  if (!termBox || !termBody || !termInput) return;

  // Click anywhere in box → focus input
  termBox.addEventListener('click', () => termInput.focus());

  // Command history
  const cmdHistory = [];
  let histIdx = -1;

  // Fortunes pool
  const fortunes = [
    '"The cluster you ignore is the one that pages you at 3am."',
    '"Error budgets are like sleep: spend them wisely."',
    '"Every outage is a postmortem someone hasn\'t written yet."',
    '"If it isn\'t in Terraform, it doesn\'t exist."',
    '"Cache invalidation is hard. Naming is harder. You knew this."',
  ];

  // Command responses
  const COMMANDS = {
    'help': '__help__',
    'kubectl get pods': [
      'NAME                    READY   STATUS             RESTARTS   AGE',
      'chaos-agent-7d8f9c      1/1     \x02Running\x03            0          3d',
      'chaos-agent-9k2m1       1/1     \x02Running\x03            0          3d',
      'experiment-runner-x4f   1/1     \x02Running\x03            0          12h',
      'payment-api-broken-1    0/1     \x01CrashLoopBackOff\x03   7          2m',
    ],
    'kubectl get pods -n havoc': '__alias__kubectl get pods',
    'kubectl describe pod payment-api-broken-1': [
      'Name:           payment-api-broken-1',
      'Namespace:      havoc',
      'Status:         Running',
      'Containers:',
      '  app:',
      '    State:          Waiting',
      '      Reason:       \x01CrashLoopBackOff\x03',
      '    Last State:     Terminated',
      '      Reason:       \x01OOMKilled\x03',
      '      Exit Code:    137',
      '    Limits:',
      '      memory:       256Mi',
      '    Requests:',
      '      memory:       128Mi',
      'Events:',
      '  BackOff   Back-off restarting failed container',
    ],
    'kubectl logs payment-api-broken-1': [
      '2026/05/30 14:22:03 starting payment-api on :8080',
      '2026/05/30 14:22:04 connected to postgres',
      '2026/05/30 14:22:11 processing batch of 4096 transactions',
      '2026/05/30 14:22:13 runtime: out of memory: cannot allocate',
      'fatal \x01error\x03: runtime: out of memory',
      'goroutine 1 [running]:',
      'runtime.throw({0x4f8a21, 0x16})',
      'SIGKILL: killed (137)',
    ],
    'terraform plan': [
      'Terraform will perform the following actions:',
      '+ aws_s3_bucket.logs',
      '    versioning  = true',
      '    encryption  = "aws:kms"',
      '+ aws_iam_role.access',
      '    name        = "logs-read-only"',
      'Plan: 2 to add, 0 to change, 0 to destroy.',
    ],
    'helm list': [
      'NAME             NAMESPACE   REVISION   STATUS      CHART',
      'havoc-control    havoc       4          \x02deployed\x03    havoc-1.2.0',
      'prometheus       monitoring  7          \x02deployed\x03    kube-prom-55.1',
      'kube-sentinel    sentinel    2          \x02deployed\x03    sentinel-0.4.1',
    ],
    'prometheus query': [
      'Query: sum(rate(http_requests_total{status="5xx"}[5m]))',
      'Result: 0.034 req/sec',
      'Status: within SLO. Error budget at 62%.',
    ],
    'hashir --about': [
      'Hashir Zahoor. SRE. Builds systems that fail gracefully.',
      'B.S. Computer Science, Adelphi University, May 2025.',
      'NYC. Open to relocation. Sponsorship needed.',
    ],
    'hashir --projects': [
      '01  Havoc          Chaos engineering on EKS',
      '02  TerraSense     LLM-driven Terraform with policy correction loop',
      '03  CricInsight    Cricket analytics API, 2,962 international matches',
      '04  Kube-Sentinel  K8s controller that auto-remediates pod failures',
      '05  Canary-Runner  SLO + error budget monitor',
      '06  Chess          20 concurrent TCP matches, FEN-validated engine',
    ],
    'hashir --stack': [
      'Languages:    Go, Python, Java, Bash, JavaScript/TypeScript',
      'Cloud:        AWS, Cloudflare',
      'Infra:        Terraform, Helm, Docker, Kubernetes',
      'CI/CD:        GitHub Actions',
      'Streaming:    Kafka',
      'Observability: Prometheus, Grafana, New Relic',
      'Storage:      PostgreSQL, MongoDB, Redis',
    ],
    'hashir --contact': [
      'Email:    hashirzahoor74@icloud.com',
      'LinkedIn: linkedin.com/in/hashirzahoor',
      'GitHub:   github.com/hashir-Zahoor-kh',
    ],
    'whoami': ['You. Hopefully a recruiter. Welcome.'],
    'fortune': '__fortune__',
    'ls projects/': [
      'havoc/         terrasense/    cricinsight/',
      'kube-sentinel/ canary-runner/ multithreaded-chess/',
    ],
    'cat /etc/passwd': ['Permission denied. Nice try.'],
    'ping recruiter': [
      'PING recruiter.linkedin.com (192.0.2.42): 56 data bytes',
      '64 bytes from 192.0.2.42: icmp_seq=0 time=12.4 ms',
      '64 bytes from 192.0.2.42: icmp_seq=1 time=11.8 ms',
      '^C',
      '--- recruiter.linkedin.com ping statistics ---',
      '2 packets transmitted, 2 received, 0.0% packet loss',
      '\x02Connection healthy. They can hear you.\x03',
    ],
    'git blame': ['Fair.'],
    'vim': [
      'vim opened. you cannot leave. there is no :q from here.',
      '(kidding. just refresh the page.)',
    ],
    'coffee': [
      'command not found: coffee',
      'did you mean: `brew install coffee`?',
    ],
    'make chaos': [
      '[havoc] starting experiment: pod-kill',
      '[havoc] blast radius: 1 pod, namespace=demo',
      '[havoc] target acquired: demo-api-3',
      '[havoc] kill signal sent',
      '[havoc] pod terminated. cluster still standing. good.',
    ],
    'rm -rf /': ['nope.'],
    'sudo hire-me': '__hire__',
    'clear': '__clear__',
  };

  // Render a text line with inline color codes
  // \x01...\x03 → .term-err, \x02...\x03 → .term-ok
  function renderText(text) {
    return text
      .replace(/\x01(.*?)\x03/g, '<span class="term-err">$1</span>')
      .replace(/\x02(.*?)\x03/g, '<span class="term-ok">$1</span>');
  }

  function addLine(html, isOutput) {
    const div = document.createElement('div');
    div.className = 'term-line' + (isOutput ? '' : '');
    if (isOutput) {
      const span = document.createElement('span');
      span.className = 'term-output';
      span.innerHTML = renderText(html);
      div.appendChild(span);
    } else {
      div.innerHTML = html;
    }
    termBody.insertBefore(div, inputLine);
  }

  function addBlank() {
    const div = document.createElement('div');
    div.className = 'term-line term-line--blank';
    termBody.insertBefore(div, inputLine);
  }

  function scrollBottom() {
    termBody.scrollTop = termBody.scrollHeight;
  }

  function addCmdLine(cmd) {
    const div = document.createElement('div');
    div.className = 'term-line term-line--cmd';
    div.innerHTML = '<span class="term-prompt">$</span><span class="term-cmd-text"> ' +
      cmd.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</span>';
    termBody.insertBefore(div, inputLine);
  }

  function resolveCommand(raw) {
    const lower = raw.trim().toLowerCase();
    // Check exact match first
    for (const key of Object.keys(COMMANDS)) {
      if (key.toLowerCase() === lower) {
        let val = COMMANDS[key];
        if (typeof val === 'string' && val.startsWith('__alias__')) {
          val = COMMANDS[val.slice(9)];
        }
        return { key, val };
      }
    }
    return null;
  }

  function executeCommand(raw) {
    const cmd = raw.trim();
    if (!cmd) return;

    // Push to user history
    cmdHistory.unshift(cmd);
    histIdx = -1;

    addCmdLine(cmd);

    const match = resolveCommand(cmd);

    if (!match) {
      addLine('', true);
      const errDiv = document.createElement('div');
      errDiv.className = 'term-line';
      const span = document.createElement('span');
      span.className = 'term-output';
      span.innerHTML = 'command not found: <span class="term-err">' +
        cmd.replace(/&/g,'&amp;').replace(/</g,'&lt;') +
        '</span>. try `help`';
      errDiv.appendChild(span);
      termBody.insertBefore(errDiv, inputLine);
      addBlank();
      scrollBottom();
      return;
    }

    const { val } = match;

    if (val === '__help__') {
      const helpRows = [
        ['kubectl get pods',            'Pods in the havoc namespace'],
        ['kubectl describe pod <name>', 'Describe a pod'],
        ['kubectl logs <name>',         'Tail pod logs'],
        ['terraform plan',              'Preview infrastructure changes'],
        ['helm list',                   'Installed releases'],
        ['prometheus query',            'Run a sample PromQL query'],
        ['hashir --about',              'Who am I'],
        ['hashir --projects',           "What I've built"],
        ['hashir --stack',              'What I work with'],
        ['hashir --contact',            'How to reach me'],
        ['whoami',                      'Self-identify'],
        ['fortune',                     'A small piece of wisdom'],
        ['ls projects/',                'List project directories'],
        ['cat /etc/passwd',             "Don't"],
        ['ping recruiter',              'Test the connection'],
        ['git blame',                   'Find the culprit'],
        ['vim',                         'Enter, never leave'],
        ['coffee',                      'Caffeine via shell'],
        ['make chaos',                  'Run a Havoc experiment'],
        ['sudo hire-me',                'The only command that matters'],
        ['clear',                       'Clear the terminal'],
      ];
      addBlank();
      const title = document.createElement('div');
      title.className = 'term-line';
      title.innerHTML = '<span class="term-output">Available commands:</span>';
      termBody.insertBefore(title, inputLine);
      const grid = document.createElement('div');
      grid.className = 'help-table';
      helpRows.forEach(([cmd, desc]) => {
        const cmdEl = document.createElement('span');
        cmdEl.className = 'help-cmd';
        cmdEl.textContent = cmd;
        const descEl = document.createElement('span');
        descEl.className = 'help-desc';
        descEl.textContent = desc;
        grid.appendChild(cmdEl);
        grid.appendChild(descEl);
      });
      termBody.insertBefore(grid, inputLine);
      addBlank();
      scrollBottom();
      return;
    }

    if (val === '__clear__') {
      // Remove all lines except the input line
      const lines = termBody.querySelectorAll('.term-line:not(#term-input-line), .term-line--blank:not(#term-input-line)');
      lines.forEach(l => { if (l !== inputLine) l.remove(); });
      scrollBottom();
      return;
    }

    if (val === '__fortune__') {
      const f = fortunes[Math.floor(Math.random() * fortunes.length)];
      addBlank();
      addLine(f, true);
      addBlank();
      scrollBottom();
      return;
    }

    if (val === '__hire__') {
      addBlank();
      addLine('request received. routing to contact section...', true);
      addBlank();
      scrollBottom();
      setTimeout(() => {
        const contact = document.getElementById('contact');
        if (contact) contact.scrollIntoView({ behavior: 'smooth' });
        setTimeout(() => {
          const emailItem = document.querySelector('#contact .contact-item');
          if (emailItem) {
            emailItem.classList.add('contact-item--pulse');
            emailItem.addEventListener('animationend', () => {
              emailItem.classList.remove('contact-item--pulse');
            }, { once: true });
          }
        }, 600);
      }, 700);
      return;
    }

    addBlank();
    val.forEach(line => addLine(line, true));
    addBlank();
    scrollBottom();
  }

  termInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const val = termInput.value.trim();
      termInput.value = '';
      executeCommand(val);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (histIdx < cmdHistory.length - 1) {
        histIdx++;
        termInput.value = cmdHistory[histIdx];
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (histIdx > 0) {
        histIdx--;
        termInput.value = cmdHistory[histIdx];
      } else {
        histIdx = -1;
        termInput.value = '';
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
    }
  });

  // Marquee chip clicks
  document.querySelectorAll('.marquee-chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      e.stopPropagation();
      termInput.value = chip.dataset.cmd;
      termInput.focus();
    });
  });
})();

// ── Ken Burns — only animates when background is in view ─────────
const kenBurnsTween = gsap.to('.bg-image', {
  scale: 1.05,
  duration: 30,
  ease: 'none',
  yoyo: true,
  repeat: -1,
  paused: true,
});

// Observe the hero (.main-view), not .bg-layer — bg-layer is
// position:fixed so it's always "in viewport" from the IO's
// perspective. main-view scrolls out, giving us the right signal.
const heroEl = document.querySelector('.main-view');
if (heroEl && 'IntersectionObserver' in window) {
  const bgObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        kenBurnsTween.resume();
      } else {
        kenBurnsTween.pause();
      }
    });
  }, { threshold: 0, rootMargin: '0px' });
  bgObserver.observe(heroEl);
} else {
  // Fallback: no IntersectionObserver support → just run it
  kenBurnsTween.resume();
}

// ── SVG border — fit geometry to actual card dimensions ──────────
function fitCardBorder() {
  const card  = document.getElementById('card');
  const svg   = card.querySelector('.card-border');
  const outer = card.querySelector('.border-outer');
  const inner = card.querySelector('.border-inner');
  const w = card.offsetWidth;
  const h = card.offsetHeight;

  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  outer.setAttribute('x', '1');        outer.setAttribute('y', '1');
  outer.setAttribute('width', w - 2);  outer.setAttribute('height', h - 2);
  inner.setAttribute('x', '9');        inner.setAttribute('y', '9');
  inner.setAttribute('width', w - 18); inner.setAttribute('height', h - 18);
}

window.addEventListener('resize', fitCardBorder);

// ── Typing animation ─────────────────────────────────────────────
(function initTyping() {
  const phrases = [
    'Distributed Systems Engineer',
    'Infrastructure Engineer',
    'Cloud-Native Builder',
    'Software Engineer',
  ];
  const el = document.getElementById('typing-text');
  let pi = 0, ci = 0, deleting = false;

  function tick() {
    const phrase = phrases[pi];
    el.textContent = deleting ? phrase.slice(0, --ci) : phrase.slice(0, ++ci);

    let delay = deleting ? 45 : 88;
    if (!deleting && ci === phrase.length)  { delay = 1900; deleting = true; }
    else if (deleting && ci === 0)          { deleting = false; pi = (pi + 1) % phrases.length; delay = 380; }
    setTimeout(tick, delay);
  }
  tick();
})();

// ── Main init ────────────────────────────────────────────────────
document.fonts.ready.then(() => {
  fitCardBorder();

  const overlay       = document.getElementById('intro-overlay');
  const outer         = document.querySelector('.border-outer');
  const inner         = document.querySelector('.border-inner');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const alreadyPlayed = sessionStorage.getItem('hz-intro-played');

  // Prepare SVG border for draw animation
  const outerLen = outer.getTotalLength();
  const innerLen = inner.getTotalLength();
  gsap.set(outer, { strokeDasharray: outerLen, strokeDashoffset: outerLen });
  gsap.set(inner, { strokeDasharray: innerLen, strokeDashoffset: innerLen });

  function drawBorder() {
    gsap.to(outer, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut' });
    gsap.to(inner, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut', delay: 0.13 });
  }

  // Skip intro entirely on second visit or reduced motion
  if (reducedMotion || alreadyPlayed) {
    overlay.style.display = 'none';
    gsap.set('#card', { opacity: 1, y: 0 });
    gsap.set([outer, inner], { strokeDashoffset: 0 });
    return;
  }

  // Card hidden until intro resolves
  gsap.set('#card', { opacity: 0, y: 24 });

  let tl;

  function skip() {
    if (tl) tl.kill();
    overlay.style.display = 'none';
    gsap.set('#card', { opacity: 1, y: 0 });
    gsap.set([outer, inner], { strokeDashoffset: 0 });
    sessionStorage.setItem('hz-intro-played', '1');
  }

  overlay.addEventListener('click', skip);
  window.addEventListener('keydown', skip, { once: true });

  tl = gsap.timeline({
    onComplete() {
      sessionStorage.setItem('hz-intro-played', '1');
      overlay.removeEventListener('click', skip);
    },
  });

  const lines = document.querySelectorAll('.intro-line');

  lines.forEach((line, i) => {
    const isLast = i === lines.length - 1;

    // Fade up in — slower for readability
    tl.fromTo(line,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.55, ease: 'power2.out' }
    );

    // Hold long enough to read, last line holds longest
    tl.to(line,
      { opacity: 0, duration: 0.35, ease: 'power2.in' },
      isLast ? '+=1.8' : '+=1.1'
    );
  });

  // Wipe overlay upward
  tl.to(overlay, {
    yPercent: -100,
    duration: 1.2,
    ease: 'power3.inOut',
    onComplete: () => { overlay.style.display = 'none'; },
  }, '+=0.1');

  // Card entrance — overlaps with wipe
  tl.to('#card', {
    opacity: 1,
    y: 0,
    duration: 0.88,
    ease: 'power3.out',
    onComplete: drawBorder,
  }, '-=0.52');
});
