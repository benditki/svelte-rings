<script>
    import { createEventDispatcher } from 'svelte'
	const dispatch = createEventDispatcher()

    export let size = 40
    export let playing = false
</script>
<svg xmlns="http://www.w3.org/2000/svg" height="{size}px" width="{size}px" viewBox="-0.5 -0.5 1 1">
    <g class:playing={playing != 0}
        on:click={() => dispatch("toggle")}>
        <circle r=0.3 fill="none" pointer-events="fill"/>
        <polygon class='triag' points="-0.17,-0.3 0.33,0 -0.17,0.3 "/>
        <polygon class='quad' points="-0.25,-0.25 0.25,-0.25 0.25,0.25 -0.25,0.25 "/>
    </g>
</svg>
<style>
    svg {
        overflow: visible;
    }
    .triag, .quad {
      transition: all 0.4s ease-in-out;
      transform: translateY(0);
      stroke-width: 0.1px;
      stroke-linecap: butt;
      stroke-linejoin: miter;
      stroke: var(--theme-bg);
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
