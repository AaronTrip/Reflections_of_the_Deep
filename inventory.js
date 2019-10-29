class Inventory
{
    constructor()
    {
        this.hidden = new Set();
        this.visible = new Set();
    }

    has(item)
    {
        return (this.hidden.has(item) || this.visible.has(item));
    }

    addHidden(item)
    {
        this.hidden.add(item);
    }

    addVisible(item)
    {
        this.visible.add(item);
    }

    remove(item)
    {
        this.hidden.delete(item);
        this.visible.delete(item);
    }

    draw(x, y)
    {
        let inventory_print_string = "";
        this.visible.forEach(function(item) { inventory_print_string += item + ' '; });
        push();
        text(inventory_print_string, x, y);
        pop();
    }
}
