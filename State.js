// ABC for states
class State
{
    run()
    {
        console.assert(0);
    }

    next()
    {
        console.assert(0);
    }
}


class Scene extends State
{
    constructor(string)
    {
        this.string = string;
        this.next_node = this  // Maybe?
    }

    run()
    {
        // TODO: work with parser
    }

    next()
    {
        // TODO: Ask parser what the outgoing edges are
    }
}


class GetInput extends State
{
    constructor(shell)
    {
        this.shell = shell;
        this.next_node = this;
    }

    run()
    {
        // Spin until command
        if(this.shell.commandReady())
        {
            // TODO: parse command
        }
    }

    next()
    {
        return this.next_node;
    }
}


class Menu extends State
{
    constructor()
    {
        this.next_node = this;
    }

    run()
    {
        // TODO: figure out logic
    }

    next()
    {
        return this.next_node;
    }
}
