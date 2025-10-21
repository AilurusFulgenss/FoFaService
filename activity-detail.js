// MOCK DATA VERSION
const FAKE_PROJECT_DATA = {
    id: 1,
    attributes: {
        Title: "โครงการบริการวิชาการแก่สังคม (เวอร์ชันจำลอง)",
        Description: "<p>เมเปิลโอเปร่าซิมโฟนีอาร์พีจีออทิสติก แบ็กโฮเก๊ะนางแบบ อิกัวนาทับซ้อนฮิตฟาสต์ฟู้ด ยากูซ่าทรูมั้ง วอลซ์ตัวตนวิกรีไซเคิล วีไอพีปาร์ตี้บร็อกโคลี ออโต้ม้านั่งเรซิ่น ตอกย้ำสหัสวรรษโกะสแตนดาร์ดแรลลี่ เอ๊าะแผดเผาอุตสาหการ ฮ็อตด็อกทอม ดีมานด์ฮาร์ดวอลนัตเยอบีราแอคทีฟ แพนดาสุนทรีย์เอาท์ สงบสุขโมเดิร์นทับซ้อน วีเจแคนยอนเอาท์ หน่อมแน้ม ผลักดันฮ็อตรีโมท</p>",
        cardImage: {
            data: [
                // รูปที่ 1 (รูปใหญ่ 2x2)
                { id: 101, attributes: { url: 'https://via.placeholder.com/800x800.png?text=Image+1', formats: { small: { url: 'https://via.placeholder.com/400x400.png?text=Image+1' } }, alternativeText: 'Test 1' } },
                // รูปที่ 2
                { id: 102, attributes: { url: 'https://via.placeholder.com/800x600.png?text=Image+2', formats: { small: { url: 'https://via.placeholder.com/400x300.png?text=Image+2' } }, alternativeText: 'Test 2' } },
                // รูปที่ 3
                { id: 103, attributes: { url: 'https://via.placeholder.com/600x800.png?text=Image+3', formats: { small: { url: 'https://via.placeholder.com/300x400.png?text=Image+3' } }, alternativeText: 'Test 3' } },
                // รูปที่ 4
                { id: 104, attributes: { url: 'https://via.placeholder.com/800x800.png?text=Image+4', formats: { small: { url: 'https://via.placeholder.com/400x400.png?text=Image+4' } }, alternativeText: 'Test 4' } },
                // รูปที่ 5 (รูปสุดท้ายที่จะโชว์ + ปุ่ม More)
                { id: 105, attributes: { url: 'https://via.placeholder.com/600x600.png?text=Image+5', formats: { small: { url: 'https://via.placeholder.com/300x300.png?text=Image+5' } }, alternativeText: 'Test 5' } },
                // --- รูปที่ซ่อนไว้ (สำหรับ Fancybox) ---
                // รูปที่ 6
                { id: 106, attributes: { url: 'https://via.placeholder.com/1920x1080.png?text=Image+6+(Hidden)', formats: { small: { url: 'https://via.placeholder.com/1920x1080.png?text=Image+6' } }, alternativeText: 'Test 6' } },
                // รูปที่ 7
                { id: 107, attributes: { url: 'https://via.placeholder.com/1080x1920.png?text=Image+7+(Hidden)', formats: { small: { url: 'https://via.placeholder.com/1080x1920.png?text=Image+7' } }, alternativeText: 'Test 7' } }
            ]
        }
    }
};
//END MOCK DATA


// CONFIG 
const CONFIG = {
    STRAPI_URL: "https://healing-deer-4066e16ac3.strapiapp.com",
    API_ENDPOINTS: {
        global: 'https://healing-deer-4066e16ac3.strapiapp.com/api/global',
    }
};

const GALLERY_DISPLAY_LIMIT = 5; // โชว์ 5 รูปใน Collage
const getElement = (id) => document.getElementById(id);

// โหลด Layout Header/Footer
async function loadLayout() {
    try {
        const globalRes = await fetch(CONFIG.API_ENDPOINTS.global);
        if (!globalRes.ok) throw new Error('Failed to fetch global data');
        const globalData = await globalRes.json();
        renderHeader(globalData.data.Header);
        renderFooter(globalData.data.Footer);
    } catch (error) {
        console.error('Error loading layout:', error);
    }
}

// โหลดข้อมูลโปรเจค (Mock)
async function loadActivityDetail() {
    console.log("Running in MOCK mode. Using FAKE_PROJECT_DATA.");
    try {
        
        const activity = FAKE_PROJECT_DATA;
        const attributes = activity.attributes;
        const images = attributes.cardImage.data; // Array รูปภาพ
        
        renderGallery(activity.id, images);
        renderContent(attributes.Title, attributes.Description);
        

    } catch (error) {
        console.error('Error loading activity detail:', error);
        getElement('gallery-container').innerHTML = '<p style="color: red; text-align: center; font-size: 1.6rem;">เกิดข้อผิดพลาดในการแสดงผล Mock Data</p>';
    }
}

// สร้าง Gallery (ใช้ Fancybox) 
function renderGallery(activityId, galleryImages) {
    const container = document.getElementById('gallery-container');
    if (!galleryImages || galleryImages.length === 0) {
        container.innerHTML = "<p>No images found.</p>";
        return;
    }

    const totalImages = galleryImages.length;
    const hiddenCount = totalImages - GALLERY_DISPLAY_LIMIT;
    let visibleHtml = '';
    let hiddenHtml = '';
    const linkId = `gallery-${activityId}`;

    galleryImages.forEach((image, index) => {
        const fullUrl = image.attributes.url;
        const thumbUrl = image.attributes.formats.small?.url || fullUrl;
        const altText = image.attributes.alternativeText || 'Activity Image';

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

    // สั่ง Fancybox ให้ทำงาน
    Fancybox.bind(`[data-fancybox="${linkId}"]`, {});
}

// สร้างเนื้อหา
// (ไม่ต้องแก้)
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

function renderFooter(footerData) {
    const footer = getElement("footer");
    if (!footer) return;
    const socialIcons = footerData.Icon.slice(1).map(icon => `<a href="${icon.href}" target="_blank"><img src="${icon.Logo.url}" alt="${icon.label}"></a>`).join("");
    footer.innerHTML = `<div class="footer-container"><div class="footer-left"><img src="${footerData.Icon[0].Logo.url}" alt="Website Logo" class="footer-logo"><div class="footer-socials">${socialIcons}</div><p class="footer-text">${footerData.text}</p></div><div class="footer-right">${footerData.map?.map || ''}</div></div>`;
}

document.addEventListener('DOMContentLoaded', () => {
    loadLayout();         // 1. โหลด Header/Footer (จาก API จริง)
    loadActivityDetail(); // 2. โหลด Gallery (จาก Mock Data)
});