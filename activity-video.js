// Configuration
const CONFIG = {
    STRAPI_URL: "http://10.20.60.45:1337",
    API_ENDPOINTS: {
        global: 'http://10.20.60.45:1337/api/global',
        activityVideo: 'http://10.20.60.45:1337/api/activity-vdo'
    },
    VIDEOS_PER_PAGE: 6
};

// State management
let allVideos = [];
let displayedVideos = 0;
let isLoading = false;

// Utility functions
const createElement = (tag, className, innerHTML) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (innerHTML) element.innerHTML = innerHTML;
    return element;
};

const getElement = (id) => document.getElementById(id);

const getYouTubeVideoId = (iframeHTML) => {
    const match = iframeHTML.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
};

const getThumbnailUrl = (videoId) => {
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
};


// API functions
async function fetchData() {
    try {
        showLoading();
        
        const [globalRes, activityRes] = await Promise.all([
            fetch(CONFIG.API_ENDPOINTS.global),
            fetch(CONFIG.API_ENDPOINTS.activityVideo)
        ]);

        if (!globalRes.ok || !activityRes.ok) {
            throw new Error('Failed to fetch data');
        }

        const globalData = await globalRes.json();
        const activityData = await activityRes.json();

        hideLoading();
        initializeWebsite(globalData.data, activityData.data);
    } catch (error) {
        console.error('Error fetching data:', error);
        hideLoading();
        showError('Failed to load videos. Please try again later.');
    }
}

function showLoading() {
    const videoGrid = getElement('video-grid');
    videoGrid.innerHTML = '<div class="loading">Loading videos...</div>';
}

function hideLoading() {
    const loadingElement = document.querySelector('.loading');
    if (loadingElement) {
        loadingElement.remove();
    }
}

function showError(message) {
    const videoGrid = getElement('video-grid');
    videoGrid.innerHTML = `<div style="text-align: center; padding: 4rem; font-size: 1.8rem; color: red;">${message}</div>`;
}

// Initialize website
function initializeWebsite(globalData, activityData) {
    renderHeader(globalData.Header);
    renderFooter(globalData.Footer);
    
    // Extract videos from the YouTube blocks
    const youtubeBlock = activityData.YoutubeBlocks.find(block => 
        block.__component === "blocks.section-youtube"
    );
    
    if (youtubeBlock && youtubeBlock.Clip) {
        allVideos = youtubeBlock.Clip;
        renderInitialVideos();
        setupLoadMoreButton();
    }
    
    setupModal();
}

// Render functions (reuse from main site)
function renderHeader(headerData) {
    const header = getElement("header");
    const navLinks = headerData.navItems
        .map(item => {
            let href = item.href;
            
            // Navigation logic
            if (item.label.toLowerCase().includes('หน้าแรก')) {
                href = 'index.html';
            }
            else if (item.label.toLowerCase().includes('กิจกรรมบริการวิชาการแก่สังคม')) {
                href = 'activity-video.html';
            }
            else if (item.label.toLowerCase().includes('โครงการและกิจกรรม')) {
                href = 'projects.html';
            }
            else if (item.label.toLowerCase().includes('งานงบประมาณ')) {
                href = 'budget.html';
            }
            
            // Add active class for current page
            const activeClass = href === 'activity-video.html' ? ' active' : '';
            
            return `<a href="${href}" class="${activeClass.trim()}">${item.label}</a>`;
        })
        .join("");

    header.innerHTML = `
        <div class="header-container">
            <img src="${CONFIG.STRAPI_URL + headerData.Logo.Logo.url}" alt="Logo" class="logo">
            <nav class="navbar">${navLinks}</nav>
        </div>
    `;
}

function renderFooter(footerData) {
    const footer = getElement("footer");
    const socialIcons = footerData.Icon.slice(1).map(icon => `
        <a href="${icon.href}" target="_blank">
            <img src="${CONFIG.STRAPI_URL + icon.Logo.url}" alt="${icon.label}">
        </a>
    `).join("");

    footer.innerHTML = `
        <div class="footer-container">
            <div class="footer-left">
                <img src="${CONFIG.STRAPI_URL + footerData.Icon[0].Logo.url}" alt="Website Logo" class="footer-logo">
                <div class="footer-socials">${socialIcons}</div>
                <p class="footer-text">${footerData.text}</p>
            </div>
            <div class="footer-right">
                ${footerData.map?.map || ''}
            </div>
        </div>
    `;
}

// Video rendering functions
function renderInitialVideos() {
    const videoGrid = getElement('video-grid');
    videoGrid.innerHTML = '';
    
    const initialVideos = allVideos.slice(0, CONFIG.VIDEOS_PER_PAGE);
    displayedVideos = initialVideos.length;
    
    initialVideos.forEach((video, index) => {
        renderVideoCard(video, index);
    });
}

function renderVideoCard(video, index) {
    const videoGrid = getElement('video-grid');
    const iframeHTML = video.clip[0]?.children[0]?.text || '';
    const videoId = getYouTubeVideoId(iframeHTML);
    const thumbnailUrl = videoId ? getThumbnailUrl(videoId) : '';

    const videoCard = createElement('div', 'video-card');
    videoCard.innerHTML = `
        <div class="video-thumbnail" style="background-image: url('${thumbnailUrl}'); background-size: cover; background-position: center;">
            <div class="play-button"></div>
        </div>
        <div class="video-info">
            <h3 class="video-title">${video.Heading}</h3>
            <p class="video-description">คลิกเพื่อดูวิดีโอ</p>
        </div>
    `;

    videoCard.addEventListener('click', () => openVideoModal(video));
    videoGrid.appendChild(videoCard);

    // Animation
    setTimeout(() => {
        videoCard.style.opacity = '0';
        videoCard.style.transform = 'translateY(20px)';
        videoCard.style.transition = 'all 0.5s ease';

        requestAnimationFrame(() => {
            videoCard.style.opacity = '1';
            videoCard.style.transform = 'translateY(0)';
        });
    }, index * 100);
}


function setupLoadMoreButton() {
    const loadMoreBtn = getElement('load-more-btn');
    
    if (displayedVideos >= allVideos.length) {
        loadMoreBtn.style.display = 'none';
        return;
    }
    
    loadMoreBtn.addEventListener('click', loadMoreVideos);
}

function loadMoreVideos() {
    if (isLoading || displayedVideos >= allVideos.length) return;
    
    isLoading = true;
    const loadMoreBtn = getElement('load-more-btn');
    loadMoreBtn.textContent = 'กำลังโหลด...';
    loadMoreBtn.disabled = true;
    
    // Simulate loading delay for better UX
    setTimeout(() => {
        const nextVideos = allVideos.slice(displayedVideos, displayedVideos + CONFIG.VIDEOS_PER_PAGE);
        
        nextVideos.forEach((video, index) => {
            renderVideoCard(video, displayedVideos + index);
        });
        
        displayedVideos += nextVideos.length;
        
        // Update button state
        if (displayedVideos >= allVideos.length) {
            loadMoreBtn.style.display = 'none';
        } else {
            loadMoreBtn.textContent = 'Load More Videos';
            loadMoreBtn.disabled = false;
        }
        
        isLoading = false;
    }, 800);
}

// Modal functions
function setupModal() {
    const modal = getElement('video-modal');
    const closeBtn = modal.querySelector('.close');
    
    closeBtn.addEventListener('click', closeVideoModal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeVideoModal();
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeVideoModal();
        }
    });
}

function openVideoModal(video) {
    const modal = getElement('video-modal');
    const modalTitle = getElement('modal-title');
    const modalVideoContainer = getElement('modal-video-container');
    
    modalTitle.textContent = video.Heading;
    modalVideoContainer.innerHTML = video.clip[0].children[0].text;
    
    // Make iframe responsive
    const iframe = modalVideoContainer.querySelector('iframe');
    if (iframe) {
        iframe.style.width = '100%';
        iframe.style.height = '450px';
        iframe.style.borderRadius = '10px';
    }
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeVideoModal() {
    const modal = getElement('video-modal');
    const modalVideoContainer = getElement('modal-video-container');
    
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    
    // Stop video playback
    modalVideoContainer.innerHTML = '';
}

// Initialize
document.addEventListener('DOMContentLoaded', fetchData);

// Handle page visibility for performance
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Pause any ongoing animations or processes
    }
});