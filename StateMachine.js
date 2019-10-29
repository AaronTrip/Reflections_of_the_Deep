class StateMachine
{
    constructor(start_state)
    {
        this.current_state = start_state;
        this.current_state.run();
    }
}
