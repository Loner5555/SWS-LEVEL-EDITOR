/**
 * SWS Level Studio v5 — Level Composer
 * Context-aware palette, deep hierarchy, Unity-style inspectors, resizable splitter
 */
const App = {
    selectedEventIdx: -1,
    selectedActionIdx: -1,
    selectedTriggerIdx: -1,
    _paletteTab: 'Units',
    _contextCategory: null,
    _gridSize: 'medium',
    _autoSaveTimer: null,
    _clipboard: null,

    async init() {
        this.bindToolbar();
        this.bindKeyboard();
        this.initSplitter();
        document.addEventListener('click', () => { document.querySelector('#context-menu').style.display='none'; document.querySelectorAll('.item-menu-dropdown,.action-dropdown').forEach(m=>m.remove()); });
        this.log('SWS Level Studio v5', 'info');
        try {
            await IDBCache.open();
            // 1. Try load from IndexedDB cache first
            if (await MetadataDB.loadFromCache()) {
                this.log(`Metadata (cache): ${MetadataDB.size()} entries`, 'info');
                this.updateMetadataBanner();
                this.renderPalette();
            } else {
                // 2. If no cache, try local/metadata.json
                await this.autoLoadLocal();
            }
            const ws = await IDBCache.loadWorkspace();
            if (ws?.theme) document.documentElement.setAttribute('data-theme', ws.theme);
            if (ws?.gridSize) this._gridSize = ws.gridSize;
        } catch(e) { console.warn('Init error:', e); }
        this._autoSaveTimer = setInterval(() => { if(LevelParser.isLoaded()&&LevelParser.isDirty()) LevelParser.autoSave().catch(()=>{}); }, 60000);
    },

    // ─── AUTO-LOAD from local/ folder ───
    async autoLoadLocal() {
        // Try metadata.json first
        try {
            const res = await fetch('local/metadata.json');
            if (res.ok) {
                const json = await res.json();
                MetadataDB._ingest(json);
                MetadataDB._loaded = true;
                await MetadataDB.saveToCache();
                this.log(`✅ Auto-loaded: local/metadata.json (${MetadataDB.size()} entries)`, 'info');
                this.updateMetadataBanner();
                this.renderPalette();
                return;
            }
        } catch(e) { /* fetch failed — file:// or not found */ }
        // Try AssetResources.asset for auto-build
        try {
            const res = await fetch('local/AssetResources.asset');
            if (res.ok) {
                const text = await res.text();
                MetadataDB.buildFromAssetResources(text);
                await MetadataDB.saveToCache();
                this.log(`✅ Auto-built from local/AssetResources.asset → ${MetadataDB.size()} entries`, 'info');
                this.updateMetadataBanner();
                this.renderPalette();
                return;
            }
        } catch(e) { /* not found */ }
        this.log('💡 Tip: Place metadata.json or AssetResources.asset in local/ folder for auto-load', 'info');
    },

    // ─── EXPORT METADATA ───
    exportMetadata() {
        if (!MetadataDB.isLoaded()) { this.log('No metadata to export', 'warning'); return; }
        const obj = Object.fromEntries(MetadataDB._db);
        const json = JSON.stringify(obj, null, 2);
        const blob = new Blob([json], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'metadata.json';
        a.click();
        URL.revokeObjectURL(url);
        this.log(`💾 Exported metadata.json (${MetadataDB.size()} entries) — save to local/ folder`, 'info');
    },

    // ─── TOOLBAR ───
    bindToolbar() {
        const $=s=>document.querySelector(s);
        $('#btn-open')?.addEventListener('click',()=>$('#file-input-level').click());
        $('#file-input-level')?.addEventListener('change',e=>this.openLevel(e));
        $('#btn-import-metadata')?.addEventListener('click',()=>$('#file-input-metadata').click());
        $('#file-input-metadata')?.addEventListener('change',e=>this.loadMetadata(e));
        $('#btn-build-metadata')?.addEventListener('click',()=>$('#file-input-asset-resources').click());
        $('#btn-export-metadata')?.addEventListener('click',()=>this.exportMetadata());
        $('#file-input-asset-resources')?.addEventListener('change',e=>this.buildMetadataFromFiles(e));
        $('#btn-save')?.addEventListener('click',()=>this.saveLevel());
        $('#btn-new')?.addEventListener('click',()=>this.createNewLevel());
        $('#btn-duplicate')?.addEventListener('click',()=>this.duplicateLevel());
        $('#btn-validate')?.addEventListener('click',()=>this.runValidation());
        $('#btn-undo')?.addEventListener('click',()=>{if(LevelParser.undo())this.refreshAll();});
        $('#btn-redo')?.addEventListener('click',()=>{if(LevelParser.redo())this.refreshAll();});
        $('#btn-add-event')?.addEventListener('click',()=>this.addEvent());
        $('#btn-clear-logs')?.addEventListener('click',()=>{$('#log-container').innerHTML='';});
        $('#btn-theme-toggle')?.addEventListener('click',()=>{const t=document.documentElement.getAttribute('data-theme');const n=t==='dark'?'light':'dark';document.documentElement.setAttribute('data-theme',n);IDBCache.saveWorkspace({theme:n,gridSize:this._gridSize}).catch(()=>{});});
        $('#btn-integrity-test')?.addEventListener('click',()=>this.runIntegrityTest());
        $('#unit-search')?.addEventListener('input',e=>this.renderPalette(e.target.value));
        // Grid size
        document.querySelectorAll('.grid-size-btn').forEach(btn=>{btn.addEventListener('click',()=>{this._gridSize=btn.dataset.size;document.querySelectorAll('.grid-size-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');this.renderPalette();IDBCache.saveWorkspace({gridSize:this._gridSize}).catch(()=>{});});});
    },

    bindKeyboard() {
        document.addEventListener('keydown', e => {
            if(e.ctrlKey&&e.key==='o'){e.preventDefault();document.querySelector('#file-input-level').click();}
            if(e.ctrlKey&&e.key==='s'){e.preventDefault();this.saveLevel();}
            if(e.ctrlKey&&e.key==='n'){e.preventDefault();this.createNewLevel();}
            if(e.ctrlKey&&e.key==='z'){e.preventDefault();if(LevelParser.undo())this.refreshAll();}
            if(e.ctrlKey&&e.key==='y'){e.preventDefault();if(LevelParser.redo())this.refreshAll();}
            if(e.ctrlKey&&e.key==='p'){e.preventDefault();this.openGlobalSearch();}
            if(e.key==='Delete'&&this.selectedEventIdx>=0&&this.selectedActionIdx<0&&this.selectedTriggerIdx<0)this.deleteEvent(this.selectedEventIdx);
        });
    },

    // ─── RESIZABLE SPLITTER ───
    initSplitter() {
        const splitter = document.querySelector('#center-splitter');
        if (!splitter) return;
        let startY, startTop, startBottom;
        const timeline = document.querySelector('.timeline-area');
        const paletteArea = document.querySelector('.palette-area');
        splitter.addEventListener('mousedown', e => {
            e.preventDefault();
            startY = e.clientY;
            startTop = timeline.offsetHeight;
            startBottom = paletteArea.offsetHeight;
            const onMove = ev => {
                const dy = ev.clientY - startY;
                const newTop = Math.max(80, Math.min(startTop + dy, startTop + startBottom - 120));
                const newBot = startTop + startBottom - newTop;
                timeline.style.flex = `0 0 ${newTop}px`;
                paletteArea.style.flex = `0 0 ${newBot}px`;
            };
            const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        });
    },

    updateMetadataBanner() {
        const b = document.querySelector('#metadata-banner');
        if (!b) return;
        b.className = MetadataDB.isLoaded() ? 'metadata-banner loaded' : 'metadata-banner empty';
        b.textContent = MetadataDB.isLoaded() ? `📋 ${MetadataDB.size()}` : '⚠ No metadata';
    },

    // ─── FILE OPS ───
    async openLevel(e) {
        const f=e.target.files[0]; if(!f)return;
        const t=await f.text();
        if(LevelParser.load(t,f.name)){document.querySelector('#current-file-name').textContent=f.name;this.log(`Loaded: ${f.name} (${(t.length/1024).toFixed(1)}KB)`,'info');this.refreshAll();}
        else this.log(`Parse failed: ${f.name}`,'error');
        e.target.value='';
    },
    async loadMetadata(e) {
        const f=e.target.files[0]; if(!f)return;
        try{await MetadataDB.loadFromFile(f);await MetadataDB.saveToCache();this.log(`Metadata: ${MetadataDB.size()} entries`,'info');this.updateMetadataBanner();this.refreshAll();this.renderPalette();}catch(err){this.log(`Error: ${err.message}`,'error');}
        e.target.value='';
    },
    async buildMetadataFromFiles(e) {
        const files=e.target.files; if(!files?.length)return;
        this.log(`Scanning ${files.length} files...`,'info');
        let ar=0,as=0;
        for(const f of files){try{const t=await f.text();if(f.name==='AssetResources.asset'||f.name.includes('AssetResources')){MetadataDB.buildFromAssetResources(t);ar++;}else if(f.name.endsWith('.asset')&&t.includes('Identifier:')){const rp=f.webkitRelativePath||f.name;if(typeof MetadataDB.enrichFromGenericAsset==='function')MetadataDB.enrichFromGenericAsset(t,rp);else MetadataDB.enrichFromSlottable(t);as++;}}catch(err){}}
        await MetadataDB.saveToCache();
        this.log(`Built: ${ar} AssetResources + ${as} assets → ${MetadataDB.size()} entries`,'info');
        this.updateMetadataBanner();this.refreshAll();this.renderPalette();e.target.value='';
        // Auto-export metadata.json
        if (MetadataDB.size() > 0) {
            this.exportMetadata();
            this.log('💡 Save metadata.json vào thư mục local/ để tự load lần sau', 'info');
        }
    },
    saveLevel() {
        if(!LevelParser.isLoaded()){this.log('No level','warning');return;}
        const json=LevelParser.serialize();
        const blob=new Blob([json],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=LevelParser.getFileName();a.click();URL.revokeObjectURL(url);
        try{const rp=(typeof safeParse==='function')?safeParse(json):JSON.parse(json);const ok=LevelParser.countKeys();const sk=this._countKeys(rp);
        this.log(ok===sk?`✅ Saved: ${LevelParser.getFileName()} (${ok} keys verified)`:`⚠ Key mismatch: ${ok}→${sk}`,'info');}catch(e){this.log(`Saved: ${LevelParser.getFileName()}`,'info');}
    },
    createNewLevel(){const n=prompt('Level name:','New_Level');if(!n)return;LevelParser.createBlank(n);document.querySelector('#current-file-name').textContent=LevelParser.getFileName();this.log(`Created: ${n}`,'info');this.refreshAll();},
    duplicateLevel(){if(!LevelParser.isLoaded())return;const n=prompt('Name:',LevelParser.getName()+'_copy');if(!n)return;LevelParser.duplicate(n);document.querySelector('#current-file-name').textContent=LevelParser.getFileName();this.refreshAll();},
    runIntegrityTest(){if(!LevelParser.isLoaded())return;const ok=LevelParser.countKeys();const json=LevelParser.serialize();const rp=(typeof safeParse==='function')?safeParse(json):JSON.parse(json);const sk=this._countKeys(rp);this.log(ok===sk?`✅ Integrity: ${ok} keys`:`❌ ${ok}→${sk}`,'info');},
    _countKeys(o){let c=0;if(o&&typeof o==='object')for(const k of Object.keys(o)){c++;c+=this._countKeys(o[k]);}return c;},
    refreshAll(){this.renderHierarchy();this.renderTimeline();if(MetadataDB.isLoaded())this.renderPalette();},

    // ═══════════════════════════════════════════
    //  HIERARCHY — Deep tree with triggers/actions
    // ═══════════════════════════════════════════
    renderHierarchy() {
        const c=document.querySelector('#hierarchy-tree');c.innerHTML='';
        if(!LevelParser.isLoaded()){c.innerHTML='<div class="empty-state">No level loaded</div>';return;}
        const d=LevelParser.getData(),s=d.Settings;
        const root=this._ts('📄 '+(d.m_Name||'Level'),'root',true);c.appendChild(root.el);
        root.ch.appendChild(this._tl('⚙ Settings',()=>this.inspectSettings()));
        root.ch.appendChild(this._tl('🎮 Game Features',()=>this.inspectObject(s.GameFeatures,'Settings.GameFeatures','🎮 Game Features')));
        // Teams
        [['left','LeftTeams','🟦'],['right','RightTeams','🟥']].forEach(([side,key,icon])=>{
            const teams=s[key]?.Array||[];
            const tn=this._ts(`${icon} ${key} (${teams.length})`,key);
            teams.forEach((t,i)=>tn.ch.appendChild(this._tl(`👥 ${t.TeamName||'Team '+i}`,()=>this.inspectTeam(side,i))));
            root.ch.appendChild(tn.el);
        });
        // Events — DEEP TREE
        const events=LevelParser.getEvents();
        const evN=this._ts(`⚡ Events (${events.length})`,'events',true);
        events.forEach((evt,ei)=>{
            const tt=Schema.getEventTriggerTime(evt);
            const tl=tt>=0?`@${tt.toFixed(0)}s`:'⚡';
            const summary=Schema.getEventSummary(evt);
            const evNode=this._ts(`[${ei}] ${tl} ${summary}`,`ev${ei}`,ei===this.selectedEventIdx);
            // Click event header → show event overview
            evNode.el.querySelector('.tree-node-header').addEventListener('click',e=>{e.stopPropagation();evNode.el.classList.toggle('expanded');this.selectedEventIdx=ei;this.selectedActionIdx=-1;this.selectedTriggerIdx=-1;this.inspectEventOverview(ei);this.renderTimeline();});
            evNode.el.querySelector('.tree-node-header').addEventListener('contextmenu',e=>{e.preventDefault();this.showEventContextMenu(e,ei);});
            // Triggers as children
            (evt.Triggers?.Array||[]).forEach((trig,ti)=>{
                const tt=Schema.TRIGGER_TYPES[trig.EventTriggerType];
                const leaf=this._tl(`🔔 ${tt?tt.label:'Trigger '+trig.EventTriggerType}`,()=>{this.selectedEventIdx=ei;this.selectedTriggerIdx=ti;this.selectedActionIdx=-1;this.inspectTrigger(ei,ti);});
                evNode.ch.appendChild(leaf);
            });
            // Actions as children
            (evt.Actions?.Array||[]).forEach((act,ai)=>{
                const at=Schema.ACTION_TYPES[act.ActionType];
                let label=at?at.label:'Action '+act.ActionType;
                if(act.ActionType===0&&act.SpawnUnits){const units=act.SpawnUnits.Units?.Array||[];if(units.length)label+=': '+units.map(u=>`${u.Number||1}×${MetadataDB.resolveWithFallback(u.AssetRefSlottableSpec?.Id?.Value||0)}`).join(', ');}
                const leaf=this._tl(`🎬 ${label}`,()=>{this.selectedEventIdx=ei;this.selectedActionIdx=ai;this.selectedTriggerIdx=-1;this.inspectAction(ei,ai);this.setContextForAction(act.ActionType);});
                leaf.style.borderLeft=`2px solid ${at?.color||'#666'}`;
                leaf.addEventListener('contextmenu',e=>{e.preventDefault();this.showActionContextMenu(e,ei,ai);});
                evNode.ch.appendChild(leaf);
            });
            evN.ch.appendChild(evNode.el);
        });
        root.ch.appendChild(evN.el);
        // Root extras
        const rx=Object.keys(d).filter(k=>!['m_GameObject','m_Enabled','m_Script','m_Name','Settings'].includes(k));
        if(rx.length){const rxN=this._ts(`📦 Root (${rx.length})`,'rx');rx.forEach(k=>rxN.ch.appendChild(this._tl(`📎 ${k}`,()=>this.inspectObject(d[k],k,k))));root.ch.appendChild(rxN.el);}
    },

    _ts(label,id,expanded=false){const n=document.createElement('div');n.className='tree-node'+(expanded?' expanded':'');const h=document.createElement('div');h.className='tree-node-header';h.innerHTML=`<span class="tree-node-toggle">▶</span><span>${label}</span>`;h.onclick=e=>{e.stopPropagation();n.classList.toggle('expanded');};const ch=document.createElement('div');ch.className='tree-node-children';n.appendChild(h);n.appendChild(ch);return{el:n,ch};},
    _tl(label,onClick){const d=document.createElement('div');d.className='tree-node-header tree-leaf';d.innerHTML=`<span class="tree-dot">●</span><span>${label}</span>`;d.onclick=e=>{e.stopPropagation();document.querySelectorAll('.tree-node-header.active').forEach(n=>n.classList.remove('active'));d.classList.add('active');onClick();};return d;},

    // ═══════════════════════════════════════════
    //  TIMELINE
    // ═══════════════════════════════════════════
    renderTimeline() {
        const track=document.querySelector('#timeline-track');track.innerHTML='';
        if(!LevelParser.isLoaded()){track.innerHTML='<div class="empty-state">No level loaded</div>';return;}
        const events=LevelParser.getEvents();
        if(!events.length){track.innerHTML='<div class="empty-state">No events</div>';return;}
        events.forEach((evt,i)=>{
            const card=document.createElement('div');card.className='event-card'+(i===this.selectedEventIdx?' selected':'');
            const acts=evt.Actions?.Array||[];const ft=acts.length?acts[0].ActionType:-1;const ai=Schema.ACTION_TYPES[ft];
            if(ft===0||ft===1)card.setAttribute('data-type','spawn');else if(ft===3||ft===7||ft===8)card.setAttribute('data-type','dialog');else if(ft>=0)card.setAttribute('data-type','system');
            if(ai)card.style.borderLeftColor=ai.color;
            const tt=Schema.getEventTriggerTime(evt);const tl=tt>=0?`${tt.toFixed(0)}s`:'⚡';
            let detail='';if(ft===0&&acts[0].SpawnUnits){const u=acts[0].SpawnUnits.Units?.Array||[];detail=u.map(x=>`${x.Number||1}×${MetadataDB.resolveWithFallback(x.AssetRefSlottableSpec?.Id?.Value||0)}`).join(', ');}else{detail=ai?ai.label:'Event';}
            card.innerHTML=`<div class="event-type-badge">${tl}</div><div class="event-summary">${detail}</div><div class="event-time">${acts.length>1?acts.length+' actions':''}</div>`;
            card.onclick=()=>{this.selectedEventIdx=i;this.selectedActionIdx=-1;this.selectedTriggerIdx=-1;this.inspectEventOverview(i);this.renderTimeline();this.renderHierarchy();};
            card.oncontextmenu=e=>{e.preventDefault();this.showEventContextMenu(e,i);};
            track.appendChild(card);
        });
    },

    addEvent(){if(!LevelParser.isLoaded()){this.log('Load a level first','warning');return;}const evts=LevelParser.getEvents();const lt=evts.length?Schema.getEventTriggerTime(evts[evts.length-1]):0;const nt=Math.max(0,lt)+30;LevelParser.addEvent(Schema.createBlankEvent(nt));this.refreshAll();this.selectedEventIdx=LevelParser.getEvents().length-1;this.inspectEventOverview(this.selectedEventIdx);},
    deleteEvent(i){LevelParser.removeEvent(i);this.selectedEventIdx=-1;this.refreshAll();document.querySelector('#property-inspector').innerHTML='<div class="empty-state">Deleted</div>';},
    showEventContextMenu(e,i){const menu=document.querySelector('#context-menu');menu.style.display='flex';menu.style.left=e.clientX+'px';menu.style.top=e.clientY+'px';menu.innerHTML='';[{l:'⧉ Duplicate',a:()=>{LevelParser.duplicateEvent(i);this.refreshAll();}},{l:'⬆ Move Up',a:()=>{if(i>0){LevelParser.moveEvent(i,i-1);this.selectedEventIdx=i-1;this.refreshAll();}}},{l:'⬇ Move Down',a:()=>{if(i<LevelParser.getEvents().length-1){LevelParser.moveEvent(i,i+1);this.selectedEventIdx=i+1;this.refreshAll();}}},{l:'🗑 Delete',a:()=>this.deleteEvent(i)}].forEach(it=>{const d=document.createElement('div');d.className='context-menu-item';d.textContent=it.l;d.onclick=e2=>{e2.stopPropagation();menu.style.display='none';it.a();};menu.appendChild(d);});},

    showActionContextMenu(e,ei,ai){const menu=document.querySelector('#context-menu');menu.style.display='flex';menu.style.left=e.clientX+'px';menu.style.top=e.clientY+'px';menu.innerHTML='';const acts=LevelParser.getEvents()[ei]?.Actions?.Array||[];[{l:'⧉ Duplicate',a:()=>{acts.splice(ai+1,0,JSON.parse(JSON.stringify(acts[ai])));LevelParser._dirty=true;this.refreshAll();}},{l:'⬆ Move Up',a:()=>{if(ai>0){[acts[ai-1],acts[ai]]=[acts[ai],acts[ai-1]];LevelParser._dirty=true;this.refreshAll();}}},{l:'⬇ Move Down',a:()=>{if(ai<acts.length-1){[acts[ai],acts[ai+1]]=[acts[ai+1],acts[ai]];LevelParser._dirty=true;this.refreshAll();}}},{l:'📋 Copy',a:()=>{this._clipboard={type:'action',data:JSON.parse(JSON.stringify(acts[ai]))};this.log('Action copied','info');}},{l:'📌 Paste After',a:()=>{if(this._clipboard?.type==='action'){acts.splice(ai+1,0,JSON.parse(JSON.stringify(this._clipboard.data)));LevelParser._dirty=true;this.refreshAll();}}},{l:'🗑 Delete',a:()=>{acts.splice(ai,1);LevelParser._dirty=true;this.refreshAll();}}].forEach(it=>{const d=document.createElement('div');d.className='context-menu-item';d.textContent=it.l;d.onclick=e2=>{e2.stopPropagation();menu.style.display='none';it.a();};menu.appendChild(d);});},

    // ═══════════════════════════════════════════
    //  CONTEXT-AWARE PALETTE
    // ═══════════════════════════════════════════
    setContextForAction(actionType) {
        const map = {0:'Units',1:'Generals',12:'Units',21:'Research',39:'UpgradeBuilding'};
        const newCat = map[actionType] || null;
        if (newCat && newCat !== this._contextCategory) {
            this._contextCategory = newCat;
            this._paletteTab = newCat;
            this.renderPalette();
        }
    },

    renderPalette(filter='') {
        const palette=document.querySelector('#unit-palette');palette.innerHTML='';
        if(!MetadataDB.isLoaded()){palette.innerHTML='<div class="empty-state">Load metadata</div>';return;}
        // Tabs
        const tabs=document.createElement('div');tabs.className='palette-tabs';
        const tabList=['Units','Generals','Spells','Equipment','Statues','Research','All'];
        tabList.forEach(tab=>{const btn=document.createElement('button');btn.className='palette-tab'+(this._paletteTab===tab?' active':'');
            if(this._contextCategory===tab)btn.classList.add('context-highlight');
            btn.textContent=tab;btn.onclick=()=>{this._paletteTab=tab;this.renderPalette(document.querySelector('#unit-search')?.value||'');};tabs.appendChild(btn);});
        palette.appendChild(tabs);
        // Grid size controls
        const controls=document.createElement('div');controls.className='palette-controls';
        ['small','medium','large'].forEach(sz=>{const b=document.createElement('button');b.className='grid-size-btn'+(this._gridSize===sz?' active':'');b.dataset.size=sz;b.textContent=sz==='small'?'▪':sz==='medium'?'▪▪':'▪▪▪';b.title=sz;b.onclick=()=>{this._gridSize=sz;this.renderPalette(filter);};controls.appendChild(b);});
        palette.appendChild(controls);
        // Filter entries
        let entries=[];
        const catMap={Units:['Unit','Entity'],Generals:['General'],Spells:['Spell'],Equipment:['Equipment'],Statues:['Statue'],Research:['Research','Tech'],UpgradeBuilding:['UpgradeBuilding']};
        if(this._paletteTab==='All'){entries=MetadataDB.search(filter||'',null);}
        else{const cats=catMap[this._paletteTab]||[];cats.forEach(cat=>{entries=entries.concat(MetadataDB.getByCategory(cat));});if(filter){const q=filter.toLowerCase();entries=entries.filter(e=>e.DisplayName&&e.DisplayName.toLowerCase().includes(q));}}
        if(this._paletteTab==='Units'&&typeof MetadataDB.getUnits==='function'&&!filter)entries=MetadataDB.getUnits();
        entries=entries.slice(0,300);
        if(!entries.length){palette.appendChild(this._el('div',{class:'empty-state',textContent:'No items'}));return;}
        // Grid
        const grid=document.createElement('div');
        grid.className=`palette-grid grid-${this._gridSize}`;
        entries.forEach(entry=>{
            const card=document.createElement('div');card.className='unit-card';
            const icon=this._getCatIcon(entry.Category);
            card.innerHTML=`<div class="unit-icon-area">${icon}</div><div class="unit-name" title="${entry.DisplayName||''}\n${entry.Category||''}\nID: ${entry.Id||''}">${entry.DisplayName||'?'}</div>`;
            card.onclick=()=>this.addAssetToSelectedAction(entry);
            card.oncontextmenu=e=>{e.preventDefault();this.showRefExplorer(entry);};
            grid.appendChild(card);
        });
        palette.appendChild(grid);
    },

    _getCatIcon(c){return{Unit:'⚔',General:'👑',Spell:'✨',Equipment:'🛡',Statue:'🏛',Entity:'👤',BackDrop:'🖼',VFX:'💥',GameType:'🎮',Research:'🔬',Tech:'🔬',UpgradeBuilding:'🏗',Wall:'🧱',AITeam:'🤖',LevelVariant:'🎭',CapturePoint:'🚩'}[c]||'📦';},

    addAssetToSelectedAction(entry) {
        if(this.selectedEventIdx<0){this.log('Select an event first','warning');return;}
        const evt=LevelParser.getEvents()[this.selectedEventIdx];
        const acts=evt?.Actions?.Array||[];
        let si=this.selectedActionIdx>=0&&acts[this.selectedActionIdx]?.ActionType===0?this.selectedActionIdx:acts.findIndex(a=>a.ActionType===0);
        if(si<0){acts.push(Schema.createBlankAction(0));si=acts.length-1;}
        LevelParser.addSpawnUnit(this.selectedEventIdx,si,Schema.createBlankSpawnUnit(String(entry.Id)));
        this.log(`+ ${entry.DisplayName}`,'info');
        if(this.selectedActionIdx>=0)this.inspectAction(this.selectedEventIdx,this.selectedActionIdx);
        else this.inspectAction(this.selectedEventIdx,si);
        this.renderTimeline();this.renderHierarchy();
    },

    // ═══════════════════════════════════════════
    //  INSPECTORS
    // ═══════════════════════════════════════════

    // ─── SETTINGS ───
    inspectSettings() {
        const ins=document.querySelector('#property-inspector');ins.innerHTML='';
        const s=LevelParser.getSettings();if(!s)return;
        this.renderGenericProps(s,'Settings',ins,'⚙ Level Settings');
    },

    // ─── TEAM ───
    inspectTeam(side,i) {
        const ins=document.querySelector('#property-inspector');ins.innerHTML='';
        const teams=side==='left'?LevelParser.getLeftTeams():LevelParser.getRightTeams();
        const team=teams[i];if(!team)return;
        const bp=`Settings.${side==='left'?'LeftTeams':'RightTeams'}.Array.${i}`;
        this.renderGenericProps(team,bp,ins,`👥 ${team.TeamName||'Team '+i}`);
    },

    inspectObject(obj,path,title) {
        const ins=document.querySelector('#property-inspector');ins.innerHTML='';
        if(!obj){ins.innerHTML='<div class="empty-state">No data</div>';return;}
        this.renderGenericProps(obj,path,ins,title);
    },

    // ─── EVENT OVERVIEW ───
    inspectEventOverview(ei) {
        const ins=document.querySelector('#property-inspector');ins.innerHTML='';
        const evt=LevelParser.getEvents()[ei];if(!evt)return;
        const bp=`Settings.Events.Array.${ei}`;
        // Header
        const hdr=this._el('div',{class:'inspector-header'});hdr.innerHTML=`<span class="inspector-title">⚡ Event ${ei}</span>`;
        ins.appendChild(hdr);
        // Delay
        if(evt.DelayBeforeTakingActions)ins.appendChild(this._propFP('Delay Before Actions',evt.DelayBeforeTakingActions.RawValue,v=>{LevelParser.set(`${bp}.DelayBeforeTakingActions.RawValue`,Schema.realToFp(v));this.renderTimeline();}));

        // ─── TRIGGERS ───
        const triggers=evt.Triggers?.Array||[];
        const trigSec=this._el('div',{class:'inspector-section'});
        trigSec.appendChild(this._el('div',{class:'inspector-section-title',textContent:`🔔 Triggers (${triggers.length})`}));
        triggers.forEach((trig,ti)=>{
            const tt=Schema.TRIGGER_TYPES[trig.EventTriggerType];
            const card=this._el('div',{class:'action-card trigger-card'});
            const head=this._el('div',{class:'action-card-header'});
            head.innerHTML=`<span class="action-card-icon" style="color:var(--status-info)">🔔</span><span class="action-card-title">${tt?tt.label:'Trigger'}</span>`;
            head.appendChild(this._makeMenu([
                {l:'⧉ Dup',a:()=>{triggers.splice(ti+1,0,JSON.parse(JSON.stringify(trig)));LevelParser._dirty=true;this.inspectEventOverview(ei);this.renderHierarchy();}},
                {l:'⬆',a:()=>{if(ti>0){[triggers[ti-1],triggers[ti]]=[triggers[ti],triggers[ti-1]];LevelParser._dirty=true;this.inspectEventOverview(ei);this.renderHierarchy();}}},
                {l:'⬇',a:()=>{if(ti<triggers.length-1){[triggers[ti],triggers[ti+1]]=[triggers[ti+1],triggers[ti]];LevelParser._dirty=true;this.inspectEventOverview(ei);this.renderHierarchy();}}},
                {l:'🗑',a:()=>{triggers.splice(ti,1);LevelParser._dirty=true;this.inspectEventOverview(ei);this.renderTimeline();this.renderHierarchy();}},
            ]));
            card.appendChild(head);
            // Click to inspect
            head.style.cursor='pointer';
            head.addEventListener('click',e=>{if(e.target.closest('.item-menu-btn'))return;this.selectedTriggerIdx=ti;this.selectedActionIdx=-1;this.inspectTrigger(ei,ti);});
            trigSec.appendChild(card);
        });
        // [+ Add Trigger]
        const addTrig=this._el('button',{class:'btn-add-inline'});addTrig.textContent='＋ Add Trigger';
        addTrig.onclick=()=>{if(!evt.Triggers)evt.Triggers={Array:[]};evt.Triggers.Array.push(Schema.createBlankTrigger(0));LevelParser._dirty=true;this.inspectEventOverview(ei);this.renderTimeline();this.renderHierarchy();};
        trigSec.appendChild(addTrig);
        ins.appendChild(trigSec);

        // ─── ACTIONS ───
        const actions=evt.Actions?.Array||[];
        const actSec=this._el('div',{class:'inspector-section'});
        actSec.appendChild(this._el('div',{class:'inspector-section-title',textContent:`🎬 Actions (${actions.length})`}));
        actions.forEach((act,ai)=>{
            const at=Schema.ACTION_TYPES[act.ActionType];
            const card=this._el('div',{class:'action-card'});
            card.style.borderLeftColor=at?.color||'#666';
            const head=this._el('div',{class:'action-card-header'});
            let label=at?at.label:'Action';
            if(act.ActionType===0){const u=act.SpawnUnits?.Units?.Array||[];if(u.length)label+=': '+u.map(x=>`${x.Number||1}×${MetadataDB.resolveWithFallback(x.AssetRefSlottableSpec?.Id?.Value||0)}`).join(', ');}
            head.innerHTML=`<span class="action-card-icon" style="color:${at?.color||'#666'}">${at?at.label.charAt(0):'?'}</span><span class="action-card-title">${label}</span>`;
            head.appendChild(this._makeMenu([
                {l:'⧉ Dup',a:()=>{actions.splice(ai+1,0,JSON.parse(JSON.stringify(act)));LevelParser._dirty=true;this.inspectEventOverview(ei);this.renderHierarchy();this.renderTimeline();}},
                {l:'⬆',a:()=>{if(ai>0){[actions[ai-1],actions[ai]]=[actions[ai],actions[ai-1]];LevelParser._dirty=true;this.inspectEventOverview(ei);this.renderHierarchy();}}},
                {l:'⬇',a:()=>{if(ai<actions.length-1){[actions[ai],actions[ai+1]]=[actions[ai+1],actions[ai]];LevelParser._dirty=true;this.inspectEventOverview(ei);this.renderHierarchy();}}},
                {l:'📋 Copy',a:()=>{this._clipboard={type:'action',data:JSON.parse(JSON.stringify(act))};this.log('Copied','info');}},
                {l:'🗑',a:()=>{actions.splice(ai,1);LevelParser._dirty=true;this.inspectEventOverview(ei);this.renderTimeline();this.renderHierarchy();}},
            ]));
            card.appendChild(head);
            head.style.cursor='pointer';
            head.addEventListener('click',e=>{if(e.target.closest('.item-menu-btn'))return;this.selectedActionIdx=ai;this.selectedTriggerIdx=-1;this.inspectAction(ei,ai);this.setContextForAction(act.ActionType);});
            actSec.appendChild(card);
        });
        // [+ Add Action ▾]
        const addActWrap=this._el('div',{style:'position:relative'});
        const addAct=this._el('button',{class:'btn-add-inline primary'});addAct.textContent='＋ Add Action ▾';
        addAct.onclick=()=>{const existing=addActWrap.querySelector('.action-dropdown');if(existing){existing.remove();return;}
            const dd=this._el('div',{class:'action-dropdown'});
            Object.entries(Schema.ACTION_TYPES).forEach(([k,v])=>{const it=this._el('div',{class:'action-dropdown-item'});it.innerHTML=`<span style="color:${v.color}">●</span> ${v.label}`;it.onclick=()=>{if(!evt.Actions)evt.Actions={Array:[]};evt.Actions.Array.push(Schema.createBlankAction(parseInt(k)));LevelParser._dirty=true;dd.remove();this.inspectEventOverview(ei);this.renderTimeline();this.renderHierarchy();};dd.appendChild(it);});
            // Paste
            if(this._clipboard?.type==='action'){const paste=this._el('div',{class:'action-dropdown-item',style:'border-top:1px solid var(--border-subtle)'});paste.textContent='📌 Paste Copied Action';paste.onclick=()=>{evt.Actions.Array.push(JSON.parse(JSON.stringify(this._clipboard.data)));LevelParser._dirty=true;dd.remove();this.inspectEventOverview(ei);this.renderTimeline();this.renderHierarchy();};dd.appendChild(paste);}
            addActWrap.appendChild(dd);};
        addActWrap.appendChild(addAct);actSec.appendChild(addActWrap);
        ins.appendChild(actSec);
    },

    // ─── TRIGGER INSPECTOR ───
    inspectTrigger(ei,ti) {
        const ins=document.querySelector('#property-inspector');ins.innerHTML='';
        const trig=(LevelParser.getEvents()[ei]?.Triggers?.Array||[])[ti];if(!trig)return;
        const bp=`Settings.Events.Array.${ei}.Triggers.Array.${ti}`;
        const tt=Schema.TRIGGER_TYPES[trig.EventTriggerType];
        ins.appendChild(this._el('div',{class:'inspector-header',innerHTML:`<span class="inspector-title">🔔 ${tt?tt.label:'Trigger'}</span>`}));
        // Type selector
        ins.appendChild(this._propSelect('Trigger Type',trig.EventTriggerType,Object.entries(Schema.TRIGGER_TYPES).map(([k,v])=>({value:parseInt(k),label:v.label})),v=>{LevelParser.set(`${bp}.EventTriggerType`,v);this.inspectTrigger(ei,ti);this.renderTimeline();this.renderHierarchy();}));
        // Trigger-specific data
        const dk=tt?.dataKey;
        if(dk&&trig[dk])this.renderGenericProps(trig[dk],`${bp}.${dk}`,ins,null);
        // Back button
        const back=this._el('button',{class:'btn-back',textContent:'← Back to Event'});back.onclick=()=>this.inspectEventOverview(ei);ins.appendChild(back);
    },

    // ─── ACTION INSPECTOR — Dedicated per type ───
    inspectAction(ei,ai) {
        const ins=document.querySelector('#property-inspector');ins.innerHTML='';
        const act=(LevelParser.getEvents()[ei]?.Actions?.Array||[])[ai];if(!act)return;
        const bp=`Settings.Events.Array.${ei}.Actions.Array.${ai}`;
        const at=Schema.ACTION_TYPES[act.ActionType];
        const dk=at?.dataKey;
        const data=dk?act[dk]:null;
        // Header
        ins.appendChild(this._el('div',{class:'inspector-header',style:`border-left:4px solid ${at?.color||'#666'}`,innerHTML:`<span class="inspector-title">🎬 ${at?at.label:'Action'}</span>`}));
        // Type selector
        ins.appendChild(this._propSelect('Action Type',act.ActionType,Object.entries(Schema.ACTION_TYPES).map(([k,v])=>({value:parseInt(k),label:v.label})),v=>{LevelParser.set(`${bp}.ActionType`,v);this.inspectAction(ei,ai);this.renderTimeline();this.renderHierarchy();}));
        if(!data){const back=this._el('button',{class:'btn-back',textContent:'← Back'});back.onclick=()=>this.inspectEventOverview(ei);ins.appendChild(back);return;}
        const dp=`${bp}.${dk}`;

        // ──── SPAWN UNITS (Unity-style) ────
        if(act.ActionType===0) {
            ins.appendChild(this._propNumber('Side',data.Side||0,v=>{LevelParser.set(`${dp}.Side`,v);}));
            ins.appendChild(this._propNumber('Team',data.TeamIndex||0,v=>{LevelParser.set(`${dp}.TeamIndex`,v);}));
            const unitsSec=this._el('div',{class:'spawn-units-section'});
            unitsSec.appendChild(this._el('div',{class:'inspector-section-title',textContent:'Units'}));
            const units=data.Units?.Array||[];
            units.forEach((u,ui)=>{
                const name=MetadataDB.resolveWithFallback(u.AssetRefSlottableSpec?.Id?.Value||0);
                const card=this._el('div',{class:'spawn-unit-card'});
                card.innerHTML=`<div class="spawn-unit-header"><span class="spawn-unit-icon">⚔</span><span class="spawn-unit-name">${name}</span></div>`;
                const body=this._el('div',{class:'spawn-unit-body'});
                const countRow=this._el('div',{class:'spawn-unit-count-row'});
                countRow.innerHTML=`<span>Count</span>`;
                const numIn=this._el('input',{type:'number',value:u.Number||1,min:'1',class:'spawn-count-input'});
                numIn.onchange=()=>{LevelParser.set(`${dp}.Units.Array.${ui}.Number`,parseInt(numIn.value)||1);this.renderTimeline();this.renderHierarchy();};
                countRow.appendChild(numIn);
                body.appendChild(countRow);
                // Action buttons
                const btns=this._el('div',{class:'spawn-unit-actions'});
                if(ui>0){const up=this._el('button',{class:'spawn-btn',textContent:'↑',title:'Move Up'});up.onclick=()=>{[units[ui-1],units[ui]]=[units[ui],units[ui-1]];LevelParser._dirty=true;this.inspectAction(ei,ai);this.renderHierarchy();};btns.appendChild(up);}
                if(ui<units.length-1){const dn=this._el('button',{class:'spawn-btn',textContent:'↓',title:'Move Down'});dn.onclick=()=>{[units[ui],units[ui+1]]=[units[ui+1],units[ui]];LevelParser._dirty=true;this.inspectAction(ei,ai);this.renderHierarchy();};btns.appendChild(dn);}
                const dup=this._el('button',{class:'spawn-btn',textContent:'⧉',title:'Duplicate'});dup.onclick=()=>{units.splice(ui+1,0,JSON.parse(JSON.stringify(u)));LevelParser._dirty=true;this.inspectAction(ei,ai);this.renderHierarchy();};btns.appendChild(dup);
                const del=this._el('button',{class:'spawn-btn danger',textContent:'✕',title:'Delete'});del.onclick=()=>{LevelParser.removeSpawnUnit(ei,ai,ui);this.inspectAction(ei,ai);this.renderTimeline();this.renderHierarchy();};btns.appendChild(del);
                body.appendChild(btns);
                card.appendChild(body);
                unitsSec.appendChild(card);
            });
            const addUnit=this._el('button',{class:'btn-add-inline',style:'margin-top:4px'});addUnit.textContent='＋ Add Unit';
            addUnit.onclick=()=>this.openAssetPicker('Unit',entry=>{
                LevelParser.addSpawnUnit(ei,ai,Schema.createBlankSpawnUnit(String(entry.Id)));
                this.log(`+ ${entry.DisplayName}`,'info');
                this.inspectAction(ei,ai);this.renderTimeline();this.renderHierarchy();
            });
            unitsSec.appendChild(addUnit);
            ins.appendChild(unitsSec);
            // Advanced
            this._renderAdvanced(data,dp,ins,['Units','Side','TeamIndex']);
        }
        // ──── CAMERA PAN ────
        else if(act.ActionType===2) {
            if(data.Position){ins.appendChild(this._propFP('Target X',data.Position.X?.RawValue||0,v=>LevelParser.set(`${dp}.Position.X.RawValue`,Schema.realToFp(v))));ins.appendChild(this._propFP('Target Y',data.Position.Y?.RawValue||0,v=>LevelParser.set(`${dp}.Position.Y.RawValue`,Schema.realToFp(v))));}
            if(data.Rate?.RawValue!==undefined)ins.appendChild(this._propFP('Rate',data.Rate.RawValue,v=>LevelParser.set(`${dp}.Rate.RawValue`,Schema.realToFp(v))));
            this._renderAdvanced(data,dp,ins,['Position','Rate']);
        }
        // ──── GIVE SPEECH ────
        else if(act.ActionType===3) {
            ins.appendChild(this._propText('Label',data.LabelToFind||'',v=>LevelParser.set(`${dp}.LabelToFind`,v)));
            if(data.GiveSpeechPosition){ins.appendChild(this._propFP('Pos X',data.GiveSpeechPosition.X?.RawValue||0,v=>LevelParser.set(`${dp}.GiveSpeechPosition.X.RawValue`,Schema.realToFp(v))));ins.appendChild(this._propFP('Pos Y',data.GiveSpeechPosition.Y?.RawValue||0,v=>LevelParser.set(`${dp}.GiveSpeechPosition.Y.RawValue`,Schema.realToFp(v))));}
            this._renderAdvanced(data,dp,ins,['LabelToFind','GiveSpeechPosition']);
        }
        // ──── SIDE WIN ────
        else if(act.ActionType===16) {
            ins.appendChild(this._propSelect('Winning Side',data.Side||0,[{value:0,label:'Left'},{value:1,label:'Right'}],v=>LevelParser.set(`${dp}.Side`,v)));
            this._renderAdvanced(data,dp,ins,['Side']);
        }
        // ──── SPAWN GENERAL ────
        else if(act.ActionType===1) {
            ins.appendChild(this._propNumber('Side',data.Side||0,v=>LevelParser.set(`${dp}.Side`,v)));
            ins.appendChild(this._propNumber('Team',data.TeamIndex||0,v=>LevelParser.set(`${dp}.TeamIndex`,v)));
            // General picker
            if(data.AssetRefSlottableSpec?.Id?.Value!==undefined){
                ins.appendChild(this._propAssetPicker('General',String(data.AssetRefSlottableSpec.Id.Value),'General',v=>{LevelParser.set(`${dp}.AssetRefSlottableSpec.Id.Value`,v);this.inspectAction(ei,ai);}));
            }
            this._renderAdvanced(data,dp,ins,['Side','TeamIndex','AssetRefSlottableSpec']);
        }
        // ──── FULL SCREEN MESSAGE ────
        else if(act.ActionType===7) {
            if(data.Message!==undefined)ins.appendChild(this._propText('Message',data.Message||'',v=>LevelParser.set(`${dp}.Message`,v)));
            this._renderAdvanced(data,dp,ins,['Message']);
        }
        // ──── MESSAGE POPUP ────
        else if(act.ActionType===8) {
            if(data.Message!==undefined)ins.appendChild(this._propText('Message',data.Message||'',v=>LevelParser.set(`${dp}.Message`,v)));
            this._renderAdvanced(data,dp,ins,['Message']);
        }
        // ──── TOGGLE PAUSE ────
        else if(act.ActionType===19) {
            if(data.Pause!==undefined)ins.appendChild(this._propCheckbox('Pause',data.Pause,v=>LevelParser.set(`${dp}.Pause`,v?1:0)));
            this._renderAdvanced(data,dp,ins,['Pause']);
        }
        // ──── CUTSCENE MODE ────
        else if(act.ActionType===17) {
            if(data.Enable!==undefined)ins.appendChild(this._propCheckbox('Enable Cutscene',data.Enable,v=>LevelParser.set(`${dp}.Enable`,v?1:0)));
            this._renderAdvanced(data,dp,ins,['Enable']);
        }
        // ──── TEAM AI COMMAND ────
        else if(act.ActionType===20) {
            ins.appendChild(this._propNumber('Side',data.Side||0,v=>LevelParser.set(`${dp}.Side`,v)));
            ins.appendChild(this._propNumber('Team',data.TeamIndex||0,v=>LevelParser.set(`${dp}.TeamIndex`,v)));
            this._renderAdvanced(data,dp,ins,['Side','TeamIndex']);
        }
        // ──── GIVE RESEARCH ────
        else if(act.ActionType===21) {
            if(data.AssetRefResearchSpec?.Id?.Value!==undefined)ins.appendChild(this._propAssetRef('Research',String(data.AssetRefResearchSpec.Id.Value),`${dp}.AssetRefResearchSpec.Id.Value`));
            ins.appendChild(this._propNumber('Side',data.Side||0,v=>LevelParser.set(`${dp}.Side`,v)));
            this._renderAdvanced(data,dp,ins,['AssetRefResearchSpec','Side']);
        }
        // ──── TIME SCALE ────
        else if(act.ActionType===38) {
            if(data.TimeScale?.RawValue!==undefined)ins.appendChild(this._propFP('Time Scale',data.TimeScale.RawValue,v=>LevelParser.set(`${dp}.TimeScale.RawValue`,Schema.realToFp(v))));
            this._renderAdvanced(data,dp,ins,['TimeScale']);
        }
        // ──── SET FOG OF WAR ────
        else if(act.ActionType===14) {
            if(data.Enable!==undefined)ins.appendChild(this._propCheckbox('Enable Fog',data.Enable,v=>LevelParser.set(`${dp}.Enable`,v?1:0)));
            this._renderAdvanced(data,dp,ins,['Enable']);
        }
        // ──── GIVE UPGRADE BUILDING ────
        else if(act.ActionType===39) {
            if(data.AssetRefUpgradeBuildingSpec?.Id?.Value!==undefined)ins.appendChild(this._propAssetRef('Building',String(data.AssetRefUpgradeBuildingSpec.Id.Value),`${dp}.AssetRefUpgradeBuildingSpec.Id.Value`));
            ins.appendChild(this._propNumber('Side',data.Side||0,v=>LevelParser.set(`${dp}.Side`,v)));
            this._renderAdvanced(data,dp,ins,['AssetRefUpgradeBuildingSpec','Side']);
        }
        // ──── ALL OTHERS — Full generic ────
        else {
            this.renderGenericProps(data,dp,ins,at?at.label:'Action Data');
        }
        // Back button
        const back=this._el('button',{class:'btn-back',textContent:'← Back to Event'});back.onclick=()=>{this.selectedActionIdx=-1;this.inspectEventOverview(ei);};ins.appendChild(back);
    },

    _renderAdvanced(data,dp,container,exclude) {
        const other={};Object.keys(data).forEach(k=>{if(!exclude.includes(k))other[k]=data[k];});
        if(!Object.keys(other).length)return;
        const g=this._el('div',{class:'advanced-section'});
        const h=this._el('div',{class:'advanced-header'});h.textContent='▶ All Properties';
        const c=this._el('div',{class:'advanced-content',style:'display:none'});
        h.onclick=()=>{const o=c.style.display!=='none';c.style.display=o?'none':'block';h.textContent=(o?'▶':'▼')+' All Properties';};
        this.renderGenericProps(other,dp,c,null);
        g.appendChild(h);g.appendChild(c);container.appendChild(g);
    },

    // ═══════════════════════════════════════════
    //  GENERIC PROPERTY EDITOR
    // ═══════════════════════════════════════════
    renderGenericProps(obj,basePath,container,title) {
        if(obj===null||obj===undefined){container.appendChild(this._el('div',{style:'color:var(--text-muted);padding:8px',textContent:'(null)'}));return;}
        if(typeof obj!=='object'){container.appendChild(this._propScalar(basePath.split('.').pop(),obj,basePath));return;}
        const rows=[];
        for(const key of Object.keys(obj)) {
            const val=obj[key],fp=basePath?`${basePath}.${key}`:key;
            if(val===null||val===undefined){rows.push(this._propRow(key,this._el('span',{style:'color:var(--text-muted)',textContent:'null'})));}
            else if(key==='Array'&&Array.isArray(val)){this._renderArr(val,basePath,container,title||'Items');return;}
            else if(typeof val==='object'&&val.Array!==undefined&&Array.isArray(val.Array)){const g=this._el('div',{class:'prop-group-nested'});const h=this._el('div',{class:'prop-group-header'});h.textContent=`▶ ${key} (${val.Array.length})`;const c=this._el('div',{style:'display:none;padding-left:8px;border-left:2px solid var(--border-subtle)'});h.onclick=()=>{const o=c.style.display!=='none';c.style.display=o?'none':'block';h.textContent=(o?'▶':'▼')+` ${key} (${val.Array.length})`;};this._renderArr(val.Array,`${fp}.Array`,c,key);g.appendChild(h);g.appendChild(c);rows.push(g);}
            else if(typeof val==='object'&&'RawValue'in val&&Object.keys(val).length===1){rows.push(this._propFP(key,val.RawValue,v=>LevelParser.set(`${fp}.RawValue`,Schema.realToFp(v))));}
            else if(typeof val==='object'&&'Value'in val&&Object.keys(val).length===1){const v=val.Value,vs=String(v);if(v===0||v===1||v==='0'||v==='1')rows.push(this._propCheckbox(key,v,nv=>LevelParser.set(`${fp}.Value`,nv?1:0)));else if(vs.length>10)rows.push(this._propAssetRef(key,vs,`${fp}.Value`));else rows.push(this._propNumber(key,typeof v==='string'?parseInt(v):v,nv=>LevelParser.set(`${fp}.Value`,nv)));}
            else if(typeof val==='object'&&val.Id&&typeof val.Id==='object'&&'Value'in val.Id){rows.push(this._propAssetRef(key,String(val.Id.Value),`${fp}.Id.Value`));}
            else if(typeof val==='object'&&val.X?.RawValue!==undefined&&val.Y){rows.push(this._propFP(`${key}.X`,val.X.RawValue,v=>LevelParser.set(`${fp}.X.RawValue`,Schema.realToFp(v))));rows.push(this._propFP(`${key}.Y`,val.Y.RawValue,v=>LevelParser.set(`${fp}.Y.RawValue`,Schema.realToFp(v))));if(val.Z?.RawValue!==undefined)rows.push(this._propFP(`${key}.Z`,val.Z.RawValue,v=>LevelParser.set(`${fp}.Z.RawValue`,Schema.realToFp(v))));}
            else if(typeof val==='object'&&!Array.isArray(val)){const g=this._el('div',{class:'prop-group-nested'});const h=this._el('div',{class:'prop-group-header'});h.textContent=`▶ ${key}`;const c=this._el('div',{style:'display:none;padding-left:8px;border-left:2px solid var(--border-subtle)'});h.onclick=()=>{const o=c.style.display!=='none';c.style.display=o?'none':'block';h.textContent=(o?'▶':'▼')+` ${key}`;};this.renderGenericProps(val,fp,c,null);g.appendChild(h);g.appendChild(c);rows.push(g);}
            else if(typeof val==='string')rows.push(this._propText(key,val,v=>LevelParser.set(fp,v)));
            else if(typeof val==='number'){if(val>1e15)rows.push(this._propAssetRef(key,String(val),fp));else rows.push(this._propNumber(key,val,v=>LevelParser.set(fp,v)));}
            else if(typeof val==='boolean')rows.push(this._propCheckbox(key,val?1:0,v=>LevelParser.set(fp,!!v)));
            else rows.push(this._propRow(key,this._el('span',{style:'color:var(--text-muted);font-size:11px',textContent:JSON.stringify(val).substring(0,60)})));
        }
        if(title){const g=this._el('div',{class:'property-group'});g.appendChild(this._el('div',{class:'property-group-header',textContent:title}));rows.forEach(r=>{if(r instanceof HTMLElement)g.appendChild(r);});container.appendChild(g);}
        else rows.forEach(r=>{if(r instanceof HTMLElement)container.appendChild(r);});
    },

    _renderArr(arr,basePath,container) {
        arr.forEach((item,i)=>{
            const ip=`${basePath}.${i}`;
            if(typeof item==='object'&&item!==null){
                const g=this._el('div',{class:'prop-group-nested',style:'margin:2px 0'});
                const h=this._el('div',{class:'prop-group-header',style:'display:flex;justify-content:space-between'});
                let il=`[${i}]`;if(item.AssetRefSlottableSpec?.Id?.Value)il+=' '+MetadataDB.resolveWithFallback(item.AssetRefSlottableSpec.Id.Value);else if(item.Id?.Value)il+=' '+MetadataDB.resolveWithFallback(item.Id.Value);
                const ls=this._el('span',{textContent:`▶ ${il}`});const db=this._el('button',{class:'spawn-btn danger',textContent:'✕'});db.onclick=e=>{e.stopPropagation();arr.splice(i,1);LevelParser._dirty=true;this.refreshAll();};
                h.appendChild(ls);h.appendChild(db);g.appendChild(h);
                const c=this._el('div',{style:'display:none;padding-left:8px'});h.onclick=e=>{if(e.target===db)return;const o=c.style.display!=='none';c.style.display=o?'none':'block';ls.textContent=(o?'▶':'▼')+` ${il}`;};
                this.renderGenericProps(item,ip,c,null);g.appendChild(c);container.appendChild(g);
            }else container.appendChild(this._propScalar(`[${i}]`,item,ip));
        });
    },

    // ─── REFERENCE EXPLORER ───
    showRefExplorer(entry) {
        const ins=document.querySelector('#property-inspector');ins.innerHTML='';
        ins.appendChild(this._el('div',{class:'inspector-header',innerHTML:`<span class="inspector-title">${this._getCatIcon(entry.Category)} ${entry.DisplayName||'?'}</span>`}));
        [['ID',entry.Id],['Category',entry.Category],['Path',entry.Path||entry.InternalPath],['Source',entry.Source]].forEach(([l,v])=>{if(v)ins.appendChild(this._propRow(l,this._el('span',{style:'font-size:11px;word-break:break-all',textContent:String(v)})));});
        if(entry.Description)ins.appendChild(this._propRow('Desc',this._el('span',{style:'font-size:11px',textContent:entry.Description})));
        if(entry.Cost)ins.appendChild(this._propRow('Cost',this._el('span',{textContent:`${entry.Cost.Gold||entry.Cost.gold||0}G ${entry.Cost.Mana||entry.Cost.mana||0}M ${entry.Cost.Population||entry.Cost.population||0}P`})));
        if(LevelParser.isLoaded()&&entry.Id){const refs=this._findRefs(String(entry.Id));const sec=this._el('div',{class:'inspector-section'});sec.appendChild(this._el('div',{class:'inspector-section-title',textContent:`📎 References (${refs.length})`}));if(!refs.length)sec.appendChild(this._el('div',{style:'padding:8px;color:var(--text-muted)',textContent:'Not used in current level'}));else refs.forEach(r=>sec.appendChild(this._el('div',{style:'padding:4px 8px;font-size:11px;color:var(--accent-primary)',textContent:r})));ins.appendChild(sec);}
    },
    _findRefs(id){const refs=[];if(!LevelParser.isLoaded())return refs;LevelParser.getEvents().forEach((evt,i)=>{if(JSON.stringify(evt).includes(id))refs.push(`Event ${i}: ${Schema.getEventSummary(evt)}`);});['LeftTeams','RightTeams'].forEach(key=>{(LevelParser.getData().Settings[key]?.Array||[]).forEach((t,ti)=>{if(JSON.stringify(t).includes(id))refs.push(`${key}[${ti}]: ${t.TeamName||'Team '+ti}`);});});return refs;},

    // ─── GLOBAL SEARCH ───
    openGlobalSearch(){let m=document.querySelector('#global-search-modal');if(!m){m=this._el('div',{id:'global-search-modal',class:'global-search-overlay'});m.innerHTML='<div class="global-search-box"><input type="text" id="global-search-input" placeholder="Search..." autofocus><div id="global-search-results" class="global-search-results"></div></div>';document.body.appendChild(m);m.addEventListener('click',e=>{if(e.target===m)m.style.display='none';});}m.style.display='flex';const i=document.querySelector('#global-search-input');i.value='';i.focus();i.oninput=()=>this._search(i.value);},
    _search(q){const r=document.querySelector('#global-search-results');r.innerHTML='';if(!q||q.length<2)return;if(MetadataDB.isLoaded())MetadataDB.search(q,null).slice(0,10).forEach(e=>{const d=this._el('div',{class:'search-result-item'});d.innerHTML=`<span class="search-cat">${this._getCatIcon(e.Category)} ${e.Category||''}</span> ${e.DisplayName}`;d.onclick=()=>{this.showRefExplorer(e);document.querySelector('#global-search-modal').style.display='none';};r.appendChild(d);});if(LevelParser.isLoaded())LevelParser.getEvents().forEach((evt,i)=>{const s=Schema.getEventSummary(evt);if(s.toLowerCase().includes(q.toLowerCase())){const d=this._el('div',{class:'search-result-item'});d.innerHTML=`<span class="search-cat">⚡</span> [${i}] ${s}`;d.onclick=()=>{this.selectedEventIdx=i;this.inspectEventOverview(i);document.querySelector('#global-search-modal').style.display='none';};r.appendChild(d);}});},

    // ─── VALIDATION / LOG ───
    runValidation(){if(!LevelParser.isLoaded())return;const r=Validator.validate();if(!r.length)this.log('✅ No issues','info');else r.forEach(x=>this.log(`[${x.level.toUpperCase()}] ${x.message}`,x.level));},
    log(msg,type='info'){const c=document.querySelector('#log-container');const e=this._el('div',{class:`log-entry ${type}`});e.innerHTML=`<span class="time">${new Date().toLocaleTimeString()}</span> ${msg}`;c.prepend(e);},

    // ─── LABEL HUMANIZER ───
    _LABEL_MAP: {
        'AssetRefSlottableSpec':'Unit','AssetRefEntityPrototype':'Entity','AssetRefEntityView':'Entity View',
        'AssetRefResearchSpec':'Research','AssetRefSpellSpec':'Spell','AssetRefUpgradeBuildingSpec':'Building',
        'AssetRefGameTypeSpec':'Game Type','AssetRefBackDropSpec':'Backdrop','AssetRefStatueSpec':'Statue',
        'EventTriggerType':'Trigger Type','ActionType':'Action Type','TeamIndex':'Team','TeamName':'Team Name',
        'DelayBeforeTakingActions':'Delay','GiveSpeechPosition':'Position','LabelToFind':'Label',
        'AllowPlayersLoadoutOverride':'Player Loadout Override','OverrideStatueHealth':'Override Statue HP',
        'StatueHealth':'Statue HP','StartingGold':'Gold','StartingMana':'Mana','StartingMiners':'Miners',
        'IsBuildableUnit':'Buildable Unit','ShouldShowPreviewOfEntityPrototype':'Show Preview',
        'TeamAiParameters':'AI Parameters','TeamAiLogicParameters':'AI Logic',
        'SpawnUnits':'Spawn Units','SpawnGeneral':'Spawn General','CameraPan':'Camera Pan',
        'GiveSpeech':'Speech','SideWin':'Side Win','RawValue':'Value',
    },
    _humanize(key) {
        if (this._LABEL_MAP[key]) return this._LABEL_MAP[key];
        // CamelCase → spaced: "AssetRefSlottableSpec" → "Asset Ref Slottable Spec"
        return key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, s => s.toUpperCase());
    },

    // ─── ASSET PICKER POPUP ───
    openAssetPicker(category, onSelect) {
        let modal = document.querySelector('#asset-picker-modal');
        if (!modal) {
            modal = this._el('div', {id:'asset-picker-modal', class:'picker-overlay'});
            modal.innerHTML = `<div class="picker-box"><div class="picker-header"><span class="picker-title">Select Asset</span><button class="picker-close">✕</button></div><input type="text" class="picker-search" placeholder="Search..."><div class="picker-list"></div></div>`;
            document.body.appendChild(modal);
            modal.querySelector('.picker-close').onclick = () => modal.style.display = 'none';
            modal.addEventListener('click', e => { if (e.target === modal) modal.style.display = 'none'; });
        }
        modal.style.display = 'flex';
        const title = modal.querySelector('.picker-title');
        title.textContent = `Select ${category}`;
        const search = modal.querySelector('.picker-search');
        const list = modal.querySelector('.picker-list');
        search.value = '';
        search.focus();
        const render = (q) => {
            list.innerHTML = '';
            const catMap = {Unit:['Unit','Entity'],General:['General'],Spell:['Spell'],Research:['Research','Tech'],Equipment:['Equipment'],Statue:['Statue'],UpgradeBuilding:['UpgradeBuilding'],Backdrop:['BackDrop']};
            const cats = catMap[category] || [category];
            let entries = [];
            cats.forEach(c => { entries = entries.concat(MetadataDB.getByCategory(c)); });
            if (category === 'Unit' && typeof MetadataDB.getUnits === 'function') entries = MetadataDB.getUnits();
            if (q) { const ql = q.toLowerCase(); entries = entries.filter(e => e.DisplayName && e.DisplayName.toLowerCase().includes(ql)); }
            entries.slice(0, 100).forEach(entry => {
                const item = this._el('div', {class:'picker-item'});
                item.innerHTML = `<span class="picker-icon">${this._getCatIcon(entry.Category)}</span><span class="picker-name">${entry.DisplayName || '?'}</span><span class="picker-id">${entry.Category || ''}</span>`;
                item.onclick = () => { modal.style.display = 'none'; onSelect(entry); };
                list.appendChild(item);
            });
            if (!entries.length) list.innerHTML = '<div class="picker-empty">No matching items</div>';
        };
        render('');
        search.oninput = () => render(search.value);
    },

    // ─── HELPERS ───
    _el(tag,attrs){const el=document.createElement(tag);if(attrs)Object.entries(attrs).forEach(([k,v])=>{if(k==='textContent')el.textContent=v;else if(k==='class')el.className=v;else if(k==='innerHTML')el.innerHTML=v;else el.setAttribute(k,v);});return el;},
    _propGroup(title,rows){const g=this._el('div',{class:'property-group'});g.appendChild(this._el('div',{class:'property-group-header',textContent:title}));rows.forEach(r=>{if(r instanceof HTMLElement)g.appendChild(r);});return g;},
    _propRow(label,el){const r=this._el('div',{class:'property-row'});const l=this._el('div',{class:'property-label',title:label});l.textContent=this._humanize(label);const v=this._el('div',{class:'property-value'});v.appendChild(el);r.appendChild(l);r.appendChild(v);return r;},
    _propScalar(l,v,p){if(typeof v==='string')return this._propText(l,v,x=>LevelParser.set(p,x));if(typeof v==='number')return this._propNumber(l,v,x=>LevelParser.set(p,x));return this._propRow(l,this._el('span',{textContent:String(v)}));},
    _propText(l,v,fn){const i=this._el('input',{type:'text',value:v||''});i.onchange=()=>fn(i.value);return this._propRow(l,i);},
    _propNumber(l,v,fn){const i=this._el('input',{type:'number',value:v});i.onchange=()=>{fn(parseInt(i.value)||0);};return this._propRow(l,i);},
    _propFP(l,raw,fn){const i=this._el('input',{type:'number',step:'0.1',value:Schema.fpToReal(raw).toFixed(2)});i.title=`Raw: ${raw}`;i.onchange=()=>{fn(parseFloat(i.value)||0);this.renderTimeline();};return this._propRow(l,i);},
    _propCheckbox(l,v,fn){const i=this._el('input',{type:'checkbox'});i.checked=!!(v&&v!=='0');i.onchange=()=>fn(i.checked);return this._propRow(l,i);},
    _propSelect(l,v,opts,fn){const s=this._el('select');opts.forEach(o=>{const opt=this._el('option',{value:o.value});opt.textContent=o.label;if(String(o.value)===String(v))opt.selected=true;s.appendChild(opt);});s.onchange=()=>fn(parseInt(s.value));return this._propRow(l,s);},
    _propAssetRef(l,id,path){const name=MetadataDB.resolveWithFallback(id);const w=this._el('div',{style:'display:flex;gap:4px;align-items:center;width:100%'});const sp=this._el('span',{style:'flex:1;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer;font-weight:500',title:`ID: ${id}`});sp.textContent=name;if(name.startsWith('Unknown')){sp.style.color='var(--status-warning)';const rb=this._el('button',{class:'spawn-btn',textContent:'🔍',title:'Resolve'});rb.onclick=()=>{const e=MetadataDB.getEntry(id);if(e){sp.textContent=e.DisplayName;sp.style.color='';}else this.log(`ID ${id} not in metadata`,'warning');};w.appendChild(sp);w.appendChild(rb);}else{sp.onclick=()=>{const e=MetadataDB.getEntry(id);if(e)this.showRefExplorer(e);};w.appendChild(sp);}return this._propRow(this._humanize(l),w);},
    // Asset picker row: shows name + [Change] button that opens picker
    _propAssetPicker(label,id,category,onChange){const name=MetadataDB.resolveWithFallback(id);const w=this._el('div',{style:'display:flex;gap:4px;align-items:center;width:100%'});const sp=this._el('span',{style:'flex:1;font-size:12px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap'});sp.textContent=name;w.appendChild(sp);const btn=this._el('button',{class:'spawn-btn',textContent:'⟳',title:`Change ${category}`});btn.onclick=()=>this.openAssetPicker(category,entry=>{onChange(String(entry.Id));sp.textContent=entry.DisplayName;});w.appendChild(btn);return this._propRow(label,w);},
    _makeMenu(items){const w=this._el('div',{style:'position:relative;display:inline-block'});const btn=this._el('button',{class:'item-menu-btn',textContent:'⋮'});btn.onclick=e=>{e.stopPropagation();document.querySelectorAll('.item-menu-dropdown').forEach(m=>m.remove());const dd=this._el('div',{class:'item-menu-dropdown'});items.forEach(it=>{const d=this._el('div',{class:'item-menu-item'});d.textContent=it.l;d.onclick=e2=>{e2.stopPropagation();dd.remove();it.a();};dd.appendChild(d);});w.appendChild(dd);setTimeout(()=>document.addEventListener('click',function cl(){dd.remove();document.removeEventListener('click',cl);},{once:true}),0);};w.appendChild(btn);return w;},
};

window.addEventListener('DOMContentLoaded', () => App.init());
