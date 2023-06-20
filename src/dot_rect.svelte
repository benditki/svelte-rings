<script>
    export let circular = false
    export let width = 0.15
    export let radius = 0.0
    export let delta = 1/16
    export let gap = undefined
    export let fill = "none"
    export let stroke = undefined
    export let stroke_width = undefined

    let actual_gap
    let actual_stroke_width
    $: actual_stroke_width = stroke_width ?? (stroke == undefined ? 0 : 0.005)
    $: actual_gap = gap ?? (circular ? 0.01 : 0.0035)

    function cont(radius, width, delta, gap) {
        if (radius == 0) {
            const w2 = width / 2
            return `M ${-w2} 0` +
                ` A ${w2} ${w2} 0 1 1 ${w2} 0` +
                ` A ${w2} ${w2} 0 1 1 ${-w2} 0`
        }

        const r1 = radius - width/2
        const r2 = radius + width/2
        const x1 = -radius + r1 * Math.cos(Math.PI * delta - Math.asin(0.5 * gap / r1))
        const y1 = r1 * Math.sin(Math.PI * delta - Math.asin(0.5 * gap / r1))
        const x2 = -radius + r2 * Math.cos(Math.PI * delta - Math.asin(0.5 * gap / r2))
        const y2 = r2 * Math.sin(Math.PI * delta - Math.asin(0.5 * gap / r2))

        return `M ${x1} ${y1}` +
            ` L ${x2} ${y2}  A ${r2} ${r2} 0 0 0 ${x2} ${-y2}` +
            ` L ${x1} ${-y1} A ${r1} ${r1} 0 0 1 ${x1} ${y1}`
    }

</script>

{#if circular}
<path {fill} {stroke} stroke-width={actual_stroke_width} d="{cont(radius, width, delta, actual_gap)}"/>
{:else}
<rect {fill} {stroke} stroke-width={actual_stroke_width} x={-delta/2 + actual_gap/2 + actual_stroke_width/2} y={- width/2 + actual_stroke_width/2} height={width - actual_stroke_width} width={delta - actual_gap - actual_stroke_width}/>
{/if}