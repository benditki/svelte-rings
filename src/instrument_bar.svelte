<script>
import { longpress } from './longpress.js'
import Dot from "./dot.svelte"
import { createEventDispatcher } from 'svelte'
const dispatch = createEventDispatcher()

export let instruments
export let episode
export let blocked

let closed = true
let selected = null

const period = 6

const center_dot = { radius: 0, size: 0.2, width: 0.45 }
const other_dot = { radius: 0.37, size: 0.12, width: 0.25, delta: 1/period }

function phase(instrument, sym_id) {
    return (sym_id - (instrument.sym_list.length - 2)/2)/period
}

function on_touch(instrument) {
    instrument.play()
}

function on_other_click(instrument, sym, instrument_id) {
    dispatch("switch", { sym, id: instrument_id })
    instrument.play()
}

function on_nav_click(instrument) {
    instrument.play()
    dispatch("add", {instrument})
}

function other(instruments, episode) {
    return Object.values(instruments).filter(i => !episode.instruments.includes(i))
}

function on_open_click() {
    if (selected) {
        dispatch("del", {instrument: selected})
        selected = null
    } else {
        closed = !closed
    }
}

function on_longpress(instrument) {
    if (blocked) return

    selected = instrument
    closed = true
}

function on_press(instrument) {
    if (selected == instrument) {
        selected = null
    } else {
        selected = instrument
    }
    closed = true
}

</script>

<div class="row bar">
    <div class="row instruments">
        {#each episode.phrases as phrase, phrase_id}
        <div class="col work" class:selected={phrase.instrument==selected}>
            <div class="card">
            <svg viewBox="-0.5 -0.5 1.0 {phrase.instrument==selected?1.25:0.9}">
                <g transform="rotate(-90)">
                <Dot {...center_dot} color={phrase.instrument.color} sym={phrase.instrument.sym_list[0]}
                    on:touch={() => on_touch(phrase.instrument)}/>
                {#each phrase.instrument.sym_list.slice(1) as sym, sym_id}
                <Dot {...other_dot} color={phrase.instrument.color} {sym} phase={phase(phrase.instrument, sym_id)}
                    on:touch={() => on_other_click(phrase.instrument, sym, phrase_id)}/>
                {/each}
                {#if phrase.instrument==selected}
                <Dot on:touch={() => dispatch("extra", { phrase_id })} phase={0.5} radius={0.5} width={0.25} delta={0.25} gap={0.05} color={phrase.parts.length > 1 ? phrase.instrument.color : "grey"}/>
                {:else}
                {#if phrase.parts.length > 1}
                <Dot phase={0.5} radius={0.31} width={0.1} delta={0.5} gap={0.05} color={phrase.instrument.color}/>
                {/if}
                {/if}
                </g>
            </svg>
            </div>
            <div class="centered caption"
                on:click={() => on_press(phrase.instrument)}>
                <label>{phrase.instrument.name}</label></div>
        </div>
        {/each}
    </div>
    <div class="row end">
        {#if blocked}
        <i class="icon-lock"></i>
        {:else}
        <nav class:closed class:selected>
            <button on:click={on_open_click}>
                <span class="l l1"></span>
                <span class="l l2"></span>
            </button>

            {#each other(instruments, episode) as instrument, instrument_id}
            <div class="col item" style="transform: translateY({-78-instrument_id*78}px)">
                <svg viewBox="-0.5 -0.5 1.0 0.75">
                    <g transform="rotate(-90)">
                    <Dot {...center_dot} color={instrument.color} sym={instrument.sym_list[0]}
                        on:press={() => on_nav_click(instrument)}/>
                    {#each instrument.sym_list.slice(1) as sym, sym_id}
                    <Dot {...other_dot} color={instrument.color} {sym} phase={phase(instrument, sym_id)}
                        on:press={() => on_nav_click(instrument)}/>
                    {/each}
                    </g>
                </svg>
                <div class="centered">{instrument.name}</div>
            </div>
            {/each}
        </nav>
        {/if}
    </div>
</div>

<style>
:root {
   --s: 70px;
}

.instruments {
    flex-basis: 350px;
    min-width: 200px;
}

.instruments > * {
    flex-basis: 64px;
    min-width: 10px;
}

.caption {
    padding: 2px 0 8px;
    border: none;
    margin: 0;
}

.instruments label {
    display: inline-block;
    border-radius: 10px;
    background: #f3eee7;
    padding: 0 4px 2px;
    border: 1px solid white;
}

div.selected label {
    background: rgb(181, 217, 228);
}

.card {
    height: calc(0.9 * var(--s));
}


div.selected .card svg {
    transform: translateY(calc(-0.35 * var(--s)));
    transition: transform 100ms ease-in-out;
    height: calc(1.25 * var(--s));
}

svg {
    width: var(--s);
    height: calc(0.9 * var(--s));
}

nav svg {
    height: calc(0.75 * var(--s));
}

nav {
   width: var(--s);
   height: var(--s);
   position: relative;

}

nav button {
    width: 80%;
    height: 80%;
    margin: auto;
    display: block;
    border-radius: 50%;
    position: relative;
    z-index: 2;
    background: #abd27f;
    box-shadow: 1px 2px 2px 0px rgba(0, 0, 0, 0.1);
    transform: scale(1.2);
    transition: transform 200ms;
}

nav.closed button {
    transform: scale(1.0)
}

nav.selected button {
    background: #FE4365;
}

.l {
    width: calc(0.4 * var(--s));
    height: calc(0.1 * var(--s));
    background: #FE4365;
    display: block;
    position: absolute;
    top: 50%;
    left: 50%;
    margin-left: calc(-0.2 * var(--s));
    margin-top: calc(-0.05 * var(--s));
    transition: transform 200ms;
}

.closed .l {
    background: white
}

.closed .l1 {
    transform: rotate(0deg);
}

.l1 {
    transform: rotate(135deg);
}

.closed .l2 {
    transform: rotate(-90deg);
}

.selected .l2 {
    transform: rotate(-90deg) scale(0.001);
    transition: transform 300ms;
}

.l2 {
    transform: rotate(45deg);
} 

nav .item {
    position: absolute;
    top: 0;
    left: 0;
    transition: transform 300ms;
    background: white;
}

nav .item:nth-child(1) {
    transition-delay: 250ms;
}

nav .item:nth-child(2) {
    transition-delay: 240ms;
}

nav .item:nth-child(3) {
    transition-delay: 230ms;
}

nav .item:nth-child(4) {
    transition-delay: 220ms;
}

nav .item:nth-child(5) {
    transition-delay: 210ms;
}

nav .item:nth-child(6) {
    transition-delay: 200ms;
}

nav .item:nth-child(7) {
    transition-delay: 190ms;
}

nav .item:nth-child(8) {
    transition-delay: 180ms;
}

nav .item:nth-child(9) {
    transition-delay: 170ms;
}


nav.closed .item {
    transform: scale(0.3) !important;
    transition: 200ms;
}

.icon-lock {
    font-size: 48px;
    color: #b9b5d4;
}


</style>
