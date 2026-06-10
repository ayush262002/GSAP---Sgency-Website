/* ══════════════════════════════════════════════════════════════
   DEVBYAG — main animation controller
   Fixes applied
   ─────────────────────────────────────────────────────────────
   ISSUE 1  .Extra/.faq/.footer are now siblings in flow (HTML +
            CSS changed); JS no longer needs to set top:"0%" on
            ExtraSection — that animation is removed.

   ISSUE 3  Every non-pinned section transition now has a smooth,
            custom eased exit motion (parallax dissolve, clip
            reveal, scale-push) instead of abruptly starting.

   ISSUE 4  A robust page-ready guard waits for:
              • document fonts loaded  (document.fonts.ready)
              • hero image loaded      (laptop img)
              • a minimum 400 ms ramp  (prevents partial-render flash)
            Body has class="loading" (visibility:hidden in CSS)
            until all conditions pass, then GSAP runs.
   ══════════════════════════════════════════════════════════════ */

gsap.registerPlugin(SplitText, ScrollTrigger);

/* ── Custom eases ─────────────────────────────────────────── */
gsap.registerEase("softOut",   gsap.parseEase("power3.out"));
gsap.registerEase("softInOut", gsap.parseEase("power3.inOut"));
gsap.registerEase("snap",      gsap.parseEase("expo.out"));
gsap.registerEase("graceful",  gsap.parseEase("sine.inOut"));

/* ── Breakpoint guard ─────────────────────────────────────── */
const IS_DESKTOP = () => window.innerWidth > 1024;

/* ══════════════════════════════════════════════════════════════
   ISSUE 4 — PAGE READY GUARD
   Body carries class="loading" (visibility:hidden) until every
   condition below resolves. This prevents:
     • FOUC (flash of unstyled content)
     • Fonts-not-loaded measurement errors in SplitText
     • Hero image popping in mid-animation
     • GSAP reading wrong element dimensions on first tick
   ══════════════════════════════════════════════════════════════ */
function waitForPageReady() {
    return new Promise((resolve) => {
        const MIN_DELAY   = 400;    // ms — minimum ramp time
        const startTime   = performance.now();

        const laptop = document.querySelector('.laptop');

        // Promise that resolves once the laptop image loads (or errors)
        const imgReady = new Promise((res) => {
            if (!laptop) { res(); return; }
            const src = laptop.src || laptop.getAttribute('src') || '';
            if (!src) { res(); return; }
            if (laptop.complete && laptop.naturalWidth > 0) { res(); return; }
            laptop.addEventListener('load',  res, { once: true });
            laptop.addEventListener('error', res, { once: true });
        });

        Promise.all([
            document.fonts.ready,
            imgReady,
        ]).then(() => {
            const elapsed = performance.now() - startTime;
            const remaining = Math.max(0, MIN_DELAY - elapsed);
            setTimeout(() => {
                // Reveal page
                document.body.classList.remove('loading');
                resolve();
            }, remaining);
        });
    });
}

/* ── Performance hints ────────────────────────────────────── */
const WILL_CHANGE_TARGETS = [
    ".hero-content", ".hero-content h1", ".hero-content h5",
    "nav", "#visit", ".cont", ".balls", ".laptop",
    ".service-img", ".left", ".service p",
    ".workItem", ".workHead", ".workCaption",
    ".testimonial-card",
    ".Sstory",
    ".scroll-img",
    ".faqPara", ".footer"
];
WILL_CHANGE_TARGETS.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
        el.style.willChange = "transform, opacity";
    });
});

/* ══════════════════════════════════════════════════════════════
   MOBILE NAV — hamburger  (all viewports)
   ══════════════════════════════════════════════════════════════ */
const hamburger    = document.querySelector('.nav-hamburger');
const mobileDrawer = document.querySelector('.mobile-nav-drawer');

if (hamburger && mobileDrawer) {
    const drawerLinks = mobileDrawer.querySelectorAll('a');

    hamburger.addEventListener('click', () => {
        const opening = !hamburger.classList.contains('open');
        hamburger.classList.toggle('open');

        if (opening) {
            mobileDrawer.style.display = 'flex';
            gsap.fromTo(mobileDrawer,
                { opacity: 0, y: -20 },
                { opacity: 1, y: 0, duration: 0.45, ease: "softOut", pointerEvents: "all" }
            );
            gsap.fromTo(drawerLinks,
                { opacity: 0, y: 30 },
                { opacity: 1, y: 0, stagger: 0.07, duration: 0.5, ease: "softOut", delay: 0.1 }
            );
        } else {
            gsap.to(mobileDrawer, {
                opacity: 0, y: -10, duration: 0.3, ease: "graceful",
                onComplete: () => { mobileDrawer.style.display = 'none'; }
            });
        }
    });

    drawerLinks.forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('open');
            gsap.to(mobileDrawer, {
                opacity: 0, y: -10, duration: 0.3, ease: "graceful",
                onComplete: () => { mobileDrawer.style.display = 'none'; }
            });
        });
    });
}

/* ══════════════════════════════════════════════════════════════
   DESKTOP ANIMATIONS
   ══════════════════════════════════════════════════════════════ */
function initDesktopAnimations() {

    /* ── Lock scroll during intro ── */
    document.body.style.overflow            = "hidden";
    document.documentElement.style.overflow = "hidden";

    /* ── Element refs ── */
    const heroContent   = document.querySelector(".hero-content");
    const heroHeadings  = document.querySelectorAll(".hero-content h1");
    const heroHeadings2 = document.querySelectorAll(".hero-content h5");
    const nav           = document.querySelector("nav");
    const visit         = document.querySelector("#visit");
    const cont          = document.querySelector(".cont");
    const balls         = document.querySelectorAll(".balls");
    const animator      = document.querySelectorAll(".animator");
    const laptop        = document.querySelector(".laptop");

    /* ── Animator bars ── */
    const animCount = animator.length;
    animator.forEach((anim, i) => {
        gsap.set(anim, {
            top:             (i % 2 === 0) ? "-100%" : "100%",
            left:            (i * 100 / animCount) + "%",
            backgroundColor: (i % 2 === 0) ? "var(--primary)" : "var(--neutralText)",
            opacity: 1,
        });
    });

    /* ── SplitText ── */
    // Ensure elements are visible to SplitText (fonts already loaded)
    const split1 = new SplitText(heroHeadings[0],  { type: "chars" });
    const split2 = new SplitText(heroHeadings2[0], { type: "chars" });
    const split3 = new SplitText(heroHeadings[1],  { type: "chars" });

    /* ── Orbital blob setup ── */
    const BLOB_RADIUS = 100;
    const blobCount   = balls.length;
    balls.forEach((ball, i) => {
        const angle = (i / blobCount) * 2 * Math.PI;
        gsap.set(ball, {
            x: BLOB_RADIUS * Math.cos(angle),
            y: BLOB_RADIUS * Math.sin(angle),
        });
    });

    /* ── Hide chars + headings initially ── */
    gsap.set([split1.chars, split2.chars, split3.chars], { opacity: 0 });
    gsap.set([heroHeadings, heroHeadings2], { opacity: 1 });
    gsap.set(laptop, { opacity: 0 });

    /* ════════════════════════════════════════════════════════
       INTRO TIMELINE
    ════════════════════════════════════════════════════════ */
    const tl = gsap.timeline({
        defaults: { ease: "softOut" },
        onComplete: () => {
            document.body.style.overflow            = "";
            document.documentElement.style.overflow = "";
            animator.forEach(a => { a.style.willChange = "auto"; });
        }
    });

    /* Bars wipe out */
    animator.forEach((anim, i) => {
        tl.to(anim,
            { top: (i % 2 === 0) ? "100%" : "-100%", duration: 0.6, ease: "snap" },
            i * 0.055
        );
    });

    const BARS_DONE = animCount * 0.055 + 0.6;

    /* Anchor letters slide in */
    tl.fromTo(split1.chars[0],
        { x: 120, opacity: 0, filter: "blur(6px)" },
        { x: 120, opacity: 1, filter: "blur(0px)", duration: 0.8 },
        BARS_DONE
    );
    tl.fromTo(split3.chars[0],
        { x: -120, opacity: 0, filter: "blur(6px)" },
        { x: -120, opacity: 1, filter: "blur(0px)", duration: 0.8 },
        BARS_DONE
    );

    tl.to(split1.chars[0], { x: 0, duration: 0.75, ease: "snap" }, BARS_DONE + 0.7);
    tl.to(split3.chars[0], { x: 0, duration: 0.75, ease: "snap" }, BARS_DONE + 0.7);

    const CASCADE_START = BARS_DONE + 1.5;
    tl.to(split1.chars.slice(1),
        { opacity: 1, y: 0, stagger: 0.04, duration: 0.6, ease: "softOut" },
        CASCADE_START
    );
    tl.to(split2.chars,
        { opacity: 1, y: 0, stagger: 0.04, duration: 0.6, ease: "softOut" },
        CASCADE_START + 0.05
    );
    tl.to(split3.chars.slice(1),
        { opacity: 1, y: 0, stagger: 0.04, duration: 0.6, ease: "softOut" },
        CASCADE_START + 0.10
    );

    const UI_START = CASCADE_START + 0.6;
    tl.to(nav,   { opacity: 1, y: 0, duration: 0.7, ease: "graceful" }, UI_START);
    tl.to(visit, { opacity: 1, y: 0, duration: 0.5, ease: "graceful" }, UI_START + 0.1);
    tl.to(cont,  { opacity: 1, y: 0, duration: 0.5, ease: "graceful" }, UI_START + 0.15);

    balls.forEach((ball, i) => {
        tl.to(ball,
            { opacity: 0.85, scale: 1, duration: 0.35, ease: "softOut" },
            UI_START + 0.05 + i * 0.08
        );
    });

    const DROP_START = UI_START + 0.6;
    balls.forEach((ball, i) => {
        tl.to(ball,
            { top: "100%", y: -30, scale: 0.6, duration: 1.1, ease: "bounce.out" },
            DROP_START + i * 0.04
        );
    });

    tl.to(laptop,
        { top: "50%", opacity: 1, duration: 1.1, ease: "bounce.out" },
        DROP_START
    );

    /* ════════════════════════════════════════════════════════
       HERO → SERVICE EXIT
       ISSUE 3: hero content does a graceful upward parallax-
       dissolve as the user scrolls toward the service section.
    ════════════════════════════════════════════════════════ */
    const services = document.querySelector(".service");

    gsap.timeline({
        scrollTrigger: {
            trigger: services,
            start:   "top 90%",
            end:     "top 40%",
            scrub:   1.4,
        }
    })
    .to(balls,       { opacity: 0, scale: 0.4, stagger: 0.04, ease: "graceful" }, 0)
    .to(visit,       { opacity: 0, y: 14,      ease: "graceful" }, 0)
    .to(cont,        { opacity: 0, y: 14,      ease: "graceful" }, 0.04)
    .to(heroContent, { opacity: 0, y: -55, scale: 0.96, filter: "blur(6px)", ease: "graceful" }, 0.12);

    /* ════════════════════════════════════════════════════════
       LAPTOP SCALE-DOWN as service approaches
    ════════════════════════════════════════════════════════ */
    gsap.timeline({
        scrollTrigger: {
            trigger: services,
            start: "top 95%",
            end:   "top top",
            scrub: 1.5,
        }
    })
    .to(laptop, {
        scale:    0.48,
        top:      "28%",
        xPercent: -50,
        filter:   "blur(0px)",
        ease:     "graceful",
    });

    /* ════════════════════════════════════════════════════════
       SERVICE — orbital image carousel
    ════════════════════════════════════════════════════════ */
    const servicesImages = document.querySelectorAll(".service-img");
    const serviceTexts   = document.querySelectorAll(".service p");
    const AllTextEffect  = document.querySelectorAll(".left");

    const ORBIT_R = 450;
    const total   = servicesImages.length;

    servicesImages.forEach((img, i) => {
        const angle = ((i - 1) / total) * 2 * Math.PI;
        gsap.set(img, {
            x:       ORBIT_R * Math.cos(angle),
            y:       ORBIT_R * Math.sin(angle),
            opacity: 0,
            scale:   0.85,
        });
    });

    gsap.set(AllTextEffect, { opacity: 0, y: 20, display: "none" });

    /* Images materialise as service pins */
    gsap.timeline({
        scrollTrigger: {
            trigger: services,
            start:   "top top",
            end:     "+=500",
            scrub:   1.5,
        }
    })
    .to(servicesImages, {
        opacity:  1,
        scale:    1,
        stagger:  0.15,
        duration: 0.6,
        ease:     "softOut"
    });

    /* Helper: crossfade active service text */
    function switchText(tl5, activeIdx, atTime) {
        AllTextEffect.forEach((text, i) => {
            if (i === activeIdx) {
                tl5.set(text, { display: "inline-block" }, atTime);
                tl5.to(text,  { opacity: 1, y: 0, duration: 0.4, ease: "softOut" }, atTime);
            } else {
                tl5.to(text,  { opacity: 0, y: -10, duration: 0.25, ease: "graceful" }, atTime);
                tl5.set(text, { display: "none" }, atTime + 0.25);
            }
        });
    }

    function getIndexAt90(step) {
        const raw = (-total / 4) - step + 1;
        return ((Math.round(raw) % total) + total) % total;
    }

    const STEP_DUR  = 1;
    const HOLD_DUR  = 1.8;
    const STEP_GAP  = STEP_DUR + HOLD_DUR;
    const NUM_STEPS = 4;

    const tl5 = gsap.timeline({
        scrollTrigger: {
            trigger: services,
            start:   "top top",
            end:     "+=3200",
            scrub:   1.2,
            pin:     true,
        }
    });

    for (let step = 0; step < NUM_STEPS; step++) {
        const stepStart = step * STEP_GAP;
        const holdStart = stepStart + STEP_DUR;

        servicesImages.forEach((img, i) => {
            const angle = ((i - 1 + step) / total) * 2 * Math.PI;
            tl5.to(img, {
                x:        ORBIT_R * Math.cos(angle),
                y:        ORBIT_R * Math.sin(angle),
                scale:    1,
                duration: STEP_DUR,
                ease:     "softInOut",
            }, stepStart + i * 0.04);
        });

        tl5.to({}, { duration: HOLD_DUR }, holdStart);
        switchText(tl5, getIndexAt90(step), stepStart + 0.55);
    }

    /* ISSUE 3 — Service → Work transition:
       Instead of just fading, the service visuals scale-push
       forward and blow away, giving a "portal" feel. */
    tl5
        .to(serviceTexts,   { opacity: 0, y: -24, duration: 0.45, ease: "graceful" }, "+=0.3")
        .to(AllTextEffect,  { opacity: 0, y: -24, duration: 0.45, ease: "graceful", display: "none" }, "<")
        .to(servicesImages, {
            opacity: 0,
            scale:   1.18,        /* ← scale FORWARD for depth push */
            y:       -40,
            stagger: 0.04,
            duration: 0.5,
            ease:    "graceful"
        }, "<+=0.1")
        .to(laptop, {
            opacity: 0,
            scale:   0.2,
            y:       60,
            duration: 0.45,
            ease:    "graceful",
            display: "none"
        }, "<");

    /* ════════════════════════════════════════════════════════
       NAV — backdrop + translate on scroll
    ════════════════════════════════════════════════════════ */
    ScrollTrigger.create({
        start: "top top-=80",
        end:   "max",
        onToggle: ({ isActive }) => {
            gsap.to(nav, {
                backdropFilter: isActive ? "blur(14px)" : "blur(0px)",
                background:     isActive
                    ? "rgba(10,10,10,0.72)"
                    : "transparent",
                duration: 0.4,
                ease: "graceful"
            });
        }
    });

    /* ════════════════════════════════════════════════════════
       WORK — vertical carousel with label parallax
    ════════════════════════════════════════════════════════ */
    const work        = document.querySelector('.work');
    const workHead    = document.querySelector('.workHead');
    const workCaption = document.querySelector('.workCaption');
    const workItem    = document.querySelectorAll('.workItem');

    gsap.set(workHead,    { top: `calc(50% - ${workHead.getBoundingClientRect().width}px)`,    opacity: 0, x: -20 });
    gsap.set(workCaption, { top: `calc(50% - ${workCaption.getBoundingClientRect().width}px)`, opacity: 0, x: -20 });

    const workItemH = workItem[0].getBoundingClientRect().height;
    workItem.forEach((item, i) => {
        gsap.set(item, {
            top:     `calc(50% + ${i * workItemH}px)`,
            opacity: i === 0 ? 1 : 0,
            filter:  i === 0 ? "blur(0px)" : "blur(3px)",
        });
    });

    ScrollTrigger.create({
        trigger: work,
        start:   "top 60%",
        onEnter: () => {
            gsap.to([workHead, workCaption], {
                opacity: 1, x: 0,
                stagger: 0.12, duration: 0.8, ease: "softOut"
            });
        }
    });

    const workTL = gsap.timeline({
        scrollTrigger: {
            trigger: work,
            start:   "top top",
            end:     "+=2200",
            pin:     true,
            scrub:   1.4,
        }
    });

    const workSteps = workItem.length;
    for (let step = 1; step < workSteps; step++) {
        const pos = step * 2;
        workItem.forEach((item, i) => {
            workTL.to(item, {
                top:      `calc(50% + ${(i - step) * workItemH}px)`,
                opacity:  i === step ? 1 : 0,
                filter:   i === step ? "blur(0px)" : "blur(4px)",
                duration: 2,
                ease:     "softInOut",
            }, pos);
        });
    }

    workTL.to(workHead,    { y: -40, duration: workSteps * 2, ease: "none" }, 0);
    workTL.to(workCaption, { y: -25, duration: workSteps * 2, ease: "none" }, 0);

    /* ISSUE 3 — Work → Testimonial transition:
       Work section exits with a horizontal wipe — items slide
       left and the labels drift right, creating a cinematic push. */
    const workExitTL = gsap.timeline({
        scrollTrigger: {
            trigger: work,
            start:   "bottom bottom-=100",
            end:     "bottom top+=100",
            scrub:   1.4,
        }
    });

    workExitTL
        .to([...workItem], { x: "-105vw", opacity: 0, stagger: 0.04, ease: "softInOut" }, 0)
        .to(workHead,      { x: "30vw",  opacity: 0, ease: "graceful" }, 0)
        .to(workCaption,   { x: "25vw",  opacity: 0, ease: "graceful" }, 0.05);

    /* ════════════════════════════════════════════════════════
       TESTIMONIALS — fan stack + hover
    ════════════════════════════════════════════════════════ */
    const testimonial      = document.querySelector(".testimonial");
    const testimonialCards = document.querySelectorAll(".testimonial-card");
    const testHead         = document.querySelector(".testHead");
    const caption          = document.querySelector(".caption");
    const mid              = Math.floor(testimonialCards.length / 2);

    gsap.set([testHead, caption], { opacity: 0, y: 30 });
    

     gsap.to(testHead, { opacity: 1, y: 0, duration: 0.8, ease: "softOut", scrollTrigger : {
        trigger: testimonial,
        start:   "top 50%",
        end: "top 0%",
        scrub: true,
    } });
            gsap.to(caption,  { opacity: 1, y: 0, duration: 0.8, ease: "softOut", delay: 0.12, scrollTrigger : {
        trigger: testimonial,
        start:   "top 50%",
        end: "top 0%",
        scrub: true,
    } });

    testimonialCards.forEach((item, i) => {
        const dist      = i - mid;
        const textColor = i % 2 === 0 ? "#000000" : "#ffffff";

        gsap.set(item, {
            left:                "50%",
            xPercent:            -50,
            x:                   dist * 110,
            y:                   80,
            opacity:             0,
            rotate:              dist * 2,
            rotateY:             dist * -4,
            scale:               0.88,
            zIndex:              i <= mid ? i : (2 * mid - i),
            transformPerspective: 1000,
            backgroundColor:     i % 2 === 0 ? "#2CFFFF" : "#FF2C2C",
        });

        item.querySelectorAll('.quote, .name, .title').forEach(el => {
            el.style.color = textColor;
        });

        ScrollTrigger.create({
            trigger: testimonial,
            start:   "top 55%",
            onEnter: () => {
                gsap.to(item, {
                    y: 0, opacity: 1, scale: 1,
                    duration: 0.75,
                    delay:    0.05 + i * 0.06,
                    ease:     "snap",
                });
            }
        });

        item.addEventListener("mouseenter", () => {
            gsap.to(item, {
                zIndex:    testimonialCards.length + 1,
                rotate:    0,
                rotateY:   0,
                scale:     1.04,
                y:         -12,
                boxShadow: "0 28px 64px rgba(0,0,0,0.55)",
                duration:  0.35,
                ease:      "softOut",
                overwrite: "auto",
            });
        });

        item.addEventListener("mouseleave", () => {
            gsap.to(item, {
                rotate:    dist * 2,
                rotateY:   dist * -4,
                scale:     1,
                y:         0,
                zIndex:    i <= mid ? i : (2 * mid - i),
                boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
                duration:  0.4,
                ease:      "graceful",
                overwrite: "auto",
            });
        });
    });

    /* ISSUE 3 — Testimonial → Success exit:
       Cards scatter outward like a hand of cards thrown across a
       table — each flies to a different corner. */
    const SCATTER_DIRS = [
        { x: "-120vw", y: "-60vh", rotate: -35 },
        { x: "-80vw",  y:  "80vh", rotate:  25 },
        { x:   "0vw",  y: "-90vh", rotate:  10 },
        { x:  "80vw",  y:  "80vh", rotate: -20 },
        { x: "120vw",  y: "-60vh", rotate:  40 },
    ];

    const testExitTL = gsap.timeline({
        scrollTrigger: {
            trigger: testimonial,
            start:   "bottom bottom-=80",
            end:     "bottom top+=80",
            scrub:   1.5,
        }
    });

    testimonialCards.forEach((card, i) => {
        const d = SCATTER_DIRS[i % SCATTER_DIRS.length];
        testExitTL.to(card, {
            x:        d.x,
            y:        d.y,
            rotate:   d.rotate,
            opacity:  0,
            scale:    0.7,
            ease:     "softInOut",
        }, i * 0.06);
    });
    testExitTL
        .to(testHead, { opacity: 0, y: -30, ease: "graceful" }, 0)
        .to(caption,  { opacity: 0, y: -30, ease: "graceful" }, 0.05);

    /* ════════════════════════════════════════════════════════
       SUCCESS STORIES — accordion stack reveal
    ════════════════════════════════════════════════════════ */
    const AllSuccessStories = document.querySelectorAll('.Sstory');
    const StitleS           = document.querySelectorAll('.Stitle');
    const successClass      = document.querySelector('.success');
    const Spara = document.querySelectorAll('.Spara');
    const blacky = document.querySelector('.black');
    const testHeadS = document.querySelector('.success .testHead');
    const captionS = document.querySelector('.success .caption');
    /* Stack stories vertically */
    let stackH = 0;
    AllSuccessStories.forEach(s => {
        gsap.set(s, { top: stackH, left: 0, right: 0, opacity: 0 });
        stackH += s.getBoundingClientRect().height;
    });

    ScrollTrigger.create({
        trigger: successClass,
        start:   "top 70%",
        onEnter: () => {
            gsap.to(AllSuccessStories, {
                opacity:  1,
                y:        0,
                stagger:  0.1,
                duration: 0.8,
                ease:     "softOut",
            });
        }
    });

    let movingHeights = [0];
    StitleS.forEach((t, i) => {
        if (i !== 0) {
            const h = t.getBoundingClientRect().height;
            movingHeights.push(movingHeights[i - 1] + h * 3);
        }
    });

    const successTL = gsap.timeline({
        scrollTrigger: {
            trigger:    successClass,
            start:      "top top",
            end:        "+=2200",
            scrub:      1.4,
            pin:        true,
            pinSpacing: true,
        }
    });

    gsap.set([testHeadS, captionS], {color: '#E8E8C8', backgroundColor: '#0A0A0A'});

    successTL.to([ successClass, AllSuccessStories, StitleS, Spara], {
    color: '#0A0A0A', 
    backgroundColor: '#E8E8C8', 
    duration: 0.6, 
    ease: 'power1.inOut' // Note: 'ease.inOut' is invalid, use 'power1.inOut'
    }, 0);

    successTL.to([testHeadS, captionS], {
    color: '#0A0A0A', 
    backgroundColor: '#E8E8C8', 
    duration: 0.6, 
    ease: 'power1.inOut' // Note: 'ease.inOut' is invalid, use 'power1.inOut'
    }, 0);

    AllSuccessStories.forEach((s, i) => {
        successTL.to(s, {
            top:    movingHeights[i],
            zIndex: i + 1,
            ease:   "softInOut",
        }, i * 0.5);
    });

    /* ════════════════════════════════════════════════════════
       EXTRA SECTION — image scatter reveal
       ISSUE 1 FIX: .Extra is now a flow sibling (not absolute
       inside .success). We no longer tween top:"0%" on it.
       Instead we just do the image scatter + text entrance.
    ════════════════════════════════════════════════════════ */
    const ExtraSection = document.querySelector('.Extra');
    const scrollImg    = document.querySelectorAll('.scroll-img');
    const imgScroll    = document.querySelector('.imgScroll');

    if (imgScroll && scrollImg.length) {
        const imgW   = imgScroll.getBoundingClientRect().width;
        const imgH   = imgScroll.getBoundingClientRect().height;
        const imgVal = imgW / (scrollImg.length || 1);

        scrollImg.forEach((img, i) => {
            gsap.set(img, {
                top:     Math.floor(Math.random() * (imgH / 2 - 50)),
                left:    Math.floor(Math.random() * (imgVal * 0.4) + i * imgVal - imgVal * 0.2),
                opacity: 0,
                scale:   0.8,
                rotate:  (Math.random() - 0.5) * 10,
            });
        });

        /* Images reveal as user scrolls into Extra */
        const extraRevealTL = gsap.timeline({
            scrollTrigger: {
                trigger: ExtraSection,
                start:   "top 75%",
                end:     "top 20%",
                scrub:   1.2,
            }
        });

        scrollImg.forEach((img, i) => {
            extraRevealTL.to(img, {
                opacity:  1,
                scale:    1,
                rotate:   0,
                duration: 0.18,
                ease:     "softOut",
            }, 0.06 * i);
        });

        successTL.to(blacky, {
            top: "0%"
        }, ">");
    }

    /* ── Extra section — headline parallax ── */
    const extraHead = document.querySelector('.extraHead');
    const laterHead = document.querySelector('.laterHead');
    const extraCapt = document.querySelector('.extracaption');
    const laterCapt = document.querySelector('.latercaption');

    if (extraHead && ExtraSection) {
        gsap.set([extraHead, extraCapt], { opacity: 0, x: -40 });
        gsap.set([laterHead, laterCapt], { opacity: 0, x:  40 });

        ScrollTrigger.create({
            trigger: ExtraSection,
            start:   "top 75%",
            onEnter: () => {
                gsap.to([extraHead, extraCapt],
                    { opacity: 1, x: 0, stagger: 0.1, duration: 0.9, ease: "softOut" }
                );
                gsap.to([laterHead, laterCapt],
                    { opacity: 1, x: 0, stagger: 0.1, duration: 0.9, ease: "softOut", delay: 0.15 }
                );
            }
        });
    }

    /* ════════════════════════════════════════════════════════
       NAV — hide cleanly as footer scrolls in
    ════════════════════════════════════════════════════════ */
    const footer = document.querySelector('.footer');

    ScrollTrigger.create({
        trigger: footer,
        start:   "top 80%",
        end:     "top 40%",
        scrub:   1,
        onUpdate: (self) => {
            gsap.set(nav, {
                display:       "none",
                y:              self.progress * -16,
                pointerEvents: self.progress > 0.9 ? "none" : "all",
            });
        }
    });

    /* Footer rise */
    const footerHead  = document.querySelector('.footerHead');
    const footerLinks = document.querySelectorAll('.links-section');

   const footerTimeline = gsap.timeline({
    scrollTrigger: {
        trigger: footer,
        start: "top top+=10%", // Animation starts when footer top hits screen center
        end:   "top top",    // Animation finishes perfectly when footer top hits screen top
        scrub: true          // Smoothly links the color change to your scroll wheel
    }
});

// Attach the animation directly to the timeline
footerTimeline.to(footer, {
    color: '#0A0A0A',
    backgroundColor: '#E8E8C8',
    ease: 'power1.inOut' // Use valid GSAP easing
});



    if (footerHead) {
        gsap.set(footerHead,  { y: 60, opacity: 0 });
        gsap.set(footerLinks, { opacity: 0, y: 20 });

        ScrollTrigger.create({
            trigger: footer,
            start:   "top 85%",
            onEnter: () => {
                gsap.to(footerHead,  { y: 0, opacity: 1, duration: 1.1, ease: "snap" });
                gsap.to(footerLinks, {
                    opacity: 1, y: 0,
                    stagger: 0.08, duration: 0.8, ease: "softOut", delay: 0.2
                });
            }
        });
    }

} // end initDesktopAnimations



/* ══════════════════════════════════════════════════════════════
   FAQ ACCORDION — all viewports
   ══════════════════════════════════════════════════════════════ */
function initFAQ() {
    const items = document.querySelectorAll('.item-faq');
    const paras = document.querySelectorAll('.faqPara');

    paras.forEach(p => {
        gsap.set(p, { height: 0, opacity: 0, overflow: "hidden", display: "block" });
    });

    items.forEach((item, i) => {
        const para = paras[i];
        if (!para) return;
        let open = false;

        const headline  = item.querySelector('.headline');
        const trigger   = headline || item;

        // Indicator icon
        const indicator = document.createElement('span');
        indicator.textContent = '+';
        indicator.style.cssText = `
            font-size: 1.4em;
            color: var(--primary);
            transition: transform 0.3s ease;
            display: inline-block;
            line-height: 1;
            pointer-events: none;
        `;
        if (headline) headline.appendChild(indicator);

        trigger.addEventListener('click', () => {
            open = !open;

            // Close all others
            items.forEach((otherItem, j) => {
                if (j !== i && paras[j]) {
                    gsap.to(paras[j], { height: 0, opacity: 0, duration: 0.35, ease: "graceful" });
                    const otherInd = otherItem.querySelector('span:last-child');
                    if (otherInd) {
                        gsap.to(otherInd, { rotation: 0, duration: 0.3 });
                        otherInd.textContent = '+';
                    }
                }
            });

            if (open) {
                gsap.set(para, { height: "auto", opacity: 1 });
                const autoH = para.getBoundingClientRect().height;
                gsap.fromTo(para,
                    { height: 0, opacity: 0 },
                    { height: autoH, opacity: 1, duration: 0.45, ease: "softOut" }
                );
                gsap.to(indicator, { rotation: 45, duration: 0.3, ease: "softOut" });
                indicator.textContent = '+';
            } else {
                gsap.to(para, { height: 0, opacity: 0, duration: 0.35, ease: "graceful" });
                gsap.to(indicator, { rotation: 0, duration: 0.3 });
            }
        });
    });
}

/* ══════════════════════════════════════════════════════════════
   MOBILE — nav + scroll reveals
   ══════════════════════════════════════════════════════════════ */
function initMobileNav() {
    const nav = document.querySelector("nav");
    if (nav) {
        gsap.to(nav, { opacity: 1, duration: 0.6, ease: "graceful", delay: 0.2 });
    }

    const mobileHeads = document.querySelectorAll('.large, .xlarge, .special');
    gsap.set(mobileHeads, { opacity: 0, y: 24 });

    mobileHeads.forEach(el => {
        ScrollTrigger.create({
            trigger: el,
            start:   "top 88%",
            onEnter: () => {
                gsap.to(el, { opacity: 1, y: 0, duration: 0.65, ease: "softOut" });
            }
        });
    });
}

/* ══════════════════════════════════════════════════════════════
   CURSOR GLOW — desktop only
   ══════════════════════════════════════════════════════════════ */
function initCursorGlow() {
    const glow = document.createElement('div');
    glow.style.cssText = `
        position: fixed;
        width: 320px; height: 320px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(255,255,102,0.06) 0%, transparent 70%);
        pointer-events: none;
        z-index: 0;
        top: 0; left: 0;
        transform: translate(-50%, -50%);
        transition: opacity 0.4s ease;
    `;
    document.body.appendChild(glow);

    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let cx = mx, cy = my;

    window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

    gsap.ticker.add(() => {
        cx += (mx - cx) * 0.08;
        cy += (my - cy) * 0.08;
        gsap.set(glow, { x: cx, y: cy });
    });
}

/* ══════════════════════════════════════════════════════════════
   ISSUE 4 — BOOT SEQUENCE
   Everything runs only after the page is truly ready.
   body.loading keeps visibility:hidden until resolve().
   ══════════════════════════════════════════════════════════════ */
waitForPageReady().then(() => {
    // Short next-frame yield so the browser paints the un-hidden body
    // before GSAP starts measuring dimensions (getBoundingClientRect).
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            if (IS_DESKTOP()) {
                initDesktopAnimations();
                initCursorGlow();
            } else {
                initMobileNav();
            }
            initFAQ();
        });
    });
});

/* ══════════════════════════════════════════════════════════════
   RESIZE — debounced breakpoint guard
   ══════════════════════════════════════════════════════════════ */
let _wasDesktop  = IS_DESKTOP();
let _resizeTimer;

window.addEventListener('resize', () => {
    clearTimeout(_resizeTimer);
    _resizeTimer = setTimeout(() => {
        const nowDesktop = IS_DESKTOP();
        if (nowDesktop !== _wasDesktop) {
            location.reload();
        } else if (nowDesktop) {
            ScrollTrigger.refresh();
        }
        _wasDesktop = nowDesktop;
    }, 300);
});