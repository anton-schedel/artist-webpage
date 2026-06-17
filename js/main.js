// Main JS: progressive enhancements (reveal on scroll, smooth scroll, i18n, Web3Forms submit)
(function () {
    // Helpers
    const query = (sel, root = document) => root.querySelector(sel);
    const queryAll = (sel, root = document) => Array.from(root.querySelectorAll(sel));
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Year in footer
    const yearEl = query('#year');
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());

    // Reveal on scroll
    const revealEls = queryAll('[data-reveal], .reveal');
    if (revealEls.length && 'IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in');
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });
        revealEls.forEach(el => io.observe(el));
    } else {
        // Fallback: show immediately
        revealEls.forEach(el => el.classList.add('in'));
    }

    // Parallax on hero avatar (if present)
    const avatar = query('#parallax-avatar');
    if (avatar && !reduceMotion) {
        window.addEventListener('scroll', () => {
            const y = window.scrollY * 0.12;
            avatar.style.transform = `translateY(${y}px)`;
        }, { passive: true });
    }

    // Header elevation on scroll (if header exists)
    const header = query('header');
    if (header) {
        const setHeaderState = () => {
            if (window.scrollY > 10) header.classList.add('scrolled');
            else header.classList.remove('scrolled');
        };
        setHeaderState();
        window.addEventListener('scroll', setHeaderState, { passive: true });
    }

    // Enhanced smooth scrolling for in-page anchors (with easing and header offset)
    if (!reduceMotion) {
        const anchorLinks = queryAll('a[href^="#"]');
        const headerHeight = () => (header ? header.offsetHeight + 8 : 0);
        const easeInOutCubic = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        const animateScroll = (targetY, duration = 600) => {
            const startY = window.scrollY;
            const diff = targetY - startY;
            let start;
            const step = (ts) => {
                if (!start) start = ts;
                const elapsed = ts - start;
                const t = Math.min(1, elapsed / duration);
                const eased = easeInOutCubic(t);
                window.scrollTo(0, startY + diff * eased);
                if (t < 1) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
        };

        anchorLinks.forEach(a => {
            a.addEventListener('click', (e) => {
                const href = a.getAttribute('href');
                if (!href || href === '#' || href.startsWith('#!')) return;
                const id = href.slice(1);
                const target = document.getElementById(id);
                if (target) {
                    e.preventDefault();
                    const y = Math.max(0, target.getBoundingClientRect().top + window.scrollY - headerHeight());
                    animateScroll(y, 700);
                }
            });
        });
    }

    // i18n strings (auto German if browser language starts with 'de')
    const i18n = {
        en: {
            navAbout: 'About', navMusic: 'Music', navSocial: 'Social', navBooking: 'Booking',
            heroTagline: 'Indiepop artist from munich', listenNow: 'Listen now', followInstagram: 'Follow on Instagram',
            statsTitle: 'Live on Spotify',
            musicTitle: 'Music', musicOpen: 'Open in Spotify', musicSubtitle: 'Stream my latest tracks and albums on Spotify',
            followTitle: 'Platforms', followSubtitle: 'Connect with Finn across platforms.',
            spotifySub: 'Follow and stream', appleSub: 'Listen and add', instagramSub: 'Follow @bisschenfinn', youtubeSub: 'Subscribe and listen', tiktokSub: 'Follow for clips',
            aboutTitle: 'About the artist',
            aboutP1: 'FINN is a rising artist in the German indie-pop scene, inspired by artists such as ENNIO, Schmyt and Zartmann. His songs capture the spirit of a young generation drifting between aimlessness and euphoria, between raucous nights and reflective contemplation.',
            aboutP2: 'Danceable beats meet nostalgic indie guitars, carried by authentic lyrics — often inspired by personal experiences, thought patterns or people around him.',
            highlightsTitle: 'Key Appearances',
            hl1: 'About you — Pangea Festival 2025',
            hl2: 'Medimeisterschaften 2023 / 2024 / 2025',
            hl3: 'BAYERN 3 POP Radar — Song of the Week (CW34 2025)',
            hl4: 'StuStaCulum 2024',
            hl5: 'Garnix Festival 2024',
            bookingTitle: 'Get in Touch', bookingSubtitle: "Interested in booking? Send a message and let's make it happen.",
            labelName: 'Name', labelEmail: 'Email', labelMessage: 'Message', send: 'Send',
            placeholderName: 'Your name',
            placeholderEmail: 'your.email@example.com',
            placeholderMessage: 'Tell us about your event, venue, and preferred dates...',
            formFillAll: 'Please fill out all fields.',
            openingEmail: 'Opening your email client…',
            bookingBullet1: 'Fast response, typically within 48h',
            bookingBullet2: 'Please include event date, city, and venue size',
            footerTop: 'Back to top',
            presskitLink: 'Media & Booking → Presskit',
            presskitBookingText: 'For detailed press materials, visit our',
            presskitBookingLink: 'Presskit page',
            presskitFooter: 'Presskit',
            sending: 'Sending…',
            sentSuccess: 'Thanks! Your request was sent.',
            sendError: 'Sorry, something went wrong. Please try again.',
            // Presskit page translations
            presskitTitle: 'FINN — Presskit',
            presskitSubtitle: 'All info, stats, biography and photos for media, booking and event organizers.',
            streamingStats: 'Streaming & Stats',
            streams: 'Streams',
            listeners: 'Monthly Listeners',
            followers: 'Followers',
            releasedSongs: 'Released Songs',
            importantAppearances: 'Key Appearances',
            featuresReleases: 'Features & Releases',
            blitzlichtDesc: 'The first German single that defines FINN\'s style.',
            marathonDesc: 'Written abroad — a single with emotional depth.',
            keinSchlafDesc: 'Collaboration with TONAN & valiente — an energetic track.',
            debutRelease: 'Debut Release',
            featArtists: 'Feat. Kleo mit K',
            latestRelease: 'Feat. TONAN & valiente',
            biography: 'Biography',
            earlyYears: 'Early Years',
            earlyYearsDesc: 'FINN discovered his passion for music during his school years. As a guitarist in big bands and jazz ensembles, he gained initial experience before vocals and solo performances in Munich bars like Import Export and Lost Weekend moved to the forefront.',
            breakthrough2024: '2024 — First Release',
            breakthrough2024Desc: 'With "Blitzlicht," FINN released his first original music in German. This was followed by performances at student festivals like StuStaCulum and Garnix Festival, cementing his growing presence in the scene.',
            festival2025: '2025 — Festival Highlight',
            festival2025Desc: 'After releasing his two most recent songs, FINN\'s live history culminated in a performance at the Pangea – About You Festival 2025, one of the most significant festival appearances of his career.',
            eventBand: 'Event Band 4attic',
            eventBandDesc: 'Outside his solo career, FINN gains stage experience with his event band 4attic. Performances include the Pasinger Vorwiesn, corporate events, private pool parties, and the Menzinger Winzerfest.',
            medimeisterschaften: 'Medimeisterschaften',
            medimeisterschaftenDesc: 'Away from his solo project, FINN also celebrated major successes:',
            drOetkerStreams: '427,000 Spotify Streams',
            blubStreams: '66,000 Spotify Streams',
            festivalAudience: 'Live to up to 10,000 festival-goers (2023-2025)',
            radioFeature: 'Radio Feature',
            radioFeatureDesc: 'BAYERN 3 POP Radar — Song of the Week (CW34 2025)',
            whatsNext: 'What\'s Next?',
            whatsNextDesc: 'In addition to the already released songs, FINN enriches his live performances with numerous unreleased tracks from his upcoming EP.',
            artistPhotos: 'Artist Photos',
            socialLinks: 'Social Links',
            backToHome: 'Back to Home',
            bookingCta: 'Booking Inquiries'
        },
        de: {
            navAbout: 'Über', navMusic: 'Musik', navSocial: 'Social', navBooking: 'Booking',
            heroTagline: 'Indiepop Artist aus München', listenNow: 'Jetzt hören', followInstagram: 'Folge auf Instagram',
            statsTitle: 'Live auf Spotify',
            musicTitle: 'Musik', musicOpen: 'Auf Spotify öffnen', musicSubtitle: 'Höre meine neuesten Tracks und Alben auf Spotify',
            followTitle: 'Plattformen', followSubtitle: 'Folge Finn auf allen Plattformen.',
            spotifySub: 'Folgen und streamen', appleSub: 'Anhören und hinzufügen', instagramSub: 'Folge @bisschenfinn', youtubeSub: 'Abonnieren und hören', tiktokSub: 'Clips & Updates',
            aboutTitle: 'Über den Künstler',
            aboutP1: 'FINN ist ein aufstrebender Künstler der deutschen Indie-Pop-Szene, inspiriert von Größen wie ENNIO, Schmyt und Zartmann. Seine Songs fangen das Lebensgefühl einer jungen Generation ein, die zwischen Orientierungslosigkeit und Euphorie, zwischen rauschhaften Nächten und nachdenklicher Reflexion pendelt.',
            aboutP2: 'Tanzbare Beats treffen auf nostalgische Indie-Gitarren, getragen von authentischen Texten – oft inspiriert von persönlichen Erfahrungen, Gedankenmustern oder Menschen aus seinem Umfeld.',
            highlightsTitle: 'Wichtige Erscheinungen',
            hl1: 'About you — Pangea Festival 2025',
            hl2: 'Medimeisterschaften 2023 / 2024 / 2025',
            hl3: 'BAYERN 3 POP Radar — Song der Woche (KW34 2025)',
            hl4: 'StuStaCulum 2024',
            hl5: 'Garnix Festival 2024',
            bookingTitle: 'Buchung', bookingSubtitle: 'Interesse an einer Buchung? Schicke eine Nachricht!',
            labelName: 'Name', labelEmail: 'E-Mail', labelMessage: 'Nachricht', send: 'Senden',
            placeholderName: 'Dein Name',
            placeholderEmail: 'deine.email@example.com',
            placeholderMessage: 'Erzähle von deinem Event, der Location und deinen Wunschdaten...',
            formFillAll: 'Bitte fülle alle Felder aus.',
            openingEmail: 'E-Mail-Programm wird geöffnet…',
            bookingBullet1: 'Schnelle Antwort, in der Regel innerhalb von 48h',
            bookingBullet2: 'Bitte Datum, Stadt und Venue-Größe angeben',
            footerTop: 'Zurück nach oben',
            presskitLink: 'Medien & Booking → Presskit',
            presskitBookingText: 'Für detaillierte Pressematerialien, besuche unser',
            presskitBookingLink: 'Presskit',
            presskitFooter: 'Presskit',
            sending: 'Senden…',
            sentSuccess: 'Danke! Deine Anfrage wurde versendet.',
            sendError: 'Leider ist ein Fehler aufgetreten. Bitte versuche es erneut.',
            // Presskit page translations
            presskitTitle: 'FINN — Presskit',
            presskitSubtitle: 'Alle Infos, Zahlen, Biografie und Fotos für Medien, Booking und Veranstalter.',
            streamingStats: 'Streaming & Stats',
            streams: 'Streams',
            listeners: 'Monatliche Hörer',
            followers: 'Follower',
            releasedSongs: 'Veröffentlichte Songs',
            importantAppearances: 'Wichtige Erscheinungen',
            featuresReleases: 'Features & Releases',
            blitzlichtDesc: 'Die erste deutsche Single, die FINNs Stil definiert.',
            marathonDesc: 'Mit "Kleo mit K" – die neueste Single mit emotionaler Tiefe.',
            keinSchlafDesc: 'Kollaboration mit TONAN & valiente – ein energiegeladener Track.',
            debutRelease: 'Debut Release',
            featArtists: 'Feat. TONAN & valiente',
            latestRelease: 'Latest Release',
            biography: 'Biografie',
            earlyYears: 'Frühe Jahre',
            earlyYearsDesc: 'FINN entdeckte bereits in seiner Schulzeit seine Leidenschaft für Musik. Als Gitarrist in Big Bands und Jazz-Ensembles sammelte er erste Erfahrungen, bevor Gesang und Soloauftritte in Münchner Bars wie dem Import Export und Lost Weekend in den Vordergrund rückten.',
            breakthrough2024: '2024 — Erster Release',
            breakthrough2024Desc: 'Mit „Blitzlicht" veröffentlichte FINN seine erste eigene Musik auf Deutsch. Es folgten Auftritte bei studentischen Festivals wie dem StuStaCulum und dem Garnix Festival, die seine wachsende Präsenz in der Szene manifestierten.',
            festival2025: '2025 — Festival Highlight',
            festival2025Desc: 'Nach der Veröffentlichung seiner beiden jüngsten Songs gipfelte FINNs Live-Historie in einem Auftritt auf dem Pangea – About You Festival 2025, einem der bedeutendsten Festival-Auftritte seiner Karriere.',
            eventBand: 'Event-Band 4attic',
            eventBandDesc: 'Außerhalb seiner Solokarriere sammelt FINN Bühnenerfahrung mit seiner Event-Band 4attic. Auftritte umfassen die Pasinger Vorwiesn, Firmenfeiern, private Poolpartys und das Menzinger Winzerfest.',
            medimeisterschaften: 'Medimeisterschaften',
            medimeisterschaftenDesc: 'Auch abseits seines Soloprojekts konnte FINN große Erfolge feiern:',
            drOetkerStreams: '427.000 Spotify-Streams',
            blubStreams: '66.000 Spotify-Streams',
            festivalAudience: 'Live vor bis zu 10.000 Festivalgästen (2023-2025)',
            radioFeature: 'Radio Feature',
            radioFeatureDesc: 'BAYERN 3 POP Radar – Song der Woche (KW34 2025)',
            whatsNext: 'Was kommt als Nächstes?',
            whatsNextDesc: 'Neben den bereits releasten Songs bereichert FINN seine Live-Performances mit zahlreichen noch unreleasten Tracks seiner kommenden EP.',
            artistPhotos: 'Artist Fotos',
            socialLinks: 'Social Links',
            backToHome: 'Zurück zur Startseite',
            bookingCta: 'Booking Anfragen'
        }
    };

    let currentI18n = i18n.en;

    const applyI18n = () => {
        const lang = (navigator.language || navigator.userLanguage || 'en').toLowerCase().startsWith('de') ? 'de' : 'en';
        const t = i18n[lang];
        currentI18n = t;
        const setText = (sel, val) => { const el = query(sel); if (el && typeof val === 'string') el.textContent = val; };
        const setPlaceholder = (sel, val) => { const el = query(sel); if (el && typeof val === 'string') el.setAttribute('placeholder', val); };
        setText('#nav-about', t.navAbout);
        setText('#nav-music', t.navMusic);
        setText('#nav-social', t.navSocial);
        setText('#nav-booking', t.navBooking);
        setText('#hero-tagline', t.heroTagline);
        setText('#stats-title', t.statsTitle);
        setText('#music-title', t.musicTitle);
        setText('#music-subtitle', t.musicSubtitle);
        setText('#music-open-btn-label', t.musicOpen);
        setText('#social-title', t.followTitle);
        setText('#social-subtitle', t.followSubtitle);
        setText('#spotify-sub', t.spotifySub);
        setText('#apple-sub', t.appleSub);
        setText('#instagram-sub', t.instagramSub);
        setText('#youtube-sub', t.youtubeSub);
        setText('#tiktok-sub', t.tiktokSub);
        setText('#about-title', t.aboutTitle);
        setText('#about-p1', t.aboutP1);
        setText('#about-p2', t.aboutP2);
        setText('#highlights-title', t.highlightsTitle);
        setText('#hl-1', t.hl1);
        setText('#hl-2', t.hl2);
        setText('#hl-3', t.hl3);
        setText('#hl-4', t.hl4);
        setText('#hl-5', t.hl5);
        setText('#booking-title', t.bookingTitle);
        setText('#booking-subtitle', t.bookingSubtitle);
        setText('#label-name', t.labelName);
        setText('#label-email', t.labelEmail);
        setText('#label-message', t.labelMessage);
        setText('#btn-send', t.send);
        setPlaceholder('#name', t.placeholderName);
        setPlaceholder('#email', t.placeholderEmail);
        setPlaceholder('#message', t.placeholderMessage);
        setText('#booking-bullet1', t.bookingBullet1);
        setText('#booking-bullet2', t.bookingBullet2);
        setText('#footer-top', t.footerTop);
        setText('#btn-listen-now-label', t.listenNow);
        setText('#btn-follow-instagram-label', t.followInstagram);
        setText('#presskit-link-hero', t.presskitLink);
        setText('#presskit-booking-text', t.presskitBookingText);
        setText('#presskit-booking-link', t.presskitBookingLink);
        setText('#presskit-footer', t.presskitFooter);
        // Presskit page translations
        setText('#presskit-title', t.presskitTitle);
        setText('#presskit-subtitle', t.presskitSubtitle);
        setText('#streaming-stats', t.streamingStats);
        setText('#streams-label', t.streams);
        setText('#listeners-label', t.listeners);
        setText('#followers-label', t.followers);
        setText('#released-songs', t.releasedSongs);
        setText('#important-appearances', t.importantAppearances);
        setText('#features-releases', t.featuresReleases);
        setText('#blitzlicht-desc', t.blitzlichtDesc);
        setText('#marathon-desc', t.marathonDesc);
        setText('#keinschlaf-desc', t.keinSchlafDesc);
        setText('#debut-release', t.debutRelease);
        setText('#feat-artists', t.featArtists);
        setText('#latest-release', t.latestRelease);
        setText('#biography', t.biography);
        setText('#early-years', t.earlyYears);
        setText('#early-years-desc', t.earlyYearsDesc);
        setText('#breakthrough-2024', t.breakthrough2024);
        setText('#breakthrough-2024-desc', t.breakthrough2024Desc);
        setText('#festival-2025', t.festival2025);
        setText('#festival-2025-desc', t.festival2025Desc);
        setText('#event-band', t.eventBand);
        setText('#event-band-desc', t.eventBandDesc);
        setText('#medimeisterschaften', t.medimeisterschaften);
        setText('#medimeisterschaften-desc', t.medimeisterschaftenDesc);
        setText('#droetker-streams', t.drOetkerStreams);
        setText('#blub-streams', t.blubStreams);
        setText('#festival-audience', t.festivalAudience);
        setText('#radio-feature', t.radioFeature);
        setText('#radio-feature-desc', t.radioFeatureDesc);
        setText('#whats-next', t.whatsNext);
        setText('#whats-next-desc', t.whatsNextDesc);
        setText('#artist-photos', t.artistPhotos);
        setText('#social-links', t.socialLinks);
        setText('#back-to-home', t.backToHome);
        setText('#booking-cta', t.bookingCta);
    };

    applyI18n();

    // Booking form: always send via Web3Forms
    const form = query('#booking-form');
    const status = query('#form-status');
    const sendBtn = query('#btn-send');
    const WEB3FORMS_KEY = 'e1a3aa4a-f38e-4db9-8bfe-4fec92bf1879';

    const sendViaWeb3Forms = async ({ name, email, message }) => {
        const fd = new FormData();
        fd.append('access_key', WEB3FORMS_KEY);
        fd.append('from_name', name);
        fd.append('from_email', email);
        fd.append('subject', `FINN Booking request — ${name}`);
        fd.append('message', message);
        fd.append('replyto', "finn.schindler24@gmail.com");
        const res = await fetch('https://api.web3forms.com/submit', { method: 'POST', body: fd });
        const data = await res.json().catch(() => ({}));
        return !!data.success;
    };

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = form.name.value.trim();
            const email = form.email.value.trim();
            const message = form.message.value.trim();

            if (!name || !email || !message) {
                if (status) status.textContent = currentI18n.formFillAll || 'Please fill out all fields.';
                return;
            }

            (async () => {
                if (status) status.textContent = currentI18n.sending || 'Sending…';
                if (sendBtn) { sendBtn.disabled = true; sendBtn.classList.add('opacity-70', 'cursor-not-allowed'); }
                try {
                    const ok = await sendViaWeb3Forms({ name, email, message });
                    if (ok) {
                        if (status) status.textContent = currentI18n.sentSuccess || 'Sent!';
                        form.reset();
                    } else {
                        throw new Error('Web3Forms error');
                    }
                } catch (err) {
                    if (status) status.textContent = currentI18n.sendError || 'Sorry, something went wrong. Please try again.';
                } finally {
                    if (sendBtn) { sendBtn.disabled = false; sendBtn.classList.remove('opacity-70', 'cursor-not-allowed'); }
                }
            })();
        });
    }

    // Animated stat counters (presskit page) + live Spotify values.
    // Endpoint is the Cloudflare Worker proxy; leave empty to keep static fallback numbers.
    // See spotify-worker/README.md for setup.
    const SPOTIFY_STATS_ENDPOINT = 'https://finn-spotify-stats.finnmusic.workers.dev';
    const statStreams = query('#stat-streams');
    const statListeners = query('#stat-listeners');
    const statFollowers = query('#stat-followers');
    const statEls = [statStreams, statListeners, statFollowers].filter(Boolean);

    if (statEls.length) {
        const parseNum = (s) => Number(String(s).replace(/[^\d]/g, '')) || 0;
        const fmt = (n) => Number(n).toLocaleString('de-DE');
        const targets = new Map(statEls.map(el => [el, parseNum(el.textContent)]));
        const canAnimate = !reduceMotion && 'IntersectionObserver' in window;
        const raf = new Map(); // in-flight animation id per element

        const animateCount = (el, to, from = 0, dur = 1400) => {
            if (raf.has(el)) cancelAnimationFrame(raf.get(el)); // supersede any running count
            const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
            let start;
            const step = (ts) => {
                if (!start) start = ts;
                const t = Math.min(1, (ts - start) / dur);
                el.textContent = fmt(Math.round(from + (to - from) * easeOutCubic(t)));
                if (t < 1) raf.set(el, requestAnimationFrame(step));
                else { el.textContent = fmt(to); raf.delete(el); }
            };
            raf.set(el, requestAnimationFrame(step));
        };

        // Count up the first time each stat scrolls into view.
        if (canAnimate) {
            statEls.forEach(el => { el.textContent = '0'; });
            const io = new IntersectionObserver((entries, obs) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const el = entry.target;
                        el.dataset.shown = '1';
                        animateCount(el, targets.get(el) || 0, 0);
                        obs.unobserve(el);
                    }
                });
            }, { threshold: 0.4 });
            statEls.forEach(el => io.observe(el));
        }

        // Pull live numbers; update targets and re-animate any counter already shown.
        if (SPOTIFY_STATS_ENDPOINT && (statStreams || statListeners || statFollowers)) {
            const onLive = (el, val) => {
                if (!el || val == null) return;
                targets.set(el, Number(val));
                if (canAnimate) {
                    if (el.dataset.shown) animateCount(el, Number(val), parseNum(el.textContent), 700);
                } else {
                    el.textContent = fmt(val);
                }
            };
            fetch(SPOTIFY_STATS_ENDPOINT)
                .then(r => r.ok ? r.json() : Promise.reject(r.status))
                .then(d => {
                    onLive(statListeners, d.monthlyListeners);
                    onLive(statStreams, d.totalStreams);
                    onLive(statFollowers, d.followers);
                })
                .catch(() => { /* keep fallback targets */ });
        }
    }
})();
