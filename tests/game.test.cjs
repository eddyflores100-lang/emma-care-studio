const { test, beforeEach, afterEach } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const ts = require('typescript')

// Run the actual TypeScript game modules with Node's test runner.
require.extensions['.ts'] = (mod, filename) => {
  mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020,
      esModuleInterop: true }, fileName: filename,
  }).outputText, filename)
}
const realTimeout = global.setTimeout
global.setTimeout = (...args) => { const t = realTimeout(...args); t.unref(); return t }
global.window = {}
let storage = new Map()
global.localStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
}
const { useStudio: store } = require('../src/lib/studio/store.ts')
const { parseVoiceCommand, voiceEngine } = require('../src/lib/studio/voice.ts')
const { makeDemoProject } = require('../src/lib/studio/catalog.ts')
const initial = structuredClone(Object.fromEntries(Object.entries(store.getState())
  .filter(([, v]) => typeof v !== 'function')))
let now = 1_000_000
const realRandom = Math.random
const realNow = Date.now
beforeEach(() => {
  now = 1_000_000
  Date.now = () => now
  Math.random = () => 0.5
  storage = new Map()
  store.setState(structuredClone(initial))
  store.setState({ hydrated: true })
})
afterEach(() => { Date.now = realNow; Math.random = realRandom; voiceEngine.stop() })
function start() { store.getState().startPlay(); return store.getState() }
function pet(kind = 'dog') { return store.getState().objects.find(o => o.catalogId === kind) }
function command(text) { return store.getState().voiceCommand(text) }
function advance(ms) {
  for (let t = 0; t < ms; t += 100) { now += 100; store.getState().moveTick(100) }
}
test('demo rules refer to the dog and toy, not shifted array indices', () => {
  const d = makeDemoProject()
  assert.equal(d.objects.find(o => o.id === d.rules[0].petId).catalogId, 'dog')
  assert.equal(d.objects.find(o => o.id === d.rules[0].targetId).catalogId, 'toy')
})
test('short renamed pets are recognized exactly', () => {
  assert.equal(parseVoiceCommand('Pío ven', [{ id: 'bird', name: 'Pío' }]).named.length, 1)
})
test('pet names containing regex punctuation cannot crash parsing', () => {
  assert.equal(parseVoiceCommand('A+[x] ven', [{ id: 'dog', name: 'A+[x]' }]).named.length, 1)
})
test('exact names win over fuzzy matches to other pets', () => {
  const parsed = parseVoiceCommand('Max ven', [{ id: 'a', name: 'Max' }, { id: 'b', name: 'Maz' }])
  assert.deepEqual(parsed.named.map(p => p.id), ['a'])
})
test('Max quieto leaves other animals free and stays until released', () => {
  start(); const max = pet(), cat = pet('cat')
  command('Max quieto')
  assert.equal(store.getState().pets[max.id].obey.cmd, 'stay')
  assert.equal(store.getState().pets[cat.id].obey, null)
  const pos = { x: max.x, y: max.y }; advance(12000)
  assert.deepEqual({ x: pet().x, y: pet().y }, pos)
  command('Max libre'); assert.equal(store.getState().pets[max.id].obey, null)
})
test('quietos separates fighting pets and stops both sides without injuring them', () => {
  start(); const max = pet(), cat = pet('cat'), s = store.getState()
  store.setState({ objects: s.objects.map(o => o.id === max.id || o.id === cat.id
    ? { ...o, x: 50, y: 50 } : o), pets: { ...s.pets,
    [max.id]: { ...s.pets[max.id], chaseUntil: now + 5000, chaseRole: 'chase', chasePartner: cat.id },
    [cat.id]: { ...s.pets[cat.id], chaseUntil: now + 5000, chaseRole: 'flee', chasePartner: max.id } } })
  command('quietos')
  assert.ok(Math.hypot(pet().x - pet('cat').x, pet().y - pet('cat').y) >= 10)
  assert.equal(store.getState().pets[max.id].chaseUntil, 0)
  assert.equal(store.getState().pets[cat.id].chaseUntil, 0)
  advance(200); assert.equal(store.getState().pets[max.id].injured, false)
})
test('calling a name answers with sound caption and comes closer', () => {
  start(); const max = pet(); const before = Math.hypot(max.x - 50, max.y - 84)
  command('Max'); assert.match(store.getState().say[max.id].text, /voy|aquí|aqui/i)
  advance(2000); assert.ok(Math.hypot(pet().x - 50, pet().y - 84) < before)
})
test('a resting pet still answers its name', () => {
  start(); const max = pet(), s = store.getState()
  store.setState({ pets: { ...s.pets, [max.id]: { ...s.pets[max.id], state: 'rest', injured: true } } })
  command('Max'); assert.ok(store.getState().say[max.id])
  assert.equal(store.getState().pets[max.id].state, 'rest')
})
test('Max a la casa transfers to the unlocked house without moving other pets', () => {
  start(); const max = pet(); store.setState({ unlockedLevels: ['jardin', 'casa'] })
  command('Max a la casa'); assert.equal(pet().level, 'casa'); assert.equal(pet('cat').level, 'jardin')
  store.getState().setLevel('casa'); assert.equal(store.getState().objects.find(o => o.id === max.id).level, 'casa')
})
test('locked travel never charges coins or moves the animal', () => {
  start(); store.setState({ coins: 1000 }); command('Max a la playa')
  assert.equal(pet().level, 'jardin'); assert.equal(store.getState().coins, 1000)
})
test('renamed pets can be recalled from another unlocked world', () => {
  start(); store.getState().updateObject(pet().id, { name: 'Toby', level: 'casa' })
  store.setState({ unlockedLevels: ['jardin', 'casa'] }); command('Toby ven')
  assert.equal(pet().level, 'jardin'); assert.equal(store.getState().pets[pet().id].obey.cmd, 'come')
})
test('different destinations are not suppressed by the same cooldown', () => {
  start(); store.setState({ unlockedLevels: ['jardin', 'casa', 'playa'] })
  command('Max a la casa'); command('Max a la playa'); assert.equal(pet().level, 'playa')
})
test('directed feeding actually feeds after reaching the bowl', () => {
  start(); const before = store.getState().pets[pet().id].stats.comida
  command('Max a comer'); advance(10000)
  assert.ok(store.getState().pets[pet().id].stats.comida >= Math.min(100, before + 18))
})
test('level and XP survive editing and restarting play', () => {
  start(); const max = pet(), s = store.getState()
  store.setState({ pets: { ...s.pets, [max.id]: { ...s.pets[max.id], lvl: 5, xp: 72, injured: true } } })
  store.getState().stopPlay(); start()
  assert.equal(store.getState().pets[max.id].lvl, 5); assert.equal(store.getState().pets[max.id].xp, 72)
  assert.equal(store.getState().pets[max.id].injured, true)
})
test('save and hydration round trip preserves progression and pet worlds', () => {
  start(); const max = pet(), s = store.getState()
  store.setState({ pets: { ...s.pets, [max.id]: { ...s.pets[max.id], lvl: 4, xp: 62 } } })
  store.getState().saveSilent(); store.setState({ pets: {}, hydrated: false }); store.getState().hydrate()
  assert.equal(store.getState().pets[max.id].lvl, 4); assert.equal(store.getState().pets[max.id].xp, 62)
})
test('new project keeps a recoverable backup of current unsaved changes', () => {
  start(); store.setState({ coins: 123 }); store.getState().newProject()
  assert.equal(JSON.parse(localStorage.getItem('emma-care-studio-backup')).coins, 123)
  assert.equal(store.getState().restoreBackup(), true); assert.equal(store.getState().coins, 123)
})
test('failed backup leaves the current project intact', () => {
  store.setState({ coins: 123 }); const orig = localStorage.setItem
  localStorage.setItem = () => { throw new Error('quota') }
  try { store.getState().newProject(); assert.equal(store.getState().coins, 123) }
  finally { localStorage.setItem = orig }
})
test('invalid imports are atomic and cannot replace the current game', () => {
  store.setState({ coins: 123 })
  assert.equal(store.getState().importProject('{"version":3,"objects":[null]}'), false)
  assert.equal(store.getState().coins, 123)
})
test('pets lose more energy while running and stop chasing when exhausted', () => {
  start(); const max = pet(), cat = pet('cat'), s = store.getState()
  store.setState({ pets: { ...s.pets, [max.id]: { ...s.pets[max.id], stats: { ...s.pets[max.id].stats, energia: 5 },
    chaseUntil: now + 5000, chaseRole: 'chase', chasePartner: cat.id } } })
  advance(100); assert.equal(store.getState().pets[max.id].chaseUntil, 0)
})
test('continuous game changes cannot postpone autosave indefinitely', t => {
  const { createAutosave } = require('../src/lib/studio/autosave.ts')
  t.mock.timers.enable({ apis: ['setTimeout'] })
  let saves = 0
  const autosave = createAutosave(() => saves++)
  for (let i = 0; i < 100; i++) { autosave.schedule(); t.mock.timers.tick(100) }
  assert.ok(saves >= 8)
  autosave.dispose()
})
test('speech alternatives execute at most one final recognized command', () => {
  let calls = []; let recognition
  window.SpeechRecognition = class { constructor() { recognition = this } start() {} stop() {} }
  voiceEngine.setHandler(text => { calls.push(text); return text === 'Max ven' ? 'ok' : 'unknown' })
  voiceEngine.start()
  recognition.onresult({ resultIndex: 0, results: [{ isFinal: false, length: 1, 0: { transcript: 'Max' } }] })
  assert.equal(calls.length, 0)
  recognition.onresult({ resultIndex: 0, results: [{ isFinal: true, length: 2,
    0: { transcript: 'Max ven' }, 1: { transcript: 'Misi ven' } }] })
  assert.deepEqual(calls, ['Max ven'])
  delete window.SpeechRecognition
})
test('an unknown named command cannot accidentally order all pets', () => {
  start(); assert.equal(command('Lola quieto'), 'unknown')
  assert.ok(Object.values(store.getState().pets).every(rt => !rt.obey))
})
test('directed bath improves hygiene even when it starts above 90', () => {
  start(); store.getState().addObject('bath', 49, 57)
  const max = pet(), s = store.getState()
  store.setState({ pets: { ...s.pets, [max.id]: { ...s.pets[max.id], stats: { ...s.pets[max.id].stats, higiene: 91 } } } })
  command('Max bañate'); advance(1000)
  assert.equal(store.getState().pets[max.id].stats.higiene, 100)
})
test('run and walk commands traverse the field and running consumes more energy', () => {
  start(); const max = pet(), cat = pet('cat')
  command('Max corre'); command('Misi pasea')
  const dogEnergy = store.getState().pets[max.id].stats.energia, catEnergy = store.getState().pets[cat.id].stats.energia
  advance(2000); store.getState().gameTick()
  assert.ok(Math.hypot(pet().x - max.x, pet().y - max.y) > Math.hypot(pet('cat').x - cat.x, pet('cat').y - cat.y))
  assert.ok(dogEnergy - store.getState().pets[max.id].stats.energia > catEnergy - store.getState().pets[cat.id].stats.energia)
})
test('legacy v2 projects migrate without losing coins or objects', () => {
  const s = store.getState()
  assert.equal(s.importProject(JSON.stringify({ version: 2, objects: s.objects, rules: s.rules,
    coins: 321, savedAt: '', unlockedLevels: ['jardin'], currentLevel: 'jardin' })), true)
  assert.equal(store.getState().coins, 321); start(); assert.ok(store.getState().pets[pet().id])
})
test('jump and dance commands hold their animation state for the named animal only', () => {
  start(); command('Max salta'); command('Misi baila')
  assert.equal(store.getState().pets[pet().id].obey.cmd, 'jump')
  assert.equal(store.getState().pets[pet('cat').id].obey.cmd, 'dance')
})
test('running rivals cross the field and trigger screen shake', () => {
  start(); const max = pet(), cat = pet('cat'), s = store.getState()
  store.setState({ objects: [{ ...max, x: 20, y: 30, speed: 14 }, { ...cat, x: 28, y: 30, speed: 14 }],
    pets: { [max.id]: { ...s.pets[max.id], state: 'idle', wanderAt: now + 10000 },
      [cat.id]: { ...s.pets[cat.id], state: 'idle', wanderAt: now + 10000 } } })
  const originalRandom = Math.random; Math.random = () => 0.8
  try {
    advance(100); assert.ok(store.getState().shakeUntil > now)
    const xs = [], ys = []
    for (let i = 0; i < 50; i++) { advance(100); xs.push(pet('cat').x); ys.push(pet('cat').y) }
    assert.ok(Math.max(...xs) - Math.min(...xs) > 45)
    assert.ok(Math.max(...ys) - Math.min(...ys) > 35)
  } finally { Math.random = originalRandom }
})
test('save errors are visible and successful retry clears them', () => {
  const orig = localStorage.setItem
  localStorage.setItem = () => { throw new Error('quota') }
  try { assert.equal(store.getState().saveSilent(), false); assert.equal(store.getState().saveError, true) }
  finally { localStorage.setItem = orig }
  assert.equal(store.getState().saveSilent(), true); assert.equal(store.getState().saveError, false)
})
test('a longer overlapping pet name selects only that pet', () => {
  const p = parseVoiceCommand('Max Junior quieto', [{id:'a',name:'Max'}, {id:'b',name:'Max Junior'}])
  assert.deepEqual(p.named.map(o=>o.id), ['b'])
})
test('temporary arrival holds do not become permanent on reload', () => {
  start(); const max=pet(); store.getState().updateObject(max.id, {x:50,y:84})
  command('Max ven'); advance(100); store.getState().saveSilent()
  store.setState({hydrated:false,pets:{}}); store.getState().hydrate()
  assert.ok(store.getState().pets[max.id].obey.until < Infinity)
})
test('repeating hospital travel preserves the medical return world', () => {
  start(); const max=pet(),s=store.getState()
  store.setState({unlockedLevels:['jardin','hospital'],pets:{...s.pets,[max.id]:{...s.pets[max.id],injured:true}}})
  command('Max al hospital'); now+=1000; command('Max al hospital')
  assert.equal(pet().home,'jardin')
})
test('editing during a chase clears transient combat without injuring pets on resume', () => {
  start(); const max=pet(),cat=pet('cat'),s=store.getState()
  store.setState({pets:{...s.pets,[max.id]:{...s.pets[max.id],chaseUntil:now+5000,chaseRole:'chase',chasePartner:cat.id}}})
  store.getState().stopPlay(); assert.equal(store.getState().pets[max.id].chaseUntil,0)
  now+=10000; start(); advance(100); assert.equal(store.getState().pets[max.id].injured,false)
})
test('screen wake lock is reacquired after returning to the game and released on cleanup', async () => {
  const { keepScreenAwake } = require('../src/lib/studio/screen.ts')
  let requests = 0, releases = 0, visibilityHandler
  const doc = {visibilityState:'visible',addEventListener:(name,fn)=>visibilityHandler=fn,removeEventListener:()=>{visibilityHandler=null}}
  const nav = {wakeLock:{request:async ()=>{requests++;return {released:false,release:async()=>{releases++}}}}}
  const cleanup=keepScreenAwake(nav,doc)
  await new Promise(resolve=>setImmediate(resolve)); assert.equal(requests,1)
  doc.visibilityState='hidden';visibilityHandler();await new Promise(resolve=>setImmediate(resolve))
  doc.visibilityState='visible';visibilityHandler();await new Promise(resolve=>setImmediate(resolve));assert.equal(requests,2)
  cleanup();await new Promise(resolve=>setImmediate(resolve));assert.equal(releases,2)
})
test('late wake lock acquisition after leaving play is released immediately', async () => {
  const { keepScreenAwake } = require('../src/lib/studio/screen.ts')
  let resolveRequest, releases=0
  const cleanup=keepScreenAwake({wakeLock:{request:()=>new Promise(resolve=>resolveRequest=resolve)}},
    {visibilityState:'visible',addEventListener(){},removeEventListener(){}})
  cleanup();resolveRequest({released:false,release:async()=>{releases++}})
  await new Promise(resolve=>setImmediate(resolve));assert.equal(releases,1)
})

test('renaming in configuration immediately switches voice commands to the assigned name', () => {
  start(); const dog = pet()
  store.getState().updateObject(dog.id, { name: 'Edgar' })
  assert.equal(command('Edgar quieto'), 'ok')
  assert.equal(store.getState().pets[dog.id].obey.cmd, 'stay')
  store.getState().updateObject(dog.id, { name: 'Lucía Fernanda' })
  now += 1000
  assert.equal(command('Edgar ven'), 'unknown')
  assert.equal(command('Lucia Fernanda ven'), 'ok')
  assert.equal(store.getState().pets[dog.id].obey.cmd, 'come')
  assert.equal(store.getState().objects.find(o => o.id === dog.id).name, 'Lucía Fernanda')
})

test('species names select only the unique animal and ambiguous species do nothing', () => {
  start(); command('gato ven')
  assert.equal(store.getState().pets[pet('cat').id].obey.cmd, 'come')
  assert.equal(store.getState().pets[pet().id].obey, null)
  store.getState().addObject('cat'); now += 1000
  assert.equal(command('gato quieto'), 'unknown')
})
test('destination wins over come in a complete travel phrase', () => {
  assert.equal(parseVoiceCommand('Max ven a la casa', [{id:'a',name:'Max'}]).kind, 'travel')
})
test('casita occupants persist on reload and can be released individually', () => {
  start(); command('Max a la casita'); advance(15000)
  const max = pet(); assert.ok(store.getState().pets[max.id].inside)
  store.getState().saveSilent(); store.setState({hydrated:false,pets:{}}); store.getState().hydrate()
  const house = store.getState().pets[max.id].inside; assert.ok(house)
  store.getState().comeOutOf(house,max.id); assert.equal(store.getState().pets[max.id].inside,null)
})
test('hospital admission requires coins for treatment and survives reload', () => {
  start(); const max=pet(),s=store.getState()
  store.setState({unlockedLevels:['jardin','hospital'],pets:{...s.pets,[max.id]:{...s.pets[max.id],injured:true}}})
  command('Max al hospital'); store.getState().setLevel('hospital'); now+=120000; store.getState().gameTick()
  assert.equal(store.getState().pets[max.id].injured,true)
  assert.equal(store.getState().pets[max.id].hospitalStatus,'waiting')
  command('Max al patio'); assert.equal(pet().level,'hospital')
  store.getState().saveSilent(); store.setState({hydrated:false,pets:{}}); store.getState().hydrate()
  assert.equal(store.getState().pets[max.id].hospitalStatus,'waiting')
  store.getState().select(max.id); store.getState().playerAction('curar')
  assert.equal(store.getState().pets[max.id].injured,true)
  store.setState({coins:20}); now+=5000; store.getState().playerAction('curar')
  assert.equal(store.getState().coins,5)
  assert.equal(store.getState().pets[max.id].hospitalStatus,'treating')
  now+=30000; store.getState().gameTick()
  assert.equal(store.getState().pets[max.id].hospitalStatus,'ready')
  assert.equal(pet().level,'hospital')
  command('Max al patio'); assert.equal(pet().level,'jardin')
})
test('hospital treatment finishes while viewing another world', () => {
  start(); const max=pet(),s=store.getState()
  store.setState({unlockedLevels:['jardin','hospital'],coins:15,pets:{...s.pets,[max.id]:{...s.pets[max.id],injured:true}}})
  command('Max al hospital'); store.getState().setLevel('hospital'); store.getState().select(max.id)
  store.getState().playerAction('curar'); store.getState().setLevel('jardin'); now+=30000; store.getState().gameTick()
  assert.equal(store.getState().pets[max.id].injured,false)
  assert.equal(pet().level,'hospital')
})
test('patients can earn treatment coins through gentle care', () => {
  start(); const max=pet(),s=store.getState()
  store.setState({unlockedLevels:['jardin','hospital'],pets:{...s.pets,[max.id]:{...s.pets[max.id],injured:true}}})
  command('Max al hospital'); store.getState().setLevel('hospital'); store.getState().select(max.id)
  store.getState().playerAction('acariciar'); assert.ok(store.getState().coins>0)
})
test('autonomous exploration covers distinct areas in every world', () => {
  for(const level of ['jardin','casa','hospital','playa']) {
    start(); const max=pet(),s=store.getState()
    store.setState({currentLevel:level,objects:[{...max,level,speed:20,x:50,y:50}],
      pets:{[max.id]:{...s.pets[max.id],obey:null,wanderAt:0}},unlockedLevels:['jardin','casa','hospital','playa']})
    const xs=[],ys=[]; for(let i=0;i<1200;i++){advance(100);xs.push(pet().x);ys.push(pet().y)}
    assert.ok(Math.max(...xs)-Math.min(...xs)>50,level+' x coverage')
    assert.ok(Math.max(...ys)-Math.min(...ys)>50,level+' y coverage')
  }
})
test('selected command buttons keep stay persistent just like voice', () => {
  start(); store.getState().select(pet().id); store.getState().giveCommand('stay')
  assert.equal(store.getState().pets[pet().id].obey.until,Infinity)
})
test('tapping to calm rivals does not injure them through the chase-end path', () => {
  start(); const max=pet(),cat=pet('cat'),s=store.getState()
  store.setState({pets:{...s.pets,[max.id]:{...s.pets[max.id],chaseUntil:now+5000,chaseRole:'chase',chasePartner:cat.id},
    [cat.id]:{...s.pets[cat.id],chaseUntil:now+5000,chaseRole:'flee',chasePartner:max.id}}})
  assert.equal(store.getState().calmAll(50,50),true)
  Math.random=()=>0; advance(100)
  assert.equal(store.getState().pets[max.id].injured,false)
  assert.equal(store.getState().pets[cat.id].injured,false)
})
test('come and follow go to the last touched point', () => {
  start(); store.getState().setOwnerPoint(90,10); command('Max sígueme')
  const initialDistance=Math.hypot(pet().x-90,pet().y-10); advance(1000)
  assert.ok(Math.hypot(pet().x-90,pet().y-10)<initialDistance)
  assert.equal(store.getState().pets[pet().id].obey.cmd,'follow')
})
test('a named greeting answers only that animal without changing its location', () => {
  start(); store.setState({unlockedLevels:['jardin','casa']}); command('Max a la casa'); command('Max hola')
  assert.equal(pet().level,'casa'); assert.match(store.getState().say[pet().id].text,/hola/i)
  assert.equal(store.getState().say[pet('cat').id],undefined)
})
test('duplicate configured names cannot choose an animal arbitrarily', () => {
  start(); store.getState().updateObject(pet('cat').id,{name:'Max'})
  assert.equal(command('Max quieto'),'unknown')
  store.getState().select(pet('cat').id); store.getState().giveCommand('stay')
  assert.equal(store.getState().pets[pet('cat').id].obey.cmd,'stay')
  assert.equal(store.getState().pets[pet().id].obey,null)
})
test('removing an occupied casita releases its occupants', () => {
  start(); command('Max a la casita'); advance(15000)
  const house=store.getState().pets[pet().id].inside; assert.ok(house)
  store.getState().removeObject(house)
  assert.equal(store.getState().pets[pet().id].inside,null)
  assert.equal(store.getState().pets[pet().id].state,'idle')
})
test('sick patients can earn coins without leaving the hospital', () => {
  start(); const max=pet(),s=store.getState()
  store.setState({unlockedLevels:['jardin','hospital'],pets:{...s.pets,[max.id]:{...s.pets[max.id],sick:true}}})
  command('Max al hospital'); store.getState().setLevel('hospital'); store.getState().select(max.id)
  store.getState().playerAction('acariciar'); assert.ok(store.getState().coins>0)
})
test('walking to the owner goes around a solid obstacle', () => {
  start(); const max=pet(),s=store.getState(),tree=s.objects.find(o=>o.catalogId==='tree')
  store.setState({objects:[{...max,x:20,y:50,speed:10},{...tree,x:50,y:50}],pets:{[max.id]:s.pets[max.id]}})
  store.getState().setOwnerPoint(80,50); command('Max ven')
  let closest=100
  for(let i=0;i<180;i++){
    advance(100);closest=Math.min(closest,Math.hypot(pet().x-50,pet().y-50))
    if(Math.hypot(pet().x-80,pet().y-50)<2) break
  }
  assert.ok(closest>=6,'does not cross the tree')
  assert.ok(Math.hypot(pet().x-80,pet().y-50)<10,'reaches the owner')
})
test('care missions preserve progress and award a bonus after three cares', () => {
  start(); store.getState().select(pet().id)
  for(let i=0;i<2;i++){store.getState().playerAction('acariciar');now+=4000}
  store.getState().saveSilent(); store.setState({hydrated:false}); store.getState().hydrate()
  assert.equal(store.getState().careMissions.acariciar,2)
  store.getState().playerAction('acariciar')
  assert.equal(store.getState().coins,11)
  assert.equal(store.getState().careMissions.acariciar,0)
})
test('gentle shared care builds friendships that prevent rival pursuits', () => {
  start(); const max=pet(),cat=pet('cat'),s=store.getState()
  store.setState({objects:s.objects.map(o=>o.id===max.id||o.id===cat.id?{...o,x:50,y:50}:o)})
  store.getState().select(max.id)
  for(let i=0;i<6;i++){store.getState().playerAction('acariciar');now+=4000}
  assert.ok(store.getState().pets[max.id].bonds[cat.id]>=12)
  store.getState().saveSilent(); store.setState({hydrated:false,pets:{}});store.getState().hydrate()
  assert.ok(store.getState().pets[max.id].bonds[cat.id]>=12)
  advance(100);assert.equal(store.getState().pets[max.id].chaseUntil,0)
})
test('a named ball command lets only that pet fetch the ball', () => {
  start(); command('Max quieto'); command('Misi trae la pelota')
  store.getState().throwBallAt(85,85)
  const cat=pet('cat'),dog=pet(),before=Math.hypot(cat.x-85,cat.y-85)
  advance(1000)
  assert.ok(Math.hypot(pet('cat').x-85,pet('cat').y-85)<before)
  assert.equal(pet().x,dog.x)
  assert.equal(store.getState().ball.targetId,cat.id)
})
test('sleeping patients complete paid treatment in the visible hospital', () => {
  start(); const max=pet(),s=store.getState()
  store.setState({unlockedLevels:['jardin','hospital'],coins:15,pets:{...s.pets,[max.id]:{...s.pets[max.id],injured:true}}})
  command('Max al hospital');store.getState().setLevel('hospital');store.getState().select(max.id)
  store.getState().playerAction('curar');store.getState().playerAction('dormir');now+=26000;store.getState().gameTick()
  assert.equal(store.getState().pets[max.id].hospitalStatus,'ready')
  assert.equal(store.getState().pets[max.id].injured,false)
})
test('quieto remains active when a sleeping pet wakes and after reloading', () => {
  start();const max=pet(),s=store.getState()
  store.setState({pets:{...s.pets,[max.id]:{...s.pets[max.id],state:'sleep',stats:{...s.pets[max.id].stats,descanso:91}}}})
  command('Max quieto');store.getState().gameTick();advance(100)
  assert.equal(store.getState().pets[max.id].obey.cmd,'stay')
  assert.equal(pet().x,max.x)
  store.getState().saveSilent();store.setState({hydrated:false,pets:{}});store.getState().hydrate()
  assert.equal(store.getState().pets[max.id].obey.until,Infinity)
})
test('a new project resets its care mission counters', () => {
  start();store.setState({careMissions:{alimentar:2,acariciar:1,banar:1}})
  store.getState().newProject()
  assert.deepEqual(store.getState().careMissions,{alimentar:0,acariciar:0,banar:0})
})

test('named commands reject unknown words and negated movement', () => {
  const pets = [{id:'max',name:'Max',catalogId:'dog'}, {id:'misi',name:'Misi',catalogId:'cat'}]
  for (const phrase of ['Max compra zapatos', 'Max no vayas a casa', 'Max ven Misi corre', 'Max a casa y a playa', 'Max a la cama y a comer', 'Max ven y ve a casa', 'Max a casa y a casita']) {
    assert.equal(parseVoiceCommand(phrase,pets), null, phrase)
  }
  assert.equal(parseVoiceCommand('Max ve a la casa por favor',pets).kind,'travel')
  assert.equal(parseVoiceCommand('Maks ven aquí',pets).named[0].id,'max')
  assert.equal(parseVoiceCommand('gato maúlla',pets).kind,'greet')
})

test('landscape lock is restored on fullscreen and visible return', async () => {
  const { maintainLandscape } = require('../src/lib/studio/screen.ts')
  const listeners = {}; let locks=0
  const doc = {visibilityState:'visible',fullscreenElement:{},addEventListener:(k,f)=>listeners[k]=f,removeEventListener:k=>delete listeners[k]}
  const cleanup=maintainLandscape(doc,{lock:async mode=>{assert.equal(mode,'landscape');locks++}})
  await Promise.resolve(); assert.equal(locks,1)
  doc.visibilityState='hidden'; listeners.visibilitychange(); assert.equal(locks,1)
  doc.visibilityState='visible'; listeners.visibilitychange(); await Promise.resolve(); assert.equal(locks,2)
  listeners.fullscreenchange(); await Promise.resolve(); assert.equal(locks,3)
  cleanup(); assert.deepEqual(listeners,{})
})

test('voice return creates a fresh recognizer and ignores stale results', () => {
  const { attachVoiceLifecycle } = require('../src/lib/studio/voice.ts')
  const recognizers=[]; let calls=0
  window.SpeechRecognition=class {constructor(){recognizers.push(this)}start(){}stop(){}}
  const listeners={}; const doc={visibilityState:'visible',addEventListener:(k,f)=>listeners[k]=f,removeEventListener:k=>delete listeners[k]}
  const cleanup=attachVoiceLifecycle(doc)
  voiceEngine.setHandler(()=>{calls++;return 'ok'});voiceEngine.start()
  const old=recognizers.at(-1)
  doc.visibilityState='hidden';listeners.visibilitychange();assert.equal(voiceEngine.getSnapshot().listening,false)
  doc.visibilityState='visible';listeners.visibilitychange();const fresh=recognizers.at(-1)
  assert.notEqual(old,fresh)
  const event={resultIndex:0,results:[{isFinal:true,length:1,0:{transcript:'Max ven'}}]}
  old.onresult(event);assert.equal(calls,0)
  fresh.onresult(event);fresh.onresult(event);assert.equal(calls,1)
  cleanup();delete window.SpeechRecognition
})

test('pet answers wait for resumed audio and produce species sounds plus acknowledgement', async () => {
  const { petResponse, setMuted }=require('../src/lib/studio/sound.ts')
  let context,resolveResume;const started=[]
  const param={setValueAtTime(){},exponentialRampToValueAtTime(){},linearRampToValueAtTime(){}}
  window.AudioContext=class {
    constructor(){context=this;this.state='suspended';this.currentTime=0;this.destination={}}
    resume(){return new Promise(resolve=>resolveResume=()=>{this.state='running';resolve()})}
    createOscillator(){return {frequency:param,connect(){},start:t=>started.push(t),stop(){}}}
    createGain(){return {gain:param,connect(){}}}
  }
  setMuted(false);const reply=petResponse('cat','calm')
  assert.deepEqual(started,[]);resolveResume();await reply
  assert.ok(started.length>=4);assert.ok(started.some(t=>t>=1.1))
  setMuted(true);const count=started.length;await petResponse('cat','greet');assert.equal(started.length,count)
  setMuted(false);context.state='closed';delete window.AudioContext
})


test('landscape recovery tolerates browsers without orientation API', () => {
  const {maintainLandscape}=require('../src/lib/studio/screen.ts')
  const doc={visibilityState:'visible',fullscreenElement:{},addEventListener(){},removeEventListener(){}}
  const previous=global.screen;global.screen={}
  try {assert.doesNotThrow(()=>maintainLandscape(doc)())} finally {global.screen=previous}
})

test('indoor worlds protect pets from rain without requiring a second shelter', () => {
  for (const level of ['casa','hospital']) {
    start(); const max=pet(); const s=store.getState()
    store.setState({currentLevel:level, objects:s.objects.map(o=>o.id===max.id?{...o,level,x:90,y:90}:o),
      event:null,nextEventAt:now+999999,
      pets:{...s.pets,[max.id]:{...s.pets[max.id],state:'idle',stats:{comida:70,descanso:70,energia:70,higiene:70,felicidad:70}}}})
    const before=structuredClone(Object.fromEntries(Object.entries(store.getState()).filter(([,v])=>typeof v!=='function')))
    store.getState().gameTick();const dry={...store.getState().pets[max.id].stats}
    store.setState({...before,event:{kind:'lluvia',until:now+20000}})
    store.getState().gameTick();assert.deepEqual(store.getState().pets[max.id].stats,dry,level)
  }
})

test('missions reward once and progress survives save and reload', () => {
  start();const max=pet();store.getState().select(max.id)
  for(let i=0;i<3;i++){store.getState().playerAction('acariciar');now+=4000}
  const before=store.getState().coins
  store.getState().claimMission('jardin-cuidado');assert.equal(store.getState().coins,before+8)
  store.getState().claimMission('jardin-cuidado');assert.equal(store.getState().coins,before+8)
  store.getState().equipPrize('pañuelo');store.getState().saveSilent()
  store.setState({hydrated:false,progression:require('../src/lib/studio/progression.ts').freshProgression()});store.getState().hydrate()
  assert.ok(store.getState().progression.claimed.includes('jardin-cuidado'));assert.equal(store.getState().progression.equipped,'pañuelo')
})
test('circuits require order, reject duplicate hits and reward completion only', () => {
  start();store.getState().select(pet().id);store.getState().startChallenge('circuito')
  assert.ok(store.getState().challenge);store.getState().hitChallenge(2)
  assert.equal(store.getState().challenge.mistakes,1);assert.equal(store.getState().progression.counters['circuito:jardin'],undefined)
  store.getState().hitChallenge(0);store.getState().hitChallenge(0)
  assert.equal(store.getState().challenge.targets.filter(t=>t.found).length,1)
  for(let id=1;id<5;id++)store.getState().hitChallenge(id)
  assert.equal(store.getState().challenge,null);assert.equal(store.getState().progression.counters['circuito:jardin'],1)
})
test('timed out challenges cannot receive awards', () => {
  start();store.getState().select(pet().id);store.getState().startChallenge('buscar');now+=60000
  store.getState().hitChallenge(0);assert.equal(store.getState().challenge,null);assert.equal(store.getState().progression.weekPoints,0)
})
test('daily hospital aid cannot be farmed or claimed without finishing', () => {
  start();store.setState({coins:0});store.getState().select(pet().id);store.getState().startChallenge('ayuda')
  store.getState().hitChallenge(0);assert.equal(store.getState().coins,0)
  for(let id=1;id<5;id++)store.getState().hitChallenge(id)
  assert.equal(store.getState().coins,20);store.setState({coins:0});store.getState().startChallenge('ayuda');assert.equal(store.getState().challenge,null)
})
test('new worlds require missions and initialize their new resident', () => {
  start();store.setState({coins:1000});store.getState().setLevel('parque');assert.equal(store.getState().currentLevel,'jardin')
  store.setState({progression:{...store.getState().progression,claimed:['jardin-cuidado','jardin-buscar']}})
  store.getState().setLevel('parque');assert.equal(store.getState().currentLevel,'parque');assert.equal(store.getState().coins,900)
  const resident=store.getState().objects.find(o=>o.level==='parque'&&o.catalogId==='rabbit');assert.ok(store.getState().pets[resident.id])
  store.getState().saveSilent();store.setState({hydrated:false});store.getState().hydrate();assert.ok(store.getState().unlockedLevels.includes('parque'))
  assert.equal(parseVoiceCommand('Nube al bosque',[resident]).level,'bosque')
})
test('new weekly records reset competitive bests while retaining lifetime records', () => {
  const {freshProgression,rollProgress,weekKey}=require('../src/lib/studio/progression.ts')
  const first=Date.UTC(2026,9,2),next=first+7*86400000
  const p={...freshProgression(),week:weekKey(first),weekPoints:100,best:{'jardin:buscar':90},weekBest:{'jardin:buscar':90}}
  const rolled=rollProgress(p,next);assert.equal(rolled.weekPoints,0);assert.deepEqual(rolled.weekBest,{})
  assert.equal(rolled.best['jardin:buscar'],90);assert.equal(rolled.history[0].points,100)
})
test('repeating a completed challenge at the same score cannot inflate weekly points', () => {
  start();store.getState().select(pet().id)
  const finish=()=>{store.getState().startChallenge('buscar');for(let i=0;i<5;i++)store.getState().hitChallenge(i)}
  finish();const points=store.getState().progression.weekPoints;finish();assert.equal(store.getState().progression.weekPoints,points)
})
test('care coin rewards are capped daily without preventing care', () => {
  start();const max=pet();store.getState().select(max.id)
  const {rollProgress}=require('../src/lib/studio/progression.ts')
  store.setState({progression:{...rollProgress(store.getState().progression),careRewards:30},pets:{...store.getState().pets,[max.id]:{...store.getState().pets[max.id],lvl:9,stats:{...store.getState().pets[max.id].stats,felicidad:40}}}})
  const coins=store.getState().coins;store.getState().playerAction('acariciar');assert.equal(store.getState().coins,coins);assert.ok(store.getState().pets[max.id].stats.felicidad>40)
})
test('a new project clears adventure records and borrowed cosmetics cannot be equipped', () => {
  start();store.getState().equipPrize('corona');assert.equal(store.getState().progression.equipped,null)
  store.setState({progression:{...store.getState().progression,claimed:['jardin-cuidado']}});store.getState().newProject()
  assert.deepEqual(store.getState().progression.claimed,[])
})

test('a waiting patient cannot be stranded by an already-used daily aid', () => {
  start();const max=pet();const s=store.getState(),{dayKey}=require('../src/lib/studio/progression.ts')
  store.setState({coins:0,currentLevel:'hospital',unlockedLevels:['jardin','hospital'],
    progression:{...s.progression,aidDay:dayKey()},objects:s.objects.map(o=>o.id===max.id?{...o,level:'hospital'}:o),
    pets:{...s.pets,[max.id]:{...s.pets[max.id],sick:true,hospitalStatus:'waiting',state:'rest'}}})
  store.getState().select(max.id);store.getState().startChallenge('ayuda');assert.ok(store.getState().challenge)
  for(let i=0;i<5;i++)store.getState().hitChallenge(i)
  assert.equal(store.getState().pets[max.id].hospitalStatus,'treating');assert.equal(store.getState().coins,0)
})
test('stopping or leaving a world cancels a challenge and cannot retain reward targets', () => {
  start();store.getState().select(pet().id);store.getState().startChallenge('buscar');store.getState().stopPlay();assert.equal(store.getState().challenge,null)
  store.getState().startPlay();store.getState().select(pet().id);store.getState().startChallenge('buscar')
  store.setState({unlockedLevels:['jardin','casa']});store.getState().setLevel('casa');assert.equal(store.getState().challenge,null)
})

test('finger petting advances care missions and distinct daily pets', () => {
  start();const {catalogById}=require('../src/lib/studio/catalog.ts')
  const pets=store.getState().objects.filter(o=>catalogById[o.catalogId]?.kind==='pet').slice(0,3)
  for(const p of pets)store.getState().petPet(p.id)
  assert.equal(store.getState().progression.dailyPets.length,pets.length)
  assert.equal(store.getState().progression.counters['care:jardin'],pets.length)
  const coins=store.getState().coins;store.getState().claimDaily();assert.equal(store.getState().coins,coins+12)
  store.getState().claimDaily();assert.equal(store.getState().coins,coins+12)
})
test('small record improvements retain their eventual ten-point coin reward', () => {
  start();const max=pet();store.getState().select(max.id)
  const finishAt=(seconds)=>{store.getState().startChallenge('buscar');now+=seconds*1000;for(let i=0;i<5;i++)store.getState().hitChallenge(i)}
  const initial=store.getState().coins;finishAt(20);finishAt(15);finishAt(10)
  assert.equal(store.getState().coins,initial+9)
})

test('wellbeing bonuses stop at the daily limit but reset on a new day', () => {
  start();const s=store.getState(),{rollProgress}=require('../src/lib/studio/progression.ts')
  store.setState({progression:{...rollProgress(s.progression),wellnessRewards:10},lastBonusAt:0,
    pets:Object.fromEntries(Object.entries(s.pets).map(([id,rt])=>[id,{...rt,stats:{...rt.stats,felicidad:100}}]))})
  const coins=store.getState().coins;store.getState().gameTick();assert.equal(store.getState().coins,coins)
  now+=86400000;store.getState().gameTick();assert.equal(store.getState().coins,coins+2)
  assert.equal(store.getState().progression.wellnessRewards,1)
})

test('natural name calls keep individual targeting', () => {
  start(); const max = pet(), cat = pet('cat')
  assert.equal(command('Oye, Max'), 'ok')
  assert.ok(store.getState().say[max.id])
  assert.equal(store.getState().say[cat.id], undefined)
  now += 1000
  assert.equal(command('Max ven por aquí'), 'ok')
  assert.equal(store.getState().pets[max.id].obey.cmd, 'come')
})
test('bonded rivals still play chase outside hospital', () => {
  start(); const max = pet(), cat = pet('cat'), s = store.getState()
  store.setState({ objects:s.objects.map(o=>o.id===max.id||o.id===cat.id?{...o,x:50,y:50}:o), pets:{...s.pets,
    [max.id]:{...s.pets[max.id],bonds:{[cat.id]:30},state:'idle',wanderAt:now+5000},
    [cat.id]:{...s.pets[cat.id],bonds:{[max.id]:30},state:'idle',wanderAt:now+5000}} })
  store.getState().moveTick(16)
  assert.ok(store.getState().pets[max.id].chaseUntil > now)
  assert.ok(store.getState().pets[cat.id].chaseUntil > now)
})

test('autonomous toy play cannot reuse a food or bed destination', () => {
  start(); const max = pet(), s = store.getState()
  store.setState({objects:s.objects.filter(o=>o.id===max.id||o.catalogId==='toy').map(o=>({...o,x:50,y:50})),pets:{[max.id]:{...s.pets[max.id],targetKind:'food',state:'idle',wanderAt:0}}})
  store.getState().moveTick(16)
  assert.equal(store.getState().pets[max.id].targetKind,'random')
  assert.notEqual(store.getState().pets[max.id].state,'eat')
})
