<script>
    import DotRect from "./dot_rect.svelte"

    export let episodes
    export let layout
    export let episode_arrangement
    export let active
    export let pointer
    import {external_points} from "./debug.js"
    let width
    let height

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
            .map(point => ({ ...point, life: point.life - 0.04 }))
            .filter(point => point.life > 0)
        external_points.update_life()
    }

    function activate(active) {
        external_points.activate(active)
        if (id == 0 && active) {
            update()
        } else if (id != 0 && !active) {
            cancelAnimationFrame(id)
            id = 0
        }
    }

    function rect(x, y, width, height, stroke_width=2) {
        if (width > stroke_width) {
            x += stroke_width / 2
            width -= stroke_width
        } else {
            x += width / 2
            width = 0
        }
        if (height > stroke_width) {
            y += stroke_width / 2
            height -= stroke_width
        } else {
            y += height / 2
            height = 0
        }
        return {x, y, width, height, ["stroke-width"]: stroke_width}
    }

    function circle(cx, cy, size, stroke_width=2) {
        return {cx, cy, r: size/2 - stroke_width, ["stroke-width"]: stroke_width}
    }

    function rect_centered(x, y, width, height, stroke_width=2) {
        return rect(x - width/2, y - height/2, width, height, stroke_width)
    }

    const presented_sections = {
        header: { color: "red"},
        title: { color: "red"},
        circle: { color: "blue"},
        list: { color: "magenta"},
        parts: { color: "magenta"},
        menu_button: { color: "greenyellow"},
        play_button: { color: "greenyellow"},
        bpm_button: { color: "greenyellow"},
    }

    const milli = (x) => (x * 1000).toFixed()

</script>


<svelte:window
    bind:innerWidth={width} bind:innerHeight={height}
    on:touchstart={(e) => on_touch(e, true)}
    on:touchmove={(e) => on_touch(e, false)}/>

{#if active && width}
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}">
    {#if layout}
    <g class="layout">
    {#each Object.entries(presented_sections) as [section_name, {color}]}
        {@const {left, top, width, height} = layout[section_name]}
        <rect {...rect(left, top, width, height)} stroke={color}/>
    {/each}
    <circle {...circle(layout.circle.center, layout.circle.middle, layout.circle.size)} stroke=blue/>
    </g>
    {/if}
    <g class="touches">
    {#each points as point, point_id}
        {#if point.start}
        <circle class="big" r={20} cx={point.x} cy={point.y} opacity={point.life}/>
        {/if}
        {#if point_id == 0}
        <circle cx={point.x} cy={point.y} opacity={point.life * 0.2}/>
        {:else}
        <line x1={points[point_id - 1].x} y1={points[point_id - 1].y} x2={point.x} y2={point.y} opacity={point.life * 0.2}/>
        {/if}
    {/each}
    {#each $external_points as point, point_id}
        {#if point_id == 0}
        <circle class="external" cx={point.x} cy={point.y} opacity={point.life}/>
        {:else}
        <line class="external" x1={$external_points[point_id - 1].x} y1={$external_points[point_id - 1].y} x2={point.x} y2={point.y} opacity={point.life}/>
        {/if}
        {#if point.get_label}
        <text x={point.x} y={point.y}>{point.get_label()}</text>
        {/if}
    {/each}
    </g>
    {#if pointer?.start && layout && episode_arrangement}
    {@const {part_transform, phase_transform, part_space, pulse_delta, available_space} = episode_arrangement}
    <g class=dots transform={layout.parts_transform}>
        {#if pointer.start?.section == "parts"}
        {@const {radius, episode_id, phrase_id, part_id, phase} = pointer.last}
        <text class=number x=0 y=-0.05>{milli(radius)}:{milli(phase)}</text>
        {#if episode_id != undefined}
            {@const {episode_transform, phrase_transform} = episode_arrangement.episode_transform(episode_id)}
            {@const {height: episode_height, phrase_arrangement} = episode_arrangement.episodes.get(episodes[episode_id])}
            <g transform={episode_transform}>
            {#if phrase_id != undefined}
            <g transform={phrase_transform(phrase_id)}>
            {#if part_id != undefined}
            <g transform={part_transform(part_id)}>
            <g transform={phase_transform(phase)}>
            <DotRect width={part_space} delta={pulse_delta} stroke="cyan"/>
            </g>
            </g>
            {:else}
            <rect {...rect(0, 0, 1, phrase_arrangement[phrase_id].height, 0.01)} stroke="cyan" fill="none"/>
            <text class=number x=1 y=0>{milli(episode_arrangement.episodes.get(episodes[episode_id]).start + phrase_arrangement[phrase_id].start)}</text>
            <text class=number x=1 y={phrase_arrangement[phrase_id].height}>{milli(episode_arrangement.episodes.get(episodes[episode_id]).start + phrase_arrangement[phrase_id].end)}</text>
            {/if}
            </g>
            {:else}
            <rect {...rect(0, 0, 1, episode_height, 0.01)} stroke="cyan" fill="none"/>
            <text class=number x=1 y=0>{milli(episode_arrangement.episodes.get(episodes[episode_id]).start)}</text>
            <text class=number x=1 y={episode_arrangement.episodes.get(episodes[episode_id]).height}>{milli(episode_arrangement.episodes.get(episodes[episode_id]).end)}</text>
            {/if}
            </g>
        {:else}
            <rect {...rect(0, 0, 1, available_space, 0.01)} stroke="cyan" fill="none"/>
        {/if}
        {/if}
    </g>
    {/if}
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
    .touches circle {
        fill: cyan;
        r: 5;
    }
    .touches circle.big {
        fill: #7affffb9;
        r: 20;
    }
    .touches line {
        stroke: cyan;
        stroke-width: 10;
        stroke-linecap: round;
    }
    .touches circle.external {
        fill: rgb(255, 158, 13);
        r: 5;
    }
    .touches circle.external.big {
        fill: rgba(255, 158, 13, 0.712);
        r: 10;
    }
    .touches line.external {
        stroke: rgb(255, 158, 13);
        stroke-width: 10;
        stroke-linecap: round;
    }

    .touches text {
        fill: black;
    }

    .layout rect {
        fill: none;
    }
    .layout circle {
        fill: none;
    }
    .dots text.number {
        font-family: monospace;
        font-size: 0.045px;
        font-weight: bold;
        fill: black;
    }
</style>