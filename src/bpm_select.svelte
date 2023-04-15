<script>
    import { createEventDispatcher } from 'svelte'
	const dispatch = createEventDispatcher()

    export let layout
    export let values = [45, 60, 75, 90, 105, 120, 135, 150, 165, 180]
    export let value

    let open = false
</script>

<style>
    button {
        background: none;
        color: inherit;
        border: none;
        padding: 0;
        margin: 0;
        font: inherit;
        cursor: pointer;
        outline: inherit;
    }

    .range {
        position: fixed;
        display: flex;
        flex-direction: column;
        background: var(--theme-bg);
        border: 2px solid var(--theme-fg);
        border-radius: 8px 0px;
    }
    .item {
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        padding: 2px;
        margin: 2px;
    }
    .active.item {
        background: var(--theme-fg);
    }
    label {
        font: 14px "Good Times", sans-serif;
        color: var(--theme-fg);
    }
    .active label {
        color: var(--theme-bg);
    }
    .container {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    }
    .container label {
        color: var(--theme-bg);
    }
    .container label.small {
        font-size: 8px;
        letter-spacing: 1px;
    }
</style>

<div class=container on:click={() => open = !open}>
    <label class="value">{value}</label>
    <label class="small">bpm</label>
</div>

{#if open}
<div class="range" style="width: {layout.bpm_range.width}px; top: {layout.bpm_range.top}px; left: {layout.bpm_range.left}px; height: {layout.bpm_range.height}px">
    {#each values as v, value_id}
    <button class="item" class:active={v == value} on:click={() => { value=v; dispatch("change"); open=false }}>
        <label>{v}</label>
    </button>
    {/each}
</div>
{/if}