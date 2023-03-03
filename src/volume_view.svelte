<script>
    export let value = 1.3
    export let visible = true

    const max_width = 25

    function range(end, step = 0.1) {
        const res = []
        for (let i = 0; i <= end; i += step) {
            res.push(i)
        }
        return res;
    }
</script>

<style>
.container {
    position: absolute;
    left: 0;
    top: 0;
    display: none;
    --stripe-height: 3px;
    --gap: 1px;
}
.visible {
    display: block;
}
.stripes {
    height: calc(20 * (var(--stripe-height) + var(--gap)));
    flex-direction: column-reverse;
}
.stripe {
    background: #5b5ec7;
    height: var(--stripe-height);
    margin-top: var(--gap);
}
.dim {
    background: #a0a1b7;
}
label {
    font: 32px "Good Times", sans-serif;
    display: inline-block;
    width: 60px;
    text-align: center;
    color: #5b5ec7;
}

</style>

<div class="container col" class:visible>
    <label>{value.toFixed(1)}</label>
    <div class="col stripes">
        {#each range(2) as i}
        <div class="stripe" data-i={i} class:dim={i >= value} style="width:{10 + i * 25}px"></div>
        {/each}
    </div>
</div>