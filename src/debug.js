import {writable} from "svelte/store"


function collectionStore() {
    let active = false
    const {subscribe, update, set} = writable([])
    const add = (item) => {
        if (!active) return
        update(collection => collection.concat([item]))
    }
    const update_life = (life=0.08) => {
        if (!active) return
        update(collection => collection
            .map(item => (item.life === undefined ? item : { ...item, life: item.life - life }))
            .filter(item => item.life === undefined || item.life > 0)
        )
    }
    const activate = (new_active) => {
        if (active == new_active) return
        active = new_active
        if (!active) {
            set([])
        }
    }

    return {subscribe, add, update_life, activate}
}
export const external_points = collectionStore([])