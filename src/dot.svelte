<script>
    import { longpress } from './longpress.js'
    import * as symbols from "./symbols"

    export let back = true
    export let circular = true
    export let radius = 1.0
    export let dot_shift = 0
    export let width = 0.15
    export let size = 0.4 * width
    export let phase = 0.0
    export let delta = 1/16
    export let gap = 0.01
    export let sym = null
    export let color = "grey"
    export let pulse_color = "var(--theme-fg)"
    export let outline_color = "var(--theme-bg-more)"
    export let flash_color = undefined

    export let next_phase = undefined
    export let next_dot_shift = 0

    function trans(circular, phase) {
        return circular ? `rotate(${360 * phase})` : `translate(${phase})`
    }

    function sym_trans(circular, radius, dot_shift) {
        return circular ? `translate(${radius + dot_shift})` : `translate(0, ${radius - dot_shift}) rotate(270)`
    }

    function cont(radius, width, delta, gap) {
        if (radius == 0) {
            const w2 = width / 2
            return `M ${-w2} 0` +
                ` A ${w2} ${w2} 0 1 1 ${w2} 0` +
                ` A ${w2} ${w2} 0 1 1 ${-w2} 0`
        }

        const r1 = radius - width/2
        const r2 = radius + width/2
        const x1 = r1 * Math.cos(Math.PI * delta - Math.asin(0.5 * gap / r1))
        const y1 = r1 * Math.sin(Math.PI * delta - Math.asin(0.5 * gap / r1))
        const x2 = r2 * Math.cos(Math.PI * delta - Math.asin(0.5 * gap / r2))
        const y2 = r2 * Math.sin(Math.PI * delta - Math.asin(0.5 * gap / r2))

        return `M ${x1} ${y1}` +
            ` L ${x2} ${y2}  A ${r2} ${r2} 0 0 0 ${x2} ${-y2}` +
            ` L ${x1} ${-y1} A ${r1} ${r1} 0 0 1 ${x1} ${y1}`
    }

    function shape(sym, size) {
        const s2 = size / 2
        if (sym == symbols.QUAD) {
            return `M ${- s2} ${+ s2}` +
                  ` L ${- s2} ${- s2}` +
                  ` L ${+ s2} ${- s2}` +
                  ` L ${+ s2} ${+ s2} Z`

        } else if (sym == symbols.TRIAG) {
            return `M ${- s2} ${+ s2}` +
                  ` L ${- s2} ${- s2}` +
                  ` L ${+ s2} 0 Z`

        } else if (sym == symbols.DOT) {
            return `M ${- s2} 0` +
                  ` A ${+ s2} ${+ s2} 0 1 1 ${+ s2} 0` +
                  ` A ${+ s2} ${+ s2} 0 1 1 ${- s2} 0`

        } else if (sym == symbols.TRAPEZ) {
            return `M ${- s2 * 1.1} ${+ s2 * 0.5}` +
                  ` L ${- s2 * 1.1} ${- s2 * 0.5}` +
                  ` L ${+ s2 * 0.9} ${- s2 * 1.2}` +
                  ` L ${+ s2 * 0.9} ${+ s2 * 1.2} Z`
        }
    }

    function stroke_width() {
        return size * 0.15
    }
</script>

<g class="container" transform="{trans(circular, phase)}">
    {#if back}
    <g class="back" use:longpress on:touch on:move on:press on:longpress on:swipe on:swipeend on:release on:finish_touch>
        {#if circular}
        <path fill={color} d="{cont(radius, width, delta, gap)}"/>
        {:else}
        <rect x={-delta/2 + gap/2} y={radius-width/2} height={width} width={delta - gap} fill={color}/>
        {/if}
    </g>
    {/if}

    {#if sym}
    <g class="sym" transform={sym_trans(circular, radius, dot_shift)}>
        <path fill={pulse_color} d={shape(sym, size)}
            stroke={outline_color} stroke-width={stroke_width()} data-debug={JSON.stringify({flash_color})}/>
        {#if flash_color}
        <path fill="none" d={shape(sym, size * 0.55)}
            stroke={flash_color} stroke-width={stroke_width()}/>
        {/if}
    </g>
    {/if}

    {#if next_phase !== undefined}
    <g class="connector">
        {#if circular}
        <line y2={radius * Math.sin(2 * Math.PI * (next_phase - phase))}
                x1={dot_shift + radius}
                x2={next_dot_shift + radius * Math.cos(2 * Math.PI * (next_phase - phase))}
                stroke={outline_color} stroke-width=0.015
                data-debug={`next_phase=${next_phase}, phase=${phase}`}/>
        <line y2={radius * Math.sin(2 * Math.PI * (next_phase - phase))}
                x1={dot_shift + radius}
                x2={next_dot_shift + radius * Math.cos(2 * Math.PI * (next_phase - phase))}
                stroke={pulse_color} stroke-width=0.008
                data-debug={`next_phase=${next_phase}, phase=${phase}`}/>
        {:else}
            {#if next_phase > phase}
            <line transform={`translate(0, ${radius})`} x2={next_phase - phase}
                    y1={-dot_shift}
                    y2={-next_dot_shift}
                    stroke={outline_color} stroke-width=0.01
                    data-debug={`next_phase=${next_phase}, phase=${phase}`}/>
            <line transform={`translate(0, ${radius})`} x2={next_phase - phase}
                    y1={-dot_shift}
                    y2={-next_dot_shift}
                    stroke={pulse_color} stroke-width=0.005
                    data-debug={`next_phase=${next_phase}, phase=${phase}`}/>
            {/if}
        {/if}
    </g>
    {/if}
</g>

<style>
.container {
    touch-action: none;
}

.sym, .connector {
    pointer-events: none;
}
</style>