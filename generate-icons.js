const sharp = require('sharp');
const path = require('path');

const SIZE = 81; // 抖音小程序 tabbar 图标推荐尺寸
const OUTPUT = path.join(__dirname, 'miniapp', 'assets', 'icons');

// 生成 SVG 图标
function homeIcon(color) {
    return `<svg width="${SIZE}" height="${SIZE}" viewBox="0 0 81 81" xmlns="http://www.w3.org/2000/svg">
        <path d="M40.5 8L6 36h8v30h18V48h17v18h18V36h8L40.5 8z" fill="${color}" stroke="none"/>
        <rect x="32" y="22" width="17" height="12" rx="2" fill="white" opacity="0.3"/>
    </svg>`;
}

function rankIcon(color) {
    return `<svg width="${SIZE}" height="${SIZE}" viewBox="0 0 81 81" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="40" width="14" height="30" rx="3" fill="${color}"/>
        <rect x="28" y="25" width="14" height="45" rx="3" fill="${color}"/>
        <rect x="46" y="12" width="14" height="58" rx="3" fill="${color}"/>
        <rect x="64" y="32" width="14" height="38" rx="3" fill="${color}" opacity="0.5"/>
        <circle cx="40" cy="8" r="4" fill="${color}"/>
    </svg>`;
}

function mineIcon(color) {
    return `<svg width="${SIZE}" height="${SIZE}" viewBox="0 0 81 81" xmlns="http://www.w3.org/2000/svg">
        <circle cx="40.5" cy="26" r="14" fill="${color}"/>
        <path d="M12 70c0-16 12-26 28.5-26S69 54 69 70" fill="${color}" stroke="none"/>
    </svg>`;
}

// 也生成一个 logo
function logoIcon() {
    return `<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#FF2442"/>
                <stop offset="100%" style="stop-color:#FF6B81"/>
            </linearGradient>
        </defs>
        <rect width="200" height="200" rx="40" fill="url(#g)"/>
        <text x="100" y="85" text-anchor="middle" font-size="48" font-weight="bold" fill="white" font-family="Arial">Fan</text>
        <text x="100" y="135" text-anchor="middle" font-size="48" font-weight="bold" fill="white" font-family="Arial">Pick</text>
        <circle cx="100" cy="160" r="8" fill="white" opacity="0.6"/>
        <circle cx="80" cy="160" r="8" fill="white" opacity="0.4"/>
        <circle cx="120" cy="160" r="8" fill="white" opacity="0.4"/>
    </svg>`;
}

async function generate() {
    const icons = [
        { name: 'home.svg', svg: homeIcon('#999999') },
        { name: 'home-active.svg', svg: homeIcon('#FF2442') },
        { name: 'rank.svg', svg: rankIcon('#999999') },
        { name: 'rank-active.svg', svg: rankIcon('#FF2442') },
        { name: 'mine.svg', svg: mineIcon('#999999') },
        { name: 'mine-active.svg', svg: mineIcon('#FF2442') },
    ];

    for (const icon of icons) {
        const pngPath = path.join(OUTPUT, icon.name.replace('.svg', '.png'));
        await sharp(Buffer.from(icon.svg))
            .resize(SIZE, SIZE)
            .png()
            .toFile(pngPath);
        console.log(`✅ ${icon.name.replace('.svg', '.png')}`);
    }

    // 生成 logo
    const logoPath = path.join(__dirname, 'miniapp', 'assets', 'logo.png');
    await sharp(Buffer.from(logoIcon()))
        .resize(200, 200)
        .png()
        .toFile(logoPath);
    console.log('✅ logo.png');

    // 生成默认头像
    const avatarSvg = `<svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
        <circle cx="60" cy="60" r="60" fill="#E8E8E8"/>
        <circle cx="60" cy="42" r="18" fill="#CCCCCC"/>
        <path d="M20 105c0-22 18-38 40-38s40 16 40 38" fill="#CCCCCC"/>
    </svg>`;
    const avatarPath = path.join(__dirname, 'miniapp', 'assets', 'default-avatar.png');
    await sharp(Buffer.from(avatarSvg))
        .resize(120, 120)
        .png()
        .toFile(avatarPath);
    console.log('✅ default-avatar.png');

    console.log('\n所有图标已生成到 miniapp/assets/');
}

generate().catch(console.error);
