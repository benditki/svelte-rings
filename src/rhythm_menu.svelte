<script>
    import { createEventDispatcher, onMount } from 'svelte'
	const dispatch = createEventDispatcher()

    export let layout
    export let rhythms
    export let active
    export let open = false

    let valid = false
    let name

    const init_ts = Date.now()

    function on_name_edit(e) {
        //console.log(this)
        name = e.target.value
        valid = !rhythms.find(rhythm => rhythm.name == name)
    }
</script>

<style>
header {
    display: flex;
    flex-direction: column;
}
.menu header {
    padding: 12px 16px;
}

button {
    margin: 0;
    padding: 0;
    background: none;
    border: none;
}

.name {
    color: var(--theme-fg);
    font-family: "Scranji";
    font-size: 130%;
    background-color: var(--theme-mid);
    padding: 3pt 8pt;
}
.menu {
    position: fixed;
    z-index: 10;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    background: var(--theme-bg);
    margin: 8px 4px;
    padding: 8px;
    border: 3px solid var(--theme-fg);
}
.list {
    margin-top: 12px;
    flex-direction: column-reverse;
    overflow-x: scroll;
}

.rename {
    margin-bottom: 12px;
}

input[type=text] {
    font-weight: inherit;
    padding: 2px 0 4px;
    width: 100%;
    margin: 0;
    text-align: center;
}
.icons {
    padding: 0 0px;
    justify-content: space-around;
    margin: 0 0 8px;
}
i {
    font-size: 36px;
    color: var(--theme-fg);
}
button:disabled i {
    color: var(--theme-bg-alt);
}

i:before {
    line-height: 62px;
}

.list i:before {
    line-height: 32px;
}

.round i {
    color: var(--theme-bg);
    margin: 0;
    line-height: 22px;
}
.round i:before {
    line-height: 22px;
    font-size: 28px;
}
h1 + i, h1 + i:before {
    margin: 0 0 0 4px;
}
.icon-check {
    color: #84cc33;
}
.icon-trash {
    color: #fe4365;
}
.icon-plus {
    font-size: 36px;
}
.icon-plus:before {
    line-height: 24px;
}
.icon-plus.outline:before {
    -webkit-text-stroke: 7px var(--theme-bg);
    color: red;
}
.icon-lock {
    color: var(--theme-mid);
}
.list .icon-lock {
    color: var(--theme-bg-alt);
}
.new {
    position: relative;
    border: 2px solid var(--theme-fg);
    border-radius: 6px;
    padding: 4px 8px 12px 0px;
    width: 48px;
}
.new span {
    color: var(--theme-fg);
    font-size: 36px;
    line-height: 24px;
    font-weight: bold;
}
.new i {
    position: absolute;
    top: 100%;
    left: 100%;
    margin: 0;
    transform: translate(-50%, -50%)
}

</style>

{#if open}
<div class="col menu">
    <header>
        <div class="row rename">
            <h1><input type=text value={rhythms[active].name}
                on:input={on_name_edit}></h1>
            {#if rhythms[active].blocked}
            <i class="icon-lock"></i>
            {:else}
            <button disabled={!valid}
                on:click={() => { open = false; dispatch("rename", {name})}}>
                <i class="icon-check"></i></button>
            {/if}
        </div>
        <div class="row icons">
            <button disabled={rhythms[active].blocked} on:click={() => { open = false; dispatch("del") }}>
                <i class="icon-trash"></i>
            </button>
            <button on:click={() => { open = false; dispatch("clone") }}>
                <i class="icon-copy"></i>
            </button>
            <button on:click={() => { open = false; dispatch("new", {period:12}) }}>
                <div class="col new">
                    <span>12</span>
                    <i class="icon-plus outline"></i>
                    <i class="icon-plus"></i>
                </div>
            </button>
            <button on:click={() => { open = false; dispatch("new", {period:16}) }}>
                <div class="col new">
                    <span>16</span>
                    <i class="icon-plus outline"></i>
                    <i class="icon-plus"></i>
                </div>
            </button>
        </div>
    </header>
    <div class="col list">
        {#each rhythms as rhythm, rhythm_id}
        {#if rhythm_id != active }
        <div class="row" style="order:{rhythm.accessed - init_ts}"
            on:click={() => { open = false; dispatch("switch", { rhythm_id })}}>
            <h1>{rhythm.name}</h1>
            {#if rhythm.blocked}<i class="icon-lock"></i>{/if}
        </div>
        {/if}
        {/each}
    </div>
</div>
{/if}

{#if layout}
<div on:click={() => open = !open} class="edge_button" style="position: fixed; z-index: 12; width: {layout.menu_button.width}px; top: {layout.menu_button.top}px; left: {layout.menu_button.left}px; height: {layout.menu_button.height}px">
    <svg xmlns="http://www.w3.org/2000/svg" height="{layout.menu_button.size}px" width="{layout.menu_button.size}px" viewBox="-0.5 -0.5 1 1" pointer-events="none">
        {#if open}
        <line x1=-0.2 x2=0.2 y1=-0.2 y2=0.2 stroke-width=0.16 stroke-linecap="round" stroke="var(--theme-bg)"/>
        <line x1=0.2 x2=-0.2 y1=-0.2 y2=0.2 stroke-width=0.16 stroke-linecap="round" stroke="var(--theme-bg)"/>
        {:else}
        <line x1=-0.1 x2=0.4 y1=-0.3 y2=-0.3 stroke-width=0.16 stroke-linecap="round" stroke="var(--theme-bg)"/>
        <line x1=-0.25 x2=0.25 y1=0 y2=0 stroke-width=0.16 stroke-linecap="round" stroke="var(--theme-bg)"/>
        <line x1=-0.4 x2=0.1 y1=0.3 y2=0.3 stroke-width=0.16 stroke-linecap="round" stroke="var(--theme-bg)"/>
        {/if}
    </svg>
</div>

{/if}
