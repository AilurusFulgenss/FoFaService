// Configuration
const CONFIG = {
    STRAPI_URL: "https://healing-deer-4066e16ac3.strapiapp.com",
    API_ENDPOINTS: {
        global: 'https://healing-deer-4066e16ac3.strapiapp.com/api/global',
        activityVideo: 'https://healing-deer-4066e16ac3.strapiapp.com/api/activity-vdo',
        // --- NEW: API สำหรับดึงยอดรวมวิว ---
        globalView: 'https://healing-deer-4066e16ac3.strapiapp.com/api/global-view'
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
        
        // NEW: ดึง Global View พร้อมกัน
        const [globalRes, activityRes, globalViewRes] = await Promise.all([
            fetch(CONFIG.API_ENDPOINTS.global),
            fetch(CONFIG.API_ENDPOINTS.activityVideo),
            fetch(CONFIG.API_ENDPOINTS.globalView)
        ]);

        if (!globalRes.ok || !activityRes.ok || !globalViewRes.ok) {
            throw new Error('Failed to fetch data');
        }

        const globalData = await globalRes.json();
        const activityData = await activityRes.json();
        const globalViewData = await globalViewRes.json();

        hideLoading();
        // NEW: ส่ง globalViewData เข้าไปใน initializeWebsite
        initializeWebsite(globalData.data, activityData.data, globalViewData.data);
    } catch (error) {
        console.error('Error fetching data:', error);
        hideLoading();
        showError('Failed to load videos. Please try again later.');
    }
}

function showLoading() {
    const videoGrid = getElement('video-grid');
    videoGrid.innerHTML = '<div class="loading">กำลังโหลด...</div>';
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
function initializeWebsite(globalData, activityData, globalViewData) {
    renderHeader(globalData.Header);
    renderFooter(globalData.Footer, globalViewData); // NEW: ส่ง globalViewData
    
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
            <img src="${headerData.Logo.Logo.url}" alt="Logo" class="logo">
            <nav class="navbar">${navLinks}</nav>
        </div>
    `;
}

// **!!! EDITED: ปรับปรุง renderFooter เพื่อแสดงยอดวิว !!!**
// **!! NEW: ปรับปรุง renderFooter ให้อ่านค่าจาก data.totalViews โดยตรง !!**
function renderFooter(footerData, globalViewData = null) {
    const footer = getElement("footer");
    const socialIcons = footerData.Icon.slice(1).map(icon => `
        <a href="${icon.href}" target="_blank">
            <img src="${icon.Logo.url}" alt="${icon.label}">
        </a>
    `).join("");

    // เปลี่ยนจาก .attributes.totalViews เป็น .totalViews
    const totalViews = globalViewData?.totalViews ?? 'N/A'; 
    
    const viewCounterHTML = `
        <div class="view-counter" style="
            text-align: center; 
            margin-top: 2rem; 
            padding-top: 1rem; 
            border-top: 1px solid #ccc;
            font-size: 1.4rem; 
            color: #555;
            width: 100%;
        ">
            <i class="fas fa-eye"></i> จำนวนผู้เข้าชม: 
            <span style="font-weight: 700; color: var(--brown);">${totalViews}</span>
        </div>
    `;

    footer.innerHTML = `
        <div class="footer-container">
            <div class="footer-left">
                <img src="${footerData.Icon[0].Logo.url}" alt="Website Logo" class="footer-logo">
                <div class="footer-socials">${socialIcons}</div>
                <p class="footer-text">${footerData.text}</p>
            </div>
            <div class="footer-right">
                ${footerData.map?.map || ''}
            </div>
        </div>
        ${viewCounterHTML}
    `;
    
    if (footer) {
        const style = document.createElement('style');
        style.textContent = `
            .view-counter i { margin-right: 0.5rem; color: #8A411B; }
            .footer-container { margin-bottom: 2rem; }
        `;
        document.head.appendChild(style); 
    }
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
    
    setTimeout(() => {
        const nextVideos = allVideos.slice(displayedVideos, displayedVideos + CONFIG.VIDEOS_PER_PAGE);
        
        nextVideos.forEach((video, index) => {
            renderVideoCard(video, displayedVideos + index);
        });
        
        displayedVideos += nextVideos.length;
        
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