<script>
    export let width = 0.15
    export let radius = 0.0
    export let delta = 1/16
    export let gap = 0.01
    export let fill = "none"
    export let stroke = undefined
    export let stroke_width = 0.005
</script>

<rect x={-delta/2 + gap/2 + stroke_width/2} y={radius - width/2 + stroke_width/2} height={width - stroke_width} width={delta - gap - stroke_width} {fill} {stroke} stroke-width={stroke_width}/>