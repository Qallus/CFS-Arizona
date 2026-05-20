#!/usr/bin/env python3
"""
Fix pass 3:
- Fix LIGHT_CSS injection guard (was tripped by THEME_INIT script text)
- Sidebar: flex-column layout so bottom bar is always visible (remove absolute)
- Sidebar: collapsible with chevron button + localStorage persistence
- Sidebar: sidebar-label class on nav spans for collapse hide/show
"""
import os, re

BASE = r'C:\Users\jwate\blueprint-landing\dashboard'

# ── Icons ──────────────────────────────────────────────────────────────────────
I = {
    'agent':      '<circle cx="12" cy="8" r="4"/><path d="M4 20a8 8 0 0116 0"/>',
    'dashboard':  '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
    'comm':       '<path d="M22 16.92V21a1 1 0 01-1.1 1 19.8 19.8 0 01-8.6-3 19.5 19.5 0 01-6-6A19.8 19.8 0 013.3 4.1 1 1 0 014.3 3H8.4l1.5 5-2 1.5a12 12 0 006 6l1.5-2 5 1.5z"/>',
    'clients':    '<circle cx="9" cy="7" r="4"/><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><path d="M22 21v-2a4 4 0 00-3-3.9"/><path d="M16 3.1a4 4 0 010 7.8"/>',
    'leads':      '<path d="M17 3h4v4"/><path d="M21 3l-7 7"/><path d="M14 21H4a1 1 0 01-1-1V10"/><path d="M3 14l7-7 4 4 7-7"/>',
    'pipeline':   '<path d="M12 1v22"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>',
    'plans':      '<path d="M3 3h7v7H3z"/><path d="M14 3h7v7h-7z"/><path d="M14 14h7v7h-7z"/><path d="M3 14h7v7H3z"/>',
    'docs':       '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/>',
    'notes':      '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4z"/>',
    'calendar':   '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    'posts':      '<path d="M3 11l18-9-9 18-2-8z"/>',
    'automation': '<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>',
    'settings':   '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l-.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"/>',
    'chat':       '<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>',
    'skills':     '<path d="M3 3h18v18H3z"/><path d="M3 9h18M9 21V9"/>',
    'mic':        '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M19 10a7 7 0 01-14 0M12 18v4M8 22h8"/>',
    'usage':      '<path d="M3 3v18h18"/><path d="M7 14l3-3 3 3 5-5"/>',
    'models':     '<circle cx="12" cy="12" r="3"/><path d="M12 1v6M12 17v6M4.2 4.2l4.3 4.3M15.5 15.5l4.3 4.3M1 12h6M17 12h6M4.2 19.8l4.3-4.3M15.5 8.5l4.3-4.3"/>',
    'sms':        '<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>',
    'email':      '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    'templates':  '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h6"/>',
    'bulk':       '<path d="M17 2h3v3M20 2l-6 6M7 22H4v-3M4 22l6-6M3 8a5 5 0 015-5M21 16a5 5 0 01-5 5"/>',
    'video':      '<rect x="2" y="6" width="14" height="12" rx="2"/><path d="M22 8l-6 4 6 4V8z"/>',
    'household':  '<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path d="M9 22V12h6v10"/>',
    'company':    '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>',
    'enrich':     '<path d="M12 2l2 4 4 .5-3 3 .5 4-3.5-2-3.5 2 .5-4-3-3 4-.5z"/>',
    'search':     '<circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>',
    'contract':   '<path d="M9 12l2 2 4-4"/><rect x="3" y="4" width="18" height="18" rx="2"/>',
    'sow':        '<path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/>',
    'finplan':    '<path d="M3 3v18h18"/><path d="M7 14l3-3 3 3 5-5"/>',
    'estate':     '<path d="M3 21h18M6 10v11M10 10v11M14 10v11M18 10v11M4 10h16L12 3 4 10z"/>',
    'compliance': '<path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/>',
    'file':       '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/>',
    'home':       '<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path d="M9 22V12h6v10"/>',
}

SECTION_TABS = {
    'agent': [
        ('agent',        'agent.html',        'Chat',             'chat'),
        ('agent-skills', 'agent-skills.html', 'Skills',           'skills'),
        ('agent-voice',  'agent-voice.html',  'Voice Agent',      'mic'),
        ('agent-usage',  'agent-usage.html',  'Usage & Analytics','usage'),
        ('agent-models', 'agent-models.html', 'Models & API',     'models'),
    ],
    'comm': [
        ('comm',          'communication.html', 'Calls',     'comm'),
        ('comm-sms',      'comm-sms.html',      'SMS',       'sms'),
        ('comm-email',    'comm-email.html',    'Email',     'email'),
        ('comm-templates','comm-templates.html','Templates', 'templates'),
        ('comm-bulk-sms', 'comm-bulk-sms.html', 'Bulk SMS',  'bulk'),
        ('comm-ai-voice', 'comm-ai-voice.html', 'AI Voice',  'mic'),
        ('comm-video',    'comm-video.html',    'Video',     'video'),
    ],
    'clients': [
        ('clients',             'contacts.html',           'Clients',    'clients'),
        ('clients-households',  'clients-households.html', 'Households', 'household'),
        ('clients-companies',   'clients-companies.html',  'Companies',  'company'),
        ('clients-enrich',      'clients-enrich.html',     'Enrich',     'enrich'),
        ('clients-scrape',      'clients-scrape.html',     'Scrape',     'search'),
    ],
    'docs': [
        ('docs',            'documents.html',       'All Files',       'file'),
        ('docs-contracts',  'docs-contracts.html',  'Contracts',       'contract'),
        ('docs-sows',       'docs-sows.html',       'SOWs',            'sow'),
        ('docs-financial',  'docs-financial.html',  'Financial Plans', 'finplan'),
        ('docs-estate',     'docs-estate.html',     'Estate Docs',     'estate'),
        ('docs-compliance', 'docs-compliance.html', 'Compliance',      'compliance'),
        ('docs-templates',  'docs-templates.html',  'Templates',       'templates'),
    ],
}

PARENT_MAP = {
    'agent-skills':'agent','agent-voice':'agent','agent-usage':'agent','agent-models':'agent',
    'comm-sms':'comm','comm-email':'comm','comm-templates':'comm',
    'comm-bulk-sms':'comm','comm-ai-voice':'comm','comm-video':'comm',
    'clients-households':'clients','clients-companies':'clients',
    'clients-enrich':'clients','clients-scrape':'clients',
    'docs-contracts':'docs','docs-sows':'docs','docs-financial':'docs',
    'docs-estate':'docs','docs-compliance':'docs','docs-templates':'docs',
}

NAV_ITEMS = [
    ('dashboard',  'dashboard.html',     'Dashboard'),
    ('agent',      'agent.html',         'Agent'),
    ('comm',       'communication.html', 'Communications'),
    ('clients',    'contacts.html',      'Clients'),
    ('leads',      'leads.html',         'Leads'),
    ('pipeline',   'pipeline.html',      'Pipeline'),
    ('plans',      'plans.html',         'Plans'),
    ('docs',       'documents.html',     'Documents'),
    ('notes',      'notes.html',         'Notes'),
    ('calendar',   'calendar.html',      'Calendar'),
    ('posts',      'posts.html',         'Posts'),
    ('automation', 'automation.html',    'Automation'),
    ('settings',   'settings.html',      'Settings'),
]

FILE_ACTIVE = {
    'home.html':              'dashboard',
    'agent.html':             'agent',
    'agent-skills.html':      'agent',
    'agent-voice.html':       'agent',
    'agent-usage.html':       'agent',
    'agent-models.html':      'agent',
    'dashboard.html':         'dashboard',
    'communication.html':     'comm',
    'comm-sms.html':          'comm',
    'comm-email.html':        'comm',
    'comm-templates.html':    'comm',
    'comm-bulk-sms.html':     'comm',
    'comm-ai-voice.html':     'comm',
    'comm-video.html':        'comm',
    'contacts.html':          'clients',
    'clients-households.html':'clients',
    'clients-companies.html': 'clients',
    'clients-enrich.html':    'clients',
    'clients-scrape.html':    'clients',
    'leads.html':             'leads',
    'pipeline.html':          'pipeline',
    'plans.html':             'plans',
    'documents.html':         'docs',
    'docs-contracts.html':    'docs',
    'docs-sows.html':         'docs',
    'docs-financial.html':    'docs',
    'docs-estate.html':       'docs',
    'docs-compliance.html':   'docs',
    'docs-templates.html':    'docs',
    'notes.html':             'notes',
    'calendar.html':          'calendar',
    'posts.html':             'posts',
    'automation.html':        'automation',
    'settings.html':          'settings',
}

# ── Theme SVGs ─────────────────────────────────────────────────────────────────
SUN_ICON  = '<svg class="theme-sun"  width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/></svg>'
MOON_ICON = '<svg class="theme-moon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none;"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>'
SUN_LG    = '<svg class="theme-sun"  width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/></svg>'
MOON_LG   = '<svg class="theme-moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none;"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>'

# ── CSS ────────────────────────────────────────────────────────────────────────
LIGHT_CSS = '''
  html[data-theme="light"] {
    --bg: #f0f4f8;
    --panel: #ffffff;
    --panel-2: #eef2f7;
    --border: #d8e0ea;
    --muted: #8896a7;
    --text: #0f172a;
    --text-dim: #5a6a7e;
  }
  html[data-theme="light"] body { background: var(--bg); }'''

# FOUC prevention — runs before page paints
THEME_INIT = '<script>(function(){var t=localStorage.getItem("sig360-theme")||"dark";document.documentElement.setAttribute("data-theme",t);}());</script>'

MAIN_JS = '''\
<script>
function toggleTheme(){
  var t=document.documentElement.getAttribute("data-theme")==="light"?"dark":"light";
  document.documentElement.setAttribute("data-theme",t);
  localStorage.setItem("sig360-theme",t);
  document.querySelectorAll(".theme-sun").forEach(function(e){e.style.display=t==="light"?"none":"";});
  document.querySelectorAll(".theme-moon").forEach(function(e){e.style.display=t==="light"?"":"none";});
}
function toggleMobileMenu(){
  var d=document.getElementById("mobile-drawer");
  var open=d.style.display==="block";
  d.style.display=open?"none":"block";
  document.body.style.overflow=open?"":"hidden";
}
function toggleSidebar(){
  var s=document.getElementById("desktop-sidebar");
  if(!s)return;
  var collapsed=s.getAttribute("data-collapsed")==="1";
  var next=collapsed?"0":"1";
  s.setAttribute("data-collapsed",next);
  localStorage.setItem("sig360-sidebar",next);
  _applySidebarState(s,next==="1");
}
function _applySidebarState(s,collapsed){
  s.style.width=collapsed?"56px":"230px";
  // Hide text/info — labels, brand name, user email
  s.querySelectorAll(".sidebar-label,.brand-text,.bottom-bar-hide").forEach(function(e){
    e.style.display=collapsed?"none":"";
  });
  // Centre nav icons when collapsed
  s.querySelectorAll(".sidebar-item").forEach(function(e){
    e.style.justifyContent=collapsed?"center":"";
    e.style.padding=collapsed?"8px 0":"";
  });
  // Centre the expand button in the footer row when collapsed
  var bar=s.querySelector(".sidebar-bottom");
  if(bar){
    bar.style.justifyContent=collapsed?"center":"";
    bar.style.padding=collapsed?"8px 0":"";
  }
  // Rotate chevron: left = expanded, right = collapsed
  s.querySelectorAll(".collapse-icon").forEach(function(e){
    e.style.transform=collapsed?"rotate(180deg)":"rotate(0deg)";
  });
}
(function(){
  var t=document.documentElement.getAttribute("data-theme")||"dark";
  document.querySelectorAll(".theme-sun").forEach(function(e){e.style.display=t==="light"?"none":"";});
  document.querySelectorAll(".theme-moon").forEach(function(e){e.style.display=t==="light"?"":"none";});
  var s=document.getElementById("desktop-sidebar");
  if(s){
    var sc=localStorage.getItem("sig360-sidebar")||"0";
    s.setAttribute("data-collapsed",sc);
    if(sc==="1")_applySidebarState(s,true);
  }
})();
</script>'''

# ── Desktop sidebar ────────────────────────────────────────────────────────────
def _nav_item_desktop(active_key, key, href, label):
    is_active = active_key == key
    cls = 'sidebar-item active' if is_active else 'sidebar-item'
    svg = f'<svg class="icon" viewBox="0 0 24 24">{I[key]}</svg>'
    # sidebar-label class lets JS hide/show the text when collapsing
    return (
        f'      <a href="{href}" class="{cls}" style="text-decoration:none;">'
        f'{svg}<span class="sidebar-label" style="white-space:nowrap;overflow:hidden;">{label}</span></a>\n'
    )

def make_desktop_sidebar(active_key):
    lines = ''
    for key, href, label in NAV_ITEMS:
        lines += _nav_item_desktop(active_key, key, href, label)

    # bottom-bar-hide items are hidden when the sidebar is collapsed so the
    # expand button (the only item without that class) stays reachable at 56px
    theme_btn = (
        '<button class="bottom-bar-hide" onclick="toggleTheme()" title="Toggle theme" '
        'style="background:none;border:none;cursor:pointer;padding:4px;color:var(--text-dim);flex-shrink:0;">'
        f'{SUN_ICON}{MOON_ICON}</button>\n'
    )
    # Chevron-left — JS rotates 180deg when collapsed so it becomes chevron-right (expand)
    collapse_btn = (
        '<button onclick="toggleSidebar()" title="Toggle sidebar" '
        'style="background:none;border:none;cursor:pointer;padding:4px;color:var(--text-dim);flex-shrink:0;">'
        '<svg class="collapse-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
        'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transition:transform 0.2s ease;">'
        '<path d="M15 18l-6-6 6-6"/></svg></button>\n'
    )

    return (
        '  <aside id="desktop-sidebar" class="shrink-0 border-r hidden md:flex md:flex-col" '
        'style="width:230px;border-color:var(--border);background:var(--panel);flex-shrink:0;'
        'position:sticky;top:0;height:100vh;transition:width 0.2s ease;overflow:hidden;">\n'

        '    <div class="px-4 py-4 border-b flex items-center gap-3" '
        'style="border-color:var(--border);flex-shrink:0;min-height:64px;">\n'
        '      <div class="w-9 h-9 rounded-lg flex items-center justify-center" '
        'style="background:linear-gradient(135deg,#3b82f6 0%,#0ea5e9 100%);flex-shrink:0;">\n'
        '        <svg class="icon-lg" viewBox="0 0 24 24" style="stroke:white;">'
        '<path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/></svg>\n'
        '      </div>\n'
        '      <div class="brand-text" style="overflow:hidden;min-width:0;">\n'
        '        <div class="font-bold text-[15px] leading-none whitespace-nowrap">SIG360</div>\n'
        '        <div class="flex items-center gap-1.5 mt-1.5">\n'
        '          <span class="w-1.5 h-1.5 rounded-full flex-shrink-0" style="background:var(--green);"></span>\n'
        '          <span class="text-[11px] whitespace-nowrap" style="color:var(--text-dim);">Connected</span>\n'
        '        </div>\n'
        '      </div>\n'
        '    </div>\n'

        '    <nav style="flex:1;overflow-y:auto;padding:6px 0;">\n'
        + lines +
        '    </nav>\n'

        # sidebar-bottom: flex container for the footer row
        # In collapsed state JS sets justify-content:center and hides .bottom-bar-hide items
        # leaving only the expand chevron visible and centered in the 56px column
        '    <div class="sidebar-bottom border-t flex items-center gap-2 px-3 py-3" '
        'style="border-color:var(--border);background:var(--panel);flex-shrink:0;">\n'
        '      <div class="bottom-bar-hide w-7 h-7 rounded-full flex items-center justify-center '
        'text-[11px] font-semibold" style="background:var(--accent);flex-shrink:0;">JW</div>\n'
        '      <div class="user-info bottom-bar-hide flex-1 min-w-0" style="overflow:hidden;">'
        '<div class="text-[11.5px] truncate" style="color:var(--text-dim);">jeremy@sig360.com</div></div>\n'
        + theme_btn
        + collapse_btn +
        '    </div>\n'
        '  </aside>'
    )


# ── Mobile drawer ──────────────────────────────────────────────────────────────
def _mob_item(active_key, key, href, label):
    is_active = active_key == key
    base = 'display:flex;align-items:center;gap:10px;padding:9px 16px;font-size:13.5px;text-decoration:none;border-left:3px solid transparent;'
    style = base + ('color:var(--text);background:rgba(59,130,246,0.1);border-left-color:var(--accent);' if is_active else 'color:var(--text-dim);')
    svg = f'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">{I[key]}</svg>'
    return f'      <a href="{href}" style="{style}">{svg}<span>{label}</span></a>\n'

def make_mobile_drawer(active_key):
    items = ''
    for key, href, label in NAV_ITEMS:
        items += _mob_item(active_key, key, href, label)

    theme_btn = (
        '      <button onclick="toggleTheme()" title="Toggle theme" '
        'style="background:none;border:none;cursor:pointer;color:var(--text-dim);padding:4px;">'
        f'{SUN_LG}{MOON_LG}</button>\n'
    )

    return (
        '<div id="mobile-drawer" style="display:none;position:fixed;inset:0;z-index:50;">\n'
        '  <div onclick="toggleMobileMenu()" style="position:absolute;inset:0;background:rgba(0,0,0,0.55);backdrop-filter:blur(2px);"></div>\n'
        '  <aside style="position:absolute;left:0;top:0;bottom:0;width:280px;display:flex;flex-direction:column;'
        'overflow:hidden;background:var(--panel);border-right:1px solid var(--border);">\n'
        '    <div style="padding:16px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:12px;">\n'
        '      <div style="width:36px;height:36px;border-radius:8px;display:flex;align-items:center;justify-content:center;'
        'background:linear-gradient(135deg,#3b82f6,#0ea5e9);flex-shrink:0;">\n'
        '        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" '
        'stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/></svg>\n'
        '      </div>\n'
        '      <div style="flex:1;">\n'
        '        <div style="font-weight:700;font-size:15px;line-height:1;color:var(--text);">SIG360</div>\n'
        '        <div style="display:flex;align-items:center;gap:6px;margin-top:6px;">\n'
        '          <span style="width:6px;height:6px;border-radius:50%;background:var(--green);display:inline-block;"></span>\n'
        '          <span style="font-size:11px;color:var(--text-dim);">Connected</span>\n'
        '        </div>\n'
        '      </div>\n'
        '      <button onclick="toggleMobileMenu()" style="background:none;border:none;cursor:pointer;color:var(--text-dim);padding:4px;">\n'
        '        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" '
        'stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>\n'
        '      </button>\n'
        '    </div>\n'
        '    <nav style="flex:1;padding:6px 0;overflow-y:auto;">\n'
        + items +
        '    </nav>\n'
        '    <div style="border-top:1px solid var(--border);padding:12px 14px;display:flex;align-items:center;gap:8px;">\n'
        '      <div style="width:28px;height:28px;border-radius:50%;background:var(--accent);display:flex;align-items:center;'
        'justify-content:center;font-size:11px;font-weight:600;color:#fff;flex-shrink:0;">JW</div>\n'
        '      <div style="flex:1;min-width:0;"><div style="font-size:11.5px;overflow:hidden;white-space:nowrap;'
        'text-overflow:ellipsis;color:var(--text-dim);">jeremy@sig360.com</div></div>\n'
        + theme_btn +
        '    </div>\n'
        '  </aside>\n'
        '</div>'
    )


# Mobile topbar: display:flex is a Tailwind class so md:hidden can override it
MOBILE_TOPBAR = (
    '<div class="md:hidden flex items-center justify-between" '
    'style="position:fixed;top:0;left:0;right:0;height:56px;padding:0 16px;z-index:40;'
    'background:var(--panel);border-bottom:1px solid var(--border);">\n'
    '  <button onclick="toggleMobileMenu()" '
    'style="background:none;border:none;cursor:pointer;color:var(--text-dim);padding:4px;" aria-label="Menu">\n'
    '    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" '
    'stroke-linecap="round" stroke-linejoin="round">'
    '<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/>'
    '<line x1="3" y1="18" x2="21" y2="18"/></svg>\n'
    '  </button>\n'
    '  <div style="display:flex;align-items:center;gap:8px;">\n'
    '    <div style="width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;'
    'background:linear-gradient(135deg,#3b82f6,#0ea5e9);">\n'
    '      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" '
    'stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/></svg>\n'
    '    </div>\n'
    '    <span style="font-weight:700;font-size:15px;color:var(--text);">SIG360</span>\n'
    '  </div>\n'
    '  <button onclick="toggleTheme()" '
    'style="background:none;border:none;cursor:pointer;color:var(--text-dim);padding:4px;" aria-label="Toggle theme">\n'
    f'    {SUN_LG}{MOON_LG}\n'
    '  </button>\n'
    '</div>'
)

# ── Common CSS for placeholder pages ──────────────────────────────────────────
COMMON_STYLE = '''\
  :root {
    --bg: #0a0d12; --panel: #11161d; --panel-2: #151b23; --border: #1f2833;
    --muted: #6b7a8e; --text: #e6edf5; --text-dim: #9aa7b8;
    --accent: #3b82f6; --accent-2: #0ea5e9; --gold: #d4a84b;
    --green: #10b981; --red: #ef4444; --amber: #f59e0b; --purple: #8b5cf6;
    --phase1: #10b981; --phase2: #f59e0b; --phase3: #3b82f6;
  }
  html[data-theme="light"] {
    --bg: #f0f4f8; --panel: #ffffff; --panel-2: #eef2f7; --border: #d8e0ea;
    --muted: #8896a7; --text: #0f172a; --text-dim: #5a6a7e;
  }
  html[data-theme="light"] body { background: var(--bg); }
  * { font-family: 'Inter', system-ui, sans-serif; }
  body { background: var(--bg); color: var(--text); margin: 0; }
  .panel { background: var(--panel); border: 1px solid var(--border); border-radius: 12px; }
  .panel-inner { background: var(--panel-2); border: 1px solid var(--border); border-radius: 10px; }
  .sidebar-item { display: flex; align-items: center; gap: 10px; padding: 8px 14px; color: var(--text-dim); font-size: 13.5px; border-left: 2px solid transparent; text-decoration: none; }
  .sidebar-item:hover { color: var(--text); background: rgba(59,130,246,0.06); }
  .sidebar-item.active { color: var(--text); background: rgba(59,130,246,0.1); border-left-color: var(--accent); }
  .tab { padding: 7px 14px; border-radius: 8px; font-size: 13px; color: var(--text-dim); display: flex; align-items: center; gap: 7px; cursor: pointer; border: 1px solid transparent; text-decoration: none; }
  .tab:hover { color: var(--text); background: rgba(59,130,246,0.06); }
  .tab.active { background: var(--panel-2); color: var(--text); border-color: var(--border); }
  svg.icon { width: 14px; height: 14px; stroke-width: 2; stroke: currentColor; fill: none; stroke-linecap: round; stroke-linejoin: round; }
  svg.icon-sm { width: 12px; height: 12px; stroke-width: 2; stroke: currentColor; fill: none; stroke-linecap: round; stroke-linejoin: round; }
  svg.icon-lg { width: 18px; height: 18px; stroke-width: 2; stroke: currentColor; fill: none; stroke-linecap: round; stroke-linejoin: round; }
  svg.icon-xl { width: 42px; height: 42px; stroke-width: 1.5; stroke: currentColor; fill: none; stroke-linecap: round; stroke-linejoin: round; }'''

# ── Placeholder pages ──────────────────────────────────────────────────────────
PLACEHOLDER_CONFIG = {
    'home.html':              ('Dashboard',                 None,       None),
    'notes.html':             ('Notes',                     None,       None),
    'posts.html':             ('Posts',                     None,       None),
    'automation.html':        ('Automation',                None,       None),
    'settings.html':          ('Settings',                  None,       None),
    'agent-skills.html':      ('Agent',    'agent',   'agent-skills'),
    'agent-voice.html':       ('Agent',    'agent',   'agent-voice'),
    'agent-usage.html':       ('Agent',    'agent',   'agent-usage'),
    'agent-models.html':      ('Agent',    'agent',   'agent-models'),
    'comm-sms.html':          ('Communications', 'comm', 'comm-sms'),
    'comm-email.html':        ('Communications', 'comm', 'comm-email'),
    'comm-templates.html':    ('Communications', 'comm', 'comm-templates'),
    'comm-bulk-sms.html':     ('Communications', 'comm', 'comm-bulk-sms'),
    'comm-ai-voice.html':     ('Communications', 'comm', 'comm-ai-voice'),
    'comm-video.html':        ('Communications', 'comm', 'comm-video'),
    'clients-households.html':('Clients', 'clients', 'clients-households'),
    'clients-companies.html': ('Clients', 'clients', 'clients-companies'),
    'clients-enrich.html':    ('Clients', 'clients', 'clients-enrich'),
    'clients-scrape.html':    ('Clients', 'clients', 'clients-scrape'),
    'docs-contracts.html':    ('Documents', 'docs', 'docs-contracts'),
    'docs-sows.html':         ('Documents', 'docs', 'docs-sows'),
    'docs-financial.html':    ('Documents', 'docs', 'docs-financial'),
    'docs-estate.html':       ('Documents', 'docs', 'docs-estate'),
    'docs-compliance.html':   ('Documents', 'docs', 'docs-compliance'),
    'docs-templates.html':    ('Documents', 'docs', 'docs-templates'),
}

def get_tab_label(section, tab_key):
    for tk, _, label, _ in SECTION_TABS[section]:
        if tk == tab_key:
            return label
    return ''

def make_tab_bar(section, active_tab_key):
    parts = []
    for tab_key, href, label, icon_key in SECTION_TABS[section]:
        cls = 'tab active' if tab_key == active_tab_key else 'tab'
        svg = f'<svg class="icon" viewBox="0 0 24 24">{I[icon_key]}</svg>'
        parts.append(f'      <a href="{href}" class="{cls}" style="text-decoration:none;">{svg}{label}</a>')
    return '\n'.join(parts)

def make_placeholder_page(filename):
    title, section, tab_key = PLACEHOLDER_CONFIG[filename]
    active_sidebar = FILE_ACTIVE[filename]
    desktop_aside = make_desktop_sidebar(active_sidebar)
    mobile_drawer = make_mobile_drawer(active_sidebar)

    icon_key = active_sidebar if active_sidebar in I else 'home'
    icon_svg_lg = f'<svg class="icon-lg" viewBox="0 0 24 24" style="color:var(--accent);">{I[icon_key]}</svg>'
    icon_svg_xl = f'<svg class="icon-xl" viewBox="0 0 24 24" style="color:var(--text-dim);">{I[icon_key]}</svg>'

    if section:
        tab_label = get_tab_label(section, tab_key)
        tab_bar = make_tab_bar(section, tab_key)
        for tk, _, _, ik in SECTION_TABS[section]:
            if tk == tab_key:
                icon_svg_xl = f'<svg class="icon-xl" viewBox="0 0 24 24" style="color:var(--text-dim);">{I[ik]}</svg>'
                break
        content = f'''  <main class="flex-1 overflow-x-hidden" style="padding:1.5rem;">
    <div class="flex items-start justify-between mb-5">
      <div>
        <div class="flex items-center gap-2">{icon_svg_lg}<h1 class="text-2xl font-bold">{title}</h1></div>
        <p class="text-[13px] mt-1" style="color:var(--text-dim);">{tab_label}</p>
      </div>
    </div>
    <div class="flex items-center gap-1 mb-5" style="overflow-x:auto;padding-bottom:4px;">
{tab_bar}
    </div>
    <div class="panel flex flex-col items-center justify-center text-center" style="min-height:400px;">
      {icon_svg_xl}
      <h2 class="text-[18px] font-semibold mt-5 mb-2">{tab_label}</h2>
      <p class="text-[13px]" style="color:var(--text-dim);">This section is under development.</p>
    </div>
  </main>'''
    else:
        content = f'''  <main class="flex-1 overflow-x-hidden" style="padding:1.5rem;">
    <div class="flex items-center gap-2 mb-6">{icon_svg_lg}<h1 class="text-2xl font-bold">{title}</h1></div>
    <div class="panel flex flex-col items-center justify-center text-center" style="min-height:420px;">
      {icon_svg_xl}
      <h2 class="text-[18px] font-semibold mt-5 mb-2">{title}</h2>
      <p class="text-[13px]" style="color:var(--text-dim);">This section is under development.</p>
    </div>
  </main>'''

    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>SIG360 — {title}</title>
{THEME_INIT}
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
{COMMON_STYLE}
</style>
</head>
<body>
{MOBILE_TOPBAR}

{mobile_drawer}

<div class="flex min-h-screen pt-14 md:pt-0">

{desktop_aside}

{content}

</div>
{MAIN_JS}
</body>
</html>'''

# ── Process existing pages ─────────────────────────────────────────────────────
# Targets ONLY the desktop sidebar aside ('hidden md:flex' or 'hidden md:block' in class attribute).
# The mobile drawer's aside has 'overflow:hidden' (not 'hidden md:') so it's never matched.
aside_re   = re.compile(r'<aside\b[^>]*?hidden md:[^"]*[^>]*>.*?</aside>', re.DOTALL)
style_re   = re.compile(r'(</style>)', re.IGNORECASE)
head_re    = re.compile(r'(</head>)', re.IGNORECASE)
body_re    = re.compile(r'(<body[^>]*>\s*)(<div\b[^>]*\bflex\b[^>]*\bmin-h-screen\b[^>]*>)', re.DOTALL)
bodyscr_re = re.compile(r'(</body>)', re.IGNORECASE)

EXISTING = [
    'dashboard.html', 'agent.html', 'communication.html', 'contacts.html',
    'leads.html', 'pipeline.html', 'plans.html', 'documents.html', 'calendar.html',
]

updated = []
for filename in EXISTING:
    path = os.path.join(BASE, filename)
    active_key = FILE_ACTIVE[filename]
    with open(path, 'r', encoding='utf-8') as f:
        html = f.read()

    # 1. THEME_INIT in <head>
    if THEME_INIT not in html:
        html = head_re.sub(THEME_INIT + r'\n\1', html, count=1)

    # 2. Light-mode CSS — guard checks for the actual CSS rule, NOT just the string "data-theme"
    #    (the old guard was tripped by THEME_INIT's script text containing "data-theme")
    if 'html[data-theme="light"]' not in html:
        html = style_re.sub(LIGHT_CSS + r'\n\1', html, count=1)

    # 3. Replace desktop sidebar (always regenerate — updates nav order, icons, collapse feature)
    new_aside = make_desktop_sidebar(active_key)
    html = aside_re.sub(new_aside, html, count=1)

    # 4. Mobile topbar + drawer
    if 'mobile-drawer' not in html:
        mob_drawer = make_mobile_drawer(active_key)
        def inject_mobile(m):
            body_open = m.group(1)
            flex_open = m.group(2)
            new_flex = flex_open.replace('class="flex min-h-screen"', 'class="flex min-h-screen pt-14 md:pt-0"')
            return body_open + MOBILE_TOPBAR + '\n\n' + mob_drawer + '\n\n' + new_flex
        html = body_re.sub(inject_mobile, html, count=1)
    else:
        # Regenerate mobile drawer (updates nav order/icons)
        old_drawer_re = re.compile(
            r'<div id="mobile-drawer".*?</div>\s*(?=\n*<div\b[^>]*\bflex\b[^>]*\bmin-h-screen\b)',
            re.DOTALL
        )
        mob_drawer = make_mobile_drawer(active_key)
        html = old_drawer_re.sub(mob_drawer + '\n\n', html, count=1)

        # Regenerate mobile topbar (fixes display:flex inline style issue)
        old_topbar_re = re.compile(
            r'<div class="md:hidden[^"]*"[^>]*>.*?</div>\s*(?=\n*<div id="mobile-drawer")',
            re.DOTALL
        )
        html = old_topbar_re.sub(MOBILE_TOPBAR + '\n\n', html, count=1)

    # 5. Fix flex container: ensure responsive top-padding Tailwind classes
    html = html.replace(
        'class="flex min-h-screen" style="padding-top:56px;"',
        'class="flex min-h-screen pt-14 md:pt-0"'
    )

    # 6. Inject MAIN_JS — guard checks for the function definition, not a mere reference
    if 'function toggleTheme' not in html:
        html = bodyscr_re.sub(MAIN_JS + '\n\\1', html, count=1)
    else:
        # Replace the existing script block with the updated one (adds toggleSidebar)
        old_js_re = re.compile(r'<script>\s*function toggleTheme.*?</script>', re.DOTALL)
        html = old_js_re.sub(MAIN_JS, html, count=1)

    with open(path, 'w', encoding='utf-8') as f:
        f.write(html)
    updated.append(filename)

print(f'Updated existing pages ({len(updated)}): {", ".join(updated)}')

# ── Regenerate placeholder pages ──────────────────────────────────────────────
created = []
for filename in PLACEHOLDER_CONFIG:
    path = os.path.join(BASE, filename)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(make_placeholder_page(filename))
    created.append(filename)

print(f'Regenerated placeholders ({len(created)}): {", ".join(created)}')
print('Done.')
