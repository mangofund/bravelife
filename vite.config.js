import { defineConfig } from 'vite'
import { readFileSync } from 'node:fs'
import uni from '@dcloudio/vite-plugin-uni'
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    uni(),
    {
      name: 'bravelife-search-pages',
      generateBundle() {
        for (const fileName of ['guide.html', 'robots.txt', 'sitemap.xml']) {
          this.emitFile({ type: 'asset', fileName, source: readFileSync(new URL('./public/' + fileName, import.meta.url), 'utf8') })
        }
      },
    },
  ],
})
