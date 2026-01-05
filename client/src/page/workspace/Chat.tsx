import { useEffect, useRef, useState } from "react";
import { useSocket } from "@/context/socket-provider";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { useAuthContext } from "@/context/auth-provider";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import API from "@/lib/axios-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Loader } from "lucide-react";
import { getAvatarColor, getAvatarFallbackText } from "@/lib/helper";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

type Message = {
    _id: string;
    senderId: {
        _id: string;
        name: string;
        profilePicture: string | null;
    };
    content: string;
    createdAt: string;
};

const Chat = () => {
    const { socket } = useSocket();
    const workspaceId = useWorkspaceId();
    const { user } = useAuthContext();
    const navigate = useNavigate();

    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    const { data, isLoading } = useQuery({
        queryKey: ["chat", workspaceId],
        queryFn: async () => {
            const response = await API.get(`/chat/${workspaceId}/messages`);
            return response.data.messages;
        },
        enabled: !!workspaceId,
    });

    useEffect(() => {
        if (data) {
            setMessages(data);
        }
    }, [data]);

    useEffect(() => {
        if (!socket || !workspaceId) return;

        socket.emit("join_room", workspaceId);

        const handleReceiveMessage = (message: Message) => {
            setMessages((prev) => [...prev, message]);
        };

        const handleMemberRemoved = (data: { memberId: string }) => {
            if (data.memberId === user?._id) {
                navigate("/"); // Redirect to home/dashboard if removed
            }
        };

        socket.on("receive_message", handleReceiveMessage);
        socket.on("member_removed", handleMemberRemoved);

        return () => {
            socket.off("receive_message", handleReceiveMessage);
            socket.off("member_removed", handleMemberRemoved);
        };
    }, [socket, workspaceId, user, navigate]);

    useEffect(() => {
        // Scroll to bottom whenever messages change
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !socket) return;

        socket.emit("send_message", {
            workspaceId,
            senderId: user?._id,
            content: newMessage,
        });

        setNewMessage("");
    };

    return (
        <div className="flex flex-col h-[calc(100vh-60px)] w-full max-w-4xl mx-auto p-4">
            <div className="flex-1 bg-white dark:bg-zinc-900 rounded-lg shadow-sm border overflow-hidden flex flex-col">
                <header className="p-4 border-b bg-gray-50 dark:bg-zinc-800/50">
                    <h2 className="text-lg font-semibold">Workspace Chat</h2>
                    <p className="text-sm text-muted-foreground">
                        Chat with your team members in real-time.
                    </p>
                </header>

                <ScrollArea className="flex-1 p-4">
                    <div className="flex flex-col gap-4">
                        {isLoading ? (
                            <Loader className="w-8 h-8 animate-spin place-self-center self-center" />
                        ) : messages.length === 0 ? (
                            <div className="text-center text-muted-foreground py-10">
                                No messages yet. Start the conversation!
                            </div>
                        ) : (
                            messages.map((msg, index) => {
                                const isMe = msg.senderId._id === user?._id;
                                const showHeader =
                                    index === 0 ||
                                    messages[index - 1].senderId._id !== msg.senderId._id;

                                const name = msg.senderId.name;
                                const initials = getAvatarFallbackText(name);
                                const avatarColor = getAvatarColor(name);

                                return (
                                    <div
                                        key={index} // Ideally use msg._id if unique, but optimistic updates might lack it initially
                                        className={`flex gap-3 ${isMe ? "flex-row-reverse" : "flex-row"
                                            }`}
                                    >
                                        {showHeader ? (
                                            <Avatar className="h-8 w-8 mt-1">
                                                <AvatarImage
                                                    src={msg.senderId.profilePicture || ""}
                                                    alt={name}
                                                />
                                                <AvatarFallback className={avatarColor}>
                                                    {initials}
                                                </AvatarFallback>
                                            </Avatar>
                                        ) : (
                                            <div className="w-8" /> // Spacer for alignment
                                        )}

                                        <div
                                            className={`flex flex-col max-w-[70%] ${isMe ? "items-end" : "items-start"
                                                }`}
                                        >
                                            {showHeader && (
                                                <span className="text-xs text-muted-foreground mb-1 ml-1">
                                                    {name},{" "}
                                                    {format(new Date(msg.createdAt), "h:mm a")}
                                                </span>
                                            )}
                                            <div
                                                className={`px-4 py-2 rounded-lg text-sm ${isMe
                                                    ? "bg-primary text-primary-foreground rounded-tr-none"
                                                    : "bg-muted rounded-tl-none"
                                                    }`}
                                            >
                                                {msg.content}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={scrollRef} />
                    </div>
                </ScrollArea>

                <div className="p-4 border-t bg-gray-50 dark:bg-zinc-800/50">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                        <Input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1"
                        />
                        <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Chat;
