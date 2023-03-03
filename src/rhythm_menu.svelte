<script>
    import { createEventDispatcher, onMount } from 'svelte'
	const dispatch = createEventDispatcher()

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
    background: #e7ecef;
    border-bottom: 1px solid #c2d0d8;
    box-shadow: 2px 2px 5px 1px rgba(0, 0, 0, 0.2);
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
    width: 64px;
}

h1 {
    margin: 4px 0 8px;
    flex-grow: 1;
    text-align: center;
}
.menu {
    position: fixed;
    z-index: 10;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    background: white;
}
.list {
    margin-top: 12px;
    flex-direction: column-reverse;
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
    color: #4691f6;
}
button:disabled i {
    color: #aaa;
}

i:before {
    line-height: 62px;
}

span.round {
    background-color: #fe4365;
    display: inline-block;
    width: 64px;
    height: 64px;
    border-radius: 50%;
    text-align: center;
    line-height: 36px;
}
.round i {
    color: white;
    margin: 0;
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
    -webkit-text-stroke: 7px #e7ecef;
    color: red;
}
.icon-lock {
    color: #b9b5d4;
}
.list .icon-lock {
    color: #d0cfd8;
}
.new {
    position: relative;
    border: 2px solid #4691f6;
    border-radius: 6px;
    padding: 4px 8px 12px 0px;
    width: 48px;
}
.new span {
    color: #4691f6;
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
        <div class="row icons">
            <button on:click={() => open = false}>
                <span class="round"><i class="icon-cross"></i></span>
            </button>
        </div>
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
<header on:click={() => open = true}>
    <h1>{rhythms[active].name}</h1>
</header>
