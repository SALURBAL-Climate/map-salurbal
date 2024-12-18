document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const infoContainer = document.querySelector('.info-container');
        const headerHeight = document.querySelector('.header')?.offsetHeight || 0;
        const paddingTop = 100;
        const targetPosition = infoContainer.offsetTop - headerHeight - paddingTop;
        const duration = 1500; 
        
        const easeInOutQuad = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
        const startTime = performance.now();
        
        const animate = currentTime => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            window.scrollTo(0, startPosition + distance * easeInOutQuad(progress));
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }, 500);
});