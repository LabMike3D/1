import './style.css';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js';

// --- THREE.JS LOGIC & ARCORE ---
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a0c);

const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
camera.position.set(0, 1, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);
// Povolení WebXR pro ARCore
renderer.xr.enabled = true;
container.appendChild(renderer.domElement);

// Přidání AR tlačítka do kontejneru
const arButton = ARButton.createButton(renderer, { requiredFeatures: ['hit-test'] });
// ARButton má defaultně position: absolute, upravíme ho aby seděl hezky vpravo dole
arButton.style.position = 'absolute';
arButton.style.bottom = '2rem';
arButton.style.right = '2rem';
arButton.style.left = 'auto';
arButton.style.transform = 'none';
arButton.style.zIndex = '20';
container.appendChild(arButton);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enableZoom = false;

scene.add(new THREE.AmbientLight(0xffffff, 1.5));
const dirLight = new THREE.DirectionalLight(0xffffff, 3);
dirLight.position.set(5, 10, 7);
scene.add(dirLight);

const loader = new GLTFLoader();
let currentModel = null;

// Zde v budoucnu nahradíš URL za 'models/model1.gltf', 'models/model2.gltf' atd.
const modelUrls = [
    'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/DamagedHelmet/glTF/DamagedHelmet.gltf',
    'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/DamagedHelmet/glTF/DamagedHelmet.gltf',
    'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/DamagedHelmet/glTF/DamagedHelmet.gltf'
];

function loadModel(index) {
    if (currentModel) {
        scene.remove(currentModel);
    }
    
    loader.load(modelUrls[index], (gltf) => {
        currentModel = gltf.scene;
        scene.add(currentModel);
        // Posuneme model mírně dozadu, aby v AR nebyl nalepený přímo na kameře (Z = -2)
        currentModel.position.set(0, 0, -2);
        currentModel.scale.set(2, 2, 2);
        currentModel.traverse(n => {
            if (n.isMesh) {
                n.castShadow = true;
                n.receiveShadow = true;
            }
        });
        console.log(`Model ${index + 1} načten ✓`);
    });
}

// Načtení výchozího modelu
loadModel(0);

// Logika přepínání modelů
const modelBtns = document.querySelectorAll('.model-btn');
modelBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        modelBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        const index = parseInt(e.target.getAttribute('data-model'));
        loadModel(index);
    });
});

// AR Eventy - zprůhlednění pozadí při vstupu do AR
renderer.xr.addEventListener('sessionstart', () => {
    scene.background = null; // Průhledné pozadí pro kameru
    if (currentModel) currentModel.position.set(0, 0, -2); // Reset pozice pro AR
});

renderer.xr.addEventListener('sessionend', () => {
    scene.background = new THREE.Color(0x0a0a0c); // Zpět na tmavé pozadí
    if (currentModel) currentModel.position.set(0, 0, 0); // Zpět na střed pro web
    camera.position.set(0, 1, 5);
});

// WebXR vyžaduje setAnimationLoop místo requestAnimationFrame
renderer.setAnimationLoop(() => {
    // Rotace funguje jen když nejsme v AR (v AR se hýbe uživatel s telefonem)
    if (currentModel && !renderer.xr.isPresenting) {
        currentModel.rotation.y += 0.005;
    }
    controls.update();
    renderer.render(scene, camera);
});

window.addEventListener('resize', () => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
});

// --- SLIDER LOGIC ---
let currentSlide = 1;
let autoInterval;
let resumeTimeout;

function startAutoSlide() {
    autoInterval = setInterval(() => {
        currentSlide = currentSlide % 5 + 1;
        const radio = document.getElementById(`slide${currentSlide}`);
        if(radio) radio.checked = true;
    }, 4000);
}

window.manualControl = function(n) {
    currentSlide = n;
    const radio = document.getElementById(`slide${currentSlide}`);
    if(radio) radio.checked = true;
    
    clearInterval(autoInterval);
    clearTimeout(resumeTimeout);
    resumeTimeout = setTimeout(startAutoSlide, 3000);
};

// Attach event listeners to radios (in case they are clicked directly instead of labels)
for (let i = 1; i <= 5; i++) {
    const radio = document.getElementById(`slide${i}`);
    if (radio) {
        radio.addEventListener('change', () => window.manualControl(i));
    }
}

startAutoSlide();

// --- NEURAL FLOW LOGIC ---
const canvas = document.getElementById('neural-flow');
const ctx = canvas.getContext('2d');
let pts = [];

function init() {
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    pts = [];
    for (let i = 0; i < 90; i++) {
        pts.push({
            x: Math.random() * canvas.width, y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.8, vy: (Math.random() - 0.5) * 0.8,
            size: Math.random() * 2.5 + 1.5
        });
    }
}

function anim() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < pts.length; i++) {
        let p = pts[i]; p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        
        ctx.fillStyle = 'rgba(99, 102, 241, 0.9)';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
        
        for (let j = i + 1; j < pts.length; j++) {
            let p2 = pts[j];
            let d = Math.hypot(p.x - p2.x, p.y - p2.y);
            if (d < 220) {
                ctx.strokeStyle = `rgba(99, 102, 241, ${0.6 * (1 - d / 220)})`;
                ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
            }
        }
    }
    requestAnimationFrame(anim);
}
window.addEventListener('resize', init);
init(); anim();

// --- SHORTS & VIDEO LOGIC ---
// Zastavení ostatních videí při spuštění nového (užitečné zejména pro mobily)
const allVideos = document.querySelectorAll('video');
allVideos.forEach(video => {
    video.addEventListener('play', function() {
        allVideos.forEach(v => {
            if (v !== this) {
                v.pause();
            }
        });
    });
});

// YT Shorts Lazy Loading Logic
const shortsIds = ['ifS73sx2RMM', 'Z6HrL7YxoFM', '6eKEcMqunRU', '9_yNp0mhOZE', '3jL6ysJdfo8'];
let shortsLoaded = false;

const shortsMenuBtn = document.getElementById('shortsMenuBtn');
const shortsDrawer = document.getElementById('shortsDrawer');
const closeShortsBtn = document.getElementById('closeShortsBtn');
const shortsContent = document.getElementById('shortsContent');
const shortsLoader = document.getElementById('shortsLoader');

shortsMenuBtn.addEventListener('click', () => {
    shortsDrawer.classList.add('open');
    // Zamezení scrollování body, když je menu otevřené
    document.body.style.overflow = 'hidden';
    
    // Načteme všechna videa najednou a využijeme nativní loading="lazy"
    if (!shortsLoaded) {
        shortsLoader.style.display = 'none'; // Skryjeme loader
        shortsIds.forEach(shortId => {
            const wrapper = document.createElement('div');
            wrapper.className = 'short-wrapper';
            wrapper.innerHTML = `<iframe loading="lazy" src="https://www.youtube.com/embed/${shortId}?rel=0&playsinline=1" title="YouTube Shorts" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
            shortsContent.appendChild(wrapper);
        });
        shortsLoaded = true;
    }
});

closeShortsBtn.addEventListener('click', () => {
    shortsDrawer.classList.remove('open');
    document.body.style.overflow = '';
});
