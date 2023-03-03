<script>
    import { createEventDispatcher } from 'svelte'
	const dispatch = createEventDispatcher()

    export let values = [45, 60, 75, 90, 105, 120, 135, 150, 165, 180]
    export let value
</script>

<style>
    button {
        background: none;
        color: inherit;
        border: none;
        border-radius: 0px;
        padding: 0;
        margin: 0;
        font: inherit;
        cursor: pointer;
        outline: inherit;
    }	
    
    .range {
        display: inline-flex;
    }
    .item {
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        padding: 2px;
        margin: 2px;
        background: #eee;
    }
    .block {
        display: block;
        width: 24px;
        height: 4px;
        background: grey;
    }
    .active .block {
        background: green;
    }
    label {
        font: 10px "Good Times", sans-serif;
    }
</style>

<div class="range">
    {#each values as v, value_id}
    <button class="item" class:active={v == value} on:click={() => { value=v; dispatch("change") }}>
        <label>{v}</label>
        <div class="block"/>
    </button>
    {/each}
</div>