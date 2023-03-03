<script>
    import Dot from "./dot.svelte"
    import { adjust, emphasize} from "./colors.js"
    import { in_limits } from "./utils.js"
    import { createEventDispatcher } from 'svelte'
	const dispatch = createEventDispatcher()

    const radius0 = 0.12
    const radius_gap = 0.02

    export let episode
    export let period
    export let playing = false
    export let phase

    $: parts = episode.phrases.reduce(
        (res, phrase, phrase_id) =>
            res.concat(phrase.parts.map((pulses, part_id) => ({ phrase, phrase_id, part_id, pulses }))),
        [])
    $: radius_delta = (0.5 - radius0) / Math.max(4, parts.length)

    function color(playing, phrase, period, pulse, phase) {
        return playing && pulse.sym && in_limits((phase - pulse.phase) % (phrase.parts.length * period), -0.1, 0.95) ?
            emphasize(phrase.instrument.color) :
            adjust(phrase.instrument.color, phrase.volume)
    }

</script>

<svg viewBox="-0.5 -0.5 1 1">
    <g transform="rotate(-90)">
    {#each parts as part, radius_id}
        {#each part.pulses as pulse, pulse_id}
        <Dot radius={radius0 + radius_delta * (radius_id + 0.5)}
            width={radius_delta - radius_gap/2} size={0.03}
            phase={(pulse.phase / period) % 1} delta={1 / period}
            sym={pulse.sym}
            color={color(playing, part.phrase, period, pulse, phase)}
            on:press={() => dispatch("press", { phrase_id: part.phrase_id, part_id: part.part_id, pulse_id })}
            on:swipe={(e) => dispatch("swipe", { phrase_id: part.phrase_id, part_id: part.part_id, pulse_id, ...e.detail })}
            on:swipeend/>
        {/each}
    {/each}
    </g>
    <g transform="scale(0.2)" class:playing={playing != 0}
        on:click={() => dispatch("toggle")}>
        <circle r=0.4 fill="none" pointer-events="fill"/>
        <polygon class='triag' points="-0.17,-0.3 0.33,0 -0.17,0.3 "/>
        <polygon class='quad' points="-0.25,-0.25 0.25,-0.25 0.25,0.25 -0.25,0.25 "/>
    </g>
</svg>

<style>
.triag, .quad {
  transition: all 0.4s ease-in-out;
  transform: translateY(0);
  stroke-width: 0.1px;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke: #1e335c;
  fill: none;
}
.triag {
  stroke-dasharray: 1.6 10.0;
  stroke-dashoffset: 0.0;
}
.quad {
  stroke-dasharray: 1.8 10.8;
  stroke-dashoffset: 3.4;
}

.playing .triag {
  stroke-dashoffset: -3.4;
}
.playing .quad {
  stroke-dashoffset: 0.0;
}
.playing .triag, .playing .quad {
  stroke: #af5308;
  animation: nudge 0.4s ease-in-out;
}
@keyframes nudge {
  0% {
    transform: translateX(0);
  }
  30% {
    transform: translateX(-0.1px);
  }
  50% {
    transform: translateX(0.1px);
  }
  70% {
    transform: translateX(-0.01px);
  }
  100% {
    transform: translateX(0);
  }
}
</style>

