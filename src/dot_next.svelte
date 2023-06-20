<script>
    export let circular
    export let x1
    export let x2
    export let y1
    export let y2
</script>

<line {x1} {x2} {y1} {y2}
        stroke="var(--theme-bg-more)" stroke-width={circular ? 0.015 : 0.01}/>
<line {x1} {x2} {y1} {y2}
        stroke="var(--theme-fg)" stroke-width={circular ? 0.008 : 0.005}/>
