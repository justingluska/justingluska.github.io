/* Zone of Genius: a 50-question, research-backed self-assessment.
 *
 * Model: 6 "genius zones," each triangulated across RIASEC (Holland) +
 * CliftonStrengths domains + Big Five facets, scored on TWO axes:
 * skill (am I good at this) and energy (does this light me up). The
 * skill x energy quadrant maps each zone onto Gay Hendricks' four zones
 * (Incompetence / Competence / Excellence / Genius) from "The Big Leap."
 *
 * Pure client-side. No backend, no dependencies. Answers persist in
 * localStorage so a refresh resumes where you left off.
 */
(function () {
  "use strict";

  // ---- Zones -------------------------------------------------------------
  // order matters: used for the radar axis order
  var ZONES = {
    builder: {
      key: "builder",
      name: "The Builder",
      tagline: "Turns chaos into shipped, finished work.",
      lineage: "Executing · Holland: Conventional · Big Five: Conscientiousness",
      definition:
        "You take ambiguous goals and turn them into organized, reliable, finished work. Where others keep talking, you make it actually happen, on time and to spec.",
      roles:
        "Operations, project & delivery management, program owner, chief-of-staff, the person who makes sure it ships.",
      leanIn:
        "Own the path from decision to done. Volunteer for the projects that are stuck in 'we keep meaning to'. You turn intention into output, and that's rarer than it looks.",
      trap:
        "You're highly capable here but it doesn't fully light you up, which means you can get buried in everyone's logistics. Protect a slice of this for the work that actually energizes you.",
      delegate:
        "Hand off the open-ended, no-clear-finish-line work. You're at your worst, and most drained, when there's nothing concrete to drive to completion."
    },
    strategist: {
      key: "strategist",
      name: "The Strategist",
      tagline: "Sees the pattern and charts the smartest path.",
      lineage: "Strategic Thinking · Holland: Investigative · Big Five: Openness",
      definition:
        "You make sense of confusing situations, spot the underlying pattern, and figure out the smartest way forward when the path isn't obvious. You're energized by 'why' and 'what's next.'",
      roles:
        "Strategy, research & analytics, planning, diagnosis, advising. The person who maps the path before everyone runs.",
      leanIn:
        "Get yourself in the room before decisions are made, not after. Your edge is seeing three moves ahead; spend your time on the highest-leverage unsolved problems.",
      trap:
        "You can analyze something well even when it bores you, which is how you end up the default 'figure it out' person for problems you don't care about. Be selective.",
      delegate:
        "Offload the rote, already-solved, just-execute work. Repetition with no puzzle in it quietly drains you."
    },
    creator: {
      key: "creator",
      name: "The Creator",
      tagline: "Brings new things into existence from a blank page.",
      lineage: "Ideation · Holland: Artistic · Big Five: Openness",
      definition:
        "You generate ideas and original work others hadn't considered. A blank page excites you more than it scares you, and you're at your best when there's no template to copy.",
      roles:
        "Design, writing & content, branding, product ideation, creative direction, anything that starts from nothing.",
      leanIn:
        "Guard your blank-page time fiercely. It's where your value is created. Get the first version out; you generate more and better ideas in motion than in planning.",
      trap:
        "You can produce polished creative work even when you've stopped enjoying it. When the spark's gone, it shows over time, so rotate onto fresh problems before you stale out.",
      delegate:
        "Pass off the maintenance and refinement of things already built. Iterating on someone else's finished thing rarely energizes you."
    },
    driver: {
      key: "driver",
      name: "The Driver",
      tagline: "Persuades, leads, and creates momentum.",
      lineage: "Influencing · Holland: Enterprising · Big Five: Extraversion",
      definition:
        "You move people and projects to action. You're good at winning people over, taking the lead under pressure, and pushing a stalled thing back into motion.",
      roles:
        "Sales, business development, founder/owner, team lead, the 'let's go' person who gets others off the fence.",
      leanIn:
        "Put yourself where momentum is the bottleneck: pitches, launches, stalled initiatives. You create energy in a room; spend it where one push changes the outcome.",
      trap:
        "You can rally people for things you don't actually believe in, and it costs you. Only spend your influence on what you'd back anyway.",
      delegate:
        "Hand off the heads-down, solo, no-audience work. Long stretches without people to move tend to flatten you."
    },
    connector: {
      key: "connector",
      name: "The Connector",
      tagline: "Builds trust and develops the people around them.",
      lineage: "Relationship Building · Holland: Social · Big Five: Agreeableness",
      definition:
        "You build trust, sense how people are really doing, and help them grow. You're the glue that keeps a team working well together, often without anyone noticing the work.",
      roles:
        "Coaching & mentoring, people/HR, customer success, partnerships, team lead. The person others bring their real problems to.",
      leanIn:
        "Make developing people an explicit part of your role, not a side effect. Mentoring, onboarding, and high-trust relationships are where you compound value for a whole team.",
      trap:
        "You'll absorb everyone's emotional load even when it exhausts you, because you're good at it. Set the boundary before you're the team's unpaid therapist.",
      delegate:
        "Offload cold, transactional, purely-task work with no human element. It's fine, but it never fills your tank."
    },
    craftsperson: {
      key: "craftsperson",
      name: "The Craftsperson",
      tagline: "Goes deep to master a craft and produce quality.",
      lineage: "Realistic mastery · Big Five: Conscientiousness · Flow / Self-Determination",
      definition:
        "You'd rather go deep and master one concrete skill than juggle many shallowly. You lose yourself in focused, hands-on work and care visibly about the quality of what you make.",
      roles:
        "Technical/engineering IC, skilled specialist, hands-on maker. The person you actually want doing the work, not just managing it.",
      leanIn:
        "Protect long, uninterrupted focus blocks. That's where your mastery lives. Become the definitive person for one hard, valuable skill rather than spreading thin.",
      trap:
        "You can keep grinding on craft past the point of diminishing returns. Make sure the depth is serving the goal, not just your own perfectionism.",
      delegate:
        "Hand off the constant-context-switching, shallow, interrupt-driven work. Fragmented days are kryptonite to your kind of focus."
    }
  };

  var ZONE_ORDER = ["builder", "strategist", "creator", "driver", "connector", "craftsperson"];

  // ---- Named combinations (top-2 zones, order-independent) ----------------
  function pairKey(a, b) {
    return [a, b].sort().join("+");
  }
  var COMBOS = {
    "builder+strategist": {
      name: "The Architect",
      blurb: "You see the smartest path and then actually build it. Rare: most people do one or the other."
    },
    "builder+creator": {
      name: "The Producer",
      blurb: "You turn raw ideas into finished, shipped things. You're where creativity stops being a daydream."
    },
    "builder+driver": {
      name: "The Closer",
      blurb: "You drive things forward and land them. When you own something, it gets done and it gets done on time."
    },
    "builder+connector": {
      name: "The Team Builder",
      blurb: "You organize both the work and the people. Teams run smoother because you're in them."
    },
    "builder+craftsperson": {
      name: "The Master Builder",
      blurb: "You make it well and you make sure it ships. Quality and follow-through in the same person."
    },
    "creator+strategist": {
      name: "The Visionary",
      blurb: "You imagine what could be and you can see the path to it. Ideas plus the strategy to make them real."
    },
    "driver+strategist": {
      name: "The Founder",
      blurb: "You see where to go and you can rally people to get there. The classic build-something-from-nothing pairing."
    },
    "connector+strategist": {
      name: "The Advisor",
      blurb: "You combine sharp judgment with a real read on people. The person others trust with the hard calls."
    },
    "craftsperson+strategist": {
      name: "The Expert",
      blurb: "Deep mastery plus the bigger picture. You don't just do the work, you know why it matters."
    },
    "creator+driver": {
      name: "The Evangelist",
      blurb: "You invent the thing and you get the world excited about it. Vision with a megaphone."
    },
    "connector+creator": {
      name: "The Inspirer",
      blurb: "You generate ideas and bring people along emotionally. You make new things feel worth caring about."
    },
    "craftsperson+creator": {
      name: "The Artisan",
      blurb: "You invent it and you craft it beautifully. Original work, made to a standard most people skip."
    },
    "connector+driver": {
      name: "The Rainmaker",
      blurb: "You move people and you bond them. Rooms open up and deals close when you're in them."
    },
    "craftsperson+driver": {
      name: "The Player-Coach",
      blurb: "You lead from the front and you can actually do the work. People follow you because you've earned it."
    },
    "connector+craftsperson": {
      name: "The Quiet Expert",
      blurb: "Deep skill and deep trust. You're the steady, masterful person a team is lucky to have."
    }
  };

  // ---- Sources / attribution ---------------------------------------------
  var SOURCES = [
    {
      title: "The Big Leap",
      by: "Gay Hendricks (2009)",
      note: "Origin of the “Zone of Genius” and the four zones: Incompetence, Competence, Excellence, Genius.",
      url: "https://www.hendricks.com/the-big-leap/"
    },
    {
      title: "The 6 Types of Working Genius",
      by: "Patrick Lencioni / The Table Group (2022)",
      note: "Model for measuring work as energizing vs. draining (genius / competency / frustration).",
      url: "https://www.workinggenius.com/"
    },
    {
      title: "Holland Codes (RIASEC)",
      by: "John L. Holland",
      note: "Six career-interest types (Realistic, Investigative, Artistic, Social, Enterprising, Conventional) used by the U.S. O*NET database.",
      url: "https://www.onetonline.org/explore/interests/"
    },
    {
      title: "CliftonStrengths domains",
      by: "Don Clifton / Gallup",
      note: "Four talent domains: Executing, Influencing, Relationship Building, Strategic Thinking.",
      url: "https://www.gallup.com/cliftonstrengths/en/253736/cliftonstrengths-domains.aspx"
    },
    {
      title: "Flow",
      by: "Mihály Csíkszentmihályi",
      note: "The challenge-skill balance behind “effortless engagement,” the energy axis of this quiz.",
      url: "https://en.wikipedia.org/wiki/Flow_(psychology)"
    },
    {
      title: "Self-Determination Theory",
      by: "Edward Deci & Richard Ryan",
      note: "Intrinsic motivation and vitality: why some work energizes and other work depletes.",
      url: "https://selfdeterminationtheory.org/theory/"
    }
  ];

  // ---- Likert questions (48) ---------------------------------------------
  // axis: "skill" or "energy" ; reverse: true => disagreement scores high
  var Q = function (zone, axis, reverse, text) {
    return { zone: zone, axis: axis, reverse: !!reverse, text: text };
  };

  var QUESTIONS = [
    // BUILDER
    Q("builder", "skill", false, "People rely on me to take a chaotic project and turn it into an organized, finished plan."),
    Q("builder", "skill", false, "I'm the one who makes sure things actually get done, not just discussed."),
    Q("builder", "skill", false, "I'm good at breaking a big, vague goal into clear, concrete steps."),
    Q("builder", "skill", true, "Following a project all the way through its boring final details is not where I'm at my best."),
    Q("builder", "energy", false, "I get genuine satisfaction from shipping something and checking it off."),
    Q("builder", "energy", false, "Bringing order to a messy, disorganized situation energizes me."),
    Q("builder", "energy", false, "I actually look forward to the execution-and-follow-through stage of a project."),
    Q("builder", "energy", true, "I lose interest once a project moves from ideas into detailed execution."),

    // STRATEGIST
    Q("strategist", "skill", false, "People come to me to make sense of a confusing situation and find the underlying pattern."),
    Q("strategist", "skill", false, "I'm good at figuring out the smartest path forward when the way isn't obvious."),
    Q("strategist", "skill", false, "I can usually spot why something isn't working before other people can."),
    Q("strategist", "skill", true, "Analyzing complex problems and untangling data isn't really one of my strengths."),
    Q("strategist", "energy", false, "I lose track of time when I'm digging into a complex problem to understand it."),
    Q("strategist", "energy", false, "Thinking through strategy and 'what's next' energizes me more than it tires me."),
    Q("strategist", "energy", false, "I enjoy gathering information and turning it over until a situation finally clicks."),
    Q("strategist", "energy", true, "Sitting with an abstract, open-ended problem mostly drains me."),

    // CREATOR
    Q("creator", "skill", false, "I regularly come up with ideas or approaches other people hadn't considered."),
    Q("creator", "skill", false, "People look to me to invent something new when there's no template to follow."),
    Q("creator", "skill", false, "I'm good at starting things from a completely blank page."),
    Q("creator", "skill", true, "Coming up with original ideas from scratch is not one of my natural talents."),
    Q("creator", "energy", false, "I feel most alive when I'm making something that didn't exist before."),
    Q("creator", "energy", false, "A blank page excites me more than it intimidates me."),
    Q("creator", "energy", false, "I lose track of time when I'm designing, writing, or building something new."),
    Q("creator", "energy", true, "Open-ended, figure-it-out-yourself creative work tends to frustrate me."),

    // DRIVER
    Q("driver", "skill", false, "I'm good at persuading people to get behind an idea or a decision."),
    Q("driver", "skill", false, "People follow my lead when something needs a push to actually happen."),
    Q("driver", "skill", false, "I'm effective at rallying others and creating momentum around a goal."),
    Q("driver", "skill", true, "Winning people over and selling an idea isn't where I shine."),
    Q("driver", "energy", false, "Taking the lead on a high-stakes project energizes me more than it stresses me."),
    Q("driver", "energy", false, "I enjoy the challenge of convincing someone to change their mind."),
    Q("driver", "energy", false, "Pushing a stalled initiative back into motion is the kind of thing I look forward to."),
    Q("driver", "energy", true, "Having to constantly motivate and chase other people wears me out."),

    // CONNECTOR
    Q("connector", "skill", false, "People trust me with what's really going on with them."),
    Q("connector", "skill", false, "I'm good at sensing how someone is doing and adjusting to keep a team working well."),
    Q("connector", "skill", false, "I'm the person who helps others grow and get better at what they do."),
    Q("connector", "skill", true, "Reading people's emotions and unspoken needs isn't one of my stronger skills."),
    Q("connector", "energy", false, "Helping someone develop and watching them improve is one of the most rewarding parts of work for me."),
    Q("connector", "energy", false, "I feel energized after a good one-on-one conversation, not drained."),
    Q("connector", "energy", false, "Bringing people together and strengthening a team is work I genuinely enjoy."),
    Q("connector", "energy", true, "Spending much of my day tending to other people's feelings tires me out."),

    // CRAFTSPERSON
    Q("craftsperson", "skill", false, "I'd rather go deep and master one concrete skill than juggle many things shallowly."),
    Q("craftsperson", "skill", false, "People count on me to personally produce high-quality, hands-on work."),
    Q("craftsperson", "skill", false, "I have a craft or technical skill I've worked hard to get genuinely good at."),
    Q("craftsperson", "skill", true, "Doing the detailed, hands-on work myself isn't really my strong suit."),
    Q("craftsperson", "energy", false, "I lose myself in focused, hands-on work where I can see the quality of what I'm making."),
    Q("craftsperson", "energy", false, "Perfecting the details of my own work is satisfying to me, not tedious."),
    Q("craftsperson", "energy", false, "I'd happily spend hours deepening my mastery of a skill I care about."),
    Q("craftsperson", "energy", true, "Deep, solitary focus on one craft for hours would bore me.")
  ];

  // ---- Open reflection prompts (Hendricks): questions 49 & 50 -----------
  var REFLECTIONS = [
    {
      id: "love",
      prompt: "What work do you do that doesn't feel like work, where you lose track of time?",
      hint: "Gay Hendricks' classic question for locating your zone of genius. Optional, but worth a sentence."
    },
    {
      id: "drain",
      prompt: "What kind of work would you happily hand off and never do again?",
      hint: "Naming your drain zone is half the value. Optional."
    }
  ];

  var SCALE = [
    { v: 1, label: "Strongly disagree" },
    { v: 2, label: "Disagree" },
    { v: 3, label: "Neutral" },
    { v: 4, label: "Agree" },
    { v: 5, label: "Strongly agree" }
  ];

  var TOTAL = QUESTIONS.length + REFLECTIONS.length; // 50

  // ---- State + persistence -----------------------------------------------
  var STORAGE_KEY = "zog.v1";
  var state = load() || { name: "", answers: {}, reflections: {}, idx: 0, done: false };

  function load() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }
  function save() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      /* private mode / full storage; quiz still works for this session */
    }
  }
  function reset() {
    state = { name: "", answers: {}, reflections: {}, idx: 0, done: false };
    save();
  }

  // ---- Scoring ------------------------------------------------------------
  function scored(answer, reverse) {
    return reverse ? 6 - answer : answer; // 1..5
  }
  // average of a list of 1..5 -> 0..100
  function pct(avg) {
    return Math.round(((avg - 1) / 4) * 100);
  }

  function computeResults() {
    var byZone = {};
    ZONE_ORDER.forEach(function (z) {
      byZone[z] = { skill: [], energy: [] };
    });
    QUESTIONS.forEach(function (q, i) {
      var a = state.answers[i];
      if (a == null) return;
      byZone[q.zone][q.axis].push(scored(a, q.reverse));
    });

    function mean(arr) {
      if (!arr.length) return 3; // neutral fallback
      return arr.reduce(function (s, x) { return s + x; }, 0) / arr.length;
    }

    var zones = ZONE_ORDER.map(function (z) {
      var skill = mean(byZone[z].skill);
      var energy = mean(byZone[z].energy);
      return {
        key: z,
        skill: skill, // 1..5
        energy: energy, // 1..5
        skillPct: pct(skill),
        energyPct: pct(energy),
        combined: (skill + energy) / 2
      };
    });

    // within-person dividing lines (robust to yes-saying / nay-saying)
    var skillMean = mean(zones.map(function (z) { return z.skill; }));
    var energyMean = mean(zones.map(function (z) { return z.energy; }));

    zones.forEach(function (z) {
      var sHigh = z.skill >= skillMean;
      var eHigh = z.energy >= energyMean;
      if (sHigh && eHigh) z.quad = "genius";
      else if (sHigh && !eHigh) z.quad = "excellence"; // the trap
      else if (!sHigh && eHigh) z.quad = "passion"; // love it, still growing
      else z.quad = "drain"; // delegate
    });

    var ranked = zones.slice().sort(function (a, b) { return b.combined - a.combined; });
    var primary = ranked[0];
    var secondary = ranked[1];
    var drain = ranked[ranked.length - 1];
    var combo = COMBOS[pairKey(primary.key, secondary.key)];

    return {
      zones: zones,
      ranked: ranked,
      primary: primary,
      secondary: secondary,
      drain: drain,
      combo: combo,
      skillMean: skillMean,
      energyMean: energyMean
    };
  }

  // ---- DOM helpers --------------------------------------------------------
  var app = document.getElementById("app");
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function clear() { app.innerHTML = ""; }
  function answeredCount() { return Object.keys(state.answers).length; }

  // ---- Screens ------------------------------------------------------------
  function renderIntro() {
    clear();
    var wrap = el("div", "screen intro");
    wrap.appendChild(el("h1", null, "Zone of Genius"));
    wrap.appendChild(el(
      "p",
      "lede",
      "A 50-question assessment that finds where your natural <em>talent</em>, your <em>energy</em>, and your <em>flow</em> actually overlap, the work you should be doing more of, and the work quietly draining you."
    ));

    var meta = el("div", "intro-meta");
    meta.innerHTML =
      '<span>50 questions</span><span>·</span><span>~10 min</span><span>·</span><span>free, no email</span><span>·</span><span>private, nothing leaves your browser</span>';
    wrap.appendChild(meta);

    var card = el("div", "card how");
    card.innerHTML =
      '<h2>How it works</h2>' +
      '<p>Most quizzes only ask what you’re good at. This one scores every skill on <strong>two axes</strong>: how good you are, and how much it <strong>energizes</strong> you. That’s the difference between your <em>Zone of Excellence</em> (great at it, but it drains you: the trap) and your true <em>Zone of Genius</em> (great at it <em>and</em> it lights you up).</p>' +
      '<p>You’ll get your top genius zones, a named profile, a full skill-vs-energy map across six modes of work, and the zone you should delegate.</p>';
    wrap.appendChild(card);

    var nameWrap = el("div", "name-field");
    nameWrap.innerHTML = '<label for="zog-name">Your name <span class="muted">(optional, shows on your results so you can share them)</span></label>';
    var input = el("input", null);
    input.id = "zog-name";
    input.type = "text";
    input.placeholder = "e.g. Alex";
    input.value = state.name || "";
    input.autocomplete = "off";
    input.addEventListener("input", function () { state.name = input.value; save(); });
    nameWrap.appendChild(input);
    wrap.appendChild(nameWrap);

    var actions = el("div", "actions");
    var begin = el("button", "btn primary");
    var resuming = answeredCount() > 0 && !state.done;
    begin.textContent = resuming ? "Resume →" : "Begin →";
    begin.addEventListener("click", function () {
      go(resuming ? state.idx : 0);
    });
    actions.appendChild(begin);

    if (state.done) {
      var seeResults = el("button", "btn ghost", "See my last results");
      seeResults.addEventListener("click", renderResults);
      actions.appendChild(seeResults);
    }
    if (answeredCount() > 0) {
      var restart = el("button", "btn ghost", "Start over");
      restart.addEventListener("click", function () {
        reset();
        renderIntro();
      });
      actions.appendChild(restart);
    }
    wrap.appendChild(actions);

    var note = el("p", "fineprint",
      'Free and private: no email, no sign-up, nothing leaves your browser. Built on Gay Hendricks’ <em>The Big Leap</em>, Lencioni’s Working Genius, Holland Codes (RIASEC), CliftonStrengths domains, and flow / self-determination research (full sources with your results). Independent and not affiliated with those authors. A self-report snapshot to start a conversation, not a verdict.');
    wrap.appendChild(note);

    app.appendChild(wrap);
    fade(wrap);
  }

  function go(i) {
    state.idx = i;
    save();
    if (i < QUESTIONS.length) renderQuestion(i);
    else if (i < TOTAL) renderReflection(i - QUESTIONS.length);
    else renderResults();
  }

  function header(i) {
    var h = el("div", "q-head");
    var bar = el("div", "progress");
    var fill = el("div", "progress-fill");
    fill.style.width = (i / TOTAL) * 100 + "%";
    bar.appendChild(fill);
    h.appendChild(bar);
    h.appendChild(el("div", "q-count", "Question " + (i + 1) + " of " + TOTAL));
    return h;
  }

  function renderQuestion(i) {
    clear();
    var q = QUESTIONS[i];
    var wrap = el("div", "screen question");
    wrap.appendChild(header(i));
    wrap.appendChild(el("p", "q-text", q.text));

    var opts = el("div", "options");
    SCALE.forEach(function (s) {
      var b = el("button", "option");
      b.innerHTML = '<span class="opt-key">' + s.v + '</span><span class="opt-label">' + s.label + "</span>";
      if (state.answers[i] === s.v) b.classList.add("selected");
      b.addEventListener("click", function () {
        state.answers[i] = s.v;
        save();
        Array.prototype.forEach.call(opts.children, function (c) { c.classList.remove("selected"); });
        b.classList.add("selected");
        setTimeout(function () { go(i + 1); }, 200);
      });
      opts.appendChild(b);
    });
    wrap.appendChild(opts);

    var nav = el("div", "q-nav");
    var back = el("button", "btn ghost sm", "← Back");
    back.disabled = i === 0;
    back.addEventListener("click", function () { go(i - 1); });
    nav.appendChild(back);
    nav.appendChild(el("div", "q-hint", "Tap an answer, or press 1-5"));
    wrap.appendChild(nav);

    app.appendChild(wrap);
    fade(wrap);
  }

  function renderReflection(ri) {
    clear();
    var r = REFLECTIONS[ri];
    var i = QUESTIONS.length + ri;
    var wrap = el("div", "screen question reflection");
    wrap.appendChild(header(i));
    wrap.appendChild(el("p", "q-text", r.prompt));
    wrap.appendChild(el("p", "q-sub", r.hint));

    var ta = el("textarea", "reflect-input");
    ta.rows = 4;
    ta.placeholder = "Type a sentence or two…";
    ta.value = state.reflections[r.id] || "";
    ta.addEventListener("input", function () { state.reflections[r.id] = ta.value; save(); });
    wrap.appendChild(ta);

    var nav = el("div", "q-nav");
    var back = el("button", "btn ghost sm", "← Back");
    back.addEventListener("click", function () { go(i - 1); });
    nav.appendChild(back);

    var next = el("button", "btn primary sm", ri === REFLECTIONS.length - 1 ? "See my results →" : "Next →");
    next.addEventListener("click", function () { go(i + 1); });
    nav.appendChild(next);
    wrap.appendChild(nav);

    app.appendChild(wrap);
    fade(wrap);
  }

  // ---- Radar (pure SVG) ---------------------------------------------------
  function radar(res) {
    var size = 320, cx = size / 2, cy = size / 2, R = 118;
    var n = ZONE_ORDER.length;
    var ns = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 " + size + " " + size);
    svg.setAttribute("class", "radar");

    function pt(idx, rad) {
      var ang = -Math.PI / 2 + (idx / n) * Math.PI * 2;
      return [cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad];
    }
    // grid rings
    [0.25, 0.5, 0.75, 1].forEach(function (g) {
      var poly = document.createElementNS(ns, "polygon");
      var pts = [];
      for (var k = 0; k < n; k++) { var p = pt(k, R * g); pts.push(p[0] + "," + p[1]); }
      poly.setAttribute("points", pts.join(" "));
      poly.setAttribute("class", "radar-grid");
      svg.appendChild(poly);
    });
    // spokes + labels
    for (var k = 0; k < n; k++) {
      var edge = pt(k, R);
      var line = document.createElementNS(ns, "line");
      line.setAttribute("x1", cx); line.setAttribute("y1", cy);
      line.setAttribute("x2", edge[0]); line.setAttribute("y2", edge[1]);
      line.setAttribute("class", "radar-spoke");
      svg.appendChild(line);

      var lp = pt(k, R + 22);
      var t = document.createElementNS(ns, "text");
      t.setAttribute("x", lp[0]); t.setAttribute("y", lp[1]);
      t.setAttribute("class", "radar-label");
      t.setAttribute("text-anchor", lp[0] < cx - 5 ? "end" : lp[0] > cx + 5 ? "start" : "middle");
      t.setAttribute("dominant-baseline", "middle");
      t.textContent = ZONES[ZONE_ORDER[k]].name.replace("The ", "");
      svg.appendChild(t);
    }
    function polygon(valueFn, cls) {
      var poly = document.createElementNS(ns, "polygon");
      var pts = [];
      for (var k2 = 0; k2 < n; k2++) {
        var z = res.zones[k2];
        var v = valueFn(z) / 100; // 0..1
        var p = pt(k2, R * v);
        pts.push(p[0] + "," + p[1]);
      }
      poly.setAttribute("points", pts.join(" "));
      poly.setAttribute("class", cls);
      svg.appendChild(poly);
    }
    polygon(function (z) { return z.skillPct; }, "radar-skill");
    polygon(function (z) { return z.energyPct; }, "radar-energy");

    var fig = el("figure", "radar-wrap");
    fig.appendChild(svg);
    var legend = el("figcaption", "radar-legend");
    legend.innerHTML =
      '<span class="lg lg-skill">Skill</span><span class="lg lg-energy">Energy</span>' +
      '<span class="lg-note">Genius = high on both</span>';
    fig.appendChild(legend);
    return fig;
  }

  var QUAD_LABEL = {
    genius: "Zone of Genius",
    excellence: "Zone of Excellence",
    passion: "Emerging passion",
    drain: "Drain zone"
  };

  function renderResults() {
    state.done = true;
    save();
    var res = computeResults();
    clear();
    var wrap = el("div", "screen results");

    // Headline
    var who = state.name ? state.name + "’s " : "Your ";
    var head = el("div", "result-head");
    head.appendChild(el("p", "result-eyebrow", who + "Zone of Genius"));
    head.appendChild(el("h1", "combo-name", res.combo ? res.combo.name : res.primary && ZONES[res.primary.key].name));
    if (res.combo) head.appendChild(el("p", "combo-blurb", res.combo.blurb));
    head.appendChild(el(
      "p",
      "combo-zones",
      ZONES[res.primary.key].name + " <span class=\"plus\">+</span> " + ZONES[res.secondary.key].name
    ));
    wrap.appendChild(head);

    // Radar
    wrap.appendChild(radar(res));

    // Top two genius zones, lean in
    var lean = el("div", "section");
    lean.appendChild(el("h2", null, "Lean in: your genius zones"));
    [res.primary, res.secondary].forEach(function (z) {
      lean.appendChild(zoneCard(z, "leanIn"));
    });
    wrap.appendChild(lean);

    // The trap: excellence zones (high skill, lower energy)
    var traps = res.zones.filter(function (z) {
      return z.quad === "excellence" && z.key !== res.primary.key && z.key !== res.secondary.key;
    });
    if (traps.length) {
      var trapSec = el("div", "section");
      trapSec.appendChild(el("h2", null, "The trap: your Zone of Excellence"));
      trapSec.appendChild(el("p", "section-sub", "You’re genuinely good at these, but they don’t light you up. This is exactly where Hendricks says high-achievers get stuck. Do less of it than your skill tempts you to."));
      traps.forEach(function (z) { trapSec.appendChild(zoneCard(z, "trap")); });
      wrap.appendChild(trapSec);
    }

    // Delegate: lowest combined
    var delSec = el("div", "section");
    delSec.appendChild(el("h2", null, "Delegate: your drain zone"));
    delSec.appendChild(zoneCard(res.drain, "delegate"));
    wrap.appendChild(delSec);

    // Full profile table
    var prof = el("div", "section");
    prof.appendChild(el("h2", null, "Full profile"));
    var grid = el("div", "profile-grid");
    res.ranked.forEach(function (z) {
      grid.appendChild(profileRow(z));
    });
    prof.appendChild(grid);
    wrap.appendChild(prof);

    // Reflections echoed back
    var hasRefl = REFLECTIONS.some(function (r) { return (state.reflections[r.id] || "").trim(); });
    if (hasRefl) {
      var rsec = el("div", "section");
      rsec.appendChild(el("h2", null, "In your own words"));
      REFLECTIONS.forEach(function (r) {
        var v = (state.reflections[r.id] || "").trim();
        if (!v) return;
        var b = el("div", "card reflect-echo");
        b.appendChild(el("p", "reflect-q", r.prompt));
        b.appendChild(el("p", "reflect-a", escapeHtml(v)));
        rsec.appendChild(b);
      });
      wrap.appendChild(rsec);
    }

    // Actions
    var actions = el("div", "actions result-actions");
    var copy = el("button", "btn primary", "Copy my results");
    copy.addEventListener("click", function () { copyResults(res, copy); });
    actions.appendChild(copy);
    var print = el("button", "btn ghost", "Print / save as PDF");
    print.addEventListener("click", function () { window.print(); });
    actions.appendChild(print);
    var retake = el("button", "btn ghost", "Retake");
    retake.addEventListener("click", function () { reset(); renderIntro(); });
    actions.appendChild(retake);
    wrap.appendChild(actions);

    // Method & sources (attribution)
    var method = el("div", "section method-section");
    method.appendChild(el("h2", null, "Method & sources"));
    var mbody = el("div", "method-body");
    mbody.innerHTML =
      "<p>Six modes of work (Builder, Strategist, Creator, Driver, Connector, Craftsperson), each triangulated across three established frameworks: Holland’s RIASEC career-interest types, Gallup’s CliftonStrengths domains, and Big Five personality facets. Every mode is measured on two axes: <strong>skill</strong> (competence) and <strong>energy</strong> (flow and intrinsic motivation).</p>" +
      "<p>Items use a 5-point fully-labeled Likert scale with reverse-keyed items to control for agreement bias. Answers are reverse-coded, averaged per axis per zone, then ranked. The skill×energy split maps onto Gay Hendricks’ four zones from <em>The Big Leap</em>: high skill + high energy = Genius; high skill + low energy = Excellence (the trap); low skill = Competence / Incompetence (delegate). Your dividing lines are set relative to your own profile, so the result reflects <em>your</em> shape, not an absolute bar.</p>" +
      "<p class=\"sources-head\">This assessment is independent and not affiliated with or endorsed by the authors below. It builds on their published, established frameworks:</p>";
    method.appendChild(mbody);

    var ul = el("ul", "sources");
    SOURCES.forEach(function (s) {
      var li = el("li", "source");
      li.innerHTML =
        '<a href="' + s.url + '" target="_blank" rel="noopener noreferrer">' + s.title + "</a>" +
        '<span class="source-by">' + s.by + "</span>" +
        '<span class="source-note">' + s.note + "</span>";
      ul.appendChild(li);
    });
    method.appendChild(ul);
    method.appendChild(el(
      "p",
      "fineprint",
      "This is a free, self-report snapshot meant to spark reflection and better work assignments, not a fixed label, a hiring tool, or a clinical instrument. Your answers stay in your browser; nothing is collected or sent anywhere."
    ));
    wrap.appendChild(method);

    app.appendChild(wrap);
    window.scrollTo(0, 0);
    fade(wrap);
  }

  function zoneCard(z, mode) {
    var Z = ZONES[z.key];
    var c = el("div", "card zone-card quad-" + z.quad);
    var top = el("div", "zone-top");
    top.appendChild(el("div", "zone-name", Z.name));
    top.appendChild(el("div", "zone-quad", QUAD_LABEL[z.quad]));
    c.appendChild(top);
    c.appendChild(el("p", "zone-tag", Z.tagline));
    c.appendChild(bars(z));
    c.appendChild(el("p", "zone-def", Z.definition));
    var msg = Z[mode] || "";
    if (msg) {
      var label = mode === "leanIn" ? "Do more of this" : mode === "trap" ? "Watch out" : mode === "delegate" ? "Hand this off" : "";
      c.appendChild(el("p", "zone-action", "<strong>" + label + ".</strong> " + msg));
    }
    c.appendChild(el("p", "zone-lineage", Z.lineage));
    return c;
  }

  function bars(z) {
    var b = el("div", "bars");
    b.innerHTML =
      barRow("Skill", z.skillPct, "skill") + barRow("Energy", z.energyPct, "energy");
    return b;
  }
  function barRow(label, val, cls) {
    return (
      '<div class="bar-row"><span class="bar-label">' + label + "</span>" +
      '<span class="bar-track"><span class="bar-fill bar-' + cls + '" style="width:' + val + '%"></span></span>' +
      '<span class="bar-val">' + val + "</span></div>"
    );
  }
  function profileRow(z) {
    var Z = ZONES[z.key];
    var row = el("div", "profile-row quad-" + z.quad);
    row.appendChild(el("div", "profile-name", Z.name.replace("The ", "")));
    var b = el("div", "profile-bars");
    b.innerHTML = barRow("S", z.skillPct, "skill") + barRow("E", z.energyPct, "energy");
    row.appendChild(b);
    row.appendChild(el("div", "profile-quad", QUAD_LABEL[z.quad]));
    return row;
  }

  function copyResults(res, btn) {
    var lines = [];
    lines.push((state.name ? state.name + ": " : "") + "Zone of Genius results");
    if (res.combo) lines.push("Profile: " + res.combo.name);
    lines.push("Genius zones: " + ZONES[res.primary.key].name + " + " + ZONES[res.secondary.key].name);
    lines.push("Delegate / drain zone: " + ZONES[res.drain.key].name);
    lines.push("");
    lines.push("Full profile (skill / energy / zone):");
    res.ranked.forEach(function (z) {
      lines.push(
        "  " + pad(ZONES[z.key].name.replace("The ", ""), 14) +
        " skill " + pad(String(z.skillPct), 3) +
        "  energy " + pad(String(z.energyPct), 3) +
        "  - " + QUAD_LABEL[z.quad]
      );
    });
    REFLECTIONS.forEach(function (r) {
      var v = (state.reflections[r.id] || "").trim();
      if (v) { lines.push(""); lines.push(r.prompt); lines.push("  " + v); }
    });
    lines.push("");
    lines.push("Taken at justingluska.com/other/zone-of-genius");
    var text = lines.join("\n");

    function done() {
      var old = btn.textContent;
      btn.textContent = "Copied ✓";
      setTimeout(function () { btn.textContent = old; }, 1800);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text, done); });
    } else {
      fallbackCopy(text, done);
    }
  }
  function fallbackCopy(text, cb) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch (e) {}
    document.body.removeChild(ta);
    cb();
  }

  function pad(s, n) { s = String(s); while (s.length < n) s += " "; return s; }
  function escapeHtml(s) {
    return s.replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    }).replace(/\n/g, "<br>");
  }
  function fade(node) {
    node.style.opacity = "0";
    node.style.transform = "translateY(8px)";
    requestAnimationFrame(function () {
      node.style.transition = "opacity .35s ease, transform .35s ease";
      node.style.opacity = "1";
      node.style.transform = "translateY(0)";
    });
  }

  // ---- Keyboard -----------------------------------------------------------
  document.addEventListener("keydown", function (e) {
    var i = state.idx;
    if (i < QUESTIONS.length && app.querySelector(".question:not(.reflection)")) {
      if (e.key >= "1" && e.key <= "5") {
        state.answers[i] = parseInt(e.key, 10);
        save();
        var opts = app.querySelectorAll(".option");
        Array.prototype.forEach.call(opts, function (c, k) {
          c.classList.toggle("selected", k === parseInt(e.key, 10) - 1);
        });
        setTimeout(function () { go(i + 1); }, 180);
      } else if (e.key === "ArrowLeft" && i > 0) {
        go(i - 1);
      } else if (e.key === "ArrowRight" && state.answers[i] != null) {
        go(i + 1);
      }
    }
  });

  // ---- Boot ---------------------------------------------------------------
  if (state.done) renderResults();
  else renderIntro();
})();
