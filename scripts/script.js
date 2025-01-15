const tooltip = document.getElementById('tooltip');
const countries = document.querySelectorAll('.country');
const hitCanvas = document.getElementById('hitCanvas');
const ctx = hitCanvas.getContext('2d');

const countryData = {
    'colombia': {
        name: 'Colombia',
    },
    'venezuela': {
        name: 'Venezuela',
    },
    'guayana_1': {
        name: 'Guayana',
    },
    'guayana_2': {
        name: 'Surinam',
    },
    'guayana_3': {
        name: 'Guayana Francesa',
    },
    'ecuador': {
        name: 'Ecuador',
    },
    'peru': {
        name: 'Perú',
    },
    'brasil': {
        name: 'Brasil',
    },
    'bolivia': {
        name: 'Bolivia',
    },
    'chile': {
        name: 'Chile',
    },
    'argentina': {
        name: 'Argentina',
    },
    'paraguay': {
        name: 'Paraguay',
    },
    'uruguay': {
        name: 'Uruguay',
    },
    'mexico': {
        name: 'México',
    },
    'guatemala': {
        name: 'Guatemala',
    },
    'honduras': {
        name: 'Honduras',
    },
    'nicaragua': {
        name: 'Nicaragua',
    },
    'costa-rica': {
        name: 'Costa Rica',
    },
    'panama': {
        name: 'Panamá',
    },
    'belice': {
        name: 'Belice',
    },
    'cuba': {
        name: 'Cuba',
    },
    'jamaica': {
        name: 'Jamaica',
    },
    'haiti': {
        name: 'Haití',
    },
    'republica-dominicana': {
        name: 'República Dominicana',
    },
    'estados-unidos': {
        name: 'Estados Unidos',
    },
    'canada': {
        name: 'Canadá',
    },
    'el-salvador': {
        name: 'El Salvador',
    },

};

const countryIcons = {
    'estados-unidos': {
        x: 251,
        y: 640,
        iconUrl: 'images/analucia_usa.png',
        url: '/map-salurbal/usa.html'
    },
    'mexico': {
        x: -38,
        y: 854,
        iconUrl: 'images/celia_mexico.png',
        url: '/map-salurbal/mexico.html'
    },
    'guatemala': {
        x: 91,
        y: 930,
        iconUrl: 'images/daniela_guatemala.png',
        url: '/map-salurbal/guatemala.html'
    },
    'colombia': {
        x: 326,
        y: 1033,
        iconUrl: 'images/leonardo_colombia.png',
        url: '/map-salurbal/colombia.html'
    },
    'colombia-02': {
        x: 392,
        y: 1121,
        iconUrl: 'images/laura_colombia.png',
        url: '/map-salurbal/colombia_02.html'
    },
    'peru': {
        x: 359,
        y: 1375,
        iconUrl: 'images/penelope_peru.png',
        url: '/map-salurbal/peru.html'
    },
    'brasil': {
        x: 777,
        y: 1568,
        iconUrl: 'images/amanda_brasil.png',
        url: '/map-salurbal/brasil.html'
    },
    'chile': {
        x: 449,
        y: 1861,
        iconUrl: 'images/tamara_chile.png',
        url: '/map-salurbal/chile.html'
    },
    'argentina': {
        x: 618,
        y: 1797,
        iconUrl: 'images/ignacio_argentina.png',
        url: '/map-salurbal/argentina.html'
    },
};

function createCountryIcons() {
    const container = document.getElementById('map-container');

    Object.entries(countryIcons).forEach(([countryId, data]) => {
        const clickArea = document.createElement('div');
        clickArea.className = 'country-icon';
        clickArea.style.left = `${data.x}px`;
        clickArea.style.top = `${data.y}px`;
        clickArea.style.backgroundImage = `url(${data.iconUrl})`;
        clickArea.addEventListener('click', () => window.location.href = data.url);
        container.appendChild(clickArea);
    });
}

createCountryIcons();

hitCanvas.width = window.innerWidth;
hitCanvas.height = window.innerHeight;

const isMobile = () => window.matchMedia('(max-width: 768px)').matches;


function isPointInCountry(x, y, path) {
    ctx.clearRect(0, 0, hitCanvas.width, hitCanvas.height);
    const svgPath = new Path2D(path.getAttribute('d'));
    const svgElement = path.closest('svg');
    const matrix = svgElement.getScreenCTM();
    const bbox = svgElement.getBoundingClientRect();

    ctx.setTransform(
        matrix.a,
        matrix.b,
        matrix.c,
        matrix.d,
        bbox.left,
        bbox.top
    );

    ctx.fill(svgPath);
    return ctx.isPointInPath(svgPath, x, y);
}

const countriesWithHover = ['estados-unidos', 'mexico', 'guatemala', 'colombia', 'peru', 'brasil', 'argentina', 'chile'];

if (!isMobile()) {
    document.addEventListener('mousemove', (e) => {
        let foundCountry = false;

        countries.forEach(country => {
            const path = country.querySelector('path');
            if (isPointInCountry(e.clientX, e.clientY, path)) {
                const countryInfo = countryData[country.id];
                tooltip.style.display = 'block';
                tooltip.style.left = e.pageX + 10 + 'px';
                tooltip.style.top = e.pageY + 10 + 'px';
                tooltip.textContent = countryInfo.name;

                foundCountry = true;
                if (countriesWithHover.includes(country.id)) {
                    path.style.fill = '#DA5A46';
                    path.style.transition = 'fill 0.3s ease';
                }
            } else {
                const originalFill = path.getAttribute('fill');
                path.style.fill = originalFill;
            }
        });

        if (!foundCountry) {
            tooltip.style.display = 'none';
        }
    });
}

window.addEventListener('resize', () => {
    if (isMobile()) {
        tooltip.style.display = 'none';
        countries.forEach(country => {
            const path = country.querySelector('path');
            const originalFill = path.getAttribute('fill');
            path.style.fill = originalFill;
        });
    }
});


