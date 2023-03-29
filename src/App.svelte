<script>

    const VERSION = "0.2.0"

    if (localStorage.getItem("version") != VERSION) {
        localStorage.clear()
        localStorage.setItem("version", VERSION)
    }

    import Episode from "./episode.js"
    import Phrase from "./phrase.js"
    import Rhythm from "./rhythm.js"
    import Pulse from "./pulse.js"
    import Instrument from "./instrument.js"
    import { in_limits } from "./utils.js"
    import sounds from "./sounds.js"
    import * as symbols from "./symbols"

    import Circle from "./circle.svelte"
    import EpisodeBar from "./episode_bar.svelte"
    import InstrumentBar from "./instrument_bar.svelte"
    import BpmSelect from "./bpm_select.svelte"
    import PlayButton from "./play_button.svelte" 
    import RhythmMenu from "./rhythm_menu.svelte"
    import VolumeView from "./volume_view.svelte"

    import DebugLayer from "./debug_layer.svelte"
    

    let instruments = {
        clave:    new Instrument('clave', "#1f77b4", [{    sound: sounds.beat },
            { letter: 'h', sym: symbols.TRIAG,             sound: sounds.beat_high }]),
        shekere:  new Instrument('shekere', "#17becf", [{  sound: sounds.shake }]),
        kenkeni:  new Instrument("kenkeni", "#e39700", [{  sound: sounds.kenkeni }]),
        sungban:  new Instrument("sungban", "#ff7f0e", [{  sound: sounds.sangban },
            { letter: 'c', sym: symbols.QUAD,              sound: sounds.sangban_closed }]),
        dundunba: new Instrument("dundunba", "#d62728", [{ sound: sounds.dundunba }]),
        djembe:   new Instrument("djembe", "#2ca02c", [
            { letter: 'b', sym: symbols.TRAPEZ,            sound: sounds.djembe_base },
            { letter: 't', sym: symbols.DOT,               sound: sounds.djembe_tone },
            { letter: 's', sym: symbols.TRIAG,             sound: sounds.djembe_slap },
        ]),
        bass:     new Instrument('bass', "#8c564b", [
            { letter: 's', sym: symbols.DOT,               sound: sounds.sangban },
            { letter: 'c', sym: symbols.QUAD,              sound: sounds.sangban_closed },
            { letter: 'd', sym: symbols.TRAPEZ,            sound: sounds.dundunba },
            { letter: 'k', sym: symbols.TRIAG,             sound: sounds.kenkeni }]),
    }

    let instrument_order = new Map([
        [ instruments.clave,        0.0 ],
        [ instruments.shekere,      0.05 ],
        [ instruments.djembe,       0.3 ],
        [ instruments.bass,         0.6 ],
        [ instruments.kenkeni,      0.8 ],
        [ instruments.sungban,      0.95 ],
        [ instruments.dundunba,     1 ],
    ].sort((a, b) => a[1] - b[1]))        
    
    let rhythms = [
        new Rhythm("tatata", 16, [
            new Episode([
                Phrase.fromPatterns(instruments.kenkeni,  ["..xx ..xx ..xx ..xx"]),
                Phrase.fromPatterns(instruments.djembe,   ["s..s s.tt s..s s.tt"])
            ]),
            new Episode([
                Phrase.fromPatterns(instruments.kenkeni,  ["..xx ..xx ..xx ..xx"]),
                Phrase.fromPatterns(instruments.djembe,   ["bttt b.ss bttt b.ss"])
            ]),
        ]),
        new Rhythm("koreduga", 18, [
            new Episode([
                Phrase.fromPatterns(instruments.shekere,  ["x.. x.. x.. x.. x.. x.."]),
                Phrase.fromPatterns(instruments.bass,     ["d.d .d. d.d d.d .s. s.d"]),
                Phrase.fromPatterns(instruments.djembe,   ["s.b .tt s.b s.b stt s.b"])
            ]),
            new Episode([
                Phrase.fromPatterns(instruments.shekere,  ["x.. x.. x.. x.. x.. x.."]),
                Phrase.fromPatterns(instruments.bass,     ["d.d .d. d.d d.d .s. s.d"]),
                Phrase.fromPatterns(instruments.djembe,   ["ss. tt. tt. ss. tt. tt."])
            ]),
            new Episode([
                Phrase.fromPatterns(instruments.shekere,  ["x.. x.. x.. x.. x.. x.."]),
                Phrase.fromPatterns(instruments.bass,     ["d.d .d. d.d d.d .s. s.d"]),
                Phrase.fromPatterns(instruments.kenkeni,  ["xx. ... xx. ... xx. ..."]),
                Phrase.fromPatterns(instruments.djembe,   ["s.s btt bs. s.s btt bs."])
            ]),
        ]),
        new Rhythm("bepepe", 12, [
            new Episode([
                Phrase.fromPatterns(instruments.shekere,  ["x.. ... x.. ..."]),
                Phrase.fromPatterns(instruments.bass,     ["dks s.d ssk d.k"]),
                Phrase.fromPatterns(instruments.djembe,   ["s.t ..b stt .s."])
            ]),
            new Episode([
                Phrase.fromPatterns(instruments.shekere,  ["x.. ... x.. ..."]),
                Phrase.fromPatterns(instruments.bass,     ["dks s.d ssk d.k"]),
                Phrase.fromPatterns(instruments.djembe,   ["b.t tts b.t .s."])
            ]),
            new Episode([
                Phrase.fromPatterns(instruments.shekere,  ["x.. ... x.. ..."]),
                Phrase.fromPatterns(instruments.bass,     ["dks s.d ssk d.k"]),
                Phrase.fromPatterns(instruments.djembe,   ["ss. t.. ss. .bs", ".s. ts. btt .tt"], 1.6)
            ]),
        ]),
        new Rhythm("djole", 16, [
            new Episode([
                Phrase.fromPatterns(instruments.shekere,  ["x... x... x... x..."]),
            ], 2),
            new Episode([
                Phrase.fromPatterns(instruments.shekere,  ["x... x... x... x..."]),
                Phrase.fromPatterns(instruments.sungban,  ["c... x... c... x..."]),
                Phrase.fromPatterns(instruments.dundunba, ["x... .... x.x. ...."]),
            ]),
            new Episode([
                Phrase.fromPatterns(instruments.shekere,  ["x... x... x... x..."]),
                Phrase.fromPatterns(instruments.bass,     ["d... s... d.d. s..."]),
                Phrase.fromPatterns(instruments.kenkeni,  ["..xx ..xx ..xx ..xx"]),
            ]),
            new Episode([
                Phrase.fromPatterns(instruments.shekere,  ["x... x... x... x..."]),
                Phrase.fromPatterns(instruments.bass,     ["d... s... d.d. s..."]),
                Phrase.fromPatterns(instruments.kenkeni,  ["..xx ..xx ..xx ..xx"], 0.5),
                Phrase.fromPatterns(instruments.djembe,   ["tttt b... t.t. b..."]),
            ], 8),
            new Episode([
                Phrase.fromPatterns(instruments.shekere,  ["x... x... x... x..."]),
                Phrase.fromPatterns(instruments.bass,     ["d.kk s.kk d.dk s.kk"]),
                Phrase.fromPatterns(instruments.djembe,   ["ttst tstt stts ttst", "tstt s.ss ttst tss."], 1.2),
            ]),
        ]),
        new Rhythm("balakulandjan", 16, [
            new Episode([
                Phrase.fromPatterns(instruments.shekere,  ["x... .... x... ...."]),
                Phrase.fromPatterns(instruments.kenkeni,  ["x... x... x... x..."]),
            ], 2),
            new Episode([
                Phrase.fromPatterns(instruments.shekere,  ["x... .... x... ...."]),
                Phrase.fromPatterns(instruments.sungban,  [".... .... ..x. x..."]),
                Phrase.fromPatterns(instruments.dundunba, ["x... ..x. x... ..x."]),
            ]),
            new Episode([
                Phrase.fromPatterns(instruments.shekere,  ["x... .... x... ...."]),
                Phrase.fromPatterns(instruments.kenkeni,  ["x... x... x... x..."]),
                Phrase.fromPatterns(instruments.bass,     ["d... ..d. d.s. s.d."]),
            ]),
            new Episode([
                Phrase.fromPatterns(instruments.shekere,  ["x... .... x... ...."]),
                Phrase.fromPatterns(instruments.kenkeni,  ["x... x... x... x..."]),
                Phrase.fromPatterns(instruments.bass,     ["d... ..d. d.s. s.d."]),
                Phrase.fromPatterns(instruments.djembe,   ["b.tt ..st t.bs .bs."]),
            ], 8),
            new Episode([
                Phrase.fromPatterns(instruments.shekere,  ["x... .... x... ...."]),
                Phrase.fromPatterns(instruments.kenkeni,  ["x... x... x... x..."]),
                Phrase.fromPatterns(instruments.bass,     ["d... ..d. d.s. s.d."]),
                Phrase.fromPatterns(instruments.djembe,   ["b.ss .bss b.ss ttss", "b.ss .bss b.s. ttss"]),
            ], 2),
            new Episode([
                Phrase.fromPatterns(instruments.shekere,  ["x... .... x... ...."]),
                Phrase.fromPatterns(instruments.kenkeni,  ["x... x... x... x..."]),
                Phrase.fromPatterns(instruments.bass,     ["d... ..d. d.s. s.d."]),
                Phrase.fromPatterns(instruments.djembe,   ["ttst tstt s.ts tts.", "ttst tstt s.t. tts."]),
            ], 2),
            new Episode([
                Phrase.fromPatterns(instruments.shekere,  ["x... .... x... ...."]),
                Phrase.fromPatterns(instruments.kenkeni,  ["x... x... x... x..."]),
                Phrase.fromPatterns(instruments.bass,     ["d... ..d. d.s. s.d."]),
                Phrase.fromPatterns(instruments.djembe,   ["bsss ttss s... ss..", "bsss ttss s.s. sstt"]),
            ], 2),
            new Episode([
                Phrase.fromPatterns(instruments.shekere,  ["x... .... x... ...."]),
                Phrase.fromPatterns(instruments.kenkeni,  ["x... x... x... x..."]),
                Phrase.fromPatterns(instruments.bass,     ["d... ..d. d.s. s.d."]),
                Phrase.fromPatterns(instruments.djembe,   ["..ss .s.t t.s. ss.t", "t.ss .s.t t.s. sstt"]),
            ], 2),
        ])

    ]

    rhythms.forEach(rhythm => rhythm.blocked = true)

    $: store_rhythms(rhythms)
    $: store_instruments(instruments)
    $: store_active(active)
    $: store_bpm(bpm)

    function store_rhythms(rhythms) {
        const stored = rhythms.map(rhythm => rhythm.store())
        console.log("storing rhythms")
        localStorage.setItem("rhythms", JSON.stringify(stored))
    }

    function store_instruments(instruments) {
        const stored = {}
        for (let name  in instruments) {
            stored[name] = instruments[name].sym_list.map(sym => sym.description)
        }
        console.log("storing instruments")
        localStorage.setItem("instruments", JSON.stringify(stored))
    }

    function load_instruments() {
        const loaded = JSON.parse(localStorage.getItem("instruments") || "{}")
        for (let name in loaded) {
            if (name in instruments) {
                instruments[name].sym_list = loaded[name].map(desc => symbols[desc])
            }
        } 
    }

    function load_rhythms() {
        const loaded = JSON.parse(localStorage.getItem("rhythms") || "[]")
        const loaded_rhythms = loaded.map(rhythm => Rhythm.fromLoaded(rhythm, instruments))
        for (let loaded_rhythm of loaded_rhythms) {
            const rhythm_id = rhythms.findIndex(rhythm => rhythm.name == loaded_rhythm.name)
            if (rhythm_id != -1) {
                if (rhythms[rhythm_id].blocked) {
                    rhythms[rhythm_id].load_blocked(loaded_rhythm)
                    rhythms = rhythms
                } else {
                    rhythms[rhythm_id] = loaded_rhythm
                }
            } else {
                rhythms = [...rhythms, loaded_rhythm]
            }
        }
    }

    load_instruments()
    load_rhythms()

    

    function dot_toggle (e, episode_id) {
        if (rhythms[active.rhythm_id].blocked) return

        const {phrase_id, part_id, pulse_id} = e.detail
        const phrase = rhythms[active.rhythm_id].episodes[episode_id].phrases[phrase_id]
        const old_sym = phrase.parts[part_id][pulse_id].sym
        const front_sym = phrase.instrument.sym_list[0]
        const new_sym = old_sym == front_sym ? null : front_sym
        rhythms[active.rhythm_id].episodes[episode_id]
            .phrases[phrase_id].parts[part_id][pulse_id].sym = new_sym
            
        
        if (!started.ts && new_sym) {
            phrase.instrument.play(new_sym, phrase.volume)
        }
    }

    function clone_episode() {
        if (rhythms[active.rhythm_id].blocked) return

        rhythms[active.rhythm_id].episodes.splice(active.episode_id + 1, 0,
            rhythms[active.rhythm_id].episodes[active.episode_id].clone())
        rhythms = rhythms
        activate_episode(active.episode_id + 1)
        selected_episodes = new Set()
    }

    function del_episodes() {
        if (rhythms[active.rhythm_id].blocked) return

        rhythms[active.rhythm_id].episodes = rhythms[active.rhythm_id].episodes.filter((episode, episode_id) => !selected_episodes.has(episode_id))
        activate_episode(Math.min(active.rhythm_id, rhythms[active.rhythm_id].episodes.length - 1))
        selected_episodes = new Set()
    }

    function set_repeat(repeat) {
        for (let episode_id of selected_episodes) {
            rhythms[active.rhythm_id].episodes[episode_id].repeat = repeat
        }
        selected_episodes = new Set()
    }

    function set_off(state) {
        for (let episode_id of selected_episodes) {
            rhythms[active.rhythm_id].episodes[episode_id].off = state
        }
        selected_episodes = new Set()
    }

    function set_solo() {
        for (const [episode_id, episode] of rhythms[active.rhythm_id].episodes.entries()) {
            episode.off = !selected_episodes.has(episode_id)
            rhythms[active.rhythm_id].episodes[episode_id] = episode
        }
        selected_episodes = new Set()
    }

    function instrument_switch(instrument) {
        if (instrument.sym_list.length > 1) {
            instrument.sym_list.push(instrument.sym_list.shift())
            instruments = instruments
        }
    }

    function add_instrument(instrument) {
        if (rhythms[active.rhythm_id].blocked) return

        const episode = rhythms[active.rhythm_id].episodes[active.episode_id]
        const {phrases, disabled_phrases} = episode
        let instrument_phrases = disabled_phrases.filter(p => p.instrument == instrument)
        
        if (instrument_phrases.length > 0) {
            episode.disabled_phrases = disabled_phrases.filter(p => p.instrument != instrument)
        } else {
            instrument_phrases = [Phrase.fromPeriod(instrument, rhythms[active.rhythm_id].period)]
        }

        episode.phrases = phrases.concat(instrument_phrases)
        rhythms = rhythms
    }

    function disable_instrument(instrument) {
        if (rhythms[active.rhythm_id].blocked) return

        const episode = rhythms[active.rhythm_id].episodes[active.episode_id]
        const {phrases, disabled_phrases} = episode
        const instrument_phrases = phrases.filter(p => p.instrument == instrument)
        episode.phrases = phrases.filter(p => p.instrument != instrument)
        episode.disabled_phrases = disabled_phrases.concat(instrument_phrases)
        rhythms = rhythms
    }

    let active = { rhythm_id: 0, episode_id: 0, pos: 0, phase: 0 }
    let started = { ts: 0, episode_id: 0, pos: 0, phase: 0 }
    let selected_episodes = new Set()
    let bpm = 90

    function store_active(active) {
        const stored = { rhythm_name: rhythms[active.rhythm_id].name, episode_id: active.episode_id }
        localStorage.setItem("active", JSON.stringify(stored))
    }

    function load_active() {
        const loaded = JSON.parse(localStorage.getItem("active") || '{"rhythm_name": "koreduga", "episode_id": 0}')
        let index = rhythms.findIndex(rhythm => rhythm.name == loaded.rhythm_name)
        if (index >= 0) {
            active.rhythm_id = index
            active.episode_id = loaded.episode_id
            flush_started()
        }
    }

    load_active()

    function store_bpm(bpm) {
        localStorage.setItem("bpm", bpm)
    }

    function load_bpm() {
        const loaded = localStorage.getItem("bpm")
        if (loaded) {
            bpm = +loaded
        }
    }

    load_bpm()

    function process(now) {
        const rhythm = rhythms[active.rhythm_id]
        let { episode_id, pos, phase } = started
        if (started.ts && rhythm.episodes.some(episode => episode.can_play)) {
            window.requestAnimationFrame(process)
            const beat_period = {9: 3, 12: 3, 16: 4, 18: 3}[rhythm.period] || 4
            const elapsed = (now - started.ts) * (bpm / 60) * beat_period * 0.001
            pos += elapsed
            phase += elapsed
            while (!rhythm.episodes[episode_id].can_play || phase >= rhythm.episode_duration(episode_id)) {
                if (rhythm.episodes[episode_id].can_play) {
                    phase -= rhythm.episode_duration(episode_id)
                }
                episode_id = (episode_id + 1) % rhythm.episodes.length
            }

            //console.log(`now=${now.toFixed(2)} elapsed=${(now - started.ts).toFixed(2)} elapsed_pos=${elapsed.toFixed(2)} pos=${pos.toFixed(2)} phase=${phase.toFixed(2)} episode_id=${episode_id}`)
            active.episode_id = episode_id
            active.pos = pos
            active.phase = phase

            const episode = rhythm.episodes[active.episode_id]

            //let report = now.toFixed(2).padEnd(16, ' ') + (now - started.ts).toFixed(2).padEnd(8, ' ') + pos.toFixed(2).padStart(8, ' ')
            
            for (const phrase of episode.phrases) {
                const phrase_length = phrase.parts.length * rhythm.period
                for (const pulses of phrase.parts) {
                    for (const pulse of pulses) {
                        if (in_limits((phase - pulse.phase) % phrase_length, -0.01, 0.5)
                            && (pulse.played == null
                                || pos - pulse.played > phrase_length - 0.95)) {
                            //report += phase.toFixed(2).padStart(8, ' ') + "=" + to_play[phrase_length].get(phase).toString().padEnd(6, ' ')
                            if (phrase.volume > 0 && pulse.sym) {
                                phrase.instrument.play(pulse.sym, phrase.volume)
                            }
                            pulse.played = pos
                        }
                    }
                }
            }
            //console.log(report)
        }
        
    }

    function flush_started(reset_phase = true) {
        if (reset_phase) {
            active.pos = active.pos + rhythms[active.rhythm_id].total_duration
            active.phase = 0
        }
        started.episode_id = active.episode_id
        started.pos = active.pos
        started.phase = active.phase
        if (started.ts) {
            started.ts = performance.now()
        }
    }

    function toggle_play() {
        if (started.ts) {
            started.ts = 0
            flush_started()
        } else {
            window.requestAnimationFrame(process)
            started.ts = performance.now() - 10
        }
    }

    function activate_episode(episode_id) {
        active.episode_id = episode_id
        flush_started()
    }

    function activate_rhythm(rhythm_id) {
        rhythms[rhythm_id].touch()
        rhythms = rhythms
        active.rhythm_id = rhythm_id
        active.episode_id = 0
        active.phase = 0
        started.ts = 0
        flush_started()
    }

    function create_rhythm(period) {
        const name = gen_rhythm_name(`rhythm${period}-1`)
        rhythms = [...rhythms,
            new Rhythm(name, period, [
                new Episode([
                    Phrase.fromPatterns(instruments.shekere,
                        period == 16 ? ["x...x...x...x..."] : ["x..x..x..x.."])
                ])
            ])
        ]
        activate_rhythm(rhythms.length - 1)
    }

    function del_rhythm() {
        if (rhythms[active.rhythm_id].blocked) return

        rhythms.splice(active.rhythm_id, 1)
        rhythms = rhythms
        const reducer = (latest, rhythm, curr) =>
            rhythm.accessed > rhythms[latest].accessed ? curr : latest
        activate_rhythm(rhythms.reduce(reducer, 0))
    }

    function gen_rhythm_name(name) {
        let index = 1
        const res = name.match(/^(.*)-(\d+)$/)
        let prefix = name
        if (res) {
            prefix = res[1]
            index = +res[2]
        }
        while(true) {
            if (!rhythms.find(rhythm => rhythm.name == name)) {
                break
            }
            index++
            name = prefix + "-" + index
        }
        return name
    }

    function clone_rhythm() {
        const rhythm = rhythms[active.rhythm_id]
        let name = gen_rhythm_name(rhythm.name)
        rhythms = [...rhythms, rhythm.clone(name)]
        activate_rhythm(rhythms.length - 1)
    }

    let current_volume = 1.0
    let volume_visible = false

    function on_cirle_swipeend(e) {
        setTimeout(() => { volume_visible = false}, 300)
    }

    function clamp(x, l1, l2) {
        return x < l1 ? l1 : x > l2 ? l2 : x
    }

    function on_cirle_swipe(e) {
        const {phrase_id, pulse_id, dx, dy, dir } = e.detail
        if (dir == 'y') {
            volume_visible = true
            current_volume = clamp(rhythms[active.rhythm_id].episodes[active.episode_id].phrases[phrase_id].volume - dy * 0.01, 0, 2)
            rhythms[active.rhythm_id].episodes[active.episode_id].phrases[phrase_id].volume = current_volume
        }
    }

    function phrase_extra(phrase_id) {
        let parts = rhythms[active.rhythm_id].episodes[active.episode_id].phrases[phrase_id].parts
        parts = parts.length > 1 ? [parts[0]] : [parts[0], parts[0].map(pulse =>
            new Pulse(pulse.phase + rhythms[active.rhythm_id].period, pulse.sym))]
        rhythms[active.rhythm_id].episodes[active.episode_id].phrases[phrase_id].parts = parts
    }

    let debug_active = false

</script>

<style>
main {
    padding: 8px 4px;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    min-height: 10px;
    background-color: var(--theme-bg);
}
main > * {
    flex-shrink: 0;
}
article {
    position: relative;
    flex-grow: 1;
    flex-shrink: 1;
    min-height: 48px;
    display: flex;
    flex-direction: row;
    justify-content: center;
    border: 3px solid var(--theme-fg);
}
.version {
    position: fixed;
    right: 0;
    top: 0;
    padding: 1px;
    font-family: monospace;
    line-height: 50%;
    font-weight: bold;
    font-size: 8pt;
}
.version.debug {
    text-shadow: 0px 0px 4px cyan;
}
</style>

<DebugLayer active={debug_active}/>

<div class="version" class:debug={debug_active} on:click={() => { debug_active = !debug_active }}>v{VERSION}</div>

<main>
    {#each [true, false] as circular, article_id}
    <article style={`order: ${article_id}`}>
        <div><VolumeView value={current_volume} visible={volume_visible}/></div>
        <InstrumentBar
        {instrument_order}
        {instruments}
        episode={rhythms[active.rhythm_id].episodes[active.episode_id]}
        blocked={rhythms[active.rhythm_id].blocked}
        on:switch={(e) => instrument_switch(e.detail.instrument)}
        on:add={(e) => add_instrument(e.detail.instrument)}
        on:disable={(e) => disable_instrument(e.detail.instrument)}
        on:extra={(e) => phrase_extra(e.detail.phrase_id)}/>
        <Circle {circular} {instrument_order}
            episode={rhythms[active.rhythm_id].episodes[active.episode_id]}
            period={rhythms[active.rhythm_id].period}
            phase={active.phase}
            playing={started.ts != 0}
            on:press={(e) => dot_toggle(e, active.episode_id)} 
            on:swipeend={on_cirle_swipeend}
            on:swipe={on_cirle_swipe}/>
        {#if article_id == 0}
        <div class="centered" style="position: absolute; width: 100%; bottom: 0">
            <BpmSelect bind:value={bpm} on:change={() => flush_started(false)}/>
        </div>
        {/if}
    </article>
    {/each}

    <div class="row" style="display: flex; justify-content: space-between; align-items: center">
    <EpisodeBar episodes={rhythms[active.rhythm_id].episodes}
        active={active.episode_id}
        blocked={rhythms[active.rhythm_id].blocked}
        round={started.ts ? active.phase / rhythms[active.rhythm_id].round_duration(active.episode_id) : null}
        bind:selected={selected_episodes}
        on:change={(e)=> activate_episode(e.detail.episode_id)}
        on:add={()=> clone_episode()}
        on:del={()=> del_episodes()}
        on:repeat={(e)=> set_repeat(e.detail.x)}
        on:on={()=>set_off(false)}
        on:off={()=>set_off(true)}
        on:solo={()=>set_solo()}/>

    <PlayButton playing={started.ts != 0}
        on:toggle={() => toggle_play()}/>
    
        <RhythmMenu {rhythms} active={active.rhythm_id}
    on:switch={(e) => activate_rhythm(e.detail.rhythm_id)}
    on:rename={(e) => rhythms[active.rhythm_id].name = e.detail.name}
    on:new={(e) => create_rhythm(e.detail.period)}
    on:del={()=> del_rhythm()}
    on:clone={() => clone_rhythm()}/>
    </div>

</main>
