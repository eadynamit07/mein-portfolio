import { db, auth } from './firebase-config.js';
import { doc, getDoc, setDoc, collection, addDoc, getDocs, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Mobile Menu
const hamburgerBtn = document.getElementById('hamburgerBtn');
const navLinks = document.getElementById('navLinks');
if (hamburgerBtn && navLinks) {
    hamburgerBtn.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });
}

// Auth Check
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = 'login.html';
    } else {
        loadProfile();
        loadProjects();
    }
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', async () => {
    await signOut(auth);
    window.location.href = 'index.html';
});

// --- Profile Logic ---
const profileForm = document.getElementById('profileForm');
const fileInput = document.getElementById('profileImageFileInput');
const previewImg = document.getElementById('profileImagePreview');
const base64Input = document.getElementById('profileImageBase64');

// Profile Image Upload
setupImageUpload(fileInput, previewImg, base64Input);

function setupImageUpload(inputElement, previewElement, valueElement) {
    if(!inputElement) return;
    inputElement.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            // Firestore Limit is 1MB per doc, so we must be safe
            if (file.size > 800 * 1024) { // 800KB constraint
                alert('Bild ist zu groß! Bitte maximal 800KB.');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                const result = e.target.result;
                previewElement.src = result;
                valueElement.value = result;
            };
            reader.readAsDataURL(file);
        }
    });
}

async function loadProfile() {
    const docRef = doc(db, "content", "profile");
    try {
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            document.getElementById('profileNameInput').value = data.name || '';
            document.getElementById('profileBirthdateInput').value = data.birthdate || '';
            document.getElementById('profileBioInput').value = data.bio || '';
            
            if (data.image) {
                previewImg.src = data.image;
                base64Input.value = data.image;
            }
        }
    } catch (error) {
        console.error("Error loading profile:", error);
    }
}

profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = profileForm.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.textContent = 'Speichere...';

    try {
        await setDoc(doc(db, "content", "profile"), {
            name: document.getElementById('profileNameInput').value,
            birthdate: document.getElementById('profileBirthdateInput').value, 
            bio: document.getElementById('profileBioInput').value,
            image: document.getElementById('profileImageBase64').value
        });
        alert('Profil erfolgreich gespeichert!');
    } catch (error) {
        console.error("Error saving profile: ", error);
        alert('Fehler beim Speichern (Bild zu groß?): ' + error.message);
    } finally {
        btn.textContent = originalText;
    }
});

// --- Projects Logic ---
const projectForm = document.getElementById('projectForm');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const projectFileInput = document.getElementById('projectImageFileInput');
const projectPreview = document.getElementById('projectImagePreview');
const projectBase64 = document.getElementById('projectImageBase64');
let isEditMode = false;

// Project Image Upload
setupImageUpload(projectFileInput, projectPreview, projectBase64);

projectForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('projectTitleInput').value;
    const desc = document.getElementById('projectDescInput').value;
    // Prefer Base64, fallback to URL input (legacy)
    const image = projectBase64.value || document.getElementById('projectImageInput').value;
    const webLink = document.getElementById('projectWebInput').value;
    const codeLink = document.getElementById('projectCodeInput').value;
    const id = document.getElementById('projectIdInput').value;

    const projectData = {
        title,
        description: desc,
        image,
        websiteUrl: webLink,
        codeUrl: codeLink,
        createdAt: new Date().toISOString()
    };

    try {
        if (isEditMode && id) {
             const docRef = doc(db, "projects", id);
             // Remove createdAt update to keep original order if needed, or update updatedAt
             await updateDoc(docRef, { ...projectData, updatedAt: new Date() });
             alert('Projekt aktualisiert!');
        } else {
             await addDoc(collection(db, "projects"), projectData);
             alert('Projekt hinzugefügt!');
        }
        
        projectForm.reset();
        resetFormState();
        loadProjects(); // Reload list
    } catch (error) {
        console.error("Error saving project: ", error);
        alert('Fehler: ' + error.message);
    }
});

async function loadProjects() {
    const list = document.getElementById('adminProjectsList');
    list.innerHTML = '<div class="loading-spinner">Lade...</div>';
    
    try {
        const querySnapshot = await getDocs(collection(db, "projects"));
        list.innerHTML = '';
        
        if (querySnapshot.empty) {
            list.innerHTML = '<p>Keine Projekte gefunden.</p>';
            return;
        }

        querySnapshot.forEach((doc) => {
            const p = doc.data();
            const item = document.createElement('div');
            item.className = 'admin-project-item';
            item.innerHTML = `
                <div class="admin-project-info">
                    <h4>${p.title}</h4>
                    <p class="small">${p.description.substring(0, 50)}...</p>
                </div>
                <div class="admin-project-actions">
                    <button class="btn-edit" data-id="${doc.id}">Edit</button>
                    <button class="btn-delete" data-id="${doc.id}">Löschen</button>
                </div>
            `;
            list.appendChild(item);
        });

        // Add Listeners to dynamic buttons
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', handleDelete);
        });
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', handleEdit);
        });

    } catch (error) {
        console.error(error);
        list.innerHTML = '<p class="error">Fehler beim Laden.</p>';
    }
}

async function handleDelete(e) {
    if(!confirm('Wirklich löschen?')) return;
    const id = e.target.getAttribute('data-id');
    try {
        await deleteDoc(doc(db, "projects", id));
        loadProjects();
    } catch (error) {
        alert('Fehler beim Löschen');
    }
}

async function handleEdit(e) {
    const id = e.target.getAttribute('data-id');
    const docRef = doc(db, "projects", id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
        const data = docSnap.data();
        document.getElementById('projectIdInput').value = id;
        document.getElementById('projectTitleInput').value = data.title;
        document.getElementById('projectDescInput').value = data.description;
        // Legacy support
        document.getElementById('projectImageInput').value = data.image; 
        
        if (data.image && data.image.startsWith('data:image')) {
             projectBase64.value = data.image;
             projectPreview.src = data.image;
        } else if (data.image) {
             // It's a URL
             projectPreview.src = data.image;
        }

        document.getElementById('projectWebInput').value = data.websiteUrl;
        document.getElementById('projectCodeInput').value = data.codeUrl;
        
        // Enter Edit Mode
        isEditMode = true;
        document.getElementById('saveProjectBtn').textContent = 'Projekt speichern';
        document.getElementById('cancelEditBtn').classList.remove('hidden');
        
        // Scroll to form
        document.querySelector('.admin-section:nth-child(2)').scrollIntoView({ behavior: 'smooth' });
    }
}

cancelEditBtn.addEventListener('click', resetFormState);

function resetFormState() {
    isEditMode = false;
    document.getElementById('projectIdInput').value = '';
    projectForm.reset();
    projectBase64.value = '';
    projectPreview.src = 'assets/images/placeholder-project.jpg';
    document.getElementById('saveProjectBtn').textContent = 'Projekt hinzufügen';
    document.getElementById('cancelEditBtn').classList.add('hidden');
}
