function setLanguage(lang) {
    try {
        if (!translations[lang]) {
            throw new Error(`Idioma no encontrado: ${lang}`);
        }

        document.querySelectorAll('[data-key]').forEach(element => {
            const key = element.getAttribute('data-key');
            if (translations[lang][key]) {
                if (element.tagName.toLowerCase() === 'iframe') {
                    const newIframe = document.createElement('iframe');
                    newIframe.src = translations[lang][key];
                    newIframe.setAttribute('data-key', key);
                    newIframe.setAttribute('allowfullscreen', '');
                    newIframe.setAttribute('title', 'YouTube video');
                    
                    const computedStyle = window.getComputedStyle(element);
                    newIframe.style.cssText = computedStyle.cssText;
                    
                    element.parentNode.replaceChild(newIframe, element);
                } else {
                    element.textContent = translations[lang][key];
                }
            }
        });


        const currentLang = document.querySelector('.current-lang');
        if (currentLang) {
            currentLang.textContent = lang.toUpperCase();
        }

        const buttons = document.querySelectorAll('.dropdown-content button');
        if (buttons) {
            buttons.forEach(btn => {
                if (btn.dataset.lang === lang) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
        }

        localStorage.setItem('preferredLanguage', lang);

    } catch (error) {
        console.warn('Error al cambiar idioma:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {

    const savedLang = localStorage.getItem('preferredLanguage') || 'es';
    

    setLanguage(savedLang);

    const langButtons = document.querySelectorAll('.language-selector button');
    if (langButtons) {
        langButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.dataset.lang) {
                    setLanguage(btn.dataset.lang);
                }
            });
        });
    }
});