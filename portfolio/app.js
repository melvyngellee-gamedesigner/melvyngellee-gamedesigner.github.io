/* =========================================
   1. SYSTÈME DE PARTICULES (FOND CONNECTÉ - RAYON RÉDUIT)
   ========================================= */
const canvas = document.getElementById('particle-canvas');
const ctx = canvas.getContext('2d');

let particlesArray;

// Dimensions
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Gestion de la souris
let mouse = {
    x: null,
    y: null,
    // MODIFICATION ICI : On divise le calcul par 3 pour réduire le rayon
    radius: ((canvas.height / 80) * (canvas.width / 80)) / 3 
}

window.addEventListener('mousemove', function(event) {
    mouse.x = event.x;
    mouse.y = event.y;
});

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // MODIFICATION ICI AUSSI (pour que ça reste petit si on redimensionne la fenêtre)
    mouse.radius = ((canvas.height / 80) * (canvas.width / 80)) / 3;
    initParticles();
});

// Création des particules
class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 1;
        this.speedX = (Math.random() * 1) - 0.5;
        this.speedY = (Math.random() * 1) - 0.5;
        this.color = '#4a90e2';
    }
    update() {
        // Mouvement
        this.x += this.speedX;
        this.y += this.speedY;

        // Rebond sur les bords
        if (this.x > canvas.width || this.x < 0) this.speedX = -this.speedX;
        if (this.y > canvas.height || this.y < 0) this.speedY = -this.speedY;

        // INTERACTION SOURIS
        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < mouse.radius + this.size) {
            if (mouse.x < this.x && this.x < canvas.width - this.size * 10) {
                this.x += 3;
            }
            if (mouse.x > this.x && this.x > this.size * 10) {
                this.x -= 3;
            }
            if (mouse.y < this.y && this.y < canvas.height - this.size * 10) {
                this.y += 3;
            }
            if (mouse.y > this.y && this.y > this.size * 10) {
                this.y -= 3;
            }
        }
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
    }
}

// Fonction pour dessiner les lignes (Le Réseau)
function connect() {
    let opacityValue = 1;
    for (let a = 0; a < particlesArray.length; a++) {
        for (let b = a; b < particlesArray.length; b++) {
            let distance = ((particlesArray[a].x - particlesArray[b].x) * (particlesArray[a].x - particlesArray[b].x)) 
                         + ((particlesArray[a].y - particlesArray[b].y) * (particlesArray[a].y - particlesArray[b].y));
            
            if (distance < (canvas.width / 7) * (canvas.height / 7)) {
                opacityValue = 1 - (distance / 20000);
                ctx.strokeStyle = 'rgba(74, 144, 226,' + opacityValue + ')';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                ctx.stroke();
            }
        }
    }
}

function initParticles() {
    particlesArray = [];
    let numberOfParticles = (canvas.height * canvas.width) / 9000;
    for (let i = 0; i < numberOfParticles * 0.5; i++) { 
        particlesArray.push(new Particle());
    }
}

function animateParticles() {
    requestAnimationFrame(animateParticles);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
        particlesArray[i].draw();
    }
    connect(); 
}

initParticles();
animateParticles();

/* ... LE RESTE DU FICHIER (BOOT TEXTE, CLICS...) NE CHANGE PAS ... */


/* =========================================
   2. TEXTE DE BIO (Séquence de Boot)
   ========================================= */
// On décale légèrement l'apparition de chaque paragraphe
const bioParagraphs = document.querySelectorAll('.bio-text p');
bioParagraphs.forEach((p, index) => {
    p.style.animationDelay = `${index * 0.2}s`;
});


/* =========================================
   3. SYSTÈME DE TIR (FIX : Retour du flottement)
   ========================================= */
const hitSound = new Audio('assets/hit.mp3'); 
hitSound.volume = 0.2; 

const targets = document.querySelectorAll('.shootable');

targets.forEach(target => {
    target.addEventListener('click', function() {
        // 1. Son
        try {
            hitSound.currentTime = 0;
            hitSound.play().catch(() => {}); 
        } catch (e) {}

        // 2. L'image tremble
        const targetClass = this.getAttribute('data-target');
        const imageToShake = document.querySelector('.' + targetClass);

        if (imageToShake) {
            // On retire la classe au cas où elle y serait déjà (pour pouvoir spammer)
            imageToShake.classList.remove('shake-active');
            
            // Astuce magique pour relancer une animation CSS immédiatement
            void imageToShake.offsetWidth; 
            
            // On lance le tremblement
            imageToShake.classList.add('shake-active');
            
            // LE FIX EST ICI : On écoute la fin de l'animation
            // Quand le tremblement est fini (0.5s), on retire la classe.
            // L'image reprendra alors automatiquement son animation de base (le flottement).
            imageToShake.addEventListener('animationend', () => {
                imageToShake.classList.remove('shake-active');
            }, { once: true }); // "once: true" nettoie l'écouteur après usage pour ne pas alourdir la page
        }

        // 3. Flash rouge sur le mot
        this.classList.add('word-clicked');
        setTimeout(() => {
            this.classList.remove('word-clicked');
        }, 200);
    });
});


/* =========================================
   4. APPARITION DES CARTOUCHES (Skills)
   ========================================= */
const cardsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            // Quand la carte est visible, on la remet à sa place
            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateY(0)";
            cardsObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.skill-card').forEach((card, index) => {
    // État initial (Caché et descendu)
    card.style.opacity = "0";
    card.style.transform = "translateY(50px)";
    card.style.transition = "opacity 0.6s ease, transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
    
    // Délai en cascade (la 1ère arrive vite, la 2ème après...)
    card.style.transitionDelay = `${index * 0.05}s`; 
    
    cardsObserver.observe(card);
});
/* =========================================
   5. EFFET HACKER SUR LE NOM (Décryptage)
   ========================================= */
const nameElement = document.querySelector('.logo-area h1');
const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"; // Les lettres possibles
let interval = null;

// On sauvegarde le texte original ("MELVYN GELLEE") dans une donnée cachée
if(nameElement) {
    nameElement.dataset.value = nameElement.innerText;

    nameElement.onmouseover = event => {  
        let iteration = 0;
        
        // On nettoie l'intervalle précédent pour éviter les bugs si on spamme
        clearInterval(interval);
        
        interval = setInterval(() => {
            event.target.innerText = event.target.innerText
                .split("") // On coupe le mot en lettres
                .map((letter, index) => {
                    // Si on a fini d'animer cette lettre, on remet la vraie
                    if(index < iteration) {
                        return event.target.dataset.value[index];
                    }
                    
                    // Sinon, on met une lettre au hasard
                    // Astuce : pour garder le saut de ligne, on vérifie si c'est un espace ou un retour
                    if (event.target.dataset.value[index] === '\n') return '\n';
                    if (event.target.dataset.value[index] === ' ') return ' ';
                    
                    return letters[Math.floor(Math.random() * 26)];
                })
                .join(""); // On recolle les lettres
            
            // Quand tout est fini, on arrête
            if(iteration >= event.target.dataset.value.length){ 
                clearInterval(interval);
            }
            
            // Vitesse de décryptage (plus le chiffre est petit, plus c'est lent)
            iteration += 1 / 3; 
        }, 30); // Vitesse de changement des lettres (30ms)
    }
}
/* =========================================
   6. GESTION DES VIDÉOS AU SURVOL
   ========================================= */
const videoCards = document.querySelectorAll('.project-card:has(video)');

videoCards.forEach(card => {
    const video = card.querySelector('video');

    // Quand la souris ENTRE
    card.addEventListener('mouseenter', () => {
        // play() renvoie une promesse, on gère les erreurs (si le navigateur bloque)
        let playPromise = video.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.log("Lecture automatique bloquée par le navigateur");
            });
        }
    });

    // Quand la souris SORT
    card.addEventListener('mouseleave', () => {
        video.pause();
        video.currentTime = 0; // On remet la vidéo au début pour la prochaine fois
    });
});
/* =========================================
   7. MODAL PLEIN ÉCRAN AU CLIC
   ========================================= */
const modal = document.getElementById('video-modal');
const fullScreenVideo = document.getElementById('full-screen-video');
const closeModalBtn = document.querySelector('.close-modal');
const triggers = document.querySelectorAll('.video-trigger'); // Les cartes qui ont une vidéo

// FONCTION : OUVRIR LE MODAL
triggers.forEach(trigger => {
    trigger.addEventListener('click', function() {
        // 1. Récupérer l'URL de la vidéo depuis l'attribut data-video
        const videoSource = this.getAttribute('data-video');
        
        // 2. L'injecter dans le grand lecteur
        fullScreenVideo.src = videoSource;
        
        // 3. Afficher le modal et lancer la lecture (avec le son cette fois)
        modal.classList.add('active');
        fullScreenVideo.play();
        fullScreenVideo.volume = 0.8; // Volume à 80%
    });
});

// FONCTION : FERMER LE MODAL
function closeVideoModal() {
    modal.classList.remove('active');
    fullScreenVideo.pause();
    fullScreenVideo.src = ""; // On vide la source pour arrêter le chargement
}

// Fermer avec la croix
closeModalBtn.addEventListener('click', closeVideoModal);

// Fermer en cliquant en dehors de la vidéo (sur le fond noir)
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeVideoModal();
    }
});
/* =========================================
   8. GESTION DES DOSSIERS PROJETS (DETAILS)
   ========================================= */
const detailButtons = document.querySelectorAll('.btn-details-trigger');
const closeDetailButtons = document.querySelectorAll('.close-details');
const allModals = document.querySelectorAll('.project-modal');

// 1. OUVRIR LE BON MODAL
detailButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        // Empêche le clic de remonter et d'ouvrir la vidéo par erreur
        e.stopPropagation(); 
        
        const modalId = btn.getAttribute('data-modal');
        const modalToOpen = document.getElementById(modalId);
        
        if(modalToOpen) {
            modalToOpen.classList.add('active');
            document.body.style.overflow = 'hidden'; // Bloque le scroll de la page principale
        }
    });
});

// 2. FERMER LES MODALS
closeDetailButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        allModals.forEach(m => m.classList.remove('active'));
        document.body.style.overflow = 'auto'; // Réactive le scroll
    });
});

// Fermer en cliquant en dehors du dossier (sur le fond noir)
allModals.forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });
});
/* =========================================
   9. SLIDER AVANT / APRÈS (CHROMESTHESIA)
   ========================================= */
const sliderInput = document.getElementById('sliderInput');
const overlayImage = document.querySelector('.overlay-image');
const sliderLine = document.querySelector('.c-slider-line');

if (sliderInput && overlayImage && sliderLine) {
    sliderInput.addEventListener('input', (e) => {
        const sliderValue = e.target.value + "%";
        
        // 1. On change la largeur de l'image du dessus (Miro)
        overlayImage.style.width = sliderValue;
        
        // 2. On bouge la ligne visuelle
        sliderLine.style.left = sliderValue;
    });
}
/* =========================================
   10. CODE SNIPPET TOGGLE (UNGOR BOK)
   ========================================= */
const btnToggleCode = document.getElementById('btn-toggle-code');
const codeWrapper = document.getElementById('ungor-code-wrapper');
const codeOverlay = document.getElementById('code-overlay');

if (btnToggleCode && codeWrapper) {
    btnToggleCode.addEventListener('click', () => {
        // On ajoute la classe pour agrandir
        codeWrapper.classList.toggle('expanded');
        
        // On gère l'affichage du bouton et de l'overlay
        if (codeWrapper.classList.contains('expanded')) {
            btnToggleCode.innerHTML = 'COLLAPSE CODE <i class="fa-solid fa-chevron-up"></i>';
            codeOverlay.style.opacity = '0'; // Cache le dégradé
        } else {
            btnToggleCode.innerHTML = 'SEE ALL CODE <i class="fa-solid fa-chevron-down"></i>';
            codeOverlay.style.opacity = '1'; // Remet le dégradé
            
            // Petit scroll automatique pour remonter si on referme
            codeWrapper.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    });
}
/* =========================================
   11. TIMELINE XP BAR (SCROLL PROGRESS)
   ========================================= */
const xpBar = document.getElementById('xp-bar');
const timelineSection = document.querySelector('.timeline');

if (xpBar && timelineSection) {
    window.addEventListener('scroll', () => {
        // On récupère la position de la timeline par rapport au haut de la page
        const sectionTop = timelineSection.offsetTop;
        const sectionHeight = timelineSection.offsetHeight;
        
        // On calcule où est le milieu de l'écran du visiteur
        const scrollPosition = window.scrollY + (window.innerHeight / 2);

        // Si on est avant la section, hauteur = 0
        if (scrollPosition < sectionTop) {
            xpBar.style.height = '0px';
        } 
        // Si on a dépassé la section, hauteur = 100%
        else if (scrollPosition > sectionTop + sectionHeight) {
            xpBar.style.height = '100%';
        } 
        // Sinon, on calcule le pourcentage
        else {
            const distance = scrollPosition - sectionTop;
            // On s'arrête un peu avant la fin pour pas dépasser (ex: 95%)
            const height = Math.min(distance, sectionHeight - 50); 
            xpBar.style.height = `${height}px`;
        }
    });
}
/* =========================================
   12. COPY EMAIL TO CLIPBOARD
   ========================================= */
function copyEmail() {
    const email = "melvyngellee@gmail.com";
    const feedback = document.getElementById('copy-msg');
    
    // API moderne pour copier
    navigator.clipboard.writeText(email).then(() => {
        // 1. Afficher le feedback "COPIED!"
        feedback.classList.add('active');
        
        // 2. L'enlever après 2 secondes
        setTimeout(() => {
            feedback.classList.remove('active');
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy: ', err);
        // Fallback si jamais ça marche pas (vieux navigateurs)
        alert("Email: " + email);
    });
}
/* =========================================
   13. SCROLL SPY (Navigation Active)
   ========================================= */
const sections = document.querySelectorAll("section, footer");
const navLinks = document.querySelectorAll(".hud-link");

const observerOptions = {
    root: null,
    rootMargin: "0px",
    threshold: 0.3 // La section doit être visible à 30% pour s'activer
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            // On retire la classe active de tous les liens
            navLinks.forEach((link) => {
                link.classList.remove("active");
                // Si l'attribut href correspond à l'id de la section visible
                if (link.getAttribute("href").substring(1) === entry.target.id) {
                    link.classList.add("active");
                }
            });
        }
    });
}, observerOptions);

sections.forEach((section) => {
    observer.observe(section);
});