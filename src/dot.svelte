<script>
    import { longpress } from './longpress.js'
    import * as symbols from "./symbols"

    export let radius = 1.0
    export let width = 0.15
    export let size = 0.4 * width
    export let phase = 0.0
    export let delta = 1/16
    export let gap = 0.01
    export let sym = null
    export let color = "grey"
    export let pulse_color = "#222"
    export let outline_color = "white"

    function trans(phase) {
        return `rotate(${360 * phase})`
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

    function shape(sym, size, radius) {
        const s2 = size / 2
        if (sym == symbols.QUAD) {
            return `M ${radius - s2} ${s2}` +
                  ` L ${radius - s2} ${-s2}` +
                  ` L ${radius + s2} ${-s2}` +
                  ` L ${radius + s2} ${s2} Z`

        } else if (sym == symbols.TRIAG) {
            return `M ${radius - s2} ${s2}` +
                  ` L ${radius - s2} ${-s2}` +
                  ` L ${radius + s2} 0 Z`

        } else if (sym == symbols.DOT) {
            return `M ${radius - s2} 0` +
                  ` A ${s2} ${s2} 0 1 1 ${radius + s2} 0` +
                  ` A ${s2} ${s2} 0 1 1 ${radius - s2} 0`
        } else if (sym == symbols.TRAPEZ) {
            return `M ${radius - s2 * 1.1} ${s2/2}` +
                  ` L ${radius - s2 * 1.1} ${-s2/2}` +
                  ` L ${radius + s2 * 0.9} ${-s2 * 1.2}` +
                  ` L ${radius + s2 * 0.9} ${s2 * 1.2} Z`
        }
    }

    function stroke_width() {
        return size * 0.15
    }
</script>

<g transform="{trans(phase)}" use:longpress on:press on:touch on:swipe on:swipeend>
    <path  fill={color} d="{cont(radius, width, delta, gap)}"/>
    {#if sym}
    <path fill={pulse_color} d={shape(sym, size, radius)}
        stroke={outline_color} stroke-width={stroke_width()}/>
    {/if}
</g>

<style>
g {
    touch-action: none;
}
</style>