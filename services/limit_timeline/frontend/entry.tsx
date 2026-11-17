import React from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import css from './index.css?inline'
import { NewDashboard } from './src/NewDashboard'

/** TSP 原生扩展页入口：把复刻看板包成 Page Pack mount 接口。
 * 主题机制与主站/tdxTSP 同源（html.dark + tf-theme + tf-theme-change），
 * Shadow DOM 内用 wrapper.dark 承载 CSS 变量，与异动信号工作台同款方案。 */
const mounted = new WeakMap<HTMLElement, Root>()

const THEME_KEY = 'tf-theme'
const THEME_EVENT = 'tf-theme-change'

function isDarkTheme(): boolean {
  let stored: string | null = null
  try { stored = localStorage.getItem(THEME_KEY) } catch { /* 隐私模式 */ }
  if (document.documentElement.classList.contains('dark')) return true
  if (stored === 'light') return false
  return true
}

function mount(host: HTMLElement): () => void {
  host.innerHTML = ''
  host.style.display = 'block'
  host.style.height = '100%'
  host.style.minHeight = '0'

  const shadow = host.shadowRoot ?? host.attachShadow({ mode: 'open' })
  shadow.innerHTML = ''
  const style = document.createElement('style')
  style.textContent = css
  shadow.appendChild(style)

  const wrapper = document.createElement('div')
  wrapper.className = 'as-root'
  wrapper.style.height = '100%'
  wrapper.style.minHeight = '0'
  shadow.appendChild(wrapper)

  const applyTheme = () => wrapper.classList.toggle('dark', isDarkTheme())
  applyTheme()
  window.addEventListener(THEME_EVENT, applyTheme)
  window.addEventListener('storage', applyTheme)
  const themeObserver = new MutationObserver(applyTheme)
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } })
  const root = createRoot(wrapper)
  root.render(
    React.createElement(QueryClientProvider, { client: queryClient },
      React.createElement(NewDashboard)
    )
  )
  mounted.set(host, root)

  return () => {
    window.removeEventListener(THEME_EVENT, applyTheme)
    window.removeEventListener('storage', applyTheme)
    themeObserver.disconnect()
    mounted.get(host)?.unmount()
    mounted.delete(host)
    shadow.innerHTML = ''
    host.innerHTML = ''
  }
}

export default {
  id: 'tsp.new-dashboard',
  apiVersion: 1,
  routes: [{ id: 'new-dashboard', path: '/custom/new-dashboard', mount }],
  navigation: [{ id: 'new-dashboard', routeId: 'new-dashboard', label: '新看板', icon: 'LayoutDashboard' }],
}
