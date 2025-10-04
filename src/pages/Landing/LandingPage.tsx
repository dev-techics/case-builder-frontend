"use client";



import Counter from "@/features/counter/counter";


export default function Component() {

    return (
        <div className="flex h-full flex-col gap-2 *:first:grow">

            <Counter />
        </div>
    );
}
