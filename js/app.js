import { db } from './firebase-config.js';
import { doc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Load content when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    // Mobile Menu Logic
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const navLinks = document.getElementById('navLinks');
    
    if (hamburgerBtn && navLinks) {
        hamburgerBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
        
        // Close menu when clicking a link
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
            });
        });
    }

    await loadProfile();
    await loadProjects();
});

async function loadProfile() {
    try {
        const docRef = doc(db, "content", "profile");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            
            // Update DOM
            if (data.name) document.getElementById('profileName').textContent = `Hallo, ich bin ${data.name}`;
            
            // Age Calculation
            if (data.birthdate) {
                const age = calculateAge(data.birthdate);
                document.getElementById('profileAge').textContent = `${age} Jahre alt`;
            }
            
            if (data.bio) document.getElementById('profileBio').textContent = data.bio;
            if (data.image) document.getElementById('profileImage').src = data.image;
        } else {
            // Default content
            document.getElementById('profileBio').textContent = "Willkommen! Bitte im Admin-Bereich Profil ausfüllen.";
        }
    } catch (error) {
        console.error("Error loading profile:", error);
    }
}

function calculateAge(birthdateString) {
    const today = new Date();
    const birthDate = new Date(birthdateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

async function loadProjects() {
    const grid = document.getElementById('projectsGrid');
    
    try {
        const querySnapshot = await getDocs(collection(db, "projects"));
        
        if (querySnapshot.empty) {
            grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">Noch keine Projekte vorhanden.</p>';
            return;
        }

        grid.innerHTML = ''; // Clear loading spinner
        
        querySnapshot.forEach((doc) => {
            const p = doc.data();
            const card = document.createElement('div');
            card.className = 'project-card';
            
            // Fallback image if none provided
            const imgSrc = p.image || 'assets/images/placeholder-project.jpg';
            
            card.innerHTML = `
                <img src="${imgSrc}" alt="${p.title}" class="project-img">
                <div class="project-content">
                    <h3 class="project-title">${p.title}</h3>
                    <p class="project-desc">${p.description}</p>
                    <div class="project-links">
                        ${p.websiteUrl ? `<a href="${p.websiteUrl}" target="_blank" class="project-link link-website"> Webseite</a>` : ''}
                        ${p.codeUrl ? `<a href="${p.codeUrl}" target="_blank" class="project-link link-code">Code ansehen</a>` : ''}
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });

    } catch (error) {
        console.error("Error loading projects:", error);
        grid.innerHTML = '<p class="error">Fehler beim Laden der Projekte.</p>';
    }
}
