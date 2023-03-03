export function longpress(node, opts = { duration: 400, threshold: 10 }) {
    let state = {}

    function dispatch(event_name, detail) {
        node.dispatchEvent(new CustomEvent(event_name, { detail }))
    }

    function prevent(e) {
        if (e.cancelable) {
            e.preventDefault()
        }
        //e.stopPropagation()
    }

    function clear() {
        if (state.timer) clearTimeout(state.timer)
        state = {}
        window.removeEventListener('mouseup',     on_mouseup)
        window.removeEventListener('mousemove',   on_mousemove)
        window.removeEventListener('touchend',    on_touchend)
        window.removeEventListener('touchcancel', on_touchcancel)
        window.removeEventListener('touchmove',   on_touchmove)
    }

    function start(x, y) {
        //console.log("start", x, y)
        clear()
        window.addEventListener('mouseup',     on_mouseup)
        window.addEventListener('mousemove',   on_mousemove)
        window.addEventListener('touchend',    on_touchend, { passive: false })
        window.addEventListener('touchcancel', on_touchcancel, { passive: false })
        window.addEventListener('touchmove',   on_touchmove, { passive: false })

        const timer = setTimeout(() => {
                state.timer = 0
                if (!state.dir) {
                    dispatch('longpress')
                    clear()
                }
            }, opts.duration)
        state = { init: {x, y}, last: {x, y}, timer }
        dispatch('touch', {x, y})
    }

    function update(x, y) {
        if ('init' in state) {
            dispatch("move", {x, y})
            state = { ...state, dx: x - state.last.x, dy: y - state.last.y, last: {x, y} }
            if (!('dir' in state)) {
                if (Math.abs(state.init.x - x) > opts.threshold) {
                    state.dir = "x"
                } else if (Math.abs(state.init.y - y) > opts.threshold) {
                    state.dir = "y"
                }
            }
            if (state.dir) {
                dispatch("swipe", { dx: state.dx, dy: state.dy, dir: state.dir })
            }
        }
    }

    function finish() {
        if ('init' in state) {
            if (!state.dir) {
                if (state.timer) dispatch('press')
            } else {
                dispatch("swipeend")
            }
        }
        clear()
    }
    
    function on_mousedown(e) {
        prevent(e)
        start(e.clientX, e.clientY)
    }
    function on_mouseup(e) {
        prevent(e)
        finish()
    }
    function on_mousemove(e) {
        prevent(e)
        update(e.clientX, e.clientY)
    } 
    function on_touchstart(e) {
        //console.log("on_touchstart", e)
        prevent(e)
        if (e.changedTouches.length > 1) {
            clear()
        } else {
            start(e.changedTouches[0].clientX, e.changedTouches[0].clientY)
        }
    }
    function on_touchend(e) {
        //console.log("on_touchend", e)
        prevent(e)
        finish()
    }
    function on_touchcancel() {
        prevent(e)
        clear()
    }
    function on_touchmove(e)   {
        prevent(e)
        if (e.changedTouches.length > 1) {
            clear()
        } else {
            update(e.changedTouches[0].clientX, e.changedTouches[0].clientY)
        }
    }

    node.addEventListener('mousedown',   on_mousedown)
    node.addEventListener('touchstart',  on_touchstart, { passive: false })

    return {
        update(new_opts) {
            opts = new_opts
        },
        destroy() {
            node.removeEventListener('mousedown',   on_mousedown)
            node.removeEventListener('touchstart',  on_touchstart)
            clear()
        }
    };
}