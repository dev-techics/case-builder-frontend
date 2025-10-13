import { MessageSquareText } from "lucide-react"

function Comment() {
    return (
        <div className="flex gap-2">
            <span><MessageSquareText size={15} /></span>
            <div className="text-sm">Comment</div>
        </div>
    )
}

export default Comment