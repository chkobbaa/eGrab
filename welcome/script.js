/**
 * eGrab Landing Page Interactions
 */

document.addEventListener('DOMContentLoaded', () => {

    // Smooth Scroll for Anchor Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Intersection Observer for Scroll Animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, observerOptions);

    // Target elements to animate
    const animateElements = document.querySelectorAll('.card, .section-header');

    animateElements.forEach((el, index) => {
        // Set initial state
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = `all 0.6s cubic-bezier(0.5, 0, 0, 1) ${index * 0.1}s`; // Staggered delay

        observer.observe(el);
    });

    // Mouse Move Parallax Effect for Background Glow
    document.addEventListener('mousemove', (e) => {
        const glow = document.querySelector('.bg-glow');
        if (glow) {
            const x = e.clientX;
            const y = e.clientY;

            // Subtle movement following cursor
            glow.animate({
                left: `${x}px`,
                top: `${y}px`
            }, { duration: 1000, fill: "forwards" });
        }
    });
});
