// Configuration
const CONFIG = {
    STRAPI_URL: "https://healing-deer-4066e16ac3.strapiapp.com",
    API_ENDPOINTS: {
        global: 'https://healing-deer-4066e16ac3.strapiapp.com/api/global',
        budget: 'https://healing-deer-4066e16ac3.strapiapp.com/api/download-page' // API endpoint สำหรับข้อมูลงบประมาณ
    }
};

// State management
let budgetData = [];

// Utility functions
const createElement = (tag, className, innerHTML) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (innerHTML) element.innerHTML = innerHTML;
    return element;
};

const getElement = (id) => document.getElementById(id);

const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileIcon = (fileType) => {
    const icons = {
        'pdf': 'fas fa-file-pdf',
        'doc': 'fas fa-file-word',
        'docx': 'fas fa-file-word',
        'xls': 'fas fa-file-excel',
        'xlsx': 'fas fa-file-excel',
        'ppt': 'fas fa-file-powerpoint',
        'pptx': 'fas fa-file-powerpoint',
        'zip': 'fas fa-file-archive',
        'rar': 'fas fa-file-archive',
        'jpg': 'fas fa-file-image',
        'jpeg': 'fas fa-file-image',
        'png': 'fas fa-file-image',
        'gif': 'fas fa-file-image',
        'txt': 'fas fa-file-alt',
        'default': 'fas fa-file'
    };
    
    return icons[fileType.toLowerCase()] || icons['default'];
};

const getFileTypeColor = (fileType) => {
    const colors = {
        'pdf': '#dc3545',
        'doc': '#2b579a',
        'docx': '#2b579a',
        'xls': '#217346',
        'xlsx': '#217346',
        'ppt': '#d24726',
        'pptx': '#d24726',
        'zip': '#6c757d',
        'rar': '#6c757d',
        'jpg': '#fd7e14',
        'jpeg': '#fd7e14',
        'png': '#fd7e14',
        'gif': '#fd7e14',
        'txt': '#6c757d',
        'default': '#6c757d'
    };
    
    return colors[fileType.toLowerCase()] || colors['default'];
};

// Helper function to get actual file size from API or extract file extension
const getFileInfoFromUrl = async (fileData) => {
    if (!fileData) return { type: 'pdf', size: 0 };
    
    // ถ้ามี size ใน API data ให้ใช้ค่าจริง
    if (fileData.size) {
        const urlParts = fileData.url.split('.');
        const extension = urlParts[urlParts.length - 1].toLowerCase();
        return {
            type: extension,
            size: fileData.size
        };
    }
    
    // ถ้าไม่มี size ให้ลองดึงจาก HEAD request
    try {
        const response = await fetch(fileData.url, { method: 'HEAD' });
        const contentLength = response.headers.get('content-length');
        const urlParts = fileData.url.split('.');
        const extension = urlParts[urlParts.length - 1].toLowerCase();
        
        return {
            type: extension,
            size: contentLength ? parseInt(contentLength) : 0
        };
    } catch (error) {
        // ถ้าดึงไม่ได้ให้ใช้ค่า 0
        const urlParts = fileData.url.split('.');
        const extension = urlParts[urlParts.length - 1].toLowerCase();
        return {
            type: extension,
            size: 0
        };
    }
};

// API functions
// 1. ฟังก์ชันสำหรับโหลด Layout (Header/Footer) โดยเฉพาะ
async function loadLayout() {
    try {
        const globalRes = await fetch(CONFIG.API_ENDPOINTS.global);
        if (!globalRes.ok) throw new Error('Failed to fetch global data');
        
        const globalData = await globalRes.json();
        
        // เรนเดอร์ Header และ Footer ทันที!
        renderHeader(globalData.data.Header);
        renderFooter(globalData.data.Footer);
        
    } catch (error) {
        console.error('Error loading layout:', error);
        // ถ้า Header/Footer ล่ม ก็อาจจะแสดงผล error บางอย่าง
    }
}

// 2. ฟังก์ชันสำหรับโหลดเนื้อหาหน้างบประมาณ
async function loadBudgetContent() {
    try {
        const budgetRes = await fetch(CONFIG.API_ENDPOINTS.budget);
        if (!budgetRes.ok) throw new Error('Failed to fetch budget data');
        
        const budgetDataResponse = await budgetRes.json();
        
        // แปลงข้อมูลและเรนเดอร์เนื้อหา (ซึ่งจะใช้เวลา ก็ไม่เป็นไร)
        budgetData = await transformBudgetData(budgetDataResponse.data);
        renderBudgetContent();
        
    } catch (error) {
        console.error('Error fetching budget data:', error);
        showError('ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
    }
}

// Transform API data to display format
async function transformBudgetData(apiData) {
    if (!apiData || !apiData.LoadBlocks) {
        return [];
    }

    const transformedData = [];
    
    for (const [blockIndex, block] of apiData.LoadBlocks.entries()) {
        // สร้าง title จากการดูข้อมูลใน block หรือใช้ title เริ่มต้น
        let sectionTitle = 'เอกสารและแบบฟอร์ม';
        
        // ลองดู pattern จาก card headings เพื่อสร้าง section title
        if (block.Card && block.Card.length > 0) {
            const firstCardHeading = block.Card[0].Heading;
            
            // จัดกลุ่มตาม pattern ของชื่อ
            if (firstCardHeading.includes('ค่าบริการทางวิชาการ')) {
                sectionTitle = 'การให้บริการทางวิชาการ';
            } else if (firstCardHeading.includes('การจัดประชุม') || firstCardHeading.includes('หลักเกณฑ์ในการจัดประชุม')) {
                sectionTitle = 'การจัดประชุมและอบรม';
            } else if (firstCardHeading.includes('ศึกษาดูงาน') || firstCardHeading.includes('ฝึกปฏิบัติ')) {
                sectionTitle = 'บริการศึกษาดูงานและฝึกปฏิบัติ';
            } else if (firstCardHeading.includes('ทุนสนับสนุน') || firstCardHeading.includes('วิทยากร')) {
                sectionTitle = 'ทุนสนับสนุนและวิทยากร';
            } else if (firstCardHeading.includes('ปาฐกถา') || firstCardHeading.includes('ค่าใช้จ่าย')) {
                sectionTitle = 'การจัดงานและค่าใช้จ่าย';
            }
        }
        
        const files = [];
        
        // ประมวลผลไฟล์แต่ละไฟล์
        for (const [cardIndex, card] of block.Card.entries()) {
            let fileUrl = '/files/default.pdf';
            let fileInfo = { type: 'pdf', size: 0 };
            
            if (card.cardImage && card.cardImage.length > 0) {
                fileUrl = card.cardImage[0].url;
                // ใช้ฟังก์ชันใหม่เพื่อดึงขนาดไฟล์จริง
                fileInfo = await getFileInfoFromUrl(card.cardImage[0]);
            }
            
            files.push({
                id: cardIndex + 1,
                name: `${card.Heading}.${fileInfo.type}`,
                url: fileUrl,
                size: fileInfo.size,
                type: fileInfo.type,
                title: card.Heading
            });
        }
        
        transformedData.push({
            id: blockIndex + 1,
            title: sectionTitle,
            description: `เอกสารและแบบฟอร์ม`,
            files: files
        });
    }
    
    return transformedData;
}

// Render functions
function renderHeader(headerData) {
    const logo = getElement("logo");
    const navbar = getElement("navbar");
    
    logo.src = headerData.Logo.Logo.url;
    
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
            const activeClass = href === 'budget.html' ? ' active' : '';
            
            return `<a href="${href}" class="${activeClass.trim()}">${item.label}</a>`;
        })
        .join("");

    navbar.innerHTML = navLinks;
}

function renderBudgetContent() {
    const container = getElement("budget-content");
    
    if (!budgetData || budgetData.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-folder-open"></i>
                <h3>ไม่พบข้อมูล</h3>
                <p>ยังไม่มีไฟล์งบประมาณให้ดาวน์โหลด</p>
            </div>
        `;
        return;
    }
    
    const sectionsHTML = budgetData.map(section => `
        <div class="budget-section">
            <div class="section-title">
                <h2>${section.title}</h2>
                <p>${section.description}</p>
            </div>
            
            <div class="files-container" id="files-container-${section.id}">
                <button class="nav-btn prev" onclick="scrollFiles(${section.id}, -1)">
                    <i class="fas fa-chevron-left"></i>
                </button>
                
                <div class="files-wrapper" id="files-wrapper-${section.id}">
                    ${section.files.map(file => `
                        <div class="file-card" onclick="downloadFile('${file.url}', '${file.name}')">
                            <div class="file-icon">
                                <i class="${getFileIcon(file.type)}"></i>
                            </div>
                            <div class="file-content">
                                <h3>${file.title || file.name}</h3>
                                <div class="file-meta">
                                    <span class="file-size">${file.size > 0 ? formatFileSize(file.size) : 'ไม่ระบุขนาด'}</span>
                                    <span class="file-type" style="background-color: ${getFileTypeColor(file.type)}">${file.type.toUpperCase()}</span>
                                </div>
                                <button class="download-btn">
                                    <i class="fas fa-download"></i> ดาวน์โหลด
                                </button>
                            </div>
                        </div>
                    `).join("")}
                </div>
                
                <button class="nav-btn next" onclick="scrollFiles(${section.id}, 1)">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        </div>
    `).join("");
    
    container.innerHTML = sectionsHTML;
    
    // Update navigation buttons state for each section
    budgetData.forEach(section => {
        updateNavButtons(section.id);
    });
}

function renderFooter(footerData) {
    const footer = getElement("footer");
    const socialIcons = footerData.Icon.slice(1).map(icon => `
        <a href="${icon.href}" target="_blank">
            <img src="${icon.Logo.url}" alt="${icon.label}">
        </a>
    `).join("");

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
    `;
}

// File operations
function downloadFile(url, filename) {
    // สร้าง link element สำหรับดาวน์โหลด
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    
    // Add click event
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Show download notification
    showNotification(`กำลังดาวน์โหลด: ${filename}`);
}

// Scroll functions
function scrollFiles(sectionId, direction) {
    const wrapper = getElement(`files-wrapper-${sectionId}`);
    const cardWidth = wrapper.querySelector('.file-card').offsetWidth + 20; // card width + gap
    
    wrapper.scrollBy({
        left: direction * cardWidth * 2,
        behavior: 'smooth'
    });
    
    // Update navigation buttons after scroll
    setTimeout(() => updateNavButtons(sectionId), 300);
}

function updateNavButtons(sectionId) {
    const wrapper = getElement(`files-wrapper-${sectionId}`);
    const container = getElement(`files-container-${sectionId}`);
    const prevBtn = container.querySelector('.nav-btn.prev');
    const nextBtn = container.querySelector('.nav-btn.next');
    
    if (!wrapper || !prevBtn || !nextBtn) return;
    
    const isAtStart = wrapper.scrollLeft <= 0;
    const isAtEnd = wrapper.scrollLeft >= wrapper.scrollWidth - wrapper.clientWidth - 1;
    
    prevBtn.disabled = isAtStart;
    nextBtn.disabled = isAtEnd;
}

// Utility functions
function showError(message) {
    const container = getElement("budget-content");
    container.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>เกิดข้อผิดพลาด</h3>
            <p>${message}</p>
            <button onclick="fetchData()" class="download-btn" style="margin-top: 2rem;">
                ลองใหม่อีกครั้ง
            </button>
        </div>
    `;
}

function showNotification(message) {
    // สร้าง notification element
    const notification = createElement('div', 'notification', `
        <i class="fas fa-download"></i>
        <span>${message}</span>
    `);
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 120px;
        right: 20px;
        background: var(--brown);
        color: white;
        padding: 1rem 2rem;
        border-radius: 25px;
        z-index: 10000;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .notification {
        display: flex;
        align-items: center;
        gap: 1rem;
        font-size: 1.4rem;
        font-weight: 600;
    }
`;
document.head.appendChild(style);

// Initialize when DOM is loaded
// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    loadLayout();         // <-- 1. สั่งโหลด Layout ทันที
    loadBudgetContent();  // <-- 2. สั่งโหลดเนื้อหา (มันจะโหลดขนานกันไป แต่ไม่บล็อก Layout)
});