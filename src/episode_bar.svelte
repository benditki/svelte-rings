<script>
    import { longpress } from './longpress.js'
    import { adjust, emphasize} from "./colors.js"
    import { createEventDispatcher } from 'svelte'
    import ProgressCircle from "./progress_circle.svelte"

	const dispatch = createEventDispatcher()

    export let episodes
    export let selected
    export let active
    export let blocked
    export let round = null

    function on_press(episode_id) {
        if (selected.size) {
            if (selected.has(episode_id)) {
                selected.delete(episode_id)
                selected = selected
            } else {
                selected = selected.add(episode_id)
            }
        } else {
            if (episode_id != active) {
                dispatch("change", {episode_id})
            }
        }
    }

    function on_longpress(episode_id) {
        selected = selected.add(episode_id)
    }

    const button_size = 32;

    function radius_delta(phrases) {
        return button_size * 0.25 / phrases.length
    }

    function radius(phrases, phrase_id) {
        return button_size * 0.3 + radius_delta(phrases) * phrase_id
    }

</script>

<div class="col">
    <div class="row buttons">
        {#each episodes as episode, episode_id}
            <button class="episode"
                class:selected={selected.has(episode_id)}
                on:press={() => on_press(episode_id)}
                use:longpress on:longpress={() => on_longpress(episode_id)}>
                <ProgressCircle
                progress={episode_id == active ? round : null}
                rounds={episode.repeat}
                width={button_size}px
                height={button_size}px><div class="label" class:active={episode_id == active}>{episode_id + 1}</div></ProgressCircle>

            </button>
        {/each}
        {#if !blocked}
        <div class="col plus" style="order:100">
            <button class="episode" style="flex-shrink:0" on:click={() => dispatch("add")}>
                <div class="label">+</div>
            </button>
        </div>
        {/if}
    </div>
    {#if selected.size}
    <aside>
        <ul>
            <li><button on:click={() => dispatch("solo", {})}>sol</button></li>
            <li><button on:click={() => dispatch("on", {})}>on</button></li>
            <li><button on:click={() => dispatch("off", {})}>off</button></li>
            <li><button on:click={() => dispatch("repeat", {x: 1})}>&times;1</button></li>
            <li><button on:click={() => dispatch("repeat", {x: 2})}>&times;2</button></li>
            <li><button on:click={() => dispatch("repeat", {x: 4})}>&times;4</button></li>
            <li><button on:click={() => dispatch("repeat", {x: 8})}>&times;8</button></li>
            <li><button disabled={selected.size>1} on:click={() => dispatch("repeat", {x: Infinity})}>&infin;</button></li>
            <li><button on:click={() => dispatch("del", {})}>del</button></li>
        </ul>
    </aside>
    {/if}
</div>

<style>
    .buttons {
        gap: 3px;
    }
    .buttons > * {
        flex-basis: 32px;
        min-width: 32px;
    }

    button.episode {
        overflow: hidden;
        margin: 0;
        padding: 0;
        width: 32px;
        min-height: 32px;
        display: block;
        position: relative;
    }
    button.episode.selected {
        background: var(--theme-mid);
        border-radius: 50%;
    }
    button.episode > * {
        position: absolute;
        overflow: hidden;
        display: block;
        width: 100%;
        height: 100%;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%)
    }
    button.episode i {
        border-width: 2px;
        border-style: solid;
        border-radius: 50%;
    }
    button.episode .label {
        margin: 0;
        padding: 0;
        font-size: 16px;
        line-height: 32px;
        font-weight: bold;
        color: var(--theme-fg);
    }
    button.episode .label.active {
        color: var(--theme-accent);
    }
    aside {
        width: 100%;
        height: 0px;
        position: relative;
        background: red;
    }
    aside ul {
        margin: 0;
        position: absolute;
        z-index: 2;
        left: 0px;
        top: 6px;
        height: 24px;
        display: flex;
        list-style: none;
    }
    aside ul li {
        margin: 0 4px;
    }
    aside button {
        width: 28px;
        height: 20px;
        border-radius: 8px;
        padding: 0 0 4px 0px;
        margin: 0;
        font-size: 14px;
        line-height: 14px;
        border: 3px solid var(--theme-fg);
    }

</style>