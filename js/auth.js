import { auth } from './firebase-config.js';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const loginForm = document.getElementById('loginForm');
const errorMsg = document.getElementById('errorMsg');

// Login Handling
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        try {
            await signInWithEmailAndPassword(auth, email, password);
            window.location.href = 'admin.html';
        } catch (error) {
            console.error(error);
            errorMsg.textContent = 'Login fehlgeschlagen: ' + error.message;
        }
    });
}

// Auth State Monitor
onAuthStateChanged(auth, (user) => {
    const loginBtn = document.getElementById('loginBtn');
    const adminBtn = document.getElementById('adminBtn');
    const logoutBtn = document.getElementById('logoutBtn'); // Admin page only

    // Index page logic
    if (loginBtn && adminBtn) {
        if (user) {
            loginBtn.classList.add('hidden');
            adminBtn.classList.remove('hidden');
        } else {
            loginBtn.classList.remove('hidden');
            adminBtn.classList.add('hidden');
        }
    }

    // Protected Route Logic
    const isProtectedPage = window.location.pathname.includes('admin.html');
    if (isProtectedPage && !user) {
        window.location.href = 'login.html';
    }
});

// Logout Helper
export const logoutUser = async () => {
    try {
        await signOut(auth);
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
    }
};
