import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyDGUeZWD7AQaZhKVVeswPo_xrbprTzux2Y",
  authDomain: "personal-site-e93cf.firebaseapp.com",
  projectId: "personal-site-e93cf",
  storageBucket: "personal-site-e93cf.firebasestorage.app",
  messagingSenderId: "905806665990",
  appId: "1:905806665990:web:745f3af6a5de388e0d2687",
  measurementId: "G-ZM1DF79Y7B"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

const blogForm = document.getElementById('blog-form');
const blogsList = document.getElementById('blogs-list');
const submitBtn = document.querySelector('.btn-submit');
const imageInput = document.getElementById('blog-image');
const searchInput = document.getElementById('blog-search');
const blogCountEl = document.getElementById('blog-count');

let allBlogs = [];

document.addEventListener('DOMContentLoaded', () => {
    loadBlogs();
});

// Search functionality
searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase().trim();
    if (!query) {
        renderBlogs(allBlogs);
        return;
    }
    const filtered = allBlogs.filter(blog =>
        blog.title.toLowerCase().includes(query) ||
        blog.content.toLowerCase().includes(query) ||
        blog.author.toLowerCase().includes(query)
    );
    renderBlogs(filtered);
});

blogForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    submitBtn.textContent = "Posting...";
    submitBtn.disabled = true;

    const author = document.getElementById('blog-author').value;
    const title = document.getElementById('blog-title').value;
    const content = document.getElementById('blog-content').value;
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const timestamp = Date.now();

    let imageUrl = null;

    // Handle image upload if a file was selected
    if (imageInput.files.length > 0) {
        try {
            const file = imageInput.files[0];
            const storageRef = ref(storage, `blog_images/${timestamp}_${file.name}`);
            submitBtn.textContent = "Uploading Image...";
            const snapshot = await uploadBytes(storageRef, file);
            imageUrl = await getDownloadURL(snapshot.ref);
        } catch (imgError) {
            console.error("Image upload failed:", imgError);
            alert("Warning: Image upload failed. Your text will still be published!");
        }
    }

    try {
        submitBtn.textContent = "Saving Post...";

        await addDoc(collection(db, "blogs"), {
            author,
            title,
            content,
            date,
            timestamp,
            imageUrl
        });

        // Clear form
        blogForm.reset();
        
        // Reload blogs
        await loadBlogs();
    } catch (error) {
        console.error("Error adding document: ", error);
        alert("Failed to post blog. Please check your database connection.");
    } finally {
        submitBtn.textContent = "Publish Post";
        submitBtn.disabled = false;
    }
});

async function loadBlogs() {
    try {
        const q = query(collection(db, "blogs"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        
        allBlogs = [];
        
        querySnapshot.forEach((docSnap) => {
            allBlogs.push(docSnap.data());
        });

        renderBlogs(allBlogs);

    } catch (error) {
        console.error("Error loading blogs: ", error);
        blogsList.innerHTML = '<div class="blog-empty"><p>Failed to load blogs. Please try again later.</p></div>';
    }
}

function renderBlogs(blogs) {
    blogsList.innerHTML = '';
    blogCountEl.textContent = `${blogs.length} article${blogs.length !== 1 ? 's' : ''}`;

    if (blogs.length === 0) {
        blogsList.innerHTML = `
            <div class="blog-empty">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                <p>No articles found.</p>
            </div>
        `;
        return;
    }

    blogs.forEach((blog, index) => {
        const card = document.createElement('article');
        card.className = 'blog-card';
        card.style.animationDelay = `${index * 0.05}s`;

        // Parse content with marked.js
        let parsedContent = blog.content;
        if (typeof marked !== 'undefined') {
            parsedContent = marked.parse(blog.content);
        } else {
            parsedContent = escapeHTML(blog.content).replace(/\n/g, '<br>');
        }

        let imageHtml = '';
        if (blog.imageUrl) {
            imageHtml = `<img src="${escapeHTML(blog.imageUrl)}" alt="${escapeHTML(blog.title)}" class="blog-card-image" loading="lazy">`;
        }

        // Check if the content is long enough to need a "Read More" button
        const isLong = blog.content.length > 350;

        card.innerHTML = `
            <div class="blog-card-meta">
                <span class="blog-card-author">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
                    ${escapeHTML(blog.author)}
                </span>
                <span class="blog-card-date">${escapeHTML(blog.date)}</span>
            </div>
            <h2>${escapeHTML(blog.title)}</h2>
            ${imageHtml}
            <div class="blog-card-body ${isLong ? 'collapsed' : ''}" data-collapsed="${isLong}">
                ${parsedContent}
            </div>
            ${isLong ? '<button class="read-more-btn" onclick="toggleReadMore(this)">Read more →</button>' : ''}
        `;

        blogsList.appendChild(card);
    });
}

// Make toggleReadMore global
window.toggleReadMore = function(btn) {
    const body = btn.previousElementSibling;
    const isCollapsed = body.classList.contains('collapsed');
    body.classList.toggle('collapsed');
    body.setAttribute('data-collapsed', !isCollapsed);
    btn.textContent = isCollapsed ? '← Show less' : 'Read more →';
};

// Helper function to prevent XSS
function escapeHTML(str) {
    return (str || "").toString().replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}
