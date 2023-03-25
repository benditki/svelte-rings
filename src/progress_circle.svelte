<script>
    export let progress = 0.25
    export let rounds = 3
    export let fill = "var(--theme-bg-alt)"
    export let color = "var(--theme-fg)"
    export let text = "1"
    export let width = "100px"
    export let height = "100px"

    const round_indicator_width = 0.04
    const round_indicator_gap = 0.02
    const round_indicator_interval = round_indicator_width + round_indicator_gap

    const strokeDasharray = function(rounds) {
        return "0 " + `${round_indicator_gap} ${round_indicator_width} `.repeat(rounds) + ` 1`
    }

    const fillStrokeDasharray = function(rounds) {
        return "0 " + `${round_indicator_gap} ${round_indicator_width} `.repeat(rounds) + `${round_indicator_gap} 1`
    }

    const strokeDashoffset = function(progress) {
        return round_indicator_interval * Math.ceil(progress)
    }

    const progressStrokeDashoffset = function(progress, rounds) {
        return 1 - (progress % 1) * (1 - round_indicator_interval * rounds)
    }

</script>
<div id="container" style="width:{width};height:{height}">
    <svg id="background" viewBox="-0.5 -0.5 1.0 1.0">
        <circle transform="rotate(270)" stroke="{progress != null ? fill : color}" pathLength=0.901 stroke-dasharray="{fillStrokeDasharray(rounds)}" ></circle>
        {#if progress != null}
        <circle transform="rotate({270 + 360 * (round_indicator_interval * rounds + round_indicator_gap)})" stroke="{color}" pathLength=0.901 stroke-dasharray="1" stroke-dashoffset={progressStrokeDashoffset(progress, rounds)}></circle>
        <circle transform="rotate(270)" stroke="{color}" pathLength=0.901 stroke-dasharray={strokeDasharray(rounds)} stroke-dashoffset={strokeDashoffset(rounds - progress)}></circle>
        {/if}
    </svg>
    <div id="foreground">
        <slot></slot>
    </div>
</div>
<style>
    #container {
        position: relative;
    }
    #background {
        position: absolute;
        left: 0;
        width: 100%;
        height: 100%;
    }
    #foreground {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        height: 100%;  
    }
    circle {
        fill: none;
        stroke-width: 0.1;
        r: 0.45;
    }
</style>