import { Button } from "./components/Button";

function counter() {
    return (
        <div className="item-center flex w-32 flex-col justify-center border-2 p-4">
            <div className="text-center">0</div>
            <Button>Increment</Button>
        </div>
    );
}

export default counter;
