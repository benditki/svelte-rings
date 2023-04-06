<script>
import { longpress } from './longpress.js'
import Dot from "./dot.svelte"
import { createEventDispatcher } from 'svelte'
const dispatch = createEventDispatcher()

export let instrument_order
export let instruments
export let episode
export let blocked

let closed = true
let selected = null

const period = 6

const presented_dot = { radius: 0, size: 0.42, width: 1 }
const hidden_dot = { radius: 0, size: 0.38, width: 0.78 }
const border_dot = { radius: 0.43, width: 0.1, delta: 1/2 }
const initial_shift = new Map([[true /*presented*/, 0.2], [false, -0.12]])

let x_shift = new Map()

function on_touch(presented) {
    const {instrument, index} = presented
    if (index == -1) {
        dispatch("add", {instrument})
    }
    instrument.play()
}

function on_longpress(presented) {
    const {instrument, index} = presented
    if (index != -1) {
        dispatch("switch", {instrument})
        instrument.play()
    }
}

const clamp = (num, min, max) => Math.min(Math.max(num, min), max)

function on_swipe(presented, presented_id, {dx}) {
    const new_shift = clamp(shift(presented, presented_id, x_shift) + dx * 0.03, -0.5, 0.5)
    x_shift = x_shift.set(presented_id, new_shift - initial_shift.get(presented.index != -1))
    if (new_shift < -0.3 && presented.index != -1) {
        dispatch("disable", {instrument: presented.instrument})
    }
    if (new_shift > 1 && presented.index == -1) {
        dispatch("add", {instrument: presented.instrument})
    }
}

function on_swipeend(presented, presented_id) {
    if (x_shift.delete(presented_id)) {
        x_shift = x_shift
    }
    presented.instrument.play()
}

function presented_instruments(instruments, episode, instrument_order) {
    return Object.values(instruments).map(instrument => {
        const index = episode.phrases.findIndex(phrase => phrase.instrument == instrument)
        const order = instrument_order.get(instrument)
        const shift = index == -1 ? -0.5 : 0
        return {instrument, index, order, shift}
    })
}

function shift(presented, presented_id, x_shift) {
    return (x_shift.get(presented_id) || 0) + initial_shift.get(presented.index != -1)
}

</script>

<div class="row container">
    <div class="col instruments">
        {#each presented_instruments(instruments, episode, instrument_order) as presented, presented_id}
        <div class="col work" class:selected={presented.instrument==selected} style={`order: ${Math.floor(presented.order*100)}`}>
            <div class="card">
            <svg viewBox="-0.3 -0.5 1.0 1.0">
                <g transform={`translate(${shift(presented, presented_id, x_shift)})`}>
                <g transform="rotate(-90)">
                <Dot {...(presented.index != -1 ? presented_dot : hidden_dot)} color={presented.instrument.color} sym={presented.instrument.sym_list[0]}
                    on:touch={() => on_touch(presented)}
                    on:longpress={() => on_longpress(presented)}
                    on:swipe={(e) => on_swipe(presented, presented_id, e.detail)}
                    on:swipeend={(e) => on_swipeend(presented, presented_id)}/>
                {#if presented.index == -1}
                <Dot {...border_dot} color="var(--theme-fg)" phase={presented.index != -1 ? 0.75 : 0.25} />
                {/if}
                </g>
                </g>
            </svg>
            </div>
        </div>
        {/each}
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
}
.instruments {
    justify-content: space-evenly
}

.card {
    height: var(--s);
}

svg {
    width: var(--s);
    height: var(--s);
}

</style>
