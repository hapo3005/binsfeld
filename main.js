(() => {
    const header = document.querySelector(".site-header");
    const yearElement = document.querySelector("#year");
    const revealElements = document.querySelectorAll(".reveal, .js-reveal");
    const contactForm = document.querySelector("#contactForm");
    const formNote = document.querySelector("#formNote");
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }

    function updateHeaderState() {
        if (!header) return;
        header.classList.toggle("is-scrolled", window.scrollY > 14);
    }

    window.addEventListener("scroll", updateHeaderState, { passive: true });
    updateHeaderState();

    function createScrollTopButton() {
        const button = document.createElement("button");
        button.className = "scroll-top-button";
        button.type = "button";
        button.setAttribute("aria-label", "Nach oben scrollen");
        button.innerHTML = `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 14.5 12 8l6 6.5" />
            </svg>
        `;

        function updateScrollTopButton() {
            const shouldShow = window.scrollY > Math.max(360, window.innerHeight * 0.55);
            button.classList.toggle("is-visible", shouldShow);
        }

        button.addEventListener("click", () => {
            window.scrollTo({
                top: 0,
                behavior: prefersReducedMotion ? "auto" : "smooth"
            });
        });

        document.body.appendChild(button);
        window.addEventListener("scroll", updateScrollTopButton, { passive: true });
        updateScrollTopButton();
    }

    createScrollTopButton();

    function closeMobileNavigation() {
        const openMenu = document.querySelector(".navbar-collapse.show");
        const toggler = document.querySelector(".mobile-menu-button");

        if (!openMenu) return;

        openMenu.classList.remove("show");

        if (toggler) {
            toggler.setAttribute("aria-expanded", "false");
        }
    }

    document.querySelectorAll(".mobile-menu-button").forEach((toggler) => {
        toggler.addEventListener("click", () => {
            const targetSelector = toggler.getAttribute("data-menu-target");
            const menu = targetSelector ? document.querySelector(targetSelector) : null;
            if (!menu) return;

            const isOpen = menu.classList.toggle("show");
            toggler.setAttribute("aria-expanded", String(isOpen));
        });
    });

    document.querySelectorAll(".navbar-collapse .nav-link, .navbar-collapse .btn").forEach((link) => {
        link.addEventListener("click", closeMobileNavigation);
    });

    if (prefersReducedMotion) {
        revealElements.forEach((element) => element.classList.add("is-visible"));
    } else if ("IntersectionObserver" in window) {
        const revealObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    entry.target.classList.add("is-visible");
                    revealObserver.unobserve(entry.target);
                });
            },
            {
                threshold: 0.14,
                rootMargin: "0px 0px -40px 0px"
            }
        );

        revealElements.forEach((element) => revealObserver.observe(element));
    } else {
        revealElements.forEach((element) => element.classList.add("is-visible"));
    }

    function createImpressionsGallery() {
        const gallery = document.querySelector(".impressions-gallery");
        if (!gallery) return;

        const mainImage = gallery.querySelector(".impressions-main-image");
        const counter = gallery.querySelector(".impressions-counter");
        const stage = gallery.querySelector(".impressions-stage");
        const strip = gallery.querySelector(".impressions-strip");
        const thumbs = [...gallery.querySelectorAll(".impressions-thumb")];
        const prevBtn = gallery.querySelector(".impressions-prev");
        const nextBtn = gallery.querySelector(".impressions-next");

        if (!mainImage || !counter || !stage || !thumbs.length) return;

        let activeIndex = 0;
        let pointerStartX = null;
        let pointerCurrentX = null;
        let autoplayTimer = null;
        const autoplayDelay = 3600;

        function stopAutoplay() {
            if (!autoplayTimer) return;
            window.clearInterval(autoplayTimer);
            autoplayTimer = null;
        }

        function startAutoplay() {
            if (prefersReducedMotion) return;
            stopAutoplay();
            autoplayTimer = window.setInterval(nextImage, autoplayDelay);
        }

        function restartAutoplay() {
            stopAutoplay();
            startAutoplay();
        }

        function showImage(index, shouldScroll = true) {
            activeIndex = positiveModulo(index, thumbs.length);
            const activeThumb = thumbs[activeIndex];
            const src = activeThumb.dataset.src;

            if (src) {
                mainImage.src = src;
                mainImage.alt = `Impression ${activeIndex + 1} der Zahnarztpraxis Binsfeld`;
            }

            counter.textContent = `${activeIndex + 1} / ${thumbs.length}`;

            thumbs.forEach((thumb, thumbIndex) => {
                const isActive = thumbIndex === activeIndex;
                thumb.classList.toggle("is-active", isActive);
                thumb.setAttribute("aria-current", isActive ? "true" : "false");
            });

            if (shouldScroll) {
                activeThumb.scrollIntoView({
                    behavior: prefersReducedMotion ? "auto" : "smooth",
                    block: "nearest",
                    inline: "center"
                });
            }
        }

        function nextImage() {
            showImage(activeIndex + 1);
        }

        function prevImage() {
            showImage(activeIndex - 1);
        }

        thumbs.forEach((thumb, index) => {
            thumb.addEventListener("click", () => {
                showImage(index);
                restartAutoplay();
            });
        });

        if (prevBtn) {
            prevBtn.addEventListener("click", () => {
                prevImage();
                restartAutoplay();
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener("click", () => {
                nextImage();
                restartAutoplay();
            });
        }

        stage.addEventListener("keydown", (event) => {
            if (event.key === "ArrowRight") {
                event.preventDefault();
                nextImage();
                restartAutoplay();
            }

            if (event.key === "ArrowLeft") {
                event.preventDefault();
                prevImage();
                restartAutoplay();
            }
        });

        stage.addEventListener("pointerdown", (event) => {
            pointerStartX = event.clientX;
            pointerCurrentX = event.clientX;

            if (typeof stage.setPointerCapture === "function") {
                stage.setPointerCapture(event.pointerId);
            }
        });

        stage.addEventListener("pointermove", (event) => {
            if (pointerStartX === null) return;
            pointerCurrentX = event.clientX;
        });

        function finishPointer(event) {
            if (pointerStartX === null) return;

            const endX = pointerCurrentX !== null ? pointerCurrentX : event.clientX;
            const delta = endX - pointerStartX;
            pointerStartX = null;
            pointerCurrentX = null;

            if (Math.abs(delta) < 46) return;
            if (delta < 0) nextImage();
            if (delta > 0) prevImage();
            restartAutoplay();
        }

        stage.addEventListener("pointerup", finishPointer);
        stage.addEventListener("pointercancel", () => {
            pointerStartX = null;
            pointerCurrentX = null;
        });

        if (strip) {
            strip.addEventListener("wheel", (event) => {
                if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
                event.preventDefault();
                strip.scrollLeft += event.deltaY;
            }, { passive: false });
        }

        showImage(0, false);
        startAutoplay();
    }

    function createTeamCoverflow() {
        const slider = document.querySelector("#teamCoverflow");
        if (!slider) return;

        const cards = [...slider.querySelectorAll(".card")];
        const prevBtn = slider.querySelector(".prev");
        const nextBtn = slider.querySelector(".next");
        const dotsWrap = slider.querySelector(".dots");

        if (!cards.length || !dotsWrap) return;

        let activeIndex = 0;
        let pointerStartX = null;
        let pointerStartY = null;
        let pointerCurrentX = null;

        cards.forEach((card, index) => {
            card.setAttribute("aria-hidden", index === activeIndex ? "false" : "true");

            const dot = document.createElement("button");
            dot.type = "button";
            dot.setAttribute("aria-label", `Behandler ${index + 1} anzeigen`);

            dot.addEventListener("click", () => {
                activeIndex = index;
                updateSlider();
            });

            dotsWrap.appendChild(dot);
        });

        const dots = [...dotsWrap.querySelectorAll("button")];

        function getOffset(index) {
            let offset = index - activeIndex;

            if (offset > cards.length / 2) offset -= cards.length;
            if (offset < -cards.length / 2) offset += cards.length;

            return offset;
        }

        function updateSlider() {
            cards.forEach((card, index) => {
                const offset = getOffset(index);

                card.className = "card";
                card.setAttribute("aria-hidden", offset === 0 ? "false" : "true");

                if (offset === 0) card.classList.add("is-active");
                if (offset === -1) card.classList.add("is-prev");
                if (offset === 1) card.classList.add("is-next");
                if (offset === -2) card.classList.add("is-far-prev");
                if (offset === 2) card.classList.add("is-far-next");
            });

            dots.forEach((dot, index) => {
                const isActive = index === activeIndex;
                dot.classList.toggle("is-active", isActive);
                dot.setAttribute("aria-current", isActive ? "true" : "false");
            });
        }

        function nextSlide() {
            activeIndex = (activeIndex + 1) % cards.length;
            updateSlider();
        }

        function prevSlide() {
            activeIndex = (activeIndex - 1 + cards.length) % cards.length;
            updateSlider();
        }

        if (prevBtn) {
            prevBtn.addEventListener("click", prevSlide);
        }

        if (nextBtn) {
            nextBtn.addEventListener("click", nextSlide);
        }

        [prevBtn, nextBtn, ...dots].forEach((control) => {
            if (control) {
                control.addEventListener("pointerdown", (event) => {
                    event.stopPropagation();
                });
            }
        });

        slider.addEventListener("keydown", (event) => {
            if (event.key === "ArrowRight") {
                event.preventDefault();
                nextSlide();
            }

            if (event.key === "ArrowLeft") {
                event.preventDefault();
                prevSlide();
            }
        });

        function resetPointer() {
            pointerStartX = null;
            pointerStartY = null;
            pointerCurrentX = null;
            slider.classList.remove("is-dragging");
        }

        slider.addEventListener("pointerdown", (event) => {
            if (event.target.closest("button")) return;

            pointerStartX = event.clientX;
            pointerStartY = event.clientY;
            pointerCurrentX = event.clientX;
            slider.classList.add("is-dragging");

            if (typeof slider.setPointerCapture === "function") {
                slider.setPointerCapture(event.pointerId);
            }
        });

        slider.addEventListener("pointermove", (event) => {
            if (pointerStartX === null || pointerStartY === null) return;

            const deltaX = event.clientX - pointerStartX;
            const deltaY = event.clientY - pointerStartY;
            pointerCurrentX = event.clientX;

            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 8) {
                event.preventDefault();
            }
        });

        slider.addEventListener("pointerup", (event) => {
            if (pointerStartX === null) return;

            const endX = pointerCurrentX !== null ? pointerCurrentX : event.clientX;
            const delta = endX - pointerStartX;
            resetPointer();

            if (Math.abs(delta) < 48) return;
            if (delta < 0) nextSlide();
            if (delta > 0) prevSlide();
        });

        slider.addEventListener("pointercancel", resetPointer);
        slider.addEventListener("pointerleave", () => {
            if (pointerStartX === null) return;

            const delta = (pointerCurrentX !== null ? pointerCurrentX : pointerStartX) - pointerStartX;
            resetPointer();

            if (Math.abs(delta) < 56) return;
            if (delta < 0) nextSlide();
            if (delta > 0) prevSlide();
        });

        updateSlider();
    }

    function positiveModulo(value, length) {
        return ((value % length) + length) % length;
    }

    function getDirectSlides(wrapper) {
        return [...wrapper.children].filter((child) => child.classList.contains("swiper-slide"));
    }

    function prepareSeamlessSlides(swiperElement, sideSets = 5) {
        const wrapper = swiperElement.querySelector(".swiper-wrapper");

        if (!wrapper) {
            return { originalCount: 0, centerStart: 0, sideSets };
        }

        const originalSlides = getDirectSlides(wrapper).map((slide) => slide.cloneNode(true));
        const originalCount = originalSlides.length;

        if (originalCount <= 1) {
            return { originalCount, centerStart: 0, sideSets };
        }

        wrapper.innerHTML = "";

        const totalSets = sideSets * 2 + 1;
        const centerSet = sideSets;

        for (let setIndex = 0; setIndex < totalSets; setIndex += 1) {
            originalSlides.forEach((originalSlide, realIndex) => {
                const slide = originalSlide.cloneNode(true);
                slide.dataset.realIndex = String(realIndex);
                slide.dataset.loopSet = String(setIndex);

                if (setIndex !== centerSet) {
                    slide.dataset.loopClone = "true";
                    slide.setAttribute("aria-hidden", "true");
                }

                wrapper.appendChild(slide);
            });
        }

        return { originalCount, centerStart: originalCount * centerSet, sideSets };
    }

    function getRealIndex(swiper, originalCount) {
        if (!swiper || !swiper.slides || !swiper.slides.length || originalCount <= 0) return 0;

        const activeSlide = swiper.slides[swiper.activeIndex];
        const realIndex = Number(activeSlide && activeSlide.dataset ? activeSlide.dataset.realIndex : undefined);

        if (Number.isInteger(realIndex)) return realIndex;

        return positiveModulo(swiper.activeIndex, originalCount);
    }

    function normalizeSeamlessPosition(swiper, config) {
        if (!swiper || !config || config.originalCount <= 1) return;

        const { originalCount, centerStart } = config;
        const realIndex = getRealIndex(swiper, originalCount);
        const safeStart = centerStart - originalCount * 2;
        const safeEnd = centerStart + originalCount * 3 - 1;

        if (swiper.activeIndex < safeStart || swiper.activeIndex > safeEnd) {
            swiper.slideTo(centerStart + realIndex, 0, false);
        }
    }

    function setupManualPagination(swiperElement, swiper, config) {
        const pagination = swiperElement.querySelector(".swiper-pagination");

        if (!pagination || !swiper || !config || config.originalCount <= 1) return;

        pagination.innerHTML = "";

        const bullets = [];

        for (let index = 0; index < config.originalCount; index += 1) {
            const bullet = document.createElement("button");
            bullet.type = "button";
            bullet.className = "swiper-pagination-bullet";
            bullet.setAttribute("aria-label", `Slide ${index + 1} anzeigen`);

            bullet.addEventListener("click", () => {
                swiper.slideTo(config.centerStart + index);
            });

            pagination.appendChild(bullet);
            bullets.push(bullet);
        }

        function updatePagination() {
            const realIndex = getRealIndex(swiper, config.originalCount);

            bullets.forEach((bullet, index) => {
                const isActive = index === realIndex;
                bullet.classList.toggle("swiper-pagination-bullet-active", isActive);
                bullet.setAttribute("aria-current", isActive ? "true" : "false");
            });
        }

        swiper.on("slideChange", updatePagination);
        swiper.on("transitionEnd", updatePagination);
        updatePagination();
    }

    function createSeamlessSwiper(target, options = {}) {
        if (typeof Swiper === "undefined") return null;

        const element = typeof target === "string" ? document.querySelector(target) : target;
        if (!element) return null;

        const config = prepareSeamlessSlides(element, 5);
        const prev = element.querySelector(".swiper-button-prev");
        const next = element.querySelector(".swiper-button-next");

        const {
            initialSlide = 0,
            loop,
            loopedSlides,
            loopAdditionalSlides,
            pagination,
            navigation,
            ...swiperOptions
        } = options;

        const safeInitialSlide = config.originalCount > 1
            ? config.centerStart + positiveModulo(initialSlide, config.originalCount)
            : 0;

        const swiper = new Swiper(element, {
            speed: 720,
            grabCursor: true,
            simulateTouch: true,
            allowTouchMove: true,
            touchRatio: 1,
            touchAngle: 38,
            centeredSlides: true,
            slidesPerView: "auto",
            effect: "coverflow",
            watchSlidesProgress: true,
            loop: false,
            rewind: false,
            initialSlide: safeInitialSlide,
            keyboard: {
                enabled: true,
                onlyInViewport: true
            },
            autoplay: prefersReducedMotion
                ? false
                : {
                    delay: 4400,
                    disableOnInteraction: false,
                    pauseOnMouseEnter: true
                },
            coverflowEffect: {
                rotate: 0,
                stretch: 0,
                depth: 115,
                modifier: 1.25,
                slideShadows: false
            },
            pagination: false,
            navigation: prev && next
                ? {
                    prevEl: prev,
                    nextEl: next
                }
                : undefined,
            ...swiperOptions
        });

        swiper.on("transitionEnd", () => normalizeSeamlessPosition(swiper, config));
        swiper.on("slideChangeTransitionEnd", () => normalizeSeamlessPosition(swiper, config));

        setupManualPagination(element, swiper, config);

        return swiper;
    }

    function createSwipers() {
        if (typeof Swiper === "undefined") {
            document.documentElement.classList.add("no-swiper");
            return;
        }

        const doctorSwiperElement = document.querySelector(".doctor-swiper");

        if (doctorSwiperElement) {
            new Swiper(doctorSwiperElement, {
                loop: true,
                speed: 700,
                grabCursor: true,
                simulateTouch: true,
                allowTouchMove: true,
                touchRatio: 1,
                touchAngle: 38,
                effect: "fade",
                fadeEffect: {
                    crossFade: true
                },
                autoHeight: true,
                keyboard: {
                    enabled: true,
                    onlyInViewport: true
                },
                pagination: {
                    el: doctorSwiperElement.querySelector(".doctor-pagination"),
                    clickable: true
                },
                navigation: {
                    nextEl: doctorSwiperElement.querySelector(".doctor-next"),
                    prevEl: doctorSwiperElement.querySelector(".doctor-prev")
                }
            });
        }

        document.querySelectorAll(".staff-swiper").forEach((swiperElement) => {
            createSeamlessSwiper(swiperElement, {
                effect: "slide",
                centeredSlides: false,
                spaceBetween: 18,
                slidesPerView: 1.08,
                autoplay: false,
                breakpoints: {
                    576: { slidesPerView: 1.5 },
                    768: { slidesPerView: 2.15 },
                    992: { slidesPerView: 3 }
                }
            });
        });

        createSeamlessSwiper(".lab-swiper", { autoplay: false });
        createSeamlessSwiper(".hygiene-swiper", { initialSlide: 1 });
        createSeamlessSwiper(".assistant-swiper", { initialSlide: 1 });
        createSeamlessSwiper(".zfa-swiper", { initialSlide: 0 });
    }

    if (contactForm) {
        contactForm.addEventListener("submit", (event) => {
            event.preventDefault();

            const formData = new FormData(contactForm);
            const name = String(formData.get("name") || "").trim();
            const email = String(formData.get("email") || "").trim();
            const phone = String(formData.get("phone") || "").trim();
            const newPatient = String(formData.get("newPatient") || "").trim();
            const concern = String(formData.get("concern") || "").trim();
            const preferredTime = String(formData.get("preferredTime") || "").trim();
            const callback = formData.get("callback") ? "Ja" : "Nein";
            const privacyConsent = formData.get("privacyConsent");
            const message = String(formData.get("message") || "").trim();

            if (!name || !email || !newPatient || !concern || !message || !privacyConsent) {
                if (formNote) {
                    formNote.textContent = "Bitte f\u00fcllen Sie alle Pflichtfelder aus und best\u00e4tigen Sie den Datenschutzhinweis.";
                    formNote.style.color = "#b42318";
                }
                return;
            }

            if (callback === "Ja" && !phone) {
                if (formNote) {
                    formNote.textContent = "Bitte geben Sie f\u00fcr einen R\u00fcckruf auch Ihre Telefonnummer an.";
                    formNote.style.color = "#b42318";
                }
                return;
            }

            const subject = encodeURIComponent(`Terminanfrage von ${name}`);
            const body = encodeURIComponent(
                `Name: ${name}\nE-Mail: ${email}\nTelefon: ${phone || "Nicht angegeben"}\nNeupatient: ${newPatient}\nAnliegen: ${concern}\nWunschzeitraum: ${preferredTime || "Nicht angegeben"}\nR\u00fcckruf bevorzugt: ${callback}\nDatenschutzhinweis best\u00e4tigt: Ja\n\nNachricht:\n${message}`
            );

            window.location.href = `mailto:praxis@za-binsfeld.de?subject=${subject}&body=${body}`;

            if (formNote) {
                formNote.textContent = "Ihr E-Mail-Programm wurde ge\u00f6ffnet. Bitte pr\u00fcfen und senden Sie die Nachricht dort ab.";
                formNote.style.color = "#055f9f";
            }
        });
    }

    createImpressionsGallery();
    createTeamCoverflow();
    createSwipers();
})();
