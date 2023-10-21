<script>
import Dot from "./dot.svelte"
import {emphasize, alternate} from "./colors.js"
import * as symbols from "./symbols"
import { createEventDispatcher } from 'svelte'
const dispatch = createEventDispatcher()

export let instrument_order
export let roll_types
export let instrument

let roll_types_open = false

const viewbox = "-0.5 -0.5 1 1"
const dot_settings = { radius: 0, size: 0.42, width: 1, outline_color: "var(--theme-fg)" }

function phases_viewbox(phases) {
    const [min, max] = [Math.min(...phases), Math.max(...phases)]
    return `${-0.5 + min} -0.5 ${1 + max - min} 1`
}

function phases_width(phases) {
    const [min, max] = [Math.min(...phases), Math.max(...phases)]
    return 1 + max - min
}

function phases_whole_pulses(phases) {
    const [min_init, max_init] = [Math.min(...phases), Math.max(...phases)]
    const [min, max] = [Math.ceil(min_init - 0.6), Math.floor(max_init + 0.6)]
    return Array(max - min + 1).fill(0).map((_, i) => i + min)
}

const Panels = {
    notes: 0,
    parts: 1,
    episodes: 2
}

const panels_order = [Panels.notes, Panels.parts, Panels.episodes]

let current_panel = Panels.notes

function on_touch(touched) {
    console.log(touched)
    roll_types_open = false
    if (touched.sym) {
        instrument.play(touched.sym)
    }
    if (touched.instrument || touched.episode) {
        current_panel = Panels.notes
    }
    dispatch("touch", touched)
}

function toggle_panel() {
    const current_order_index = panels_order.findIndex((p) => p == current_panel)
    current_panel = panels_order[(current_order_index + 1) % panels_order.length]
}

</script>

<div class="row container">
    {#if current_panel == Panels.notes && instrument}
    <div class="row" style="height: 100%;">
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <svg {viewbox} on:click={() => on_touch({arrow: "left"})}>
        <rect x=-0.25 y=-0.25 width=0.5 height=0.5 fill={"none"}/>
        <polyline points="0.15,-0.4,-0.15,0,0.15,0.4"/>
    </svg>
    <div class="col">
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <svg {viewbox} on:click={() => on_touch({arrow: "up"})}>
            <rect x=-0.25 y=-0.25 width=0.5 height=0.5 fill={"none"}/>
            <polyline points="-0.3,0.3,0,0,0.3,0.3"/>
        </svg>
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <svg {viewbox} on:click={() => on_touch({arrow: "down"})}>
            <rect x=-0.25 y=-0.25 width=0.5 height=0.5 fill={"none"}/>
            <polyline points="-0.3,-0.3,0,0,0.3,-0.3"/>
        </svg>
    </div>
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <svg {viewbox} on:click={() => on_touch({arrow: "right"})}>
        <rect x=-0.25 y=-0.25 width=0.5 height=0.5 fill={"none"}/>
        <polyline points="-0.15,-0.4,0.15,0,-0.15,0.4"/>
    </svg>
    </div>
    {#each [null].concat(instrument.sym_list) as sym}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <svg {viewbox} on:click={() => on_touch({sym})}>
        <rect x=-0.25 y=-0.25 width=0.5 height=0.5 fill={instrument.color}/>
        <g transform="translate(-0.13,-0.13) rotate(-90)">
        <Dot {...dot_settings} {sym} pulse_color={"none"}/>
        </g>
    </svg>
    {/each}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <svg {viewbox} on:click={() => roll_types_open = !roll_types_open}>
        <rect x=-0.25 y=-0.25 width=0.5 height=0.5 fill={instrument.color}/>
        <g transform="translate(-0.05,-0.05)">
        <circle class="more_symbol" cy=-0.25/>
        <circle class="more_symbol" cy=0/>
        <circle class="more_symbol" cy=0.25/>
        </g>
    </svg>
    {:else if current_panel == Panels.parts || current_panel == Panels.notes && !instrument}
    {#each Array.from(instrument_order.keys()) as other_instrument}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <svg {viewbox} on:click={() => on_touch({instrument: {to_add: other_instrument}})}>
        <rect x=-0.25 y=-0.25 width=0.5 height=0.5 fill={other_instrument.color}/>
        <line x1=0 y1=-0.15 x2=0 y2=0.15/>
        <line x1=-0.15 y1=0 x2=0.15 y2=0/>
    </svg>
    {#if instrument == other_instrument}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <svg {viewbox} on:click={() => on_touch({instrument: {to_remove: other_instrument}})}>
        <rect x=-0.25 y=-0.25 width=0.5 height=0.5 fill={instrument.color}/>
        <line x1=-0.15 y1=0 x2=0.15 y2=0/>
    </svg>
    {/if}
    {/each}
    {:else if current_panel == Panels.episodes}
    <div class="row"></div>
    <div class="row">
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <svg {viewbox} on:click={() => on_touch({episode: {add: true}})}>
        <circle r=0.4/>
        <line x1=0 y1=-0.3 x2=0 y2=0.3/>
        <line x1=-0.3 y1=0 x2=0.3 y2=0/>
    </svg>
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <svg {viewbox} on:click={() => on_touch({episode: {remove: true}})}>
        <circle r=0.4/>
        <line x1=-0.3 y1=0 x2=0.3 y2=0/>
    </svg>
    </div>
    {/if}
    <div class="row">
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <svg {viewbox} on:click={toggle_panel}>
        {#if current_panel == Panels.notes}
        <line x1=-0.1 y1=-0.2 x2=0.1 y2=-0.2/>
        <line x1=-0.3 y1=0 x2=0.3 y2=0/>
        <line x1=-0.1 y1=0.2 x2=0.1 y2=0.2/>
        {:else if current_panel == Panels.parts}
        <line x1=-0.1 y1=-0.2 x2=0.1 y2=-0.2/>
        <line x1=-0.1 y1=0 x2=0.1 y2=0/>
        <line x1=-0.3 y1=0.2 x2=0.3 y2=0.2/>
        {:else if current_panel == Panels.episodes}
        <line x1=-0.3 y1=-0.2 x2=0.3 y2=-0.2/>
        <line x1=-0.1 y1=0 x2=0.1 y2=0/>
        <line x1=-0.1 y1=0.2 x2=0.1 y2=0.2/>
        {/if}
    </svg>
    </div>
</div>

{#if roll_types_open && instrument}
<div class="row above_container">
{#each [[null, [0]]].concat(Object.entries(roll_types)) as [type, phases]}
<!-- svelte-ignore a11y-click-events-have-key-events -->
<svg viewbox={phases_viewbox(phases)} style:width={36*phases_width(phases)} on:click={() => on_touch({pulse_type: type})}>
    {#each phases_whole_pulses(phases) as phase, not_first}
    <g transform="translate({phase})">
    {#if not_first}
    <rect x=-1 y=-0.05 width=1 height=0.1 fill={instrument.color}/>
    {/if}
    </g>
    {/each}
    {#each phases_whole_pulses(phases) as phase}
    <g transform="translate({phase})">
    <rect x=-0.275 y=-0.275 width=0.55 height=0.55 fill={phase == 0.0 ? emphasize(instrument.color) : instrument.color}/>
    </g>
    {/each}
    <g transform="rotate(-90)">
    {#each phases as phase, phase_id}
    <g transform="translate(0,{phase})">
        <Dot {...dot_settings} outline_enlarge={1.5} sym={symbols.DOT} pulse_color="none" outline_color="var(--theme-bg-alt)"/>
    </g>
    {#if phase_id > 0}
    <line y1={phases[phase_id - 1] + 0.15} y2={phase - 0.15} style="stroke:var(--theme-bg-alt);stroke-width:0.18"/>
    {/if}
    {/each}
    {#each phases as phase, phase_id}
    <g transform="translate(0,{phase})">
        <Dot {...dot_settings} sym={symbols.DOT} pulse_color={"none"}/>
    </g>
    {#if phase_id > 0 && (phase - phases[phase_id - 1] > 0.3)}
    <line y1={phases[phase_id - 1] + 0.2} y2={phase - 0.2} style="stroke-width:0.08"/>
    {/if}
    {/each}
    </g>
</svg>
{/each}
</div>
{/if}


<style>
:root {
   --s: 36px;
}

.container {
    position: absolute;
    left: 0;
    height: 100%;
    width: 100%;
    justify-content: space-between;
}

.above_container {
    background-color: var(--theme-bg-alt);
    position: absolute;
    bottom: 100%;
    max-height: 400%;
    width: 100%;
    justify-content: space-between;
    gap: 0px 8px;
}

svg {
    width: var(--s);
    height: var(--s);
}

line, polyline, circle {
    stroke-width: 0.09;
    stroke: var(--theme-fg);
    fill: none;
}

rect {
    stroke-width: 0.04;
}

circle.more_symbol {
    r: 0.075;
    stroke-width: 0.05;
    stroke: var(--theme-fg);
    fill: none;
}

</style>
