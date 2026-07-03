import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
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

document.addEventListener('DOMContentLoaded', () => {
    loadBlogs();
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
            console.error("Image upload failed (Storage rules likely not set):", imgError);
            alert("Warning: Your image failed to upload (Firebase Storage is likely not enabled or rules are strictly locked). However, your text will still be published!");
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
        submitBtn.textContent = "Post Blog";
        submitBtn.disabled = false;
    }
});

async function loadBlogs() {
    blogsList.innerHTML = '<p style="color: var(--secondary);">Loading blogs...</p>';
    
    try {
        const q = query(collection(db, "blogs"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        
        blogsList.innerHTML = '';
        
        if (querySnapshot.empty) {
            blogsList.innerHTML = '<p style="color: var(--secondary);">No blogs posted yet.</p>';
            return;
        }

        querySnapshot.forEach((docSnap) => {
            const blog = docSnap.data();
            const blogDiv = document.createElement('div');
            blogDiv.className = 'blog-post';

            // Use marked.js to parse markdown content
            let parsedContent = blog.content;
            if (typeof marked !== 'undefined') {
                parsedContent = marked.parse(blog.content);
            } else {
                parsedContent = escapeHTML(blog.content).replace(/\n/g, '<br>');
            }

            let imageHtml = '';
            if (blog.imageUrl) {
                imageHtml = `<img src="${escapeHTML(blog.imageUrl)}" alt="Blog Image" style="max-width: 100%; border-radius: 8px; margin-top: 1rem; margin-bottom: 1rem;">`;
            }

            blogDiv.innerHTML = `
                <h3 class="blog-title">${escapeHTML(blog.title)}</h3>
                <div class="blog-meta">Posted by <strong>${escapeHTML(blog.author)}</strong> on ${escapeHTML(blog.date)}</div>
                ${imageHtml}
                <div class="blog-content" style="font-family: inherit;">${parsedContent}</div>
            `;
            
            blogsList.appendChild(blogDiv);
        });



    } catch (error) {
        console.error("Error loading blogs: ", error);
        blogsList.innerHTML = '<p style="color: #ef4444;">Failed to load blogs. Check database connection.</p>';
    }
}

async function deleteBlog(id) {
    if (confirm('Are you sure you want to delete this blog post?')) {
        try {
            await deleteDoc(doc(db, "blogs", id));
            await loadBlogs();
        } catch (error) {
            console.error("Error deleting document: ", error);
            alert("Failed to delete blog.");
        }
    }
}

// Helper function to prevent XSS (Cross-Site Scripting)
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
