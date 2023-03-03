<script>
    export let active
    let width = 100, height = 100

    $: activate(active)

    let points = []

    function on_touch(e, start) {
        if (!active) return

        for (const touch of e.changedTouches) {
            points.push({ x: touch.pageX, y: touch.pageY, life: 1.0, start })
        }
        points = points
    }

    let id = 0

    function update() {
        id = requestAnimationFrame(update)
        points = points
            .map(point => ({ ...point, life: point.life - 0.08 }))
            .filter(point => point.life > 0)
    }

    function activate(active) {
        if (id == 0 && active) {
            update()
        } else if (id != 0 && !active) {
            cancelAnimationFrame(id)
            id = 0
        }
    }

</script>

<svelte:window
    bind:innerWidth={width} bind:innerHeight={height}
    on:touchstart={(e) => on_touch(e, true)}
    on:touchmove={(e) => on_touch(e, false)}/>

{#if active}
<svg viewBox="0 0 {width} {height}">
    {#each points as point, point_id}
        {#if point.start}
        <circle class="big" r={20} cx={point.x} cy={point.y} opacity={point.life}/>
        {/if}
        {#if point_id == 0}
        <circle r={10} cx={point.x} cy={point.y} opacity={point.life}/>
        {:else}
        <line x1={points[point_id - 1].x} y1={points[point_id - 1].y} x2={point.x} y2={point.y} opacity={point.life}/>
        {/if}
    {/each}
</svg>
{/if}

<style>
svg {
    position: fixed;
    z-index: 100;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    pointer-events: none;
}
circle {
    fill: cyan;
}
circle.big {
    fill: #7affffb9;
}
line {
    stroke: cyan;
    stroke-width: 20;
    stroke-linecap: round;
}
</style>