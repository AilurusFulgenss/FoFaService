// CONFIG 
const CONFIG = {
    STRAPI_URL: "https://healing-deer-4066e16ac3.strapiapp.com",
    API_ENDPOINTS: {
        global: 'https://healing-deer-4066e16ac3.strapiapp.com/api/global',
        // ใช้ API เดิมที่ Projects.js ใช้ เพื่อดึงข้อมูลโครงการทั้งหมด
        projects: 'https://healing-deer-4066e16ac3.strapiapp.com/api/project-and-activitie',
        // --- NEW: API สำหรับดึงยอดรวมวิว ---
        globalView: 'https://healing-deer-4066e16ac3.strapiapp.com/api/global-view'
    }
};

const GALLERY_DISPLAY_LIMIT = 5; 
const getElement = (id) => document.getElementById(id);

// Utility: ดึง ID จาก URL
function getActivityIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return parseInt(params.get('id')); 
}

// Helper: ค้นหากิจกรรมจากชุดข้อมูลโครงการทั้งหมด
function findActivityById(projectId, allProjectsData) {
    if (!allProjectsData || !allProjectsData.Card) return null;
    
    for (const quarter of allProjectsData.Card) {
        if (quarter.Card) {
            const foundActivity = quarter.Card.find(card => card.id === projectId);
            if (foundActivity) {
                return foundActivity; 
            }
        }
    }
    return null; 
}

// โหลด Layout Header/Footer
async function loadLayout() {
    try {
        // NEW: ดึง Global View พร้อมกัน
        const [globalRes, globalViewRes] = await Promise.all([
            fetch(CONFIG.API_ENDPOINTS.global),
            fetch(CONFIG.API_ENDPOINTS.globalView)
        ]);
        
        if (!globalRes.ok || !globalViewRes.ok) throw new Error('Failed to fetch global data');
        
        const globalData = await globalRes.json();
        const globalViewData = await globalViewRes.json(); 
        
        renderHeader(globalData.data.Header);
        renderFooter(globalData.data.Footer, globalViewData.data);
    } catch (error) {
        console.error('Error loading layout:', error);
    }
}

// โหลดข้อมูลโปรเจคจริงและค้นหากิจกรรม
async function loadActivityDetail() {
    const activityId = getActivityIdFromUrl();
    const galleryContainer = getElement('gallery-container');
    const contentContainer = getElement('content-container');
    
    if (!activityId) {
        galleryContainer.innerHTML = '<p class="loading-placeholder">ไม่พบ ID กิจกรรม</p>';
        contentContainer.innerHTML = '';
        return;
    }
    
    try {
        const projectsRes = await fetch(CONFIG.API_ENDPOINTS.projects);
        if (!projectsRes.ok) throw new Error('Failed to fetch projects data');
        
        const projectsData = await projectsRes.json();
        const activity = findActivityById(activityId, projectsData.data);
        
        if (!activity) {
            galleryContainer.innerHTML = `<p class="loading-placeholder">ไม่พบกิจกรรม ID: ${activityId}</p>`;
            contentContainer.innerHTML = '';
            return;
        }

        const images = activity.cardImage || []; 
        
        // **!!! EDITED: ดึง longText ก่อน สำหรับบทความเต็ม !!!**
        const fullContent = activity.longText || activity.text; 
        
        const formattedDescription = fullContent || 'ไม่มีรายละเอียด';
        
        renderGallery(activity.id, images);
        renderContent(activity.Heading, formattedDescription);
        
    } catch (error) {
        console.error('Error loading activity detail:', error);
        galleryContainer.innerHTML = '<p class="loading-placeholder" style="color: red;">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>';
        contentContainer.innerHTML = '';
    }
}

// สร้าง Gallery (ใช้ Fancybox) 
function renderGallery(activityId, galleryImages) {
    const container = document.getElementById('gallery-container');
    if (!galleryImages || galleryImages.length === 0) {
        container.innerHTML = "<p class='loading-placeholder'>No images found.</p>";
        return;
    }

    const totalImages = galleryImages.length;
    const hiddenCount = totalImages - GALLERY_DISPLAY_LIMIT;
    let visibleHtml = '';
    let hiddenHtml = '';
    const linkId = `gallery-${activityId}`;

    galleryImages.forEach((image, index) => {
        const fullUrl = image.url;
        const thumbUrl = image.url; 
        const altText = image.alternativeText || 'Activity Image';

        if (index < (GALLERY_DISPLAY_LIMIT - 1)) {
            visibleHtml += `<a href="${fullUrl}" data-fancybox="${linkId}" class="grid-item"><img src="${thumbUrl}" alt="${altText}"></a>`;
        } else if (index === (GALLERY_DISPLAY_LIMIT - 1)) {
            let overlay = (hiddenCount > 0) ? `<div class="more-overlay"><span>+${hiddenCount} More</span></div>` : '';
            visibleHtml += `
                <a href="${fullUrl}" data-fancybox="${linkId}" class="grid-item item-more">
                    <img src="${thumbUrl}" alt="${altText}">
                    ${overlay}
                </a>
            `;
        } else {
            hiddenHtml += `<a href="${fullUrl}" data-fancybox="${linkId}"></a>`;
        }
    });

    container.innerHTML = `
        <div class="collage-grid">${visibleHtml}</div>
        <div style="display: none;">${hiddenHtml}</div>
    `;

    Fancybox.bind(`[data-fancybox="${linkId}"]`, {});
}

// สร้างเนื้อหา
function renderContent(title, description) {
    const container = document.getElementById('content-container');
    container.innerHTML = `
        <h2>${title || 'ไม่มีหัวข้อ'}</h2>
        <div>${description || 'ไม่มีรายละเอียด'}</div> 
    `;
}

//  Render Header/Footer 
function renderHeader(headerData) {
    const header = getElement("header");
    if (!header) return;
    const navLinks = headerData.navItems
        .map(item => {
            let href = item.href;
            if (item.label.toLowerCase().includes('หน้าแรก')) href = 'index.html';
            else if (item.label.toLowerCase().includes('กิจกรรมบริการวิชาการแก่สังคม')) href = 'activity-video.html';
            else if (item.label.toLowerCase().includes('โครงการและกิจกรรม')) href = 'projects.html';
            else if (item.label.toLowerCase().includes('งานงบประมาณ')) href = 'budget.html';
            
            const activeClass = href === 'projects.html' ? ' active' : '';
            return `<a href="${href}" class="${activeClass.trim()}">${item.label}</a>`;
        })
        .join("");
    header.innerHTML = `<div class="header-container"><img src="${headerData.Logo.Logo.url}" alt="Logo" class="logo"><nav class="navbar">${navLinks}</nav></div>`;
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

document.addEventListener('DOMContentLoaded', () => {
    loadLayout();         
    loadActivityDetail(); 
});