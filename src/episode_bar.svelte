<script>
    import { longpress } from './longpress.js'
    import { adjust, emphasize} from "./colors.js"
    import { createEventDispatcher } from 'svelte'
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

    const button_size = 64;

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
        <div class="col">
            <button class="episode"
                class:selected={selected.has(episode_id)}
                on:press={() => on_press(episode_id)}
                use:longpress on:longpress={() => on_longpress(episode_id)}>
                {#each episode.phrases as phrase, phrase_id}
                <i style="border-color:{episode.off ? 'grey' : episode_id == active ? emphasize(phrase.instrument.color) : adjust(phrase.instrument.color, phrase.volume)};
                    width:{2 * radius(episode.phrases, phrase_id)}px;
                    height:{2 * radius(episode.phrases, phrase_id)}px">
                </i>
                {/each}
                <div class="label outline">{episode_id + 1}</div>
                <div class="label" class:active={episode_id == active}>{episode_id + 1}</div>
            </button>
            <div class="repeat row">
                {#if round != null && episode_id == active}{round + 1}/{/if}<!--
                -->{#if episode.repeat === Infinity}&infin;{:else}{#if round == null || episode_id != active}&times;{/if}{episode.repeat}{/if}
            </div>
        </div>
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
            <li><button on:click={() => dispatch("solo", {})}>solo</button></li>
            <li><button on:click={() => dispatch("on", {})}>on</button></li>
            <li><button on:click={() => dispatch("off", {})}>off</button></li>
            <li><div class="col">
                <button on:click={() => dispatch("repeat", {x: 1})}>&times;1</button>
                <button on:click={() => dispatch("repeat", {x: 2})}>&times;2</button>
                <button on:click={() => dispatch("repeat", {x: 4})}>&times;4</button>
                <button on:click={() => dispatch("repeat", {x: 8})}>&times;8</button>
            </div></li>
            <li><button disabled={selected.size>1} on:click={() => dispatch("repeat", {x: Infinity})}>&infin;</button></li>
            <li><button on:click={() => dispatch("del", {})}>del</button></li>
        </ul>
    </aside>
    {/if}
</div>

<style>
    .buttons > * {
        flex-basis: 64px;
        min-width: 10px;
    }
    .buttons > *:last-child {
        flex-shrink: 0;
    }
    button.episode {
        overflow: hidden;
        margin: 0;
        padding: 0;
        width: 64px;
        min-height: 64px;
        border-radius: 50%;
        display: block;
        position: relative;
        box-shadow: 1px 1px 8px 0px rgba(0, 0, 0, 0.2),
            inset 0px 0px 5px 0px rgba(0, 0, 0, 0.2);
        border: 1px solid #ccc;
    }
    button.episode.selected {
        box-shadow:  0px 0px 5px 2px #00ccffa4,
            inset 0px 0px 5px 0px rgba(0, 0, 0, 0.2);
        border: 1px solid #00ccff;
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
        border-width: 3px;
        border-style: solid;
        border-radius: 50%;
    }
    button.episode .label {
        margin: 0;
        padding: 0;
        font-size: 2rem;
        line-height: 2rem;
        width: 2rem;
        height: 2rem;
        font-weight: bold; 
        letter-spacing: -1px;
        font-family: "Helvetica Narrow","Arial Narrow",Tahoma,Arial,Helvetica,sans-serif;
    }
    button.episode .label.outline {
        -webkit-text-stroke: 3px white;
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
        left: 50%;
        transform: translateX(-50%);
        padding: 8px;
        display: flex;
        list-style: none;
    }
    aside ul li {
        margin: 0 4px;
    }
    aside button {
        width: 36px;
        border-radius: 8px;
        padding: 0 0 4px 0px;
        margin: 0;
        border: 1px solid #8fafe7;
    }
    .label.active {
        color: blue;
    }
    .repeat {
        font-size: 1.3rem;
        text-align: center;
        font-weight: bold;
        justify-content: center;
    }
</style>