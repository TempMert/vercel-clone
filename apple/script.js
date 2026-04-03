// ===== SCROLL-TRIGGERED ANIMATIONS =====
class ScrollExperience {
    constructor() {
        this.videos = [];
        this.scrollProgress = 0;
        this.init();
    }

    init() {
        this.setupVideos();
        this.setupProgressBar();
        this.setupIntersectionObserver();
        this.bindScrollEvents();
        this.animate();
    }

    // ===== VIDEO SCROLL SYNC =====
    setupVideos() {
        const videoElements = document.querySelectorAll('video');
        
        videoElements.forEach((video, index) => {
            // Ensure video is ready
            video.muted = true;
            video.playsInline = true;
            video.preload = 'auto';
            
            // Try to autoplay
            video.play().catch(() => {
                // Autoplay blocked, will work on scroll
            });
            
            this.videos.push({
                element: video,
                section: video.closest('.video-section'),
                currentIndex: index
            });
        });
    }

    setupProgressBar() {
        this.progressBar = document.createElement('div');
        this.progressBar.className = 'progress-bar';
        document.body.appendChild(this.progressBar);
    }

    setupIntersectionObserver() {
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, observerOptions);

        // Observe all animated elements
        const animatedElements = document.querySelectorAll(
            '.parallax-title, .parallax-subtitle, .section-title, .feature-card, .cta-title, .cta-subtitle, .cta-button'
        );
        
        animatedElements.forEach(el => observer.observe(el));

        // Feature cards with stagger
        const featureCards = document.querySelectorAll('.feature-card');
        const featureObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const delay = parseInt(entry.target.dataset.delay) || 0;
                    setTimeout(() => {
                        entry.target.classList.add('visible');
                    }, delay);
                    featureObserver.unobserve(entry.target);
                }
            });
        }, observerOptions);

        featureCards.forEach(card => featureObserver.observe(card));

        // Word-by-word text reveal
        const wordObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const words = entry.target.querySelectorAll('.word');
                    words.forEach((word, index) => {
                        setTimeout(() => {
                            word.classList.add('visible');
                        }, index * 150);
                    });
                    wordObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.3 });

        document.querySelectorAll('.scroll-text').forEach(el => wordObserver.observe(el));
    }

    bindScrollEvents() {
        let ticking = false;

        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    this.onScroll();
                    ticking = false;
                });
                ticking = true;
            }
        });
    }

    onScroll() {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        
        // Update scroll progress
        this.scrollProgress = scrollTop / docHeight;
        if (this.progressBar) {
            this.progressBar.style.transform = `scaleX(${this.scrollProgress})`;
        }

        // Update video playback based on scroll
        this.videos.forEach(({ element, section }) => {
            if (!section) return;

            const sectionRect = section.getBoundingClientRect();
            const sectionHeight = section.offsetHeight;
            const viewportHeight = window.innerHeight;

            // Calculate scroll progress within the section
            const sectionScrollProgress = -sectionRect.top / (sectionHeight - viewportHeight);
            const clampedProgress = Math.max(0, Math.min(1, sectionScrollProgress));

            // Sync video currentTime with scroll
            if (element.duration) {
                element.currentTime = element.duration * clampedProgress;
            }

            // Fade text based on scroll
            const textContent = section.querySelector('.text-content');
            if (textContent) {
                const words = textContent.querySelectorAll('.word');
                const totalWords = words.length;
                
                words.forEach((word, index) => {
                    const wordStart = (index / totalWords);
                    const wordEnd = ((index + 1) / totalWords);
                    
                    if (clampedProgress >= wordStart && clampedProgress <= wordEnd) {
                        word.classList.add('visible');
                    } else if (clampedProgress > wordEnd) {
                        word.classList.add('visible');
                    } else {
                        word.classList.remove('visible');
                    }
                });
            }
        });

        // Parallax effect
        this.updateParallax();
    }

    updateParallax() {
        const parallaxSections = document.querySelectorAll('.parallax-section');
        
        parallaxSections.forEach(section => {
            const rect = section.getBoundingClientRect();
            const bg = section.querySelector('.parallax-bg');
            
            if (bg) {
                const scrollPercent = -rect.top / window.innerHeight;
                const yOffset = scrollPercent * 100;
                bg.style.transform = `translateY(${yOffset}px)`;
            }
        });
    }

    // ===== ANIMATION LOOP =====
    animate() {
        // Continuous animation for smooth effects
        requestAnimationFrame(() => this.animate());
    }
}

// ===== SMOOTH SCROLL FOR ANCHOR LINKS =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// ===== INITIALIZE ON DOM READY =====
document.addEventListener('DOMContentLoaded', () => {
    new ScrollExperience();
    
    // Add loaded class for any final animations
    document.body.classList.add('loaded');
});

// ===== PERFORMANCE: Reduce animations on low-end devices =====
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.style.setProperty('--animation-duration', '0.01ms');
}
