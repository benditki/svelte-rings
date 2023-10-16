<script>
    import { createEventDispatcher, onMount } from 'svelte'
	const dispatch = createEventDispatcher()

    export let layout
    export let rhythms
    export let active
    export let open = false

    let edit_open = false
    let name_is_valid = false
    let name = undefined

    const init_ts = Date.now()

    function close_all() {
        open = false
        edit_open = false
    }

    function toggle_open() {
        open = !open
        edit_open = false
    }

    function on_name_edit(e) {
        update_name(e.target.value)
    }

    function update_name(new_value) {
        name = new_value
        name_is_valid = name && !rhythms.find(rhythm => rhythm.name == name)
    }

    function toggle_edit(e) {
        edit_open = !edit_open
        if (edit_open) {
            update_name(rhythms[active].name)
        } else {
            if (name_is_valid) {
                dispatch("rename", {name})
            }
        }
    }

    function layout_style_elem(name, value, units="px") {
        return value == undefined ? "" : `${name}: ${value}${units}`
    }

    function layout_style({left, top, width, height}) {
        return [
            layout_style_elem("left", left),
            layout_style_elem("top", top),
            layout_style_elem("width", width),
            layout_style_elem("height", height)
        ].filter((s) => s).join("; ")
    }
</script>

<style>
.title {
    position: fixed;
    display: flex;
    justify-content: center;
    z-index: 11;
}
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

line {
    stroke-width: 0.13;
    stroke-linecap: round;
    stroke: var(--theme-fg);
}

text {
    font-size: 0.45px;
    font-weight: bold;
    text-anchor: middle;
    fill: var(--theme-fg);
    font-family: "Good Times", sans-serif;
}

.fixed_button {
    position: fixed;
    z-index: 12;
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
    position: fixed;
    z-index: 11;
    padding: 8px;
    /* margin-top: 12px; */
    /* flex-direction: column-reverse; */
    /* overflow-x: scroll; */
}

.rename {
    margin-bottom: 12px;
}

input[type=text] {
    font-weight: inherit;
    text-transform: inherit;
    background-color: var(--theme-bg-more);
    /* color: var(--theme-fg-alt); */
    border: none;
    /* padding: 2px 0 4px; */
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
    <div class="col list" style={layout_style(layout.rhythm_list)}>
        {#each rhythms as rhythm, rhythm_id}
        {#if rhythm_id != active }
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div class="row  centered" style="order:{init_ts - rhythm.accessed}"
            on:click={() => { close_all(); dispatch("switch", { rhythm_id })}}>
            <h1 class="rhythm_name">{rhythm.name}</h1>
        </div>
        {/if}
        {/each}
    </div>
</div>
{/if}

{#if layout}
{#if rhythms[active]}
<!-- svelte-ignore a11y-click-events-have-key-events -->
{#if open && !rhythms[active].blocked}
<div on:click={toggle_edit} class="round_button fixed_button" style="{layout_style(layout.title_edit)}">
    <svg xmlns="http://www.w3.org/2000/svg" height="{layout.title_edit.height}px" width="{layout.title_edit.width}px" viewBox="-0.5 -0.5 1 1" pointer-events="none">
        {#if edit_open}
        <line x1=-0.3 x2=0.2 y1=0.35 y2=0.35/>
        {#if name_is_valid}
        <line x1=-0.1 x2=0.3 y1=0.2 y2=-0.3/>
        <line x1=-0.3 x2=-0.1 y1=0 y2=0.2/>
        {:else}
        <line x1=-0.2 x2=0.1 y1=-0.15 y2=0.15/>
        <line x1=0.1 x2=-0.2 y1=-0.15 y2=0.15/>
        {/if}
        {:else}
        <line x1=-0.3 x2=0.2 y1=0.35 y2=0.35/>
        <line x1=0.2 x2=-0.15 y1=-0.3 y2=0.2/>
        <line transform="translate(0.02, -0.15)" x1=0.2 x2=-0.15 y1=-0.3 y2=0.2/>
        {/if}
    </svg>
</div>
{/if}
<h1 class="title rhythm_name" style={layout_style(layout.title)}>{#if open && edit_open}<input type=text value={rhythms[active].name}
    on:input={on_name_edit} autofocus>{:else}{rhythms[active].name}{/if}</h1>
{/if}

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div on:click={toggle_open} class="edge_button fixed_button" style="{layout_style(layout.menu_button)}">
    <svg xmlns="http://www.w3.org/2000/svg" height="{layout.menu_button.size}px" width="{layout.menu_button.size}px" viewBox="-0.5 -0.5 1 1" pointer-events="none">
        {#if open}
        <line x1=-0.2 x2=0.2 y1=-0.2 y2=0.2/>
        <line x1=0.2 x2=-0.2 y1=-0.2 y2=0.2/>
        {:else}
        <line x1=-0.1 x2=0.4 y1=-0.3 y2=-0.3/>
        <line x1=-0.25 x2=0.25 y1=0 y2=0/>
        <line x1=-0.4 x2=0.1 y1=0.3 y2=0.3/>
        {/if}
    </svg>
</div>

{#if open}
{#if !rhythms[active].blocked}
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div on:click={() => {close_all(); dispatch("del")}} class="edge_button fixed_button" style="{layout_style(layout.play_button)}">
    <svg xmlns="http://www.w3.org/2000/svg" height="{layout.play_button.size}px" width="{layout.play_button.size}px" viewBox="-0.5 -0.5 1 1" pointer-events="none">
        <line x1=-0.15 x2=0.15 y1=-0.3 y2=-0.3/>
        <line x1=-0.3 x2=0.3 y1=-0.1 y2=-0.1/>
        <line x1=0 x2=0 y1=0 y2=0.2/>
        <line x1=-0.2 x2=-0.2 y1=0 y2=0.2/>
        <line x1=0.2 x2=0.2 y1=0 y2=0.2/>
        <line x1=-0.15 x2=0.15 y1=0.3 y2=0.3/>
    </svg>
</div>
{/if}

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div on:click={() => {close_all(); dispatch("clone")}} class="edge_button fixed_button" style="{layout_style(layout.bpm_button)}">
    <svg xmlns="http://www.w3.org/2000/svg" height="{layout.bpm_button.size}px" width="{layout.bpm_button.size}px" viewBox="-0.5 -0.5 1 1" pointer-events="none">
        <line x1=-0.4 x2=0.15 y1=-0.4 y2=-0.4/>
        <line x1=-0.4 x2=0.15 y1=0.1 y2=0.1/>
        <line x1=-0.4 x2=-0.4 y1=-0.4 y2=0.1/>
        <line x1=0.15 x2=0.15 y1=-0.4 y2=0.1/>

        <line x1=0.2 x2=0.4 y1=-0.15 y2=-0.15/>
        <line x1=-0.15 x2=0.4 y1=0.4 y2=0.4/>
        <line x1=-0.15 x2=-0.15 y1=0.2 y2=0.4/>
        <line x1=0.4 x2=0.4 y1=-0.15 y2=0.4/>
    </svg>
</div>

<div class="edge_button fixed_button row" style="{layout_style(layout.bpm_button_expend)};border-top-left-radius: {layout.bpm_button_expend.radius}px; border-bottom-left-radius:  {layout.bpm_button_expend.radius}px;">
    <div class="col" style="gap: 8px">
    {#each [[12, 3], [16, 4], [18, 3]] as [period, beat_period]}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div on:click={() => {close_all(); dispatch("new", {period})}}>
    <svg xmlns="http://www.w3.org/2000/svg" height="{layout.bpm_button_expend.size}px" width="{layout.bpm_button_expend.size}px" viewBox="-0.5 -0.5 1 1" pointer-events="none">
        <text y=0.2>{period}</text>
        {#each Array(period) as _, i}
        <line transform="rotate({360 * (i / period - 0.25)})" x1=0.43 x2=0.43 style="stroke-width:{(i % beat_period) ? 0.1 : 0.14}px"/>
        {/each}
    </svg>
    </div>
    {/each}
    </div>
</div>
{/if}

{/if}
