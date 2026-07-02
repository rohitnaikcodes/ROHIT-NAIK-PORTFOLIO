// Simple password protection (Not highly secure, but prevents casual access)
const SECRET_PASSWORD = "rohit";

function checkPassword() {
    const input = document.getElementById('password-input').value;
    if (input === SECRET_PASSWORD) {
        document.getElementById('auth-overlay').style.display = 'none';
        document.getElementById('main-content').style.display = 'block';
        loadBlogs(); // Load blogs once authenticated
    } else {
        document.getElementById('error-msg').style.display = 'block';
    }
}

// Allow pressing 'Enter' to submit password
document.getElementById('password-input').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        checkPassword();
    }
});

// Blog Logic (Using LocalStorage as requested/default for static site)
const blogForm = document.getElementById('blog-form');
const blogsList = document.getElementById('blogs-list');

blogForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const author = document.getElementById('blog-author').value;
    const title = document.getElementById('blog-title').value;
    const content = document.getElementById('blog-content').value;
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const newBlog = { id: Date.now(), author, title, content, date };

    // Get existing blogs from local storage
    let blogs = JSON.parse(localStorage.getItem('secret_blogs')) || [];
    
    // Add new blog to the top
    blogs.unshift(newBlog);
    
    // Save back to local storage
    localStorage.setItem('secret_blogs', JSON.stringify(blogs));

    // Clear form
    blogForm.reset();

    // Reload blogs to show the new one
    loadBlogs();
});

function loadBlogs() {
    let blogs = JSON.parse(localStorage.getItem('secret_blogs')) || [];
    blogsList.innerHTML = '';

    if (blogs.length === 0) {
        blogsList.innerHTML = '<p style="color: var(--secondary);">No blogs posted yet.</p>';
        return;
    }

    blogs.forEach(blog => {
        const blogDiv = document.createElement('div');
        blogDiv.className = 'blog-post';

        blogDiv.innerHTML = `
            <h3 class="blog-title">${escapeHTML(blog.title)}</h3>
            <div class="blog-meta">Posted by <strong>${escapeHTML(blog.author)}</strong> on ${blog.date}</div>
            <div class="blog-content">${escapeHTML(blog.content)}</div>
            <button onclick="deleteBlog(${blog.id})" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer;">Delete</button>
        `;
        
        blogsList.appendChild(blogDiv);
    });
}

function deleteBlog(id) {
    if (confirm('Are you sure you want to delete this blog post?')) {
        let blogs = JSON.parse(localStorage.getItem('secret_blogs')) || [];
        blogs = blogs.filter(b => b.id !== id);
        localStorage.setItem('secret_blogs', JSON.stringify(blogs));
        loadBlogs();
    }
}

// Helper function to prevent XSS (Cross-Site Scripting)
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag])
    );
}
