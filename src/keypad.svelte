<script>
import Dot from "./dot.svelte"
import { createEventDispatcher } from 'svelte'
const dispatch = createEventDispatcher()

export let instrument_order
export let instrument

const viewbox = "-0.5 -0.5 1 1"
const dot_settings = { radius: 0, size: 0.42, width: 1, outline_color: "var(--theme-fg)" }

const Panels = {
    notes: 0,
    parts: 1,
    episodes: 2
}

const panels_order = [Panels.notes, Panels.parts, Panels.episodes]

let current_panel = Panels.notes

function on_touch(touched) {
    console.log(touched)
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
    {#if instrument}
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
    <svg {viewbox} on:click={() => on_touch({more: null})}>
        <rect x=-0.25 y=-0.25 width=0.5 height=0.5 fill={instrument.color}/>
        <g transform="translate(-0.05,-0.05)">
        <circle class="more_symbol" cy=-0.25/>
        <circle class="more_symbol" cy=0/>
        <circle class="more_symbol" cy=0.25/>
        </g>
    </svg>
    {/if}
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

<style>
:root {
   --s: 36px;
}

.container {
    position: absolute;
    left: 0;
    height: 100%;
    width: 100%;
    align-items: center;
    justify-content: space-between;
    padding-left: 8px;
    padding-right: 4px;
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

circle.more_symbol {
    r: 0.075;
    stroke-width: 0.05;
    stroke: var(--theme-fg);
    fill: none;
}

</style>
