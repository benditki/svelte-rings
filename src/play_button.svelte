<script>
    import { createEventDispatcher } from 'svelte'
	const dispatch = createEventDispatcher()

    export let playing = false
</script>
<svg height="40px" viewBox="-0.5 -0.5 1 1">
    <g class:playing={playing != 0} transform="scale(1.2)"
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
      stroke-width: 0.08px;
      stroke-linecap: butt;
      stroke-linejoin: miter;
      stroke: var(--theme-fg);
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
      stroke: var(--theme-fg);
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
