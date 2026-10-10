const fs = require('fs');
const path = require('path');
const { PurgeCSS } = require('purgecss');
const CleanCSS = require('clean-css');
const { minify: minifyHtml } = require('html-minifier-terser');
const { minify: minifyJs } = require('terser');
const fsExtra = require('fs-extra');

const SOURCE_DIR = __dirname;
const DIST_DIR = path.join(__dirname, 'dist');
const COMPETITION_DIST_DIR = path.join(__dirname, 'competition-dist');

// Only ship assets referenced by published pages, scripts, styles or SVGs.
async function pruneAssets(directory) {
  const assets = path.join(directory, 'assets');
  const files = [];
  const walk = (folder) => {
    for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
      const full = path.join(folder, entry.name);
      if (entry.isDirectory()) walk(full);
      else files.push(full);
    }
  };
  walk(directory);
  let text = files.filter(file => !file.startsWith(assets + path.sep) && /\.(html|css|js|xml|txt)$/.test(file))
    .map(file => fs.readFileSync(file, 'utf8')).join('\n');
  // Decode URL-encoded filenames without assuming every percent sign is an escape.
  text = text.replace(/%[0-9a-f]{2}/gi, code => String.fromCharCode(parseInt(code.slice(1), 16)));
  const keep = new Set();
  let changed = true;
  while (changed) {
    changed = false;
    for (const file of files.filter(file => file.startsWith(assets + path.sep))) {
      const relative = path.relative(directory, file).split(path.sep).join('/');
      if (!keep.has(file) && text.includes(relative)) {
        keep.add(file); changed = true;
        if (file.endsWith('.svg')) text += '\n' + fs.readFileSync(file, 'utf8');
      }
    }
  }
  let removed = 0;
  for (const file of files.filter(file => file.startsWith(assets + path.sep))) {
    if (!keep.has(file)) { fs.unlinkSync(file); removed++; }
  }
  const removeEmpty = folder => {
    for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
      if (entry.isDirectory()) removeEmpty(path.join(folder, entry.name));
    }
    if (folder !== assets && fs.readdirSync(folder).length === 0) fs.rmdirSync(folder);
  };
  removeEmpty(assets);
  console.log(`   └─ ${path.basename(directory)}: ${keep.size} referenced assets, ${removed} unused files excluded.`);
}


async function build() {
  console.log('🚀 Starting advanced web build optimization...');
  const startTime = Date.now();

  try {
    // JSON is the source of truth; the browser wrapper is generated for file:// support.
    const payloadConfig = JSON.parse(fs.readFileSync(path.join(SOURCE_DIR, 'payload_config.json'), 'utf8'));
    if (payloadConfig.confirmed_capacity_kg + payloadConfig.available_capacity_kg !== payloadConfig.total_capacity_kg) {
      throw new Error('Confirmed and available payload capacity must equal total capacity.');
    }
    fs.writeFileSync(path.join(SOURCE_DIR, 'payload_config.js'), `window.PAYLOAD_CONFIG = ${JSON.stringify(payloadConfig, null, 2)};\n`);
    const payloadPage = path.join(SOURCE_DIR, 'payload.html');
    const configVersion = require('crypto').createHash('sha256').update(JSON.stringify(payloadConfig)).digest('hex').slice(0, 12);
    const payloadHtml = fs.readFileSync(payloadPage, 'utf8')
      .replace(/<(span|strong)\b([^>]*\bdata-payload="([^"]+)"[^>]*)>[^<]*<\/\1>/g, (match, tag, attrs, key) => {
        const value = payloadConfig[key];
        if (typeof value !== 'number') throw new Error(`Unknown payload value: ${key}`);
        const unit = attrs.match(/data-unit="([^"]*)"/)?.[1] || '';
        const text = attrs.includes('data-money="true"') ? '$' + value.toLocaleString('en-US') : value;
        return `<${tag}${attrs}>${text}${unit}</${tag}>`;
      })
      .replace(/payload_config\.js(?:\?v=[^"']*)?/, `payload_config.js?v=${configVersion}`);
    fs.writeFileSync(payloadPage, payloadHtml);
    const llmsPath = path.join(SOURCE_DIR, 'llms.txt');
    const payloadFacts = `- Payload access: Mission 01 has ${payloadConfig.total_capacity_kg} kg total capacity, ${payloadConfig.confirmed_capacity_kg} kg confirmed and ${payloadConfig.available_capacity_kg} kg available. Entry pricing is $${payloadConfig.entry_price_per_kg_usd.toLocaleString('en-US')}/kg for the first ${payloadConfig.entry_allocation_kg} kg; additional capacity is $${payloadConfig.additional_price_per_kg_usd.toLocaleString('en-US')}/kg, subject to technical review. Microgravity duration: ${payloadConfig.microgravity_duration_minutes} minutes. Schedule is agreed during technical review.`;
    fs.writeFileSync(llmsPath, fs.readFileSync(llmsPath, 'utf8').replace(/^- Payload access:.*$/m, payloadFacts));
    // 1. Clean and recreate dist directory
    console.log('🧹 Cleaning existing dist/ directory...');
    await fsExtra.emptyDir(DIST_DIR);
    await fsExtra.emptyDir(COMPETITION_DIST_DIR);
    await fsExtra.ensureDir(path.join(DIST_DIR, 'news'));

    // 2. CSS Purging & Minification
    console.log('✂️  Purging unused CSS and minifying...');
    const sourceCssPath = path.join(SOURCE_DIR, 'styles.css');
    const sourceCssContent = fs.readFileSync(sourceCssPath, 'utf8');

    const purgeOptions = {
      content: [
        path.join(SOURCE_DIR, '*.html'),
        path.join(SOURCE_DIR, 'news', '*.html'),
        path.join(SOURCE_DIR, 'app.js'),
        path.join(SOURCE_DIR, 'homepage-data.js')
      ],
      css: [sourceCssPath],
      safelist: {
        standard: [
          'scroll-progress-container',
          'scroll-progress-bar',
          'reveal-on-scroll',
          'revealed',
          'no-scroll',
          'is-changing',
          'active',
          'dropdown',
          'dropdown-active',
          'scrolled',
          'hero-live',
          'status-pill',
          'status-nominal',
          'status-warning',
          'status-critical',
                  ],
        deep: [/dropdown/, /status/, /reveal/, /view-transition/, /cookie/]
      }
    };
    const purgeCSSResult = await new PurgeCSS().purge(purgeOptions);

    const purgedCssContent = purgeCSSResult[0].css;
    const cleanCssResult = new CleanCSS({ level: 2 }).minify(purgedCssContent);

    if (cleanCssResult.errors.length) {
      throw new Error('CleanCSS Errors: ' + cleanCssResult.errors.join(', '));
    }

    const outputCssPath = path.join(DIST_DIR, 'styles.min.css');
    fs.writeFileSync(outputCssPath, cleanCssResult.styles);
    fs.writeFileSync(path.join(SOURCE_DIR, 'styles.min.css'), cleanCssResult.styles);

    // Starlight needs only its page styles and the shared interactive controls.
    // Scan app.js as well so navigation, forms, and injected cookie UI survive.
    const starlightCssResult = await new PurgeCSS().purge({
      ...purgeOptions,
      content: [path.join(SOURCE_DIR, 'starlight.html'), path.join(SOURCE_DIR, 'app.js')]
    });
    const starlightCss = new CleanCSS({ level: 2 }).minify(starlightCssResult[0].css);
    if (starlightCss.errors.length) throw new Error(starlightCss.errors.join(', '));
    for (const directory of [SOURCE_DIR, DIST_DIR]) {
      fs.writeFileSync(path.join(directory, 'starlight.min.css'), starlightCss.styles);
    }
    console.log(`   └─ Starlight CSS: ${(Buffer.byteLength(starlightCss.styles) / 1024).toFixed(2)} KB`);
    
    // Log CSS comparison
    const origCssSize = (Buffer.byteLength(sourceCssContent) / 1024).toFixed(2);
    const minCssSize = (Buffer.byteLength(cleanCssResult.styles) / 1024).toFixed(2);
    console.log(`   └─ styles.css: ${origCssSize} KB ➡️  styles.min.css: ${minCssSize} KB (${((1 - minCssSize / origCssSize) * 100).toFixed(1)}% reduction)`);

    // Also write a copy of styles.css just in case we need it, though all HTMLs use styles.min.css


    // 3. JS Minification
    console.log('⚡ Minifying JavaScript files...');
    const jsFiles = ['app.js', 'homepage-data.js'];
    
    for (const jsFile of jsFiles) {
      const sourceJsPath = path.join(SOURCE_DIR, jsFile);
      const sourceJsContent = fs.readFileSync(sourceJsPath, 'utf8');
      
      const minifiedJs = await minifyJs(sourceJsContent, {
        compress: true,
        mangle: true
      });

      const outputMinJsName = jsFile.replace('.js', '.min.js');
      fs.writeFileSync(path.join(DIST_DIR, outputMinJsName), minifiedJs.code);
      fs.writeFileSync(path.join(SOURCE_DIR, outputMinJsName), minifiedJs.code);


      const origJsSize = (Buffer.byteLength(sourceJsContent) / 1024).toFixed(2);
      const minJsSize = (Buffer.byteLength(minifiedJs.code) / 1024).toFixed(2);
      console.log(`   └─ ${jsFile}: ${origJsSize} KB ➡️  ${outputMinJsName}: ${minJsSize} KB`);
    }

    // Small page-specific configuration is already production-safe and is
    // loaded separately by payload.html. Keep it in dist so the deferred
    // request resolves on the deployed site.
    const payloadConfigPath = path.join(SOURCE_DIR, 'payload_config.js');
    if (fs.existsSync(payloadConfigPath)) {
      fs.copyFileSync(payloadConfigPath, path.join(DIST_DIR, 'payload_config.js'));
    }

    fs.copyFileSync(path.join(SOURCE_DIR, 'analytics.js'), path.join(DIST_DIR, 'analytics.js'));

    // 4. Copy Assets
    console.log('📂 Copying assets...');
    const sourceAssetsDir = path.join(SOURCE_DIR, 'assets');
    const destAssetsDir = path.join(DIST_DIR, 'assets');
    if (fs.existsSync(sourceAssetsDir)) {
      await fsExtra.copy(sourceAssetsDir, destAssetsDir);
      console.log('   └─ Assets directory successfully copied.');
    } else {
      console.log('   ⚠️  No assets directory found to copy.');
    }

    // 4b. Copy SEO / crawler files
    console.log('🤖 Copying SEO files (robots.txt, sitemap.xml, llms.txt)...');
    for (const seoFile of ['robots.txt', 'sitemap.xml', 'llms.txt', 'llms-full.md']) {
      const seoSrc = path.join(SOURCE_DIR, seoFile);
      if (fs.existsSync(seoSrc)) {
        fs.copyFileSync(seoSrc, path.join(DIST_DIR, seoFile));
      }
    }

    // 5. HTML Minification
    console.log('📝 Minifying HTML files...');
    const htmlMinOptions = {
      collapseWhitespace: true,
      removeComments: true,
      removeRedundantAttributes: true,
      useShortDoctype: true,
      minifyJS: true,
      minifyCSS: true
    };

    // Helper to find and minify HTMLs
    const minifyHtmlInDir = async (srcDir, destDir) => {
      const files = fs.readdirSync(srcDir);
      for (const file of files) {
        if (path.extname(file) === '.html') {
          const srcPath = path.join(srcDir, file);
          const destPath = path.join(destDir, file);
          const originalHtml = fs.readFileSync(srcPath, 'utf8').replace(
            /(app\.min\.js|styles\.min\.css|starlight\.min\.css|homepage-data\.min\.js)(?:\?v=[^"']*)?/g,
            (match, name) => `${name}?v=${require('crypto').createHash('sha256').update(fs.readFileSync(path.join(DIST_DIR, name))).digest('hex').slice(0, 12)}`
          );
          
          try {
            const minifiedHtml = await minifyHtml(originalHtml, htmlMinOptions);
            fs.writeFileSync(destPath, minifiedHtml);
            
            const origSize = Buffer.byteLength(originalHtml);
            const minSize = Buffer.byteLength(minifiedHtml);
            // console.log(`   └─ ${path.relative(SOURCE_DIR, srcPath)}: ${(origSize/1024).toFixed(2)} KB ➡️  ${(minSize/1024).toFixed(2)} KB`);
          } catch (htmlErr) {
            console.error(`❌ Failed to minify HTML ${file}:`, htmlErr);
            throw htmlErr;
          }
        }
      }
    };

    // Minify root HTMLs
    await minifyHtmlInDir(SOURCE_DIR, DIST_DIR);
    
    // Minify news HTMLs
    const newsSourceDir = path.join(SOURCE_DIR, 'news');
    const newsDestDir = path.join(DIST_DIR, 'news');
    if (fs.existsSync(newsSourceDir)) {
      await minifyHtmlInDir(newsSourceDir, newsDestDir);
    }
    console.log('   └─ All HTML files successfully minified and structured.');

    // 6. Build a self-contained root bundle for competition.elara-aerospace.com.
    // The main site's dist/ output remains unchanged; this bundle is what should
    // be uploaded as the subdomain's document root on Hetzner.
    console.log('🛰️  Preparing competition subdomain bundle...');
    await fsExtra.copy(path.join(DIST_DIR, 'assets'), path.join(COMPETITION_DIST_DIR, 'assets'));
    for (const sharedFile of ['styles.min.css', 'app.min.js', 'analytics.js']) {
      await fsExtra.copy(path.join(DIST_DIR, sharedFile), path.join(COMPETITION_DIST_DIR, sharedFile));
    }

    let competitionHtml = fs.readFileSync(path.join(DIST_DIR, 'competition.html'), 'utf8');
    competitionHtml = competitionHtml
      .replace(/href="\.\/([^"/]+\.html(?:[?#][^"]*)?)"/g, 'href="https://elara-aerospace.com/$1"')
      .replace(/https:\/\/elara-aerospace\.com\/competition\.html/g, 'https://competition.elara-aerospace.com/');
    fs.writeFileSync(path.join(COMPETITION_DIST_DIR, 'index.html'), competitionHtml);
    fs.writeFileSync(path.join(COMPETITION_DIST_DIR, 'robots.txt'), 'User-agent: *\nAllow: /\n');
    console.log(`   └─ Competition subdomain bundle: ${COMPETITION_DIST_DIR}`);

    await pruneAssets(DIST_DIR);
    await pruneAssets(COMPETITION_DIST_DIR);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n🎉 Build optimization completed successfully in ${duration}s!`);
    console.log(`📂 Production-ready site resides in: ${DIST_DIR}`);

  } catch (error) {
    console.error('❌ Build failed with error:', error);
    process.exit(1);
  }
}

build();
