let jobsData = [];
let extractedCVText = "";

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    setupEventListeners();
    loadDemoOrFetchJobs();
});

function initTheme() {
    const toggleBtn = document.getElementById('theme-toggle');
    toggleBtn.addEventListener('click', () => {
        const body = document.getElementById('body-app');
        body.classList.toggle('dark');
        body.classList.toggle('bg-slate-100');
        body.classList.toggle('text-slate-900');
    });
}

async function loadDemoOrFetchJobs() {
    try {
        const res = await fetch('/api/jobs');
        if (res.ok) {
            jobsData = await res.json();
        } else {
            throw new Error("API Indisponible");
        }
    } catch (e) {
        jobsData = [
            {
                id: "tg_101",
                title: "Analyste de Données & Conformité GDPR / DPO",
                company: "Groupe Bancaire Régional",
                pays: "Togo",
                region: "Maritime",
                ville: "Lomé",
                contract_types: "CDI, Remote",
                description: "Nous recherchons un Expert en Données et Conformité GDPR/DPO. Compétences requises: SQL, Python, Analyse de données bancaires, Gouvernance SI, Audit de sécurité.",
                date_posted: "2026-07-20",
                date_expiry: "2026-08-30",
                source_url: "https://t.me/lfriiactu/101",
                status: "active"
            },
            {
                id: "tg_102",
                title: "Chef de Projet Stratégie Corporate & Opérations",
                company: "Cabinet Conseil International",
                pays: "Togo",
                region: "Maritime",
                ville: "Lomé",
                contract_types: "CDI, Flexible",
                description: "Recherche un responsable de projet de croissance externe et restructuration d'entreprise. Management, stratégie, négociation, finance d'entreprise.",
                date_posted: "2026-07-18",
                date_expiry: "2026-08-20",
                source_url: "https://t.me/lfriiactu/102",
                status: "active"
            },
            {
                id: "tg_103",
                title: "Consultant Développement Durable & Climat",
                company: "Agence de Développement",
                pays: "Bénin",
                region: "Littoral",
                ville: "Cotonou",
                contract_types: "Consultance, Freelance",
                description: "Consultance pour évaluation de projets environnementaux et santé publique en Afrique de l'Ouest. Expertise RSE et climat exigée.",
                date_posted: "2026-05-10",
                date_expiry: "2026-06-15",
                source_url: "https://t.me/lfriiactu/103",
                status: "archived"
            }
        ];
    }
    renderJobs();
}

function setupEventListeners() {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('cv-file-input');

    dropZone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleCVUpload(e.target.files[0]);
        }
    });

    document.getElementById('filter-contract').addEventListener('change', renderJobs);
    document.getElementById('filter-country').addEventListener('change', renderJobs);
    document.getElementById('filter-status').addEventListener('change', renderJobs);
}

async function handleCVUpload(file) {
    const fileName = file.name;
    document.getElementById('cv-filename').textContent = fileName;
    
    if (fileName.endsWith && fileName.endsWith('.pdf')) {
        const arrayBuffer = await file.arrayBuffer();
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let text = "";
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            text += content.items.map(item => item.str).join(" ") + " ";
        }
        extractedCVText = text;
    } else {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
        extractedCVText = result.value;
    }

    const wordCount = extractedCVText.split(/\s+/).length;
    document.getElementById('cv-word-count').textContent = `${wordCount} mots`;
    document.getElementById('cv-status').classList.remove('hidden');

    renderJobs();
}

function calculateMatchScore(jobDescription) {
    if (!extractedCVText || extractedCVText.trim().length === 0) {
        return { score: 0, missingKeywords: [] };
    }

    const cleanText = (str) => str.toLowerCase().replace(/[^a-z0-9à-ÿ\s]/g, ' ');
    const cvWords = new Set(cleanText(extractedCVText).split(/\s+/).filter(w => w.length > 3));
    const jobWords = cleanText(jobDescription).split(/\s+/).filter(w => w.length > 3);

    const totalJobKeywords = new Set(jobWords);
    let matchedCount = 0;
    let missingKeywords = [];

    totalJobKeywords.forEach(word => {
        if (cvWords.has(word)) {
            matchedCount++;
        } else {
            missingKeywords.push(word);
        }
    });

    const score = Math.min(100, Math.round((matchedCount / Math.max(1, totalJobKeywords.size)) * 100 * 1.5));
    return {
        score: score,
        missingKeywords: missingKeywords.slice(0, 5)
    };
}

function renderJobs() {
    const container = document.getElementById('jobs-container');
    const filterContract = document.getElementById('filter-contract').value;
    const filterCountry = document.getElementById('filter-country').value;
    const filterStatus = document.getElementById('filter-status').value;

    container.innerHTML = "";

    const filtered = jobsData.filter(job => {
        if (filterContract !== 'ALL' && !job.contract_types.includes(filterContract)) return false;
        if (filterCountry !== 'ALL' && job.pays !== filterCountry) return false;
        if (filterStatus !== 'ALL' && job.status !== filterStatus) return false;
        return true;
    });

    document.getElementById('jobs-count').textContent = `${filtered.length} opportunité(s) trouvée(s)`;

    filtered.forEach(job => {
        const { score, missingKeywords } = calculateMatchScore(job.description);
        
        const isArchived = job.status === 'archived';
        const card = document.createElement('div');
        card.className = `p-5 rounded-xl border transition ${isArchived ? 'bg-slate-900/40 border-slate-800 opacity-75' : 'bg-slate-800/80 border-slate-700/80 hover:border-sky-500/50'}`;

        let scoreBadge = '';
        if (extractedCVText) {
            let scoreColor = score > 70 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 
                             score > 40 ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 
                                          'bg-rose-500/20 text-rose-400 border-rose-500/30';
            scoreBadge = `<span class="px-3 py-1 rounded-full text-xs font-bold border ${scoreColor}">Match: ${score}%</span>`;
        }

        card.innerHTML = `
            <div class="flex items-start justify-between gap-4 mb-2">
                <div>
                    <div class="flex items-center gap-2 flex-wrap mb-1">
                        <span class="text-xs px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 font-medium">${job.company}</span>
                        <span class="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300">${job.pays} (${job.ville})</span>
                        ${isArchived ? '<span class="text-xs px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">Expiré / Archivé</span>' : ''}
                    </div>
                    <h3 class="text-base font-bold text-slate-100">${job.title}</h3>
                </div>
                ${scoreBadge}
            </div>

            <p class="text-xs text-slate-300 line-clamp-2 mb-3">${job.description}</p>

            ${extractedCVText && missingKeywords.length > 0 ? `
                <div class="mb-3 p-2 rounded bg-slate-900/80 border border-slate-800 text-xs">
                    <span class="text-slate-400 font-medium">Recommandation CV (Mots-clés manquants) :</span>
                    <div class="flex flex-wrap gap-1 mt-1">
                        ${missingKeywords.map(k => `<span class="px-1.5 py-0.5 rounded bg-slate-800 text-amber-400 border border-amber-500/20 text-[10px]">${k}</span>`).join('')}
                    </div>
                </div>
            ` : ''}

            <div class="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-700/50">
                <div class="flex items-center gap-3">
                    <span><i class="fa-solid fa-file-contract"></i> ${job.contract_types}</span>
                    <span><i class="fa-regular fa-clock"></i> Expire le : ${job.date_expiry}</span>
                </div>
                <a href="${job.source_url}" target="_blank" class="text-sky-400 hover:underline flex items-center gap-1 font-medium">
                    Voir sur Telegram <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                </a>
            </div>
        `;

        container.appendChild(card);
    });
}
