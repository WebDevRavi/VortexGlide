/**
 * VORTEX GLIDE — Production Bundler & Build Script
 * Bundles code into clean distribution structure:
 * - assets/
 * - favicon.svg
 * - index.html
 * - index-B9D_BkIN.js
 * - index-q2dla6cg.css
 * - logo.png
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import * as esbuild from 'esbuild';

const DIST_DIR = 'dist';
const ZIP_NAME = 'vortex-glide.zip';
const JS_BUNDLE = 'index-B9D_BkIN.js';
const CSS_BUNDLE = 'index-q2dla6cg.css';

async function build() {
  console.log('⚡ VORTEX GLIDE — Production Build');
  console.log('===================================\n');

  // 1. Clean dist
  if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true });
  }
  fs.mkdirSync(DIST_DIR, { recursive: true });

  const buildDir = path.join(DIST_DIR, 'vortex-glide');
  fs.mkdirSync(buildDir, { recursive: true });

  // 2. Copy assets folder
  console.log('📁 Copying assets...');
  function copyDir(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        copyDir(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  if (fs.existsSync('assets')) {
    copyDir('assets', path.join(buildDir, 'assets'));
  }

  // 3. Copy root media: favicon.svg and logo.svg
  console.log('🖼️ Copying root media (favicon.svg, logo.svg)...');
  const faviconSrc = fs.existsSync('favicon.svg') ? 'favicon.svg' : 'assets/icons/favicon.svg';
  if (fs.existsSync(faviconSrc)) {
    fs.copyFileSync(faviconSrc, path.join(buildDir, 'favicon.svg'));
  }
  if (fs.existsSync('logo.svg')) {
    fs.copyFileSync('logo.svg', path.join(buildDir, 'logo.svg'));
  } else if (fs.existsSync('assets/icons/logo.svg')) {
    fs.copyFileSync('assets/icons/logo.svg', path.join(buildDir, 'logo.svg'));
  }
  if (fs.existsSync('logo.png')) {
    fs.copyFileSync('logo.png', path.join(buildDir, 'logo.png'));
  }

  // 4. Bundle and minify CSS into index-q2dla6cg.css
  console.log(`🎨 Bundling CSS into ${CSS_BUNDLE}...`);
  const cssFiles = [
    'css/main.css',
    'css/menu.css',
    'css/gameplay.css',
    'css/responsive.css'
  ];

  let combinedCss = '';
  for (const file of cssFiles) {
    if (fs.existsSync(file)) {
      combinedCss += fs.readFileSync(file, 'utf8') + '\n';
    }
  }

  const minifiedCss = await esbuild.transform(combinedCss, {
    loader: 'css',
    minify: true
  });
  fs.writeFileSync(path.join(buildDir, CSS_BUNDLE), minifiedCss.code);

  // 5. Bundle and minify JS into index-B9D_BkIN.js
  console.log(`📦 Bundling JavaScript into ${JS_BUNDLE}...`);
  await esbuild.build({
    entryPoints: ['js/main.js'],
    bundle: true,
    minify: true,
    format: 'esm',
    target: ['es2020'],
    outfile: path.join(buildDir, JS_BUNDLE)
  });

  // 6. Generate optimized production index.html
  console.log('📄 Generating production index.html...');
  const prodHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>Vortex Glide — High-Speed 3D Tunnel Arcade</title>
  <meta name="description" content="Vortex Glide is a high-speed 3D tunnel arcade runner. Steer your futuristic craft through an endless neon vortex, dodge incoming hazard gates, and break your distance records.">
  <meta name="theme-color" content="#060710">

  <!-- Favicon / App Icon -->
  <link rel="icon" type="image/svg+xml" href="./favicon.svg">

  <!-- CrazyGames SDK v3 Official Script -->
  <script src="https://sdk.crazygames.com/crazygames-sdk-v3.js"></script>

  <!-- Bundled Stylesheet -->
  <link rel="stylesheet" href="./${CSS_BUNDLE}">
</head>
<body>
  <div id="game-container">
    <!-- WebGL Render Canvas -->
    <canvas id="game-canvas"></canvas>

    <!-- UI Overlay Root -->
    <div id="ui-root">
      
      <!-- Gameplay HUD -->
      <div id="gameplay-hud"></div>

      <!-- 3-2-1 Countdown Overlay -->
      <div id="countdown-overlay">
        <div class="countdown-number" id="countdown-number">3</div>
      </div>

      <!-- FX & Damage Overlay -->
      <div id="fx-overlay">
        <div class="impact-flash" id="impact-flash"></div>
      </div>

      <!-- Home Screen -->
      <div class="screen active" id="home-screen"></div>

      <!-- How to Play Screen -->
      <div class="screen backdrop-dim" id="how-to-play-screen"></div>

      <!-- Settings Screen -->
      <div class="screen backdrop-dim" id="settings-screen"></div>

      <!-- Leaderboard Screen -->
      <div class="screen backdrop-dim" id="leaderboard-screen"></div>

      <!-- Pause Screen -->
      <div class="screen backdrop-dim" id="pause-screen"></div>

      <!-- Game Over Screen -->
      <div class="screen backdrop-dim" id="game-over-screen"></div>

      <!-- Dev FPS Counter -->
      <div id="fps-counter">FPS: 60</div>
    </div>

    <!-- Mandatory Mobile Landscape Orientation Lock Screen -->
    <div id="rotate-device-overlay">
      <div class="rotate-phone-box">
        <div class="rotate-phone-animation">
          <svg viewBox="0 0 100 100" class="rotate-phone-svg" aria-hidden="true">
            <rect x="30" y="15" width="40" height="70" rx="8" class="phone-body" />
            <circle cx="50" cy="78" r="3" class="phone-button" />
            <line x1="42" y1="22" x2="58" y2="22" class="phone-speaker" />
            <path d="M 20 48 A 32 32 0 0 1 76 22" class="rotate-arrow" />
            <polygon points="76,17 84,23 76,29" class="rotate-arrow-head" />
          </svg>
        </div>
        <h2 class="rotate-title">ROTATE YOUR DEVICE</h2>
        <p class="rotate-subtitle">Vortex Glide is optimized for high-speed landscape navigation.</p>
        <div class="rotate-badge">LANDSCAPE ONLY</div>
      </div>
    </div>
  </div>

  <!-- Bundled Script -->
  <script type="module" src="./${JS_BUNDLE}"></script>
</body>
</html>
`;

  fs.writeFileSync(path.join(buildDir, 'index.html'), prodHtml);

  // 7. Verify files and sizes
  let totalSize = 0;
  let fileCount = 0;
  function calcSize(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        calcSize(full);
      } else {
        totalSize += fs.statSync(full).size;
        fileCount++;
      }
    }
  }
  calcSize(buildDir);

  console.log(`\n📦 Files: ${fileCount}`);
  console.log(`📏 Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);

  // 8. Validate CrazyGames limits
  const maxSize = 250 * 1024 * 1024;
  const maxFiles = 1500;
  const initialMax = 50 * 1024 * 1024;

  if (totalSize > maxSize) {
    console.error(`\n❌ FAIL: Total size ${(totalSize/1024/1024).toFixed(2)} MB exceeds 250 MB limit`);
    process.exit(1);
  }
  if (fileCount > maxFiles) {
    console.error(`\n❌ FAIL: File count ${fileCount} exceeds 1500 limit`);
    process.exit(1);
  }
  if (totalSize > initialMax) {
    console.warn(`\n⚠️  WARNING: Size ${(totalSize/1024/1024).toFixed(2)} MB exceeds 50 MB initial download limit`);
  }

  console.log('✅ CrazyGames limits: PASS');

  // 9. Create zip using PowerShell
  const zipPath = path.join(DIST_DIR, ZIP_NAME);
  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
  }

  const absZip = path.resolve(zipPath);
  const absBuild = path.resolve(buildDir);

  try {
    if (process.platform === 'win32') {
      execSync(
        `powershell -NoProfile -Command "Compress-Archive -Path '${absBuild}\\*' -DestinationPath '${absZip}' -Force"`,
        { stdio: 'inherit' }
      );
    } else {
      try {
        execSync(`zip -r "${absZip}" .`, { cwd: absBuild, stdio: 'ignore' });
      } catch (zipErr) {
        // Zip is optional for web hosting (only needed for CrazyGames manual upload)
      }
    }

    if (fs.existsSync(absZip)) {
      const zipSize = fs.statSync(absZip).size;
      console.log(`\n🎯 Build complete: dist/${ZIP_NAME} (${(zipSize / 1024 / 1024).toFixed(2)} MB)`);
    }
    console.log('\n📁 Clean folder structure created in dist/vortex-glide:');
    const rootItems = fs.readdirSync(buildDir);
    for (const item of rootItems) {
      const isDir = fs.statSync(path.join(buildDir, item)).isDirectory();
      console.log(`   - ${item}${isDir ? '/' : ''}`);
    }
    console.log('\n📤 Ready for deployment or upload to CrazyGames / Vercel');
  } catch (err) {
    console.error('⚠️ Notice during zip step:', err.message);
  }
}

build().catch(console.error);
