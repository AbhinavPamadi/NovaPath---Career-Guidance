"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import { Bot, Sparkles, X, Mic, Send } from "lucide-react";
import { provideContextualHelp } from "@/lib/provide-contextual-help"; // 🔑 frontend helper calling /api
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Textarea } from "../ui/textarea";

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
}

export function AIAvatar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [messageCounter, setMessageCounter] = useState(0);
  const pathname = usePathname();
  const { toast } = useToast();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const predictiveMessages = [
    "What can you do?",
    "Tell me about career paths.",
    "What is NovaPath?",
  ];

  const getHelp = useCallback(
    async (message: string) => {
      setIsLoading(true);
      const userMsgId = `user-${messageCounter}`;
      setMessageCounter((prev) => prev + 1);

      // Add user message
      const newMessage: Message = {
        id: userMsgId,
        text: message,
        sender: "user",
      };
      setMessages((prev) => [...prev, newMessage]);
      setInputValue("");

      try {
        // 🔑 Call API helper
        const result = await provideContextualHelp({
          userActivity: message,
          pageContent: `The user is on the ${pathname} page.`,
        });

        const aiMsgId = `ai-${messageCounter + 1}`;
        setMessageCounter((prev) => prev + 1);

        const aiMessage: Message = {
          id: aiMsgId,
          text: result.helpMessage,
          sender: "ai",
        };
        setMessages((prev) => [...prev, aiMessage]);
      } catch (error) {
        console.error("Error providing contextual help:", error);
        toast({
          variant: "destructive",
          title: "AI Error",
          description: "Could not get a response from the AI.",
        });

        const errorMsgId = `ai-error-${messageCounter + 1}`;
        setMessageCounter((prev) => prev + 1);

        const aiErrorMessage: Message = {
          id: errorMsgId,
          text: "Sorry, I'm having trouble connecting. Please try again later.",
          sender: "ai",
        };
        setMessages((prev) => [...prev, aiErrorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [pathname, toast, messageCounter]
  );

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = (message: string) => {
    if (message.trim()) {
      getHelp(message);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  useEffect(() => {
    if (isOpen) {
      textareaRef.current?.focus();
    }
  }, [isOpen]);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-[380px] h-[550px] mb-4 origin-bottom-right"
          >
            <Card className="w-full h-full glass-card flex flex-col">
              <CardHeader className="flex-row items-center justify-between p-4 border-b border-primary/20">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Bot className="w-8 h-8 text-primary" />
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full border-2 border-card" />
                  </div>
                  <div>
                    <p className="font-bold text-lg font-headline">Nova AI</p>
                    <p className="text-xs text-blue-400">Online</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </CardHeader>

              {/* Chat Messages */}
              <CardContent
                ref={chatContainerRef}
                className="flex-1 p-4 space-y-4 overflow-y-auto"
              >
                {messages.length === 0 && (
                  <div className="text-center text-sm text-muted-foreground animate-in fade-in">
                    <Sparkles className="mx-auto h-8 w-8 text-blue-500 mb-4" />
                    <p className="font-bold">Welcome to Nova AI!</p>
                    <p>
                      You can ask me anything about your career path or this
                      website.
                    </p>
                  </div>
                )}

                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex items-end gap-2",
                      msg.sender === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {msg.sender === "ai" && (
                      <Bot className="w-6 h-6 text-primary flex-shrink-0" />
                    )}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={cn(
                        "max-w-[80%] rounded-xl px-4 py-2.5 text-sm whitespace-pre-line",
                        msg.sender === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      {msg.text}
                    </motion.div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex items-end gap-2 justify-start">
                    <Bot className="w-6 h-6 text-primary flex-shrink-0" />
                    <div className="max-w-[80%] rounded-xl px-4 py-2.5 text-sm bg-muted flex items-center gap-2">
                      <span
                        className="w-2 h-2 bg-primary/50 rounded-full animate-pulse"
                        style={{ animationDelay: "0s" }}
                      />
                      <span
                        className="w-2 h-2 bg-primary/50 rounded-full animate-pulse"
                        style={{ animationDelay: "0.2s" }}
                      />
                      <span
                        className="w-2 h-2 bg-primary/50 rounded-full animate-pulse"
                        style={{ animationDelay: "0.4s" }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>

              {/* Input Box */}
              <div className="p-4 border-t border-primary/20">
                {messages.length === 0 && (
                  <div className="flex gap-2 mb-2 flex-wrap">
                    {predictiveMessages.map((msg) => (
                      <Button
                        key={msg}
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => handleSendMessage(msg)}
                      >
                        {msg}
                      </Button>
                    ))}
                  </div>
                )}
                <div className="relative">
                  <Textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask me anything..."
                    className="pr-20 min-h-[40px]"
                    rows={1}
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground"
                    >
                      <Mic className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      className="h-8 w-8"
                      disabled={isLoading || !inputValue.trim()}
                      onClick={() => handleSendMessage(inputValue)}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          delay: 0.5,
          duration: 0.3,
          type: "spring",
          stiffness: 200,
        }}
      >
        <Button
          size="icon"
          className="rounded-full w-16 h-16 bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/40 pulse-button"
          onClick={() => setIsOpen((prev) => !prev)}
        >
          <AnimatePresence>
            {isOpen ? (
              <motion.div
                key="x"
                initial={{ scale: 0, rotate: 90 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 90 }}
              >
                <X className="h-8 w-8" />
              </motion.div>
            ) : (
              <motion.div
                key="bot"
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: -90 }}
              >
                <Bot className="h-8 w-8" />
              </motion.div>
            )}
          </AnimatePresence>
          <span className="sr-only">AI Career Guide</span>
        </Button>
      </motion.div>
    </div>
  );
}
